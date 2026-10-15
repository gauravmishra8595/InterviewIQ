import type { Turn } from "@/lib/types";

const TYPE_LABEL: Record<Turn["question_type"], string> = {
  intro: "Warm-up",
  resume: "From your resume",
  technical: "Technical",
  behavioral: "Behavioral",
  followup: "Follow-up on your answer",
};

export default function QuestionCard({ turn, onReplay, voiceOn, onToggleVoice }: { turn: Turn; onReplay: () => void; voiceOn: boolean; onToggleVoice: () => void }) {
  return (
    <div className="text-center">
      <span className="inline-block rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">{TYPE_LABEL[turn.question_type]}</span>
      <h1 className="mx-auto mt-4 max-w-2xl font-display text-2xl font-semibold leading-snug text-white sm:text-3xl" aria-live="polite">{turn.question_text}</h1>
      <div className="mt-4 flex items-center justify-center gap-4 text-sm text-white/60">
        <button onClick={onReplay} className="hover:text-white">Hear it again</button>
        <span className="h-3 w-px bg-white/20" />
        <button onClick={onToggleVoice} className="hover:text-white" aria-pressed={voiceOn}>{voiceOn ? "Voice on" : "Voice off"}</button>
      </div>
    </div>
  );
}
