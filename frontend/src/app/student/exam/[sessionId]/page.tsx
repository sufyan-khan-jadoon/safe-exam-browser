"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { studentService } from "@/lib/student.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Shield, Clock, CheckCircle, AlertTriangle, Save, Flag, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  questionText: string;
  questionType: "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER";
  options: string[];
  points: number;
}

export default function StudentExamPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> answerText
  const [flags, setFlags] = useState<Record<string, boolean>>({}); // questionId -> isFlagged
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Pagination / Deck State
  const [activeIndex, setActiveIndex] = useState(0);

  // Timer state
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Kiosk mode violations ("Lives" model)
  const [violations, setViolations] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [cloudSaving, setCloudSaving] = useState(false);

  const fetchExamDetails = async () => {
    try {
      setLoading(true);
      const res = await studentService.getStudentExam();
      const { exam, questions: fetchedQuestions, savedAnswers } = res.data;

      setExam(exam);
      setQuestions(fetchedQuestions);

      // Prepopulate saved answers from DB
      const answersMap: Record<string, string> = {};
      savedAnswers.forEach((ans: any) => {
        answersMap[ans.questionId] = ans.answerText;
      });
      setAnswers(answersMap);

      // Calculate server time left
      const sessionRes = res.data.session || {}; // fallback if session start is passed
      const startedAt = new Date(res.data.session?.startedAt || new Date());
      const durationMs = exam.durationInMinutes * 60 * 1000;
      const elapsedMs = new Date().getTime() - startedAt.getTime();
      const remainingSecs = Math.max(0, Math.floor((durationMs - elapsedMs) / 1000));

      setTimeLeft(remainingSecs);
    } catch (err: any) {
      toast.error("Failed to load exam. Redirecting...");
      router.push("/student/join");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamDetails();
  }, [params.sessionId]);

  // Countdown timer logic
  useEffect(() => {
    if (timeLeft === null) return;

    if (timeLeft <= 0) {
      handleForceSubmit();
      return;
    }

    timerRef.current = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft]);

  // Violations model ("Lives")
  useEffect(() => {
    if (loading || submitting) return;

    const handleBlur = () => {
      setViolations((prev) => {
        const next = prev + 1;
        if (next >= 4) {
          handleForceSubmit("Exam terminated due to multiple security violations.");
        } else {
          setShowWarning(true);
        }
        return next;
      });
    };

    window.addEventListener("blur", handleBlur);

    // Kiosk blocks
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleCopyPaste = (e: ClipboardEvent) => e.preventDefault();

    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 key
      if (e.key === "F12") {
        e.preventDefault();
        toast.error("Developer Tools are locked during this test.");
      }
      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) {
        e.preventDefault();
        toast.error("Security lockout active.");
      }
      if (e.ctrlKey && e.key === "u") {
        e.preventDefault();
        toast.error("Source viewing is disabled.");
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("cut", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("cut", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [loading, submitting]);

  // Helper to format remaining time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Auto-Save action
  const handleAnswerSelect = async (questionId: string, answerText: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answerText }));
    try {
      setCloudSaving(true);
      await studentService.saveAnswer(questionId, answerText);
    } catch (err) {
      toast.error("Auto-save sync failed. Please check internet connection.");
    } finally {
      setCloudSaving(false);
    }
  };

  // Toggle flag
  const toggleFlag = (questionId: string) => {
    setFlags((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  // Force Submit (Timer / Violations)
  const handleForceSubmit = async (reason = "Time has expired! Submitting your exam...") => {
    if (submitting) return;
    toast.error(reason, { duration: 6000 });
    await executeSubmission();
  };

  // Manual Submit
  const handleManualSubmit = async () => {
    const totalQuestions = questions.length;
    const answeredCount = Object.keys(answers).length;
    const unansweredCount = totalQuestions - answeredCount;

    let confirmMsg = "Are you sure you want to submit and complete your exam?";
    if (unansweredCount > 0) {
      confirmMsg = `You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`;
    }

    if (!confirm(confirmMsg)) return;
    await executeSubmission();
  };

  // Final submit caller
  const executeSubmission = async () => {
    try {
      setSubmitting(true);
      if (timerRef.current) clearTimeout(timerRef.current);

      const res = await studentService.submitExam();
      localStorage.removeItem("student_jwt");
      toast.success("Exam submitted successfully!");

      // Render score screen or static completion
      router.push("/student/join");
    } catch (err: any) {
      toast.error("Failed to submit exam. Please contact your administrator.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-zinc-500 text-sm mt-4">Setting up secure testing container...</p>
      </div>
    );
  }

  const activeQuestion = questions[activeIndex];
  const hasAnsweredActive = activeQuestion ? !!answers[activeQuestion.id] : false;

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 md:p-6 bg-zinc-950 relative overflow-hidden">
      {/* Violation Overlay Warning */}
      {showWarning && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-center items-center p-4">
          <Card className="max-w-md border-red-900/50 bg-zinc-900 text-white text-center">
            <CardHeader className="flex flex-col items-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mb-2 animate-bounce" />
              <CardTitle className="text-xl text-red-500">Security Warning!</CardTitle>
              <CardDescription className="text-zinc-400">
                You switched tabs, lost focus, or attempted to resize the window.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-zinc-300">
                This examination terminal is strictly locked down. Leaving the screen represents an act of violation.
              </p>
              <div className="bg-red-950/20 border border-red-900/40 p-4 rounded-lg">
                <span className="text-xs uppercase text-zinc-400 font-bold block mb-1">
                  Remaining Security Lives
                </span>
                <span className="text-4xl font-extrabold text-red-400">
                  {3 - violations} / 3
                </span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button
                variant="destructive"
                className="font-semibold"
                onClick={() => setShowWarning(false)}
              >
                I understand, Resume Exam
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Main Examination Header */}
      <div className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between border border-zinc-800 bg-zinc-900/50 backdrop-blur-md p-4 rounded-xl mb-6 gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">{exam?.examTitle}</h1>
            <span className="text-xs text-zinc-400 font-medium">Secure Terminal Session</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Cloud Auto Save Status Indicator */}
          <div className="flex items-center text-xs text-zinc-500 space-x-1.5 bg-zinc-950 px-2.5 py-1.5 rounded-md border border-zinc-900">
            <Save className={cn("w-3.5 h-3.5", cloudSaving ? "text-primary animate-pulse" : "text-zinc-600")} />
            <span>{cloudSaving ? "Saving..." : "Saved to cloud"}</span>
          </div>

          {/* Dynamic Visual Timer */}
          <div className={cn(
            "flex items-center space-x-2 px-4 py-1.5 rounded-lg border font-mono font-bold text-sm",
            timeLeft && timeLeft < 120
              ? "border-red-900/50 bg-red-950/20 text-red-400 animate-pulse"
              : "border-zinc-800 bg-zinc-950 text-zinc-100"
          )}>
            <Clock className="w-4 h-4 text-zinc-400" />
            <span>{timeLeft !== null ? formatTime(timeLeft) : "--:--"}</span>
          </div>
        </div>
      </div>

      {/* Exam Body Layout */}
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow items-start">
        {/* Active Question Card (Left 8 cols) */}
        <div className="lg:col-span-8 h-full flex flex-col justify-between">
          {activeQuestion ? (
            <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-md shadow-2xl flex flex-col h-full min-h-[450px]">
              <CardHeader className="pb-4 border-b border-zinc-900 flex flex-row justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Question {activeIndex + 1}
                    </span>
                    <span className="text-xs text-zinc-500 uppercase">
                      {activeQuestion.questionType.replace("_", " ")}
                    </span>
                  </div>
                  <CardTitle className="text-lg text-white font-semibold pt-1 leading-relaxed">
                    {activeQuestion.questionText}
                  </CardTitle>
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-500 block">Weight</span>
                  <span className="text-sm font-bold text-zinc-300">{activeQuestion.points} pts</span>
                </div>
              </CardHeader>
              <CardContent className="py-6 flex-grow">
                {/* MCQ Options */}
                {activeQuestion.questionType === "MCQ" && (
                  <div className="space-y-3">
                    {activeQuestion.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAnswerSelect(activeQuestion.id, opt)}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border transition-all flex items-center space-x-3",
                          answers[activeQuestion.id] === opt
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-700"
                        )}
                      >
                        <span className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border",
                          answers[activeQuestion.id] === opt
                            ? "border-primary text-primary"
                            : "border-zinc-800 text-zinc-500"
                        )}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="font-medium">{opt}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* True/False Options */}
                {activeQuestion.questionType === "TRUE_FALSE" && (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => handleAnswerSelect(activeQuestion.id, "true")}
                      className={cn(
                        "w-full p-6 rounded-xl border text-center transition-all font-semibold text-lg flex flex-col items-center justify-center space-y-2",
                        answers[activeQuestion.id] === "true"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-700"
                      )}
                    >
                      <span>True</span>
                    </button>
                    <button
                      onClick={() => handleAnswerSelect(activeQuestion.id, "false")}
                      className={cn(
                        "w-full p-6 rounded-xl border text-center transition-all font-semibold text-lg flex flex-col items-center justify-center space-y-2",
                        answers[activeQuestion.id] === "false"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-700"
                      )}
                    >
                      <span>False</span>
                    </button>
                  </div>
                )}

                {/* Short Answer */}
                {activeQuestion.questionType === "SHORT_ANSWER" && (
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 font-medium uppercase">Type response below</label>
                    <textarea
                      value={answers[activeQuestion.id] || ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [activeQuestion.id]: e.target.value }))}
                      onBlur={(e) => handleAnswerSelect(activeQuestion.id, e.target.value)}
                      placeholder="Write your explanation keywords/phrases..."
                      rows={5}
                      className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-primary placeholder:text-zinc-700 shadow-inner"
                    />
                    <p className="text-xs text-zinc-600 leading-tight">
                      * Answer is saved automatically when you click outside the input field.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t border-zinc-900 py-4 flex justify-between gap-4">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    className="border-zinc-800 hover:bg-zinc-800"
                    disabled={activeIndex === 0}
                    onClick={() => setActiveIndex(activeIndex - 1)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>

                  <Button
                    variant="outline"
                    className={cn(
                      "border-zinc-800 hover:bg-zinc-800",
                      flags[activeQuestion.id] && "bg-yellow-950/20 text-yellow-400 border-yellow-900/40 hover:bg-yellow-950/40"
                    )}
                    onClick={() => toggleFlag(activeQuestion.id)}
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    {flags[activeQuestion.id] ? "Flagged" : "Flag Review"}
                  </Button>
                </div>

                {activeIndex < questions.length - 1 ? (
                  <Button
                    onClick={() => setActiveIndex(activeIndex + 1)}
                  >
                    Next Question
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    className="bg-green-600 text-white hover:bg-green-700"
                    onClick={handleManualSubmit}
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit Examination"}
                    <Check className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          ) : (
            <div className="text-center py-24 text-zinc-500">
              Initializing question palette...
            </div>
          )}
        </div>

        {/* Question Palette Sidebar (Right 4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-md shadow-2xl">
            <CardHeader className="pb-3 border-b border-zinc-900">
              <CardTitle className="text-md">Question Palette</CardTitle>
              <CardDescription>
                Overview of your progress.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-5 gap-2 max-h-[250px] overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  const isFlagged = !!flags[q.id];
                  const isActive = activeIndex === idx;

                  return (
                    <button
                      key={q.id}
                      onClick={() => setActiveIndex(idx)}
                      className={cn(
                        "h-10 w-full rounded-lg font-mono font-bold text-sm border flex items-center justify-center transition-all",
                        isActive
                          ? "ring-2 ring-primary border-primary bg-primary/10 text-primary font-extrabold"
                          : isFlagged
                          ? "bg-yellow-950/30 border-yellow-800 text-yellow-400"
                          : isAnswered
                          ? "bg-green-950/20 border-green-900 text-green-400"
                          : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                      )}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Palette Legend Indicator */}
              <div className="grid grid-cols-2 gap-2 mt-6 pt-4 border-t border-zinc-900 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-950/20 border border-green-900 text-green-400 rounded" />
                  <span className="text-zinc-400">Answered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-950/30 border border-yellow-800 text-yellow-400 rounded" />
                  <span className="text-zinc-400">Flagged</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 ring-2 ring-primary border border-primary bg-primary/10 rounded animate-pulse" />
                  <span className="text-zinc-400">Active</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-zinc-950 border border-zinc-800 rounded" />
                  <span className="text-zinc-400">Unvisited</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-zinc-900 py-4 flex flex-col gap-2">
              <div className="flex justify-between w-full text-xs text-zinc-500">
                <span>Progress:</span>
                <span className="font-semibold text-zinc-300">
                  {Object.keys(answers).length} / {questions.length} Answered
                </span>
              </div>
              <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-zinc-900 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${(Object.keys(answers).length / (questions.length || 1)) * 100}%` }}
                />
              </div>
            </CardFooter>
          </Card>

          {/* Secure Lockdown Notice Card */}
          <Card className="border-red-950/20 bg-red-950/5 text-red-400">
            <CardContent className="pt-4 flex items-start gap-2.5 text-xs">
              <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Lockdown active:</strong> Closing this window, navigating away, or refreshing will alert your proctor. All activities are recorded server-side.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
