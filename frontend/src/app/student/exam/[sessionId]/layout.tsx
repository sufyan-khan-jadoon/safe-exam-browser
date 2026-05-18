"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function StudentExamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Check if student session token exists in localStorage (used as fallback check on frontend)
    const token = localStorage.getItem("student_jwt");
    if (!token) {
      router.push("/student/join");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-zinc-500 text-sm mt-4">Verifying exam session credentials...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-primary selection:text-primary-foreground">
      {children}
    </div>
  );
}
