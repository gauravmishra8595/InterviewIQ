"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import ProgressChart from "@/components/ProgressChart";
import { ScoreBar } from "@/components/ScoreCard";
import { useApi } from "@/hooks/useApi";
import { cap, formatDate, scoreTone } from "@/lib/format";
import { roleLabel, SessionListItem, Stats } from "@/lib/types";

export default function Dashboard() {
  const { data } = useSession();
  const { call, ready } = useApi();
  const [stats, setStats] = useState<Stats | null>(null);
  const [sessions, setSessions] = useState<SessionListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    Promise.all([call<Stats>("/interviews/stats/"), call<SessionListItem[]>("/interviews/")])
      .then(([s, l]) => { setStats(s); setSessions(l); })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load your dashboard."));
  }, [ready, call]);

  const first = data?.user?.name?.split(" ")[0];
  const loading = !stats || !sessions;
  const trend = stats?.trend ?? [];
  const delta = trend.length >= 2 ? Math.round(trend[trend.length - 1].score - trend[0].score) : null;

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{first ? `Hi ${first}, ready to practise?` : "Your practice dashboard"}</h1>
          <p className="mt-1 text-ink-soft">{stats?.completed ? `You have finished ${stats.completed} interview${stats.completed === 1 ? "" : "s"}.` : "Your first interview takes about 15 minutes."}</p>
        </div>
        <Link href="/setup" className="btn btn-primary px-6">New interview</Link>
      </div>

      {error && <p className="error-box mt-8">{error}</p>}
      {loading && !error && <p className="mt-16 text-center text-ink-soft">Loading your progress...</p>}

      {stats && sessions && stats.completed === 0 && (
        <div className="mt-10 rounded-3xl border-2 border-dashed border-line bg-white p-12 text-center">
          <h2 className="text-2xl font-bold">No finished interviews yet</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-soft">Pick a role, answer a few questions out loud, and your scores and trend will show up here.</p>
          <Link href="/setup" className="btn btn-primary mt-6 px-7">Start your first interview</Link>
        </div>
      )}

      {stats && sessions && stats.completed > 0 && (
        <>
          <section className="panel mt-8 grid divide-y divide-line p-0 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[["Average score", stats.average], ["Best score", stats.best], ["Latest score", stats.latest]].map(([k, v]) => (
              <div key={String(k)} className="p-6">
                <p className="text-sm text-ink-soft">{k}</p>
                <p className={`font-display text-4xl font-bold ${scoreTone(Number(v ?? 0))}`}>{v !== null ? Math.round(Number(v)) : "n/a"}</p>
              </div>
            ))}
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="panel">
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">Score trend</h2>
                {delta !== null && <span className={`text-sm font-medium ${delta >= 0 ? "text-mint" : "text-rose"}`}>{delta >= 0 ? "+" : ""}{delta} since your first</span>}
              </div>
              <ProgressChart points={trend.map((t) => ({ score: t.score, date: t.date }))} />
            </div>
            <div className="panel space-y-5">
              <h2 className="text-lg font-semibold">Where you stand</h2>
              <ScoreBar label="Content" value={stats.categories.content ?? 0} />
              <ScoreBar label="Structure" value={stats.categories.structure ?? 0} />
              <ScoreBar label="Delivery" value={stats.categories.communication ?? 0} />
              <p className="text-xs text-ink-faint">Averages across all finished interviews. Work on your lowest bar first.</p>
            </div>
          </section>
        </>
      )}

      {sessions && sessions.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Recent interviews</h2>
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {sessions.slice(0, 10).map((s) => {
              const done = s.status === "completed";
              return (
                <li key={s.id}>
                  <Link href={done ? `/result/${s.id}` : `/interview/${s.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-violet-wash/50">
                    <div>
                      <p className="font-medium">{roleLabel(s.role)}</p>
                      <p className="text-sm text-ink-soft">{cap(s.difficulty)}, {s.answered_count}/{s.total_questions} answered, {formatDate(s.created_at)}</p>
                    </div>
                    {done ? <span className={`font-display text-2xl font-bold ${scoreTone(s.overall_score ?? 0)}`}>{Math.round(s.overall_score ?? 0)}</span> : <span className="rounded-full bg-spot/30 px-3 py-1 text-sm font-medium">Resume</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
