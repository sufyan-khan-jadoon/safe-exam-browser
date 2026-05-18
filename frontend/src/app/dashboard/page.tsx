"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/useAuthStore";
import { FileText, Users, Award, TrendingUp } from "lucide-react";

const stats = [
  { name: "Total Exams", value: "12", icon: FileText, change: "+2 from last month" },
  { name: "Active Students", value: "340", icon: Users, change: "+14 from last month" },
  { name: "Average Score", value: "76%", icon: Award, change: "+4% from last month" },
  { name: "Completion Rate", value: "92%", icon: TrendingUp, change: "Stable" },
];

export default function DashboardPage() {
  const { teacher } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome back, {teacher?.fullName}!</h2>
        <p className="text-zinc-500">Here's an overview of your examination system.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="shadow-sm border-zinc-200 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <stat.icon className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-zinc-500 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle>Recent Exams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Midterm Examination - CS101</p>
                    <p className="text-sm text-zinc-500">Scheduled for next week</p>
                  </div>
                  <div className="font-medium text-sm">Draft</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center">
                  <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mr-4">
                    <span className="text-xs font-medium">ST</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">John Doe (10293)</p>
                    <p className="text-sm text-zinc-500">Quiz 1 - Mathematics</p>
                  </div>
                  <div className="font-medium text-sm text-green-500">85%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
