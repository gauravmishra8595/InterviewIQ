import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import {API_URL as API} from "./config";

function expiryOf(jwt: string): number {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString());
    return payload.exp * 1000;
  } catch {
    return Date.now() + 55 * 60 * 1000;
  }
}

  async function post(path: string, body: unknown) {
  try {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: { detail: "Cannot reach the server. Wait 30 seconds for it to wake up, then try again." } };
  }
}

async function refreshAccess(token: JWT): Promise<JWT> {
  const { ok, data } = await post("/auth/token/refresh/", { refresh: token.refreshToken });
  if (!ok || !data.access) return { ...token, error: "RefreshFailed" };
  return { ...token, accessToken: data.access, accessExp: expiryOf(data.access), error: undefined };
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Email",
      credentials: { email: { type: "email" }, password: { type: "password" } },
      async authorize(credentials) {
        const { ok, data } = await post("/auth/login/", {
          email: credentials?.email,
          password: credentials?.password,
        });
        if (!ok) throw new Error(data.detail ?? "Wrong email or password.");
        return {
          id: String(data.user.id),
          email: data.user.email,
          name: data.user.name,
          image: data.user.picture || null,
          accessToken: data.access,
          refreshToken: data.refresh,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        if (account.provider === "google") {
          const { ok, data } = await post("/auth/google/", { id_token: account.id_token });
          if (!ok) throw new Error(data.detail ?? "Google sign-in failed.");
          token.accessToken = data.access;
          token.refreshToken = data.refresh;
          token.name = data.user.name || token.name;
          token.picture = data.user.picture || token.picture;
        } else {
          token.accessToken = user.accessToken;
          token.refreshToken = user.refreshToken;
        }
        token.accessExp = expiryOf(token.accessToken as string);
        return token;
      }
      if (token.accessExp && Date.now() < token.accessExp - 60_000) return token;
      return refreshAccess(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },
};