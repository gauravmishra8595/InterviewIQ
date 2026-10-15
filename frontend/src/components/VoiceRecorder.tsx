import { clock } from "@/lib/format";

export default function VoiceRecorder({ supported, listening, seconds, onStart, onStop, disabled }: { supported: boolean; listening: boolean; seconds: number; onStart: () => void; onStop: () => void; disabled?: boolean }) {
  if (!supported) {
    return <p className="text-sm text-white/60">Voice input works in Chrome, Edge and Safari. Type your answer instead.</p>;
  }
  return (
    <div className="flex items-center gap-3">
      <button onClick={listening ? onStop : onStart} disabled={disabled}
        className={`relative grid h-14 w-14 place-items-center rounded-full transition disabled:opacity-50 ${listening ? "bg-rose text-white" : "bg-mint text-ink-deep hover:brightness-110"}`}
        aria-label={listening ? "Stop recording" : "Start recording"}>
        {listening ? <span className="h-4 w-4 rounded-sm bg-white" /> : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
        )}
      </button>
      <div className="text-sm leading-tight">
        <p className="font-medium text-white">{listening ? "Listening..." : seconds ? "Paused" : "Tap to answer out loud"}</p>
        <p className="text-white/50">{listening || seconds ? clock(seconds) : "or type below"}</p>
      </div>
    </div>
  );
}
