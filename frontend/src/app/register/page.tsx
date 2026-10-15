import Link from "next/link";

import AuthShell from "@/components/AuthShell";
import RegisterForm from "@/components/RegisterForm";

export const metadata = { title: "Create account | InterviewIQ" };

export default function RegisterPage() {
  return (
    <AuthShell title="Create your account" subtitle="Takes under a minute. No card needed." footer={<>Already registered? <Link href="/login" className="font-semibold text-violet hover:underline">Log in</Link></>}>
      <RegisterForm />
    </AuthShell>
  );
}
