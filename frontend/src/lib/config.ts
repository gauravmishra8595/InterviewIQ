// One place for the API address, used by the browser (api.ts) AND by the NextAuth server code (auth.ts).
const PROD_FALLBACK = "https://interviewiq-api-a3w5.onrender.com/api";

const raw =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production" ? PROD_FALLBACK : "http://localhost:8000/api");

export const API_URL = raw.replace(/\/+$/, "");

/** Pings the free Render server so it wakes up while the user is still typing. */
export function wakeServer() {
  fetch(`${API_URL}/health/`, { cache: "no-store" }).catch(() => undefined);
}
