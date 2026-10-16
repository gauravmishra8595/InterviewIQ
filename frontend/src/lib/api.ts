export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://interviewiq-api-a3w5.onrender.com/api"
    : "http://localhost:8000/api");

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

/** Turns DRF error shapes ({detail} or {field: [msgs]}) into one readable sentence. */
export function errorMessage(data: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (typeof obj.detail === "string") return obj.detail;
    const parts: string[] = [];
    for (const value of Object.values(obj)) {
      if (Array.isArray(value)) parts.push(...value.map(String));
      else if (typeof value === "string") parts.push(value);
    }
    if (parts.length) return parts.join(" ");
  }
  return fallback;
}

interface Options {
  token?: string;
  method?: string;
  body?: unknown;
  form?: FormData;
}

export async function apiFetch<T>(path: string, { token, method, body, form }: Options = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload: BodyInit | undefined;
  if (form) payload = form;
  else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { method: method ?? (payload ? "POST" : "GET"), headers, body: payload, cache: "no-store" });
  } catch {
    throw new ApiError("Cannot reach the server. Check your connection and try again.", 0, null);
  }
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) throw new ApiError(errorMessage(data), res.status, data);
  return data as T;
}

function safeJson(text: string) {
  try { return JSON.parse(text); } catch { return text; }
}
