"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VerifyEmailPage() {
  return (
    <Card className="shadow-lg border-zinc-200 dark:border-zinc-800 text-center">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <MailCheck className="w-8 h-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Check your email</CardTitle>
        <CardDescription className="text-zinc-500">
          We've sent you a verification link. Please check your inbox and click the link to verify your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-zinc-500 mb-4">
          Can't find the email? Check your spam folder or ensure you entered the correct email address.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <Link 
          href="/login"
          className={cn(buttonVariants({ variant: "outline" }), "w-full")}
        >
          Back to Login
        </Link>
      </CardFooter>
    </Card>
  );
}
