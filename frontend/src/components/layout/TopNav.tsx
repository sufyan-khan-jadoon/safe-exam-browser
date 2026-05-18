"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function TopNav() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname.includes("/exams/create")) return "Create Exam";
    if (pathname.includes("/exams")) return "Exams";
    if (pathname.includes("/results")) return "Results";
    if (pathname.includes("/settings")) return "Settings";
    return "Dashboard Overview";
  };

  return (
    <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
      <div className="flex flex-1 items-center justify-between px-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">{getPageTitle()}</h1>
        <div className="flex items-center space-x-4">
          <Link 
            href="/dashboard/exams/create"
            className={cn(buttonVariants({ size: "sm" }), "hidden sm:flex")}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Exam
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
