export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export const formatLongDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

export const scoreTone = (score: number) =>
  score >= 80 ? "text-mint" : score >= 65 ? "text-violet" : score >= 50 ? "text-spot-dark" : "text-rose";

export const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
