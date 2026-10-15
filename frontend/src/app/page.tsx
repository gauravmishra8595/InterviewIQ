import Link from "next/link";

import Logo from "@/components/Logo";
import VoiceOrb from "@/components/VoiceOrb";

const PRACTISE = [
  { title: "Questions about you", text: "Upload your resume and the interviewer asks about your actual projects and skills, not a generic list." },
  { title: "Answer out loud", text: "Speak your answers the way you will in the room. Your voice is transcribed live, and you can edit before sending." },
  { title: "A scorecard that explains itself", text: "Every answer is scored on content, structure and delivery, with filler words, pace and one fix to try next time." },
];

const STEPS = [
  ["Pick a role and level", "Software, web, data or HR. Easy, medium or hard."],
  ["Add your resume", "Optional, but it turns on project and skill questions."],
  ["Talk through 5 questions", "A follow-up digs into whatever your last answer left thin."],
  ["Review your report", "See strengths, gaps, and what to practise tomorrow."],
];

export default function Home() {
  return (
    <>
      <header className="border-b border-line/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <nav className="flex items-center gap-2">
            <Link href="/login" className="btn btn-quiet">Log in</Link>
            <Link href="/register" className="btn btn-primary">Start free</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <h1 className="text-4xl font-bold leading-[1.08] sm:text-6xl">Walk into placement season already warmed up.</h1>
            <p className="mt-6 max-w-xl text-lg text-ink-soft">
              InterviewIQ is a mock interviewer that listens to your answers, asks follow-ups about your resume, and tells you exactly what to fix. Free for students.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="btn btn-primary px-7 py-3.5 text-base">Start your first interview</Link>
              <Link href="/login" className="btn btn-ghost px-7 py-3.5 text-base">I have an account</Link>
            </div>
            <p className="mt-4 text-sm text-ink-faint">Sign up with Google or email. Works best in Chrome with a microphone.</p>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] bg-ink-deep p-8 text-white shadow-lift">
            <div className="pointer-events-none absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-spot/30 blur-3xl" />
            <div className="relative flex flex-col items-center text-center">
              <VoiceOrb state="speaking" level={0.3} size={170} />
              <p className="mt-6 text-xs text-white/50">Question 3 of 5, from your resume</p>
              <p className="mt-2 font-display text-xl font-semibold leading-snug">You built a REST API for your internship. What was the hardest trade-off you made?</p>
              <div className="mt-6 grid w-full grid-cols-3 gap-2 text-left text-xs">
                {[["Content", "7.8"], ["Structure", "6.5"], ["Delivery", "8.1"]].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-white/10 p-3"><p className="text-white/60">{k}</p><p className="font-display text-lg font-bold">{v}</p></div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-line bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-3">
            {PRACTISE.map((p) => (
              <div key={p.title}>
                <h2 className="text-xl font-semibold">{p.title}</h2>
                <p className="mt-2 text-ink-soft">{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-3xl font-bold">Ten minutes from sign-up to feedback</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-4">
            {STEPS.map(([t, d], i) => (
              <li key={t}>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-violet text-sm font-bold text-white">{i + 1}</span>
                <h3 className="mt-4 text-lg font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-ink-soft">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24">
          <div className="rounded-[2rem] bg-violet p-10 text-white md:flex md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold">Your next interview does not have to be your first.</h2>
              <p className="mt-2 text-white/80">Practise tonight. Your scores will show the difference by next week.</p>
            </div>
            <Link href="/register" className="btn btn-spot mt-6 px-7 py-3.5 text-base md:mt-0">Create free account</Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-8 text-center text-sm text-ink-faint">InterviewIQ, an AI mock interview coach built for students. Supports UN SDG 8: Decent Work and Economic Growth.</footer>
    </>
  );
}
