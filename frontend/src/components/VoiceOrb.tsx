"use client";

export type OrbState = "idle" | "speaking" | "listening" | "thinking";

/** The signature element: a spotlight orb that swells with the interviewer's voice or the candidate's mic level. */
export default function VoiceOrb({ state = "idle", level = 0, size = 220 }: { state?: OrbState; level?: number; size?: number }) {
  const swell = 1 + Math.min(1, level) * 0.38;
  const active = state === "speaking" || state === "listening";
  const core = state === "listening" ? "#1FB57A" : "#FFC93C";

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`Interviewer is ${state}`}>
      {active && (
        <>
          <span className="absolute inset-0 animate-ring rounded-full border-2" style={{ borderColor: core, opacity: 0.4 }} />
          <span className="absolute inset-0 animate-ring rounded-full border-2 [animation-delay:1.2s]" style={{ borderColor: core, opacity: 0.4 }} />
        </>
      )}
      <span className="absolute rounded-full blur-2xl transition-transform duration-150" style={{ width: size * 0.9, height: size * 0.9, background: core, opacity: 0.35, transform: `scale(${swell})` }} />
      <span
        className={`relative block rounded-full transition-transform duration-100 ${state === "idle" || state === "thinking" ? "animate-breathe" : ""}`}
        style={{
          width: size * 0.56,
          height: size * 0.56,
          transform: active ? `scale(${swell})` : undefined,
          background: `radial-gradient(circle at 35% 30%, #fff 0%, ${core} 38%, ${state === "listening" ? "#0E7A52" : "#E6AE12"} 100%)`,
          boxShadow: `0 0 60px 6px ${core}66`,
        }}
      />
      {state === "thinking" && <span className="absolute h-[62%] w-[62%] animate-spin rounded-full border-2 border-transparent border-t-white/70" />}
    </div>
  );
}
