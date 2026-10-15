"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import PasswordField from "./PasswordField";

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

export default function ResetPasswordForm() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = sessionStorage.getItem("iq_reset_token");
    if (!t) router.replace("/forgot-password");
    else setToken(t);
  }, [router]);

  const level = strength(password);
  const labels = ["Too short", "Weak", "Okay", "Good", "Strong"];
  const colors = ["bg-line", "bg-rose", "bg-spot", "bg-mint", "bg-mint"];

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) return setError("The two passwords do not match.");
    setBusy(true);
    try {
      await apiFetch("/auth/reset-password/", { body: { reset_token: token, new_password: password } });
      sessionStorage.removeItem("iq_reset_token");
      router.push("/login?reset=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the password.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <PasswordField id="new-password" label="New password" value={password} onChange={setPassword} autoComplete="new-password" placeholder="At least 8 characters" />
        <div className="mt-2 flex items-center gap-2" aria-live="polite">
          <div className="flex flex-1 gap-1">{[1, 2, 3, 4].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${level >= i ? colors[level] : "bg-line"}`} />)}</div>
          <span className="w-16 text-right text-xs text-ink-faint">{password ? labels[level] : ""}</span>
        </div>
      </div>
      <PasswordField id="confirm-password" label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
      {error && <p className="error-box" role="alert">{error}</p>}
      <button className="btn btn-primary w-full" disabled={busy || !token}>{busy ? "Saving..." : "Save new password"}</button>
    </form>
  );
}
