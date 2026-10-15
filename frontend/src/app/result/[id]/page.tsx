"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ScoreBar, ScoreRing } from "@/components/ScoreCard";
import { useApi } from "@/hooks/useApi";
import { cap, formatLongDate, scoreTone } from "@/lib/format";
import { roleLabel, Session } from "@/lib/types";

function paceNote(wpm: number | null) {
  if (!wpm) return "Record your answers by voice to see your pace.";
  if (wpm < 100) return "A little slow. Aim for 120 to 160 words a minute.";
  if (wpm > 180) return "Quite fast. Slow down so each point lands.";
  return "A comfortable pace for an interviewer to follow.";
}

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { call, ready } = useApi();
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    call<Session>(`/interviews/${id}/`)
      .then((s) => (s.status !== "completed" ? router.replace(`/interview/${id}`) : setSession(s)))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load this report."));
  }, [ready, id, call, router]);

  if (error) return <main className="mx-auto max-w-xl px-5 py-24 text-center"><p className="error-box">{error}</p><Link href="/dashboard" className="btn btn-ghost mt-6">Back to dashboard</Link></main>;
  if (!session) return <main className="mx-auto max-w-xl px-5 py-24 text-center text-ink-soft">Building your report...</main>;

  const r = session.report;
  const turns = session.turns.filter((t) => t.answered_at);
  const overall = r.overall ?? session.overall_score ?? 0;

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <p className="text-sm text-ink-soft">{roleLabel(session.role)}, {cap(session.difficulty)}, {formatLongDate(session.created_at)}</p>
      <div className="mt-4 grid items-center gap-8 md:grid-cols-[auto_1fr]">
        <ScoreRing score={overall} />
        <div>
          <h1 className={`text-4xl font-bold ${scoreTone(overall)}`}>{r.grade}</h1>
          <p className="mt-3 max-w-xl text-lg text-ink-soft">{r.summary}</p>
        </div>
      </div>

      <section className="panel mt-10 grid gap-6 md:grid-cols-3">
        <ScoreBar label="Content" value={r.averages?.content ?? 0} />
        <ScoreBar label="Structure" value={r.averages?.structure ?? 0} />
        <ScoreBar label="Delivery" value={r.averages?.communication ?? 0} />
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-5"><p className="text-sm text-ink-soft">Speaking pace</p><p className="font-display text-3xl font-bold">{r.speech?.avg_wpm ?? "n/a"}<span className="text-sm font-normal text-ink-faint"> wpm</span></p><p className="mt-1 text-xs text-ink-faint">{paceNote(r.speech?.avg_wpm ?? null)}</p></div>
        <div className="rounded-2xl border border-line bg-white p-5"><p className="text-sm text-ink-soft">Filler words</p><p className="font-display text-3xl font-bold">{r.speech?.filler_total ?? 0}</p><p className="mt-1 text-xs text-ink-faint">Words like basically, actually and you know. Pause instead.</p></div>
        <div className="rounded-2xl border border-line bg-white p-5"><p className="text-sm text-ink-soft">Average answer length</p><p className="font-display text-3xl font-bold">{r.speech?.avg_words ?? 0}<span className="text-sm font-normal text-ink-faint"> words</span></p><p className="mt-1 text-xs text-ink-faint">Around 80 to 150 words fits most answers.</p></div>
      </section>

      <section className="mt-10 grid gap-8 md:grid-cols-2">
        <div><h2 className="text-xl font-semibold text-mint">What you did well</h2><ul className="mt-3 space-y-2 text-ink-soft">{(r.strengths ?? []).map((s) => <li key={s} className="border-l-2 border-mint pl-3">{s}</li>)}</ul></div>
        <div><h2 className="text-xl font-semibold text-violet">What to improve</h2><ul className="mt-3 space-y-2 text-ink-soft">{(r.improvements ?? []).map((s) => <li key={s} className="border-l-2 border-violet pl-3">{s}</li>)}</ul></div>
      </section>

      {!!r.next_steps?.length && (
        <section className="mt-8 rounded-2xl bg-violet-wash p-6">
          <h2 className="text-lg font-semibold">Do this next</h2>
          <ul className="mt-2 space-y-1.5 text-ink-soft">{r.next_steps.map((s) => <li key={s}>{s}</li>)}</ul>
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Question by question</h2>
        <div className="mt-4 space-y-3">
          {turns.map((t) => (
            <details key={t.id} className="group rounded-2xl border border-line bg-white p-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                <span className="font-medium">{t.index + 1}. {t.question_text}</span>
                <span className={`shrink-0 font-display text-xl font-bold ${scoreTone(t.overall_score ?? 0)}`}>{Math.round(t.overall_score ?? 0)}</span>
              </summary>
              <div className="mt-4 space-y-4 border-t border-line pt-4 text-sm">
                <div><p className="text-xs font-semibold text-ink-faint">Your answer</p><p className="mt-1 whitespace-pre-wrap text-ink-soft">{t.skipped ? "Skipped" : t.answer_text}</p></div>
                {!t.skipped && (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <ScoreBar label="Content" value={t.scores.content ?? 0} />
                    <ScoreBar label="Structure" value={t.scores.structure ?? 0} />
                    <ScoreBar label="Delivery" value={t.scores.communication ?? 0} />
                  </div>
                )}
                {!!t.feedback.improvements?.length && <div><p className="text-xs font-semibold text-ink-faint">Improve</p><ul className="mt-1 list-disc space-y-1 pl-5 text-ink-soft">{t.feedback.improvements.map((x) => <li key={x}>{x}</li>)}</ul></div>}
                {t.feedback.better_answer_hint && <div><p className="text-xs font-semibold text-ink-faint">A strong answer covers</p><p className="mt-1 text-ink-soft">{t.feedback.better_answer_hint}</p></div>}
              </div>
            </details>
          ))}
        </div>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href={`/setup?role=${session.role}`} className="btn btn-primary">Practise this role again</Link>
        <Link href="/dashboard" className="btn btn-ghost">Back to dashboard</Link>
      </div>
    </main>
  );
}
