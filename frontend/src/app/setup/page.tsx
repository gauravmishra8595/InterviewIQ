"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

import ResumeUpload from "@/components/ResumeUpload";
import RoleSelector from "@/components/RoleSelector";
import { useApi } from "@/hooks/useApi";
import { cap } from "@/lib/format";
import { Difficulty, ROLES, Role, Session } from "@/lib/types";

function Segmented<T extends string | number>({ label, value, options, onChange, hint }: { label: string; value: T; options: { v: T; text: string; hint?: string }[]; onChange: (v: T) => void; hint?: string }) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="inline-flex w-full rounded-xl border border-line bg-white p-1">
        {options.map((o) => (
          <button key={String(o.v)} type="button" onClick={() => onChange(o.v)} aria-pressed={value === o.v}
            className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${value === o.v ? "bg-violet text-white" : "text-ink-soft hover:text-violet"}`}>
            {o.text}
            {o.hint && <span className={`block text-xs font-normal ${value === o.v ? "text-white/75" : "text-ink-faint"}`}>{o.hint}</span>}
          </button>
        ))}
      </div>
      {hint && <p className="mt-1.5 text-xs text-ink-faint">{hint}</p>}
    </fieldset>
  );
}

function SetupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { call, ready } = useApi();
  const initial = (ROLES.find((r) => r.id === params.get("role"))?.id ?? "sde") as Role;
  const [role, setRole] = useState<Role>(initial);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [total, setTotal] = useState(5);
  const [resume, setResume] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function start(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.append("role", role);
    form.append("difficulty", difficulty);
    form.append("total_questions", String(total));
    if (resume) form.append("resume", resume);
    try {
      const session = await call<Session>("/interviews/", { form });
      router.push(`/interview/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the interview.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={start} className="space-y-8">
      <section><h2 className="label text-base">1. What are you interviewing for?</h2><RoleSelector value={role} onChange={setRole} /></section>
      <section className="grid gap-6 sm:grid-cols-2">
        <Segmented label="2. Difficulty" value={difficulty} onChange={setDifficulty}
          options={(["easy", "medium", "hard"] as Difficulty[]).map((d) => ({ v: d, text: cap(d) }))}
          hint={difficulty === "easy" ? "Fundamentals and common questions." : difficulty === "medium" ? "Typical campus placement level." : "Product-company depth."} />
        <Segmented label="3. Length" value={total} onChange={setTotal}
          options={[{ v: 3, text: "3", hint: "~8 min" }, { v: 5, text: "5", hint: "~15 min" }, { v: 8, text: "8", hint: "~25 min" }]} />
      </section>
      <section><h2 className="label text-base">4. Resume <span className="font-normal text-ink-faint">(optional)</span></h2><ResumeUpload file={resume} onChange={setResume} /></section>
      {error && <p className="error-box" role="alert">{error}</p>}
      <div className="rounded-2xl bg-violet-wash p-4 text-sm text-ink-soft">Tip: use Chrome, find a quiet spot, and allow the microphone when asked. You can always type instead.</div>
      <button className="btn btn-primary w-full py-4 text-base" disabled={busy || !ready}>{busy ? "Preparing your interviewer..." : "Start interview"}</button>
    </form>
  );
}

export default function SetupPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-3xl font-bold">Set up your interview</h1>
      <p className="mt-2 mb-10 text-ink-soft">Four quick choices, then you are in the room.</p>
      <Suspense fallback={null}><SetupForm /></Suspense>
    </main>
  );
}
