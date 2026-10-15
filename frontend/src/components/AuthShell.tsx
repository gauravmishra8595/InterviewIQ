import type { ReactNode } from "react";

import Logo from "./Logo";
import VoiceOrb from "./VoiceOrb";

export default function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <aside className="relative hidden overflow-hidden bg-ink-deep p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-spot/25 blur-3xl" />
        <Logo light />
        <div className="relative mx-auto flex flex-col items-center text-center">
          <VoiceOrb state="speaking" level={0.25} size={190} />
          <p className="mt-10 max-w-sm font-display text-2xl font-semibold leading-snug">
            An interviewer who is patient, honest, and awake at 2 a.m.
          </p>
          <p className="mt-3 max-w-xs text-sm text-white/60">Answer out loud, get scored on content, structure and delivery, and watch the numbers climb.</p>
        </div>
        <p className="relative text-xs text-white/40">Free for students. Built for placement season.</p>
      </aside>
      <main className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md animate-rise">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {subtitle && <p className="mt-2 text-ink-soft">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-ink-soft">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
