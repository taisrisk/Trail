import type { ReactNode } from "react";

export function Badge({ children, tone = "cyan" }: { children: ReactNode; tone?: "cyan" | "violet" | "emerald" | "amber" | "slate" }) {
  const tones = {
    cyan: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
    violet: "border-violet-300/25 bg-violet-300/10 text-violet-100",
    emerald: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
    amber: "border-amber-300/25 bg-amber-300/10 text-amber-100",
    slate: "border-white/10 bg-white/[0.06] text-slate-200",
  };

  return <span className={`rounded-full border px-3 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function SectionTitle({ eyebrow, title, body, align = "center" }: { eyebrow: string; title: string; body: string; align?: "center" | "left" }) {
  return (
    <div className={`${align === "center" ? "mx-auto text-center" : ""} mb-10 max-w-3xl`}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/80">{eyebrow}</p>
      <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-slate-300">{body}</p>
    </div>
  );
}

export function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass rounded-[1.7rem] ${className}`}>{children}</div>;
}

export function TerminalBlock({ lines }: { lines: string[] }) {
  return (
    <div className="rounded-[1.4rem] border border-emerald-300/20 bg-[#030806]/90 p-4 font-mono text-xs text-emerald-100 shadow-2xl">
      <div className="mb-3 flex gap-1.5">
        <span className="h-3 w-3 rounded-full bg-red-400/80" />
        <span className="h-3 w-3 rounded-full bg-amber-300/80" />
        <span className="h-3 w-3 rounded-full bg-emerald-300/80" />
      </div>
      <div className="space-y-2">
        {lines.map((line) => (
          <p key={line}><span className="text-emerald-400">$</span> {line}</p>
        ))}
      </div>
    </div>
  );
}
