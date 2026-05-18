"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { questionService, QuestionData } from "@/lib/question.service";
import { examService, ExamData } from "@/lib/exam.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, Edit2, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ExamQuestionsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [exam, setExam] = useState<ExamData | null>(null);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(true);

  // Editor State
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<"MCQ" | "TRUE_FALSE" | "SHORT_ANSWER">("MCQ");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [points, setPoints] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [examRes, questionsRes] = await Promise.all([
        examService.getExamById(params.id),
        questionService.getQuestionsForExam(params.id),
      ]);
      setExam(examRes.data);
      setQuestions(questionsRes.data);
    } catch (err: any) {
      toast.error("Failed to load exam details");
      router.push("/dashboard/exams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [params.id]);

  // Reset Form
  const resetForm = () => {
    setEditingQuestionId(null);
    setQuestionText("");
    setQuestionType("MCQ");
    setOptions(["", ""]);
    setCorrectAnswer("");
    setPoints(1);
  };

  // MCQ Options Helpers
  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleAddOption = () => {
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast.error("MCQ must have at least 2 options");
      return;
    }
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
    if (correctAnswer === options[index]) {
      setCorrectAnswer("");
    }
  };

  // Submit Handler (Create/Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!questionText.trim()) {
      toast.error("Question text is required");
      return;
    }

    let payloadCorrectAnswer = correctAnswer;
    let payloadOptions = options;

    if (questionType === "MCQ") {
      const filteredOptions = options.map((opt) => opt.trim()).filter((opt) => opt !== "");
      if (filteredOptions.length < 2) {
        toast.error("MCQ must have at least 2 options");
        return;
      }
      if (!payloadCorrectAnswer || !filteredOptions.includes(payloadCorrectAnswer)) {
        toast.error("Please select a valid correct answer option");
        return;
      }
      payloadOptions = filteredOptions;
    } else if (questionType === "TRUE_FALSE") {
      payloadOptions = ["true", "false"];
      if (payloadCorrectAnswer !== "true" && payloadCorrectAnswer !== "false") {
        toast.error("Correct answer must be True or False");
        return;
      }
    } else {
      payloadOptions = [];
      if (!payloadCorrectAnswer.trim()) {
        toast.error("Correct answer keywords are required");
        return;
      }
    }

    try {
      setSubmitting(true);
      const questionPayload: QuestionData = {
        questionText,
        questionType,
        options: payloadOptions,
        correctAnswer: payloadCorrectAnswer,
        points: Number(points),
      };

      if (editingQuestionId) {
        await questionService.updateQuestion(editingQuestionId, questionPayload);
        toast.success("Question updated successfully!");
      } else {
        await questionService.createQuestion(params.id, questionPayload);
        toast.success("Question added successfully!");
      }

      resetForm();
      const res = await questionService.getQuestionsForExam(params.id);
      setQuestions(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save question");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Handler
  const handleEditClick = (q: QuestionData) => {
    setEditingQuestionId(q.id || null);
    setQuestionText(q.questionText);
    setQuestionType(q.questionType);
    setPoints(q.points);
    setCorrectAnswer(q.correctAnswer);

    if (q.questionType === "MCQ") {
      setOptions(q.options);
    } else {
      setOptions(["", ""]);
    }
  };

  // Delete Handler
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      await questionService.deleteQuestion(id);
      toast.success("Question deleted successfully!");
      const res = await questionService.getQuestionsForExam(params.id);
      setQuestions(res.data);
      if (editingQuestionId === id) resetForm();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete question");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const sumPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const isPointsMismatch = exam ? sumPoints !== exam.totalMarks : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/exams">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{exam?.examTitle}</h2>
          <p className="text-zinc-500">Manage questions and points distribution.</p>
        </div>
      </div>

      {isPointsMismatch && (
        <div className="flex items-center p-4 rounded-md bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50 text-yellow-800 dark:text-yellow-400 gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">
            Warning: The sum of points from all questions (<strong>{sumPoints} pts</strong>) does not match the configured Exam Total Marks (<strong>{exam?.totalMarks} pts</strong>).
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Questions List */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Exam Questions ({questions.length})</CardTitle>
                <CardDescription>
                  List of questions configured for this exam.
                </CardDescription>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold block">Total Points</span>
                <span className={cn("text-lg font-bold font-mono", isPointsMismatch ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400")}>
                  {sumPoints} / {exam?.totalMarks}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  No questions added yet. Use the editor to add your first question!
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className={cn(
                        "p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-3 relative group transition-all hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50",
                        editingQuestionId === q.id && "border-primary dark:border-primary/80 bg-primary/5"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Q{idx + 1}
                          </span>
                          <span className="text-xs text-zinc-500 font-semibold uppercase">
                            {q.questionType.replace("_", " ")}
                          </span>
                          <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-600 dark:text-zinc-400">
                            {q.points} pt{q.points > 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 hover:text-primary"
                            onClick={() => handleEditClick(q)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                            onClick={() => handleDelete(q.id || "")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <p className="font-semibold text-zinc-950 dark:text-white pr-16 leading-tight">
                        {q.questionText}
                      </p>

                      {q.questionType === "MCQ" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4">
                          {q.options.map((opt, i) => (
                            <div
                              key={i}
                              className={cn(
                                "text-sm p-2 rounded border border-zinc-200 dark:border-zinc-800 flex items-center space-x-2 bg-white dark:bg-zinc-950",
                                opt === q.correctAnswer && "border-green-500 dark:border-green-800/80 bg-green-50/30 dark:bg-green-950/10 text-green-700 dark:text-green-400"
                              )}
                            >
                              <span className="font-bold text-xs uppercase text-zinc-400">
                                {String.fromCharCode(65 + i)}.
                              </span>
                              <span className="truncate">{opt}</span>
                              {opt === q.correctAnswer && <CheckCircle2 className="w-4 h-4 ml-auto text-green-600 dark:text-green-500 flex-shrink-0" />}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.questionType === "TRUE_FALSE" && (
                        <div className="flex space-x-4 pl-4">
                          <div className={cn(
                            "text-sm px-4 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 font-semibold",
                            q.correctAnswer === "true" && "border-green-500 bg-green-50/30 dark:bg-green-950/10 text-green-700 dark:text-green-400"
                          )}>
                            True
                          </div>
                          <div className={cn(
                            "text-sm px-4 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 font-semibold",
                            q.correctAnswer === "false" && "border-green-500 bg-green-50/30 dark:bg-green-950/10 text-green-700 dark:text-green-400"
                          )}>
                            False
                          </div>
                        </div>
                      )}

                      {q.questionType === "SHORT_ANSWER" && (
                        <div className="pl-4 text-sm flex items-center">
                          <span className="text-zinc-500 mr-2">Correct Answer:</span>
                          <strong className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded border border-green-200 dark:border-green-900/50">
                            {q.correctAnswer}
                          </strong>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Editor Form */}
        <div className="lg:col-span-5">
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 sticky top-24">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {editingQuestionId ? "Edit Question" : "Add New Question"}
              </CardTitle>
              <CardDescription>
                Configure the question parameters below.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Question Type</label>
                  <select
                    value={questionType}
                    onChange={(e) => {
                      setQuestionType(e.target.value as any);
                      setCorrectAnswer("");
                    }}
                    className="flex h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="MCQ">Multiple Choice (MCQ)</option>
                    <option value="TRUE_FALSE">True / False</option>
                    <option value="SHORT_ANSWER">Short Answer</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Question Text</label>
                  <textarea
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Enter the question query here..."
                    rows={3}
                    className="flex w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm shadow-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Points / Marks</label>
                  <Input
                    type="number"
                    min={1}
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                  />
                </div>

                {/* MCQ Builder */}
                {questionType === "MCQ" && (
                  <div className="space-y-3 border-t border-zinc-100 dark:border-zinc-900 pt-4">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm font-semibold">MCQ Choices</label>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={handleAddOption}
                      >
                        Add Choice
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {options.map((opt, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="correct-mcq"
                            checked={correctAnswer !== "" && correctAnswer === opt}
                            disabled={!opt.trim()}
                            onChange={() => setCorrectAnswer(opt)}
                            className="h-4 w-4 rounded-full border-zinc-300 text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                            title="Select as correct answer"
                          />
                          <Input
                            placeholder={`Option ${index + 1}`}
                            value={opt}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                            onClick={() => handleRemoveOption(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    {correctAnswer === "" && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                        * Please select one radio button to mark the correct choice.
                      </p>
                    )}
                  </div>
                )}

                {/* True/False Builder */}
                {questionType === "TRUE_FALSE" && (
                  <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-900 pt-4">
                    <label className="text-sm font-semibold">Correct Answer</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2 cursor-pointer p-2 border rounded-md w-full hover:bg-zinc-50 dark:hover:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                        <input
                          type="radio"
                          name="tf-answer"
                          value="true"
                          checked={correctAnswer === "true"}
                          onChange={() => setCorrectAnswer("true")}
                          className="h-4 w-4 text-primary focus:ring-primary cursor-pointer"
                        />
                        <span className="text-sm font-medium">True</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer p-2 border rounded-md w-full hover:bg-zinc-50 dark:hover:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                        <input
                          type="radio"
                          name="tf-answer"
                          value="false"
                          checked={correctAnswer === "false"}
                          onChange={() => setCorrectAnswer("false")}
                          className="h-4 w-4 text-primary focus:ring-primary cursor-pointer"
                        />
                        <span className="text-sm font-medium">False</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Short Answer Builder */}
                {questionType === "SHORT_ANSWER" && (
                  <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-900 pt-4">
                    <label className="text-sm font-semibold">Correct Answer Keyword / Phrase</label>
                    <Input
                      placeholder="Enter correct phrasing or primary keyword..."
                      value={correctAnswer}
                      onChange={(e) => setCorrectAnswer(e.target.value)}
                    />
                    <p className="text-xs text-zinc-500 leading-tight">
                      This keyword will be matched against the student's submission during evaluation.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t border-zinc-100 dark:border-zinc-900 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                  disabled={submitting}
                >
                  Clear Form
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? "Saving..." : editingQuestionId ? "Save Changes" : "Add Question"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
