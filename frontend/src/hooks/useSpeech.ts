"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* Minimal typings for the Web Speech API (Chrome / Edge / Safari). */
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}
interface Recognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export function useSpeech(lang = "en-IN") {
  const recRef = useRef<Recognition | null>(null);
  const wantListening = useRef(false);
  const startedAt = useRef<number | null>(null);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    setSupported(true);
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;
    rec.onresult = (e) => {
      let finals = "";
      let temp = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) finals += chunk + " ";
        else temp += chunk;
      }
      if (finals) setFinalText((prev) => (prev + finals).replace(/\s+/g, " ").trimStart());
      setInterim(temp);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        wantListening.current = false;
        setError("Microphone access is blocked. Allow it in your browser, or type your answer.");
      } else if (e.error !== "no-speech" && e.error !== "aborted") {
        setError("Speech recognition had a problem. You can keep typing your answer.");
      }
    };
    rec.onend = () => {
      // Chrome stops after silence; restart while the user still wants to record.
      if (wantListening.current) {
        try { rec.start(); } catch { /* already started */ }
      } else {
        setListening(false);
        setInterim("");
      }
    };
    recRef.current = rec;
    return () => {
      wantListening.current = false;
      try { rec.stop(); } catch { /* noop */ }
    };
  }, [lang]);

  useEffect(() => {
    if (!listening) return;
    const id = setInterval(() => {
      if (startedAt.current) setSeconds(Math.round((Date.now() - startedAt.current) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, [listening]);

  const start = useCallback(() => {
    if (!recRef.current) return;
    setError(null);
    wantListening.current = true;
    if (!startedAt.current) startedAt.current = Date.now();
    try { recRef.current.start(); setListening(true); } catch { /* already running */ }
  }, []);

  const stop = useCallback(() => {
    wantListening.current = false;
    try { recRef.current?.stop(); } catch { /* noop */ }
    setListening(false);
    setInterim("");
  }, []);

  const reset = useCallback(() => {
    wantListening.current = false;
    try { recRef.current?.stop(); } catch { /* noop */ }
    startedAt.current = null;
    setListening(false);
    setFinalText("");
    setInterim("");
    setSeconds(0);
    setError(null);
  }, []);

  /** Seconds spent on this answer (recording time, or time since first start). */
  const elapsed = useCallback(() => (startedAt.current ? (Date.now() - startedAt.current) / 1000 : 0), []);

  return { supported, listening, finalText, setFinalText, interim, error, seconds, start, stop, reset, elapsed };
}

export function speak(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-IN";
  utter.rate = 0.98;
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((v) => v.lang === "en-IN") ?? voices.find((v) => v.lang.startsWith("en"));
  if (voice) utter.voice = voice;
  utter.onend = () => onEnd?.();
  utter.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utter);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
