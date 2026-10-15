import Link from "next/link";

import AuthShell from "@/components/AuthShell";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata = { title: "Reset password | InterviewIQ" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset your password" subtitle="Enter the email on your account and we will send a code." footer={<Link href="/login" className="font-semibold text-violet hover:underline">Back to log in</Link>}>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
