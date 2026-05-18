"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { proctorService } from "@/lib/proctor.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, ArrowLeft, RefreshCw, AlertTriangle, ShieldCheck, Clock, Eye, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Student {
  id: string;
  fullName: string;
  rollNumber: string;
}

interface CheatLog {
  id: string;
  type: string;
  description: string | null;
  timestamp: string;
}

interface ExamSession {
  id: string;
  status: "STARTED" | "PAUSED" | "COMPLETED";
  startedAt: string;
  completedAt: string | null;
  obtainedMarks: number;
  student: Student;
  cheatLogs: CheatLog[];
  _count: {
    answers: number;
  };
}

export default function ProctorSessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const examId = resolvedParams.id;
  const router = useRouter();
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ExamSession | null>(null);

  const fetchSessions = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const res = await proctorService.getExamSessions(examId);
      setSessions(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to load active monitoring logs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSessions();

    // Setup 10-second polling for active live proctoring monitoring
    const interval = setInterval(() => {
      fetchSessions(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [examId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-zinc-500 text-sm mt-4">Connecting to live proctoring logs feed...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-900/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="icon"
              className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 text-zinc-300" />
            </Button>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Proctoring Dashboard</h1>
              <p className="text-zinc-400 text-sm">
                Monitor live student sessions, completion statuses, and security breach timelines.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
              Live Polling Active (10s)
            </span>
            <Button
              variant="outline"
              className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800"
              onClick={() => fetchSessions(true)}
              disabled={refreshing}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
              Refresh Feed
            </Button>
          </div>
        </div>

        {/* Sessions Feed Table */}
        <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-md shadow-2xl">
          <CardHeader className="border-b border-zinc-900 pb-4">
            <CardTitle className="text-lg">Examination Logs ({sessions.length})</CardTitle>
            <CardDescription className="text-zinc-500">
              Active and submitted exams for this group.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {sessions.length === 0 ? (
              <div className="text-center py-20 text-zinc-500">
                <ShieldCheck className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <h3 className="font-semibold text-zinc-400">No active sessions yet</h3>
                <p className="text-zinc-600 text-sm max-w-xs mx-auto mt-1">
                  Once students use the exam key to join, their status logs will populate this board in real time.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-zinc-950/60">
                  <TableRow className="border-zinc-800 hover:bg-zinc-950/60">
                    <TableHead className="text-zinc-400">Student</TableHead>
                    <TableHead className="text-zinc-400">Roll Number</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-zinc-400">Progress</TableHead>
                    <TableHead className="text-zinc-400">Joined At</TableHead>
                    <TableHead className="text-zinc-400">Score</TableHead>
                    <TableHead className="text-zinc-400">Security Warnings</TableHead>
                    <TableHead className="text-zinc-400 text-right">Audit Trail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((sess) => {
                    const violationCount = sess.cheatLogs.length;

                    return (
                      <TableRow key={sess.id} className="border-zinc-800 hover:bg-zinc-900/30">
                        <TableCell className="font-semibold text-white">
                          {sess.student.fullName}
                        </TableCell>
                        <TableCell className="text-zinc-400 font-mono text-xs">
                          {sess.student.rollNumber}
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-bold uppercase",
                            sess.status === "COMPLETED"
                              ? "bg-green-950/30 text-green-400 border border-green-900/50"
                              : "bg-amber-950/30 text-amber-400 border border-amber-900/50 animate-pulse"
                          )}>
                            {sess.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-zinc-400 text-xs">
                          {sess._count.answers} answers saved
                        </TableCell>
                        <TableCell className="text-zinc-400 text-xs font-mono">
                          {new Date(sess.startedAt).toLocaleTimeString()}
                        </TableCell>
                        <TableCell className="font-bold">
                          {sess.status === "COMPLETED" ? (
                            <span className="text-primary">{sess.obtainedMarks} pts</span>
                          ) : (
                            <span className="text-zinc-600">Pending</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {violationCount === 0 ? (
                            <span className="text-xs text-green-400 flex items-center gap-1.5 font-medium">
                              <ShieldCheck className="w-4 h-4 text-green-500" />
                              Clean Session
                            </span>
                          ) : (
                            <span className={cn(
                              "text-xs px-2.5 py-1 rounded-md font-bold inline-flex items-center gap-1.5",
                              violationCount >= 3
                                ? "bg-red-950/30 border border-red-900/50 text-red-400 animate-pulse"
                                : "bg-yellow-950/30 border border-yellow-900/50 text-yellow-400"
                            )}>
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {violationCount} Violation{violationCount > 1 ? "s" : ""}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:text-primary-foreground hover:bg-primary"
                                onClick={() => setSelectedSession(sess)}
                              >
                                <Eye className="w-4 h-4 mr-1.5" />
                                Inspect Log
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="border-zinc-800 bg-zinc-950 text-white max-w-lg">
                              <DialogHeader>
                                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                  Security Audit: {sess.student.fullName}
                                </DialogTitle>
                                <DialogDescription className="text-zinc-500">
                                  Chronological incident log captured by client listeners during testing.
                                </DialogDescription>
                              </DialogHeader>

                              {/* Timeline scroll container */}
                              <div className="mt-4 max-h-[350px] overflow-y-auto pr-1 space-y-4">
                                {sess.cheatLogs.length === 0 ? (
                                  <div className="text-center py-10 text-zinc-500 text-sm">
                                    No security incidents captured for this session. 🛡️
                                  </div>
                                ) : (
                                  <div className="relative border-l border-zinc-800 ml-3 pl-4 space-y-6 py-2">
                                    {sess.cheatLogs.map((log) => (
                                      <div key={log.id} className="relative">
                                        {/* Dot */}
                                        <div className={cn(
                                          "absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border",
                                          log.type === "auto_termination"
                                            ? "bg-red-500 border-red-400"
                                            : "bg-yellow-500 border-yellow-400"
                                        )} />
                                        <div className="space-y-1">
                                          <span className="text-zinc-500 text-[10px] font-mono block">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                          </span>
                                          <h4 className="text-xs uppercase font-extrabold tracking-wider text-zinc-300">
                                            {log.type.replace("_", " ")}
                                          </h4>
                                          <p className="text-sm text-zinc-400 leading-tight">
                                            {log.description}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
