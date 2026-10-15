"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function UserMenu() {
  const { data } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const user = data?.user;
  if (!user) return null;
  const initials = (user.name || user.email || "?").split(/[\s@]/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 text-sm font-medium hover:border-violet" aria-haspopup="menu" aria-expanded={open}>
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="h-8 w-8 rounded-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="grid h-8 w-8 place-items-center rounded-full bg-violet text-xs font-bold text-white">{initials}</span>
        )}
        <span className="hidden max-w-[120px] truncate sm:block">{user.name?.split(" ")[0] || "Account"}</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-line bg-white p-2 shadow-lift">
          <p className="truncate px-3 py-2 text-xs text-ink-faint">{user.email}</p>
          <Link role="menuitem" href="/dashboard" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-violet-wash">Dashboard</Link>
          <Link role="menuitem" href="/setup" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-violet-wash">New interview</Link>
          <button role="menuitem" onClick={() => signOut({ callbackUrl: "/" })} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-rose hover:bg-rose-wash">Sign out</button>
        </div>
      )}
    </div>
  );
}
