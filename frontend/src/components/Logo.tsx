import Link from "next/link";

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#5B3DF5" />
      <circle cx="16" cy="16" r="5.2" fill="#FFC93C" />
      <path d="M16 5.5v3M16 23.5v3M5.5 16h3M23.5 16h3" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".85" />
    </svg>
  );
}

export default function Logo({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className={`font-display text-xl font-bold ${light ? "text-white" : "text-ink"}`}>InterviewIQ</span>
    </Link>
  );
}
