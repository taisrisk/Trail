import type { ReactNode } from "react";

export function Badge({ children, tone = "cyan" }: { children: ReactNode; tone?: "cyan" | "violet" | "emerald" | "amber" | "slate" }) {
  const tones = {
    cyan: "border-blue-300/20 bg-blue-300/10 text-blue-100",
    violet: "border-violet-300/20 bg-violet-300/10 text-violet-100",
    emerald: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
    amber: "border-amber-300/20 bg-amber-300/10 text-amber-100",
    slate: "border-white/10 bg-white/[0.05] text-slate-300",
  };

  return <span className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>;
}

export function SectionTitle({ eyebrow, title, body, align = "center" }: { eyebrow: string; title: string; body: string; align?: "center" | "left" }) {
  return (
    <div className={`${align === "center" ? "mx-auto text-center" : ""} mb-10 max-w-3xl`}>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-200/70">{eyebrow}</p>
      <h2 className="text-3xl font-semibold tracking-[-0.055em] text-white md:text-5xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-slate-400">{body}</p>
    </div>
  );
}

export function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass ${className}`}>{children}</div>;
}

export function TerminalBlock({ lines }: { lines: string[] }) {
  return (
    <div className="rounded-xl border border-emerald-300/15 bg-black/80 p-4 font-mono text-xs text-emerald-100 shadow-2xl">
      <div className="mb-3 flex gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/70" />
      </div>
      <div className="space-y-2">
        {lines.map((line) => (
          <p key={line}><span className="text-emerald-400">$</span> {line}</p>
        ))}
      </div>
    </div>
  );
}
