import Link from "next/link";
import { Suspense } from "react";

import AuthShell from "@/components/AuthShell";
import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Log in | InterviewIQ" };

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Log in to keep practising where you left off." footer={<>New here? <Link href="/register" className="font-semibold text-violet hover:underline">Create an account</Link></>}>
      <Suspense fallback={null}><LoginForm /></Suspense>
    </AuthShell>
  );
}
