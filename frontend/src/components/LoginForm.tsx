"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import GoogleButton from "./GoogleButton";
import PasswordField from "./PasswordField";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(params.get("error") ? "Sign-in failed. Try again or use email and password." : null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signIn("credentials", { email: email.trim(), password, redirect: false });
    setBusy(false);
    if (res?.error) setError(res.error === "CredentialsSignin" ? "Wrong email or password." : res.error);
    else router.push(callbackUrl);
  }

  return (
    <div className="space-y-5">
      {params.get("reset") && <p className="ok-box">Password updated. Log in with your new password.</p>}
      <GoogleButton callbackUrl={callbackUrl} />
      <div className="flex items-center gap-3 text-xs text-ink-faint"><span className="h-px flex-1 bg-line" />or log in with email<span className="h-px flex-1 bg-line" /></div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@college.edu" required />
        </div>
        <PasswordField id="password" label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
        <div className="text-right"><Link href="/forgot-password" className="text-sm font-medium text-violet hover:underline">Forgot password?</Link></div>
        {error && <p className="error-box" role="alert">{error}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Logging in..." : "Log in"}</button>
      </form>
    </div>
  );
}
