"use client";

import { useEffect, useState } from "react";
import { examService, ExamData } from "@/lib/exam.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Loader2, Copy, Trash2, Edit, Calendar, Clock, Award, ShieldAlert, ExternalLink, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ExamsPage() {
  const [exams, setExams] = useState<ExamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await examService.getExams();
      setExams(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to fetch exams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success(`Exam key ${key} copied to clipboard!`);
  };

  const handlePublish = async (id: string) => {
    try {
      await examService.updateExam(id, { isPublished: true });
      toast.success("Exam published successfully!");
      fetchExams();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to publish exam");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this exam? This will permanently delete all associated questions and student sessions.")) {
      return;
    }
    try {
      await examService.deleteExam(id);
      toast.success("Exam deleted successfully!");
      fetchExams();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete exam");
    }
  };

  const filteredExams = exams.filter((exam) => {
    if (filter === "published") return exam.isPublished;
    if (filter === "draft") return !exam.isPublished;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Your Exams</h2>
          <p className="text-zinc-500">Create, manage, and monitor your online exams.</p>
        </div>
        <Link
          href="/dashboard/exams/create"
          className={cn(buttonVariants({ variant: "default" }), "w-full sm:w-auto")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Exam
        </Link>
      </div>

      <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <Button
          variant={filter === "all" ? "default" : "ghost"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All Exams
        </Button>
        <Button
          variant={filter === "published" ? "default" : "ghost"}
          size="sm"
          onClick={() => setFilter("published")}
        >
          Published
        </Button>
        <Button
          variant={filter === "draft" ? "default" : "ghost"}
          size="sm"
          onClick={() => setFilter("draft")}
        >
          Drafts
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : filteredExams.length === 0 ? (
        <Card className="text-center py-16 border-dashed border-2">
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <ShieldAlert className="w-12 h-12 text-zinc-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">No exams found</h3>
              <p className="text-zinc-500 text-sm max-w-sm mx-auto">
                {filter === "all"
                  ? "You haven't created any exams yet. Click the button above to create your first exam."
                  : `You have no ${filter} exams.`}
              </p>
            </div>
            {filter === "all" && (
              <Link href="/dashboard/exams/create" className={buttonVariants()}>
                Create First Exam
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredExams.map((exam) => (
            <Card
              key={exam.id}
              className={cn(
                "shadow-md border-zinc-200 dark:border-zinc-800 flex flex-col justify-between transition-all hover:shadow-lg",
                !exam.isPublished && "border-l-4 border-l-yellow-500"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={cn(
                      "px-2 py-0.5 text-xs font-semibold rounded-full",
                      exam.isPublished
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    )}
                  >
                    {exam.isPublished ? "Published" : "Draft"}
                  </span>
                  <div className="flex items-center space-x-1 bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                    <span>{exam.examKey}</span>
                    <button
                      onClick={() => handleCopyKey(exam.examKey || "")}
                      className="hover:text-primary transition-colors ml-1"
                      title="Copy Key"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <CardTitle className="line-clamp-1">{exam.examTitle}</CardTitle>
                <CardDescription className="line-clamp-2 h-10 mt-1">
                  {exam.examDescription || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pb-4 border-t border-zinc-100 dark:border-zinc-900 pt-4">
                <div className="flex items-center text-sm text-zinc-500">
                  <Clock className="w-4 h-4 mr-2 text-zinc-400" />
                  <span>Duration: {exam.durationInMinutes} mins</span>
                </div>
                <div className="flex items-center text-sm text-zinc-500">
                  <Award className="w-4 h-4 mr-2 text-zinc-400" />
                  <span>
                    Marks: {exam.passingMarks}/{exam.totalMarks} passing
                  </span>
                </div>
                <div className="flex items-center text-sm text-zinc-500">
                  <Calendar className="w-4 h-4 mr-2 text-zinc-400" />
                  <span className="truncate">
                    {new Date(exam.examStartDate).toLocaleDateString()} -{" "}
                    {new Date(exam.examEndDate).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between gap-2 border-t border-zinc-100 dark:border-zinc-900 pt-4">
                <div className="flex space-x-1">
                  <Link
                    href={`/dashboard/exams/${exam.id}/edit`}
                    className={cn(buttonVariants({ variant: "outline", size: "icon" }), "h-8 w-8")}
                    title="Edit Exam"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={() => handleDelete(exam.id || "")}
                    title="Delete Exam"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {!exam.isPublished && (
                  <Button size="sm" onClick={() => handlePublish(exam.id || "")}>
                    Publish Exam
                  </Button>
                )}
                {exam.isPublished && (
                  <div className="flex space-x-1.5">
                    <Link
                      href={`/dashboard/exams/${exam.id}/questions`}
                      className={cn(buttonVariants({ size: "sm", variant: "secondary" }))}
                    >
                      Questions
                    </Link>
                    <Link
                      href={`/dashboard/exams/${exam.id}/sessions`}
                      className={cn(buttonVariants({ size: "sm", variant: "default" }))}
                    >
                      Proctor
                    </Link>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
