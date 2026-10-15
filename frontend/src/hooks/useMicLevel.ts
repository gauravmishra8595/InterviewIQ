"use client";

import { useEffect, useState } from "react";

/** Live microphone loudness (0..1) while `active`. Fails quietly if the mic is unavailable. */
export function useMicLevel(active: boolean) {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!active) { setLevel(0); return; }
    let raf = 0;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let cancelled = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          setLevel((prev) => prev * 0.7 + Math.min(1, avg / 90) * 0.3);
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        /* no mic visual, speech recognition may still work */
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close().catch(() => undefined);
    };
  }, [active]);

  return level;
}
