import type { Turn } from "@/lib/types";
import { ScoreBar } from "./ScoreCard";

export default function FeedbackPanel({ turn, last, busy, onNext }: { turn: Turn; last: boolean; busy: boolean; onNext: () => void }) {
  const s = turn.scores;
  const m = turn.metrics;
  const chips: string[] = [];
  if (m.wpm) chips.push(`${m.wpm} words/min`);
  if (typeof m.filler_total === "number" && !turn.skipped) chips.push(`${m.filler_total} filler word${m.filler_total === 1 ? "" : "s"}`);
  if (m.word_count) chips.push(`${m.word_count} words`);

  return (
    <div className="animate-rise rounded-3xl border border-white/10 bg-white/[0.06] p-6 text-white backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/60">Answer score</p>
          <p className="font-display text-4xl font-bold">{Math.round(turn.overall_score ?? 0)}<span className="text-lg font-normal text-white/50"> / 100</span></p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">{chips.map((c) => <span key={c} className="rounded-full bg-white/10 px-3 py-1 text-xs">{c}</span>)}</div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <ScoreBar dark label="Content" value={s.content ?? 0} />
        <ScoreBar dark label="Structure" value={s.structure ?? 0} />
        <ScoreBar dark label="Delivery" value={s.communication ?? 0} />
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {!!turn.feedback.strengths?.length && (
          <div>
            <p className="mb-2 text-sm font-semibold text-mint">What worked</p>
            <ul className="space-y-1.5 text-sm text-white/85">{turn.feedback.strengths.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        )}
        {!!turn.feedback.improvements?.length && (
          <div>
            <p className="mb-2 text-sm font-semibold text-spot">Improve next time</p>
            <ul className="space-y-1.5 text-sm text-white/85">{turn.feedback.improvements.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        )}
      </div>
      {turn.feedback.better_answer_hint && (
        <details className="mt-5 text-sm text-white/80">
          <summary className="cursor-pointer font-medium text-white">What a strong answer covers</summary>
          <p className="mt-2 leading-relaxed">{turn.feedback.better_answer_hint}</p>
        </details>
      )}
      <button onClick={onNext} disabled={busy} className="btn btn-spot mt-6 w-full">{busy ? "Preparing..." : last ? "See my report" : "Next question"}</button>
    </div>
  );
}
