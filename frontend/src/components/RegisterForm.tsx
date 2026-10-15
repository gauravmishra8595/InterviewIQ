"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { apiFetch } from "@/lib/api";
import GoogleButton from "./GoogleButton";
import PasswordField from "./PasswordField";

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) return setError("The two passwords do not match.");
    setBusy(true);
    try {
      await apiFetch("/auth/register/", {
        body: { name: form.name.trim(), email: form.email.trim(), password: form.password },
      });
      const res = await signIn("credentials", { email: form.email.trim(), password: form.password, redirect: false });
      if (res?.error) throw new Error("Account created, but automatic login failed. Please log in.");
      router.push("/setup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <GoogleButton callbackUrl="/setup" label="Sign up with Google" />
      <div className="flex items-center gap-3 text-xs text-ink-faint"><span className="h-px flex-1 bg-line" />or use email<span className="h-px flex-1 bg-line" /></div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="name" className="label">Full name</label>
          <input id="name" className="input" value={form.name} onChange={(e) => set("name")(e.target.value)} autoComplete="name" required />
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" className="input" value={form.email} onChange={(e) => set("email")(e.target.value)} autoComplete="email" required />
        </div>
        <PasswordField id="password" label="Password" value={form.password} onChange={set("password")} autoComplete="new-password" placeholder="At least 8 characters" />
        <PasswordField id="confirm" label="Confirm password" value={form.confirm} onChange={set("confirm")} autoComplete="new-password" />
        {error && <p className="error-box" role="alert">{error}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Creating account..." : "Create account"}</button>
      </form>
    </div>
  );
}
