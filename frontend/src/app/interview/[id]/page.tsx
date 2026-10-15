"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import FeedbackPanel from "@/components/FeedbackPanel";
import Logo from "@/components/Logo";
import QuestionCard from "@/components/QuestionCard";
import VoiceOrb, { OrbState } from "@/components/VoiceOrb";
import VoiceRecorder from "@/components/VoiceRecorder";
import { useApi } from "@/hooks/useApi";
import { useMicLevel } from "@/hooks/useMicLevel";
import { speak, stopSpeaking, useSpeech } from "@/hooks/useSpeech";
import type { AnswerResponse, Session, Turn } from "@/lib/types";

type Phase = "loading" | "answering" | "scoring" | "feedback" | "finishing";

export default function InterviewRoom() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { call, ready } = useApi();
  const speech = useSpeech();
  const [session, setSession] = useState<Session | null>(null);
  const [turn, setTurn] = useState<Turn | null>(null);
  const [answered, setAnswered] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const [result, setResult] = useState<AnswerResponse | null>(null);
  const [voiceOn, setVoiceOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [fake, setFake] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const spokenFor = useRef<number | null>(null);
  const mic = useMicLevel(speech.listening);

  // load session
  useEffect(() => {
    if (!ready) return;
    call<Session>(`/interviews/${id}/`)
      .then((s) => {
        if (s.status === "completed") return router.replace(`/result/${id}`);
        setSession(s);
        setAnswered(s.answered_count);
        setTurn(s.turns.find((t) => !t.answered_at) ?? null);
        setPhase("answering");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load this interview."));
  }, [ready, id, call, router]);

  const ask = useCallback((text: string) => {
    if (!voiceOn) return;
    setSpeaking(true);
    speak(text, () => setSpeaking(false));
  }, [voiceOn]);

  // speak each new question once
  useEffect(() => {
    if (turn && phase === "answering" && spokenFor.current !== turn.id) {
      spokenFor.current = turn.id;
      speech.reset();
      ask(turn.question_text);
    }
  }, [turn, phase, ask, speech]);

  useEffect(() => () => stopSpeaking(), []);

  // gentle fake level while the interviewer talks
  useEffect(() => {
    if (!speaking) { setFake(0); return; }
    const t = setInterval(() => setFake(0.2 + Math.random() * 0.5), 140);
    return () => clearInterval(t);
  }, [speaking]);

  const answerText = speech.finalText + (speech.interim ? ` ${speech.interim}` : "");
  const orbState: OrbState = phase === "scoring" || phase === "finishing" ? "thinking" : speech.listening ? "listening" : speaking ? "speaking" : "idle";
  const orbLevel = speech.listening ? mic : speaking ? fake : 0;

  async function submit(skipped = false) {
    if (!turn) return;
    stopSpeaking();
    setSpeaking(false);
    speech.stop();
    setPhase("scoring");
    setError(null);
    try {
      const res = await call<AnswerResponse>(`/interviews/${id}/answer/`, {
        body: { answer_text: skipped ? "" : answerText.trim(), skipped, duration_seconds: speech.elapsed() },
      });
      setResult(res);
      setAnswered((n) => n + 1);
      setPhase("feedback");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not score that answer.");
      setPhase("answering");
    }
  }

  async function next() {
    if (!result) return;
    if (result.finished) return finish();
    setTurn(result.next_turn);
    setResult(null);
    setPhase("answering");
  }

  async function finish() {
    setPhase("finishing");
    try {
      await call(`/interviews/${id}/finish/`, { method: "POST" });
      router.push(`/result/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not build your report.");
      setPhase("feedback");
    }
  }

  async function endEarly() {
    const msg = answered ? "End now and see your report for the questions you answered?" : "Leave this interview? Nothing has been scored yet.";
    if (!window.confirm(msg)) return;
    stopSpeaking();
    speech.stop();
    if (!answered) {
      await call(`/interviews/${id}/`, { method: "DELETE" }).catch(() => undefined);
      return router.push("/dashboard");
    }
    await finish();
  }

  const total = session?.total_questions ?? 5;
  const lastQuestion = result?.finished ?? false;

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-deep text-white">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-spot/15 blur-3xl" />
      <header className="relative mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-5">
        <Logo href="/dashboard" light />
        <div className="flex flex-1 items-center justify-center gap-1.5" aria-label={`${answered} of ${total} questions answered`}>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`h-1.5 w-8 rounded-full sm:w-12 ${i < answered ? "bg-mint" : i === answered && phase !== "finishing" ? "bg-spot" : "bg-white/15"}`} />
          ))}
        </div>
        <button onClick={endEarly} className="text-sm text-white/60 hover:text-white">{answered ? "End early" : "Leave"}</button>
      </header>

      <main className="relative mx-auto flex max-w-3xl flex-col items-center px-5 pb-16 pt-2">
        {error && !turn && (
          <div className="mt-20 text-center"><p className="error-box">{error}</p><Link href="/dashboard" className="btn btn-ghost mt-6">Back to dashboard</Link></div>
        )}
        {phase === "loading" && !error && <p className="mt-32 text-white/60">Getting your interviewer ready...</p>}

        {turn && phase !== "loading" && (
          <>
            <VoiceOrb state={orbState} level={orbLevel} size={200} />
            <div className="mt-2 w-full">
              <QuestionCard turn={turn} voiceOn={voiceOn} onReplay={() => ask(turn.question_text)} onToggleVoice={() => { if (voiceOn) { stopSpeaking(); setSpeaking(false); } setVoiceOn((v) => !v); }} />
            </div>

            <div className="mt-8 w-full">
              {(phase === "answering" || phase === "scoring") && (
                <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
                  <textarea
                    value={answerText}
                    onChange={(e) => speech.setFinalText(e.target.value)}
                    disabled={phase === "scoring"}
                    rows={6}
                    placeholder="Your answer appears here as you speak. You can also type or edit it."
                    className="w-full resize-none rounded-2xl border border-white/10 bg-ink-deep/60 p-4 text-[15px] leading-relaxed text-white placeholder:text-white/35 focus:border-spot focus:outline-none focus:ring-2 focus:ring-spot/30"
                    aria-label="Your answer"
                  />
                  {speech.error && <p className="mt-2 text-sm text-spot">{speech.error}</p>}
                  {error && <p className="mt-2 text-sm text-spot" role="alert">{error}</p>}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <VoiceRecorder supported={speech.supported} listening={speech.listening} seconds={speech.seconds} onStart={() => { stopSpeaking(); setSpeaking(false); speech.start(); }} onStop={speech.stop} disabled={phase === "scoring"} />
                    <div className="flex items-center gap-2">
                      <button onClick={() => submit(true)} disabled={phase === "scoring"} className="btn px-4 py-3 text-white/70 hover:text-white">Skip</button>
                      <button onClick={() => submit(false)} disabled={phase === "scoring" || answerText.trim().length < 3} className="btn btn-spot px-6">
                        {phase === "scoring" ? "Scoring..." : "Submit answer"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {(phase === "feedback" || phase === "finishing") && result && (
                <>
                  {error && <p className="error-box mb-3" role="alert">{error}</p>}
                  <FeedbackPanel turn={result.turn} last={lastQuestion} busy={phase === "finishing"} onNext={next} />
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
