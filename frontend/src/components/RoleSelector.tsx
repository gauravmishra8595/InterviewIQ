"use client";

import { ROLES, Role } from "@/lib/types";

export default function RoleSelector({ value, onChange }: { value: Role; onChange: (r: Role) => void }) {
  return (
    <div role="radiogroup" aria-label="Interview role" className="grid gap-3 sm:grid-cols-2">
      {ROLES.map((r) => {
        const on = value === r.id;
        return (
          <button key={r.id} type="button" role="radio" aria-checked={on} onClick={() => onChange(r.id)}
            className={`rounded-2xl border-2 p-4 text-left transition ${on ? "border-violet bg-violet-wash" : "border-line bg-white hover:border-violet/40"} ${r.id === "hr" ? "sm:col-span-2" : ""}`}>
            <div className="flex items-center justify-between">
              <span className="font-display text-base font-semibold">{r.label}</span>
              <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${on ? "border-violet bg-violet" : "border-line"}`}>
                {on && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5.2 4.2 7.4 8 3" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-soft">{r.blurb}</p>
          </button>
        );
      })}
    </div>
  );
}
