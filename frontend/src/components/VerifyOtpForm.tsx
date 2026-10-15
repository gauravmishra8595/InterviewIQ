"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import OtpInput from "./OtpInput";

export default function VerifyOtpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  useEffect(() => { if (!email) router.replace("/forgot-password"); }, [email, router]);
  useEffect(() => { setDevOtp(sessionStorage.getItem("iq_dev_otp")); }, []);
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function verify(e?: FormEvent) {
    e?.preventDefault();
    if (otp.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<{ reset_token: string }>("/auth/verify-otp/", { body: { email, otp } });
      sessionStorage.setItem("iq_reset_token", res.reset_token);
      sessionStorage.removeItem("iq_dev_otp");
      router.push("/reset-password");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify the code.");
      setOtp("");
      setBusy(false);
    }
  }

  async function resend() {
    setError(null);
    setNote(null);
    try {
      const res = await apiFetch<{ detail: string; dev_otp?: string }>("/auth/forgot-password/", { body: { email } });
      if (res.dev_otp) { sessionStorage.setItem("iq_dev_otp", res.dev_otp); setDevOtp(res.dev_otp); }
      setNote("A new code is on its way.");
      setCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend the code.");
    }
  }

  return (
    <form onSubmit={verify} className="space-y-5">
      <div>
        <p className="mb-3 text-sm text-ink-soft">Code emailed to <strong className="text-ink">{email}</strong>. Check your spam folder too.</p>
        <OtpInput value={otp} onChange={(v) => { setOtp(v); if (v.length === 6) setTimeout(() => document.getElementById("verify-btn")?.click(), 120); }} disabled={busy} />
      </div>
      {devOtp && <p className="ok-box text-xs">Local demo mode: your code is <strong className="font-display text-base tracking-widest">{devOtp}</strong></p>}
      {note && <p className="ok-box" role="status">{note}</p>}
      {error && <p className="error-box" role="alert">{error}</p>}
      <button id="verify-btn" className="btn btn-primary w-full" disabled={busy || otp.length !== 6}>{busy ? "Checking..." : "Verify code"}</button>
      <p className="text-center text-sm text-ink-soft">
        Did not get it?{" "}
        {cooldown > 0 ? <span className="text-ink-faint">Resend in {cooldown}s</span> : <button type="button" onClick={resend} className="font-semibold text-violet hover:underline">Resend code</button>}
      </p>
    </form>
  );
}
