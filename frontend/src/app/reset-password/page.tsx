import AuthShell from "@/components/AuthShell";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata = { title: "New password | InterviewIQ" };

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Choose a new password" subtitle="Pick something you have not used on other sites.">
      <ResetPasswordForm />
    </AuthShell>
  );
}
