"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function VerifyTokenPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email address...");

  useEffect(() => {
    const verify = async () => {
      try {
        await authService.verifyEmail(params.token);
        setStatus("success");
        setMessage("Your email has been successfully verified! You can now log in.");
      } catch (err: any) {
        setStatus("error");
        setMessage(err.response?.data?.error || "Invalid or expired verification link.");
      }
    };

    verify();
  }, [params.token]);

  return (
    <Card className="shadow-lg border-zinc-200 dark:border-zinc-800 text-center">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          {status === "loading" && <Loader2 className="w-12 h-12 text-primary animate-spin" />}
          {status === "success" && <CheckCircle className="w-12 h-12 text-green-500" />}
          {status === "error" && <XCircle className="w-12 h-12 text-red-500" />}
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          {status === "loading" && "Verifying..."}
          {status === "success" && "Verification Complete"}
          {status === "error" && "Verification Failed"}
        </CardTitle>
        <CardDescription className="text-zinc-500">{message}</CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-center pt-4">
        {status !== "loading" && (
          <Link 
            href="/login"
            className={cn(buttonVariants(), "w-full")}
          >
            Go to Login
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
