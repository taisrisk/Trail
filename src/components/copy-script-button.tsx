"use client";

import { useState } from "react";

export function CopyScriptButton({ script, label = "Copy script" }: { script: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copyScript() {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={copyScript}
      className="rounded-full bg-cyan-200 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_36px_rgba(94,234,212,.22)] transition hover:bg-cyan-100"
    >
      {copied ? "Copied" : label}
    </button>
  );
}
