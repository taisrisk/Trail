import Link from "next/link";

import { CopyScriptButton } from "@/components/copy-script-button";
import { Badge, GlassCard, SectionTitle } from "@/components/ui/primitives";
import { macLinux, oneLineWindows, quickStart, windowsCmd } from "@/lib/install-scripts";

const setupSteps = [
  "Fastest: copy the one-line CMD command and paste it into Command Prompt.",
  "Alternative: download trail-install.cmd and double-click/run it.",
  "The script installs Git/Node when needed, clones Trail, creates ~/.trail, installs packages, builds, and launches the app.",
  "Open the dashboard, choose Quick Domain / Relay Node / Sovereign MX, then create aliases and watchers.",
];

const createdFolders = ["config", "keys", "vault", "mail", "attachments", "index", "graph", "watchers", "queues", "backups"];

function ScriptPanel({ title, subtitle, script, label, downloadHref, downloadLabel }: { title: string; subtitle: string; script: string; label: string; downloadHref?: string; downloadLabel?: string }) {
  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-white/[0.035] p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">{subtitle}</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {downloadHref ? (
            <a href={downloadHref} className="rounded-full border border-cyan-300/25 px-5 py-2.5 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/10">
              {downloadLabel ?? "Download"}
            </a>
          ) : null}
          <CopyScriptButton script={script} label={label} />
        </div>
      </div>
      <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap bg-[#030806]/90 p-5 font-mono text-xs leading-6 text-emerald-100">
        {script}
      </pre>
    </GlassCard>
  );
}

export const metadata = {
  title: "Install Trail",
  description: "One-copy install scripts for Trail local-first email OS.",
};

export default function InstallPage() {
  return (
    <main className="relative overflow-hidden px-5 py-6 md:px-8">
      <div className="orb left-8 top-20 h-44 w-44 bg-cyan-400/15" />
      <div className="orb right-10 top-24 h-56 w-56 bg-violet-400/15 [animation-delay:1.2s]" />

      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300 text-sm font-black text-slate-950">T</div>
          <div>
            <p className="font-semibold text-white">Trail</p>
            <p className="text-xs text-slate-400">Installer</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="hidden rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 sm:inline-flex">Dashboard</Link>
          <Badge tone="emerald">one-copy setup</Badge>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-8 pb-14 pt-16 lg:grid-cols-[1fr_.85fr] lg:items-center">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">Paste one script into CMD. Trail handles the rest.</div>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.06em] text-white md:text-7xl">Install the local email OS in one shot.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">This page gives users a copyable setup script that installs prerequisites, clones Trail, creates the local node folders, builds the app, and opens the dashboard.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#one-line" className="rounded-full bg-cyan-200 px-6 py-3 font-semibold text-slate-950 shadow-[0_0_40px_rgba(94,234,212,.25)]">Copy one-line CMD</a>
            <a href="/install/trail-install.cmd" className="rounded-full border border-cyan-300/25 px-6 py-3 font-semibold text-cyan-100 hover:bg-cyan-300/10">Download .cmd</a>
            <a href="#windows" className="rounded-full border border-cyan-300/25 px-6 py-3 font-semibold text-cyan-100 hover:bg-cyan-300/10">Full script</a>
            <a href="/dashboard" className="rounded-full border border-white/15 px-6 py-3 font-semibold text-white hover:bg-white/10">Open dashboard</a>
          </div>
        </div>

        <GlassCard className="p-6">
          <SectionTitle align="left" eyebrow="What it sets up" title="App, node, vault, and dashboard" body="The setup script creates a Trail home directory and launches both the web app and standalone local node." />
          <div className="grid grid-cols-2 gap-3">
            {createdFolders.map((folder) => (
              <div key={folder} className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                <code className="text-sm text-cyan-100">~/.trail/{folder}</code>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      <section className="mx-auto max-w-7xl py-8">
        <GlassCard className="p-6">
          <div className="grid gap-4 md:grid-cols-4">
            {setupSteps.map((step, index) => (
              <div key={step} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/10 font-semibold text-cyan-100">{index + 1}</div>
                <p className="text-sm leading-6 text-slate-300">{step}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      <section id="one-line" className="mx-auto max-w-7xl py-8">
        <GlassCard className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-cyan-300/10 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">fastest Windows path</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">One line to paste into CMD</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">For a hosted site, replace localhost with the real Trail domain. This command downloads the .cmd installer, saves it to Temp, and runs it.</p>
            </div>
            <CopyScriptButton script={oneLineWindows} label="Copy one-line command" />
          </div>
          <pre className="overflow-auto whitespace-pre-wrap bg-[#030806]/90 p-5 font-mono text-sm leading-7 text-emerald-100">{oneLineWindows}</pre>
        </GlassCard>
      </section>

      <section id="windows" className="mx-auto max-w-7xl py-8">
        <ScriptPanel title="Windows CMD installer" subtitle="recommended" script={windowsCmd} label="Copy Windows CMD script" downloadHref="/install/trail-install.cmd" downloadLabel="Download .cmd" />
      </section>

      <section id="restart" className="mx-auto max-w-7xl py-8">
        <ScriptPanel title="Restart an existing install" subtitle="quick command" script={quickStart} label="Copy restart commands" />
      </section>

      <section className="mx-auto max-w-7xl py-8">
        <ScriptPanel title="macOS / Linux installer" subtitle="optional" script={macLinux} label="Copy shell script" downloadHref="/install/trail-install.sh" downloadLabel="Download .sh" />
      </section>

      <section className="mx-auto max-w-7xl pb-20 pt-8">
        <GlassCard className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-violet-200">After install</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Finish setup in the control dashboard.</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">Pick a mail mode, enter your domain, create aliases, and test local AI watchers. The installer prepares the local machine; the dashboard handles personal configuration.</p>
            </div>
            <a href="/dashboard" className="rounded-full bg-cyan-200 px-6 py-3 font-semibold text-slate-950 shadow-[0_0_40px_rgba(94,234,212,.25)]">Open dashboard</a>
          </div>
        </GlassCard>
      </section>
    </main>
  );
}

