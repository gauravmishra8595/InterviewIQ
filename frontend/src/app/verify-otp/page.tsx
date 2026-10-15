import Link from "next/link";
import { Suspense } from "react";

import AuthShell from "@/components/AuthShell";
import VerifyOtpForm from "@/components/VerifyOtpForm";

export const metadata = { title: "Enter code | InterviewIQ" };

export default function VerifyOtpPage() {
  return (
    <AuthShell title="Enter the 6-digit code" subtitle="The code expires in 10 minutes." footer={<Link href="/forgot-password" className="font-semibold text-violet hover:underline">Use a different email</Link>}>
      <Suspense fallback={null}><VerifyOtpForm /></Suspense>
    </AuthShell>
  );
}
