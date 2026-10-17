import { API_URL } from "./config";
export { API_URL };
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
    throw new ApiError("Cannot reach the server. If it was idle it may be waking up, so wait 30 seconds and try again.", 0, null);
  }
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    // A non-JSON body (an HTML error page) must never be shown to the user.
    const message =
      typeof data === "string"
        ? res.status >= 500
          ? "The server had a problem. Wait a moment and try again."
          : "Something went wrong. Please try again."
        : errorMessage(data);
    throw new ApiError(message, res.status, data);
  }
  return data as T;
}

function safeJson(text: string) {
  try { return JSON.parse(text); } catch { return text; }
}
