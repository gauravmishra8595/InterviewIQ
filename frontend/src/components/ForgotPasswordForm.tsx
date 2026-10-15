"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { apiFetch } from "@/lib/api";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<{ detail: string; dev_otp?: string }>("/auth/forgot-password/", { body: { email: email.trim() } });
      if (res.dev_otp) sessionStorage.setItem("iq_dev_otp", res.dev_otp);
      else sessionStorage.removeItem("iq_dev_otp");
      router.push(`/verify-otp?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" autoComplete="email" required />
        <p className="mt-1.5 text-xs text-ink-faint">We will email you a 6-digit code to verify it is you.</p>
      </div>
      {error && <p className="error-box" role="alert">{error}</p>}
      <button className="btn btn-primary w-full" disabled={busy || !email.trim()}>{busy ? "Sending code..." : "Send code"}</button>
    </form>
  );
}
