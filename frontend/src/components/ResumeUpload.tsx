"use client";

import { DragEvent, useRef, useState } from "react";

export default function ResumeUpload({ file, onChange }: { file: File | null; onChange: (f: File | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function accept(f?: File | null) {
    if (!f) return;
    const ok = /\.(pdf|txt)$/i.test(f.name);
    if (!ok) return setError("Upload a PDF or TXT file.");
    if (f.size > 5 * 1024 * 1024) return setError("The file must be under 5 MB.");
    setError(null);
    onChange(f);
  }
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); accept(e.dataTransfer.files?.[0]); };

  if (file) {
    return (
      <div className="flex items-center justify-between rounded-2xl border-2 border-mint/40 bg-mint-wash p-4">
        <div className="min-w-0">
          <p className="truncate font-medium">{file.name}</p>
          <p className="text-xs text-ink-soft">{(file.size / 1024).toFixed(0)} KB. We will ask about your skills and projects.</p>
        </div>
        <button type="button" onClick={() => onChange(null)} className="btn btn-quiet px-3 py-2 text-rose hover:text-rose">Remove</button>
      </div>
    );
  }
  return (
    <div>
      <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={onDrop}
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${drag ? "border-violet bg-violet-wash" : "border-line bg-white"}`}>
        <p className="font-medium">Drop your resume here</p>
        <p className="mt-1 text-sm text-ink-soft">PDF or TXT, up to 5 MB. Optional, but it makes the questions about you.</p>
        <button type="button" onClick={() => input.current?.click()} className="btn btn-ghost mt-4 px-4 py-2">Choose file</button>
        <input ref={input} type="file" accept=".pdf,.txt" className="sr-only" onChange={(e) => accept(e.target.files?.[0])} aria-label="Upload resume" />
      </div>
      {error && <p className="error-box mt-3" role="alert">{error}</p>}
    </div>
  );
}
