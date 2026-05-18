"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { studentService } from "@/lib/student.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { GraduationCap, ShieldAlert } from "lucide-react";

const joinSchema = z.object({
  fullName: z.string().min(3, "Name must be at least 3 characters").max(100),
  rollNumber: z.string().min(3, "Roll number must be at least 3 characters").max(50),
  examKey: z
    .string()
    .length(6, "Exam Key must be exactly 6 characters")
    .toUpperCase(),
});

export default function StudentJoinPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof joinSchema>>({
    resolver: zodResolver(joinSchema),
    defaultValues: {
      fullName: "",
      rollNumber: "",
      examKey: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof joinSchema>) => {
    try {
      setIsLoading(true);
      const res = await studentService.joinExam(values);
      toast.success("Joined exam session successfully!");
      
      // Store token locally (as fallback, cookie handles main requests)
      localStorage.setItem("student_jwt", res.data.token);
      
      // Redirect to the dynamic exam screen
      router.push(`/student/exam/${res.data.session.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to join exam");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 z-10">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-inner">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Student Lobby
          </h1>
          <p className="text-zinc-400 text-sm max-w-xs">
            Enter your credentials and the secure key provided by your teacher to access the examination portal.
          </p>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-md shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-white">Join Examination</CardTitle>
            <CardDescription className="text-zinc-500">
              Please enter your actual academic records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Jane Doe"
                          className="bg-zinc-950/80 border-zinc-800 text-white placeholder:text-zinc-600 focus:ring-primary focus:border-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rollNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">Roll Number / Student ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., CS-2024-89A"
                          className="bg-zinc-950/80 border-zinc-800 text-white placeholder:text-zinc-600 focus:ring-primary focus:border-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="examKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">Exam Key (6 characters)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., AB3D9E"
                          maxLength={6}
                          className="bg-zinc-950/80 border-zinc-800 text-white placeholder:text-zinc-600 font-mono tracking-widest text-center uppercase focus:ring-primary focus:border-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-start p-3 bg-red-950/20 border border-red-900/50 rounded-lg text-red-400 gap-2 mt-4 text-xs">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="leading-tight">
                    Attention: Opening developers console, resizing windows, or swapping tabs during this examination will trigger alert notifications to your proctor.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? "Validating Key..." : "Enter Secure Exam"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
