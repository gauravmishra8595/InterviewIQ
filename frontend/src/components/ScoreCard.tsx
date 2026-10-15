export function ScoreRing({ score, size = 190, label }: { score: number; size?: number; label?: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const color = pct >= 80 ? "#1FB57A" : pct >= 65 ? "#5B3DF5" : pct >= 50 ? "#E6AE12" : "#E5484D";
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`Score ${Math.round(pct)} out of 100`}>
      <svg viewBox="0 0 120 120" width={size} height={size} className="-rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#E1E4EE" strokeWidth="9" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} style={{ transition: "stroke-dashoffset 1s ease-out" }} />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-5xl font-bold leading-none">{Math.round(pct)}</div>
        <div className="mt-1 text-xs text-ink-faint">{label ?? "out of 100"}</div>
      </div>
    </div>
  );
}

export function ScoreBar({ label, value, max = 10, dark = false }: { label: string; value: number; max?: number; dark?: boolean }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = pct >= 75 ? "bg-mint" : pct >= 55 ? "bg-violet" : pct >= 40 ? "bg-spot" : "bg-rose";
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className={dark ? "text-white/80" : "text-ink-soft"}>{label}</span>
        <span className={`font-display font-semibold ${dark ? "text-white" : "text-ink"}`}>{value.toFixed(1)}<span className={`text-xs font-normal ${dark ? "text-white/50" : "text-ink-faint"}`}>/{max}</span></span>
      </div>
      <div className={`h-2 overflow-hidden rounded-full ${dark ? "bg-white/10" : "bg-line"}`}>
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%`, transition: "width 0.8s ease-out" }} />
      </div>
    </div>
  );
}
