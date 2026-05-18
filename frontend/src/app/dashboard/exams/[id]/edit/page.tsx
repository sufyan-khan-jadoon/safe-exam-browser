"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { examService } from "@/lib/exam.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const editExamSchema = z
  .object({
    examTitle: z.string().min(3, "Title must be at least 3 characters").max(100),
    examDescription: z.string().max(500).optional(),
    durationInMinutes: z.coerce
      .number()
      .int()
      .positive("Duration must be a positive integer"),
    totalMarks: z.coerce
      .number()
      .int()
      .positive("Total marks must be a positive integer"),
    passingMarks: z.coerce
      .number()
      .int()
      .positive("Passing marks must be a positive integer"),
    examStartDate: z.string().min(1, "Start date is required"),
    examEndDate: z.string().min(1, "End date is required"),
    isPublished: z.boolean().default(false),
  })
  .refine((data) => data.passingMarks <= data.totalMarks, {
    message: "Passing marks cannot exceed total marks",
    path: ["passingMarks"],
  })
  .refine((data) => new Date(data.examEndDate) > new Date(data.examStartDate), {
    message: "Exam end date must be strictly after the start date",
    path: ["examEndDate"],
  });

export default function EditExamPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const examId = resolvedParams.id;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const form = useForm<z.infer<typeof editExamSchema>>({
    resolver: zodResolver(editExamSchema),
    defaultValues: {
      examTitle: "",
      examDescription: "",
      durationInMinutes: 60,
      totalMarks: 100,
      passingMarks: 40,
      examStartDate: "",
      examEndDate: "",
      isPublished: false,
    },
  });

  useEffect(() => {
    const loadExam = async () => {
      try {
        const res = await examService.getExamById(examId);
        const exam = res.data;

        // Convert UTC dates to format supported by datetime-local input
        const formatDatetime = (dateString: string) => {
          const date = new Date(dateString);
          const pad = (n: number) => n.toString().padStart(2, "0");
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
            date.getDate()
          )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        };

        form.reset({
          examTitle: exam.examTitle,
          examDescription: exam.examDescription || "",
          durationInMinutes: exam.durationInMinutes,
          totalMarks: exam.totalMarks,
          passingMarks: exam.passingMarks,
          examStartDate: formatDatetime(exam.examStartDate),
          examEndDate: formatDatetime(exam.examEndDate),
          isPublished: exam.isPublished,
        });
      } catch (err: any) {
        toast.error("Failed to load exam details");
        router.push("/dashboard/exams");
      } finally {
        setIsFetching(false);
      }
    };

    loadExam();
  }, [examId, form, router]);

  const onSubmit = async (values: z.infer<typeof editExamSchema>) => {
    try {
      setIsLoading(true);
      await examService.updateExam(examId, values);
      toast.success("Exam updated successfully!");
      router.push("/dashboard/exams");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update exam");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Edit Exam</h2>
        <p className="text-zinc-500">Modify the settings of your online test.</p>
      </div>

      <Card className="shadow-md border-zinc-200 dark:border-zinc-800">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="examTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exam Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Computer Science Midterm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="examDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exam Description</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Covers chapters 1 to 5, including networks and databases." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="durationInMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (Minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalMarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Marks</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passingMarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passing Marks</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="examStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date & Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" className="block w-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="examEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date & Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" className="block w-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary mt-1 cursor-pointer"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">Publish Exam</FormLabel>
                      <p className="text-xs text-zinc-500">
                        Once published, students can take the exam using the unique key.
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/exams")}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
