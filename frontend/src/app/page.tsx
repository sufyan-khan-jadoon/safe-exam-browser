import { redirect } from "next/navigation";

export default function Home() {
  // Redirect the root page directly to the dashboard
  // The dashboard layout will handle unauthenticated users
  redirect("/dashboard");
}
