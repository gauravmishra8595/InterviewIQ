"use client";

import { signOut, useSession } from "next-auth/react";
import { useCallback } from "react";

import { ApiError, apiFetch } from "@/lib/api";

/** Returns an authenticated fetch helper. Signs the user out if the API says the token is dead. */
export function useApi() {
  const { data: session, status } = useSession();
  const token = session?.accessToken;

  const call = useCallback(
    async <T,>(path: string, opts: { method?: string; body?: unknown; form?: FormData } = {}) => {
      try {
        return await apiFetch<T>(path, { ...opts, token });
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          await signOut({ callbackUrl: "/login" });
        }
        throw err;
      }
    },
    [token]
  );

  return { call, ready: status === "authenticated" && !!token, status };
}
