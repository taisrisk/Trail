import Link from "next/link";

import { apiSurface, bykPrinciples, dnsRecords, localNodeModules, mailModes, roadmap } from "@/lib/byk-mail";
import { graphNodes, timeline, watchers } from "@/lib/trail-core";
import { cryptoBlueprint } from "@/lib/crypto-blueprint";
import { Badge, GlassCard, SectionTitle } from "@/components/ui/primitives";

const heroStats = [
  ["BYK", "key/domain/computer"],
  ["local", "vault + graph + AI"],
  ["3", "mail operating modes"],
  ["0", "server plaintext target"],
];

const flow = ["owned domain", "replaceable routing", "local node", "encrypted vault", "private AI graph"];

function Nav() {
  return (
    <nav className="stage-card mx-auto flex max-w-7xl items-center justify-between rounded-xl px-4 py-3 text-[11px]">
      <Link href="/" className="flex items-center gap-2 font-semibold text-white">
        <span className="grid h-6 w-6 place-items-center rounded-md border border-emerald-300/20 bg-emerald-300/10 text-[10px] text-emerald-100">T</span>
        Trail
      </Link>
      <div className="hidden items-center gap-5 text-slate-300 md:flex">
        <a href="#modes" className="hover:text-white">Modes</a>
        <a href="#domain" className="hover:text-white">Domain</a>
        <a href="/ecosystem" className="hover:text-white">Ecosystem</a>
        <a href="/pass" className="hover:text-white">Erme Pass</a>
        <a href="/install" className="hover:text-white">Install</a>
      </div>
      <div className="flex items-center gap-2">
        <a href="/dashboard" className="rounded-md border border-white/15 px-3 py-1.5 font-semibold text-white hover:bg-white/10">Dashboard</a>
        <a href="/pass" className="rounded-md bg-white px-3 py-1.5 font-semibold text-black hover:bg-slate-200">Open Pass</a>
      </div>
    </nav>
  );
}

function HeroMockup() {
  return (
    <div className="relative min-h-[520px] lg:min-h-[610px]">
      <div className="stage-card absolute left-0 top-14 hidden w-[78%] rounded-2xl p-6 opacity-85 md:block">
        <div className="mb-8 text-center">
          <p className="text-[11px] uppercase tracking-[0.35em] text-emerald-200/70">Local node foundations</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Mail OS primitives</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {localNodeModules.slice(0, 4).map((module) => (
            <div key={module.name} className="rounded-xl border border-white/10 bg-black/50 p-4">
              <div className="h-24 rounded-lg border border-emerald-300/10 bg-[radial-gradient(circle_at_center,rgba(16,185,129,.18),rgba(2,6,23,.7)_55%,rgba(0,0,0,.9))]" />
              <p className="mt-4 text-sm font-semibold text-white">{module.name}</p>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{module.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="stage-card absolute right-0 top-0 z-10 w-full rounded-2xl p-5 shadow-[0_40px_120px_rgba(0,0,0,.65)] md:w-[78%]">
        <div className="mb-10 flex items-center justify-between text-[11px] text-slate-300">
          <span className="font-semibold text-white">Trail</span>
          <span>local node online</span>
        </div>
        <div className="grid gap-7 lg:grid-cols-[.92fr_1.08fr] lg:items-center">
          <div>
            <Badge tone="emerald">BYK mail agent stack</Badge>
            <h2 className="mt-5 text-4xl font-semibold leading-[1.02] tracking-[-0.055em] text-white md:text-5xl">Own the inbox brain on your machine.</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-400">Domain routing can be a pipe. The readable inbox, vault, graph, search, and AI rules stay inside the local node.</p>
            <div className="mt-6 flex gap-2">
              <a href="/install" className="rounded-md bg-white px-4 py-2 text-xs font-semibold text-black">Install locally</a>
              <a href="/dashboard" className="rounded-md border border-white/15 px-4 py-2 text-xs font-semibold text-white">Open node</a>
            </div>
          </div>
          <div className="relative min-h-[270px] overflow-hidden rounded-2xl border border-white/10 bg-black/55 p-4">
            <div className="grid-bg absolute inset-0 opacity-60" />
            <div className="preview-glow absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full" />
            {flow.map((item, index) => (
              <div key={item} className={`absolute rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-xs text-slate-200 shadow-2xl ${[
                "left-4 top-6", "right-5 top-12", "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2", "left-8 bottom-10", "right-8 bottom-8",
              ][index]}`}>
                <span className="mr-2 text-emerald-200">0{index + 1}</span>{item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="stage-card absolute bottom-2 left-[18%] z-20 hidden w-[55%] rounded-xl p-5 text-center shadow-[0_35px_90px_rgba(0,0,0,.7)] lg:block">
        <p className="text-sm font-semibold text-white">Unbeatable privacy, local-first control</p>
        <div className="mt-5 grid grid-cols-4 gap-3">
          {heroStats.map(([value, label]) => (
            <div key={label} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
              <p className="text-lg font-semibold text-white">{value}</p>
              <p className="mt-1 text-[10px] text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MailModes() {
  return (
    <section id="modes" className="mx-auto max-w-7xl py-20">
      <SectionTitle eyebrow="Mail modes" title="Start with a pipe. Keep the brain local." body="The page now uses the dark product-preview style: thin chrome, black cards, layered panels, tiny labels, and deep green/blue atmosphere." />
      <div className="grid gap-4 lg:grid-cols-3">
        {mailModes.map((mode) => (
          <GlassCard key={mode.id} className="card-hover p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <Badge tone={mode.status === "advanced" ? "amber" : mode.status === "local" ? "emerald" : "cyan"}>{mode.status}</Badge>
              <span className="font-mono text-[10px] text-slate-500">{mode.id}</span>
            </div>
            <h3 className="text-2xl font-semibold tracking-[-0.03em] text-white">{mode.name}</h3>
            <p className="mt-3 min-h-20 text-sm leading-6 text-slate-400">{mode.tagline}</p>
            <div className="mt-5 space-y-2 border-t border-white/10 pt-5">
              {mode.flow.map((step, index) => (
                <div key={step} className="flex items-center gap-3 text-xs text-slate-300">
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-white/[0.04] font-mono text-emerald-200">{index + 1}</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}

function DomainSetup() {
  return (
    <section id="domain" className="mx-auto grid max-w-7xl gap-8 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
      <div>
        <SectionTitle align="left" eyebrow="Domain setup" title="DNS, aliases, relays, and local storage in one command center." body="Every record and pipe is treated as infrastructure around the local vault — useful, replaceable, never the source of truth." />
        <div className="space-y-3">
          {bykPrinciples.map((principle) => <div key={principle} className="rounded-xl border border-white/10 bg-black/45 p-4 text-sm leading-6 text-slate-300">{principle}</div>)}
        </div>
      </div>
      <GlassCard className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-emerald-200/70">DNS preview</p>
            <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">yourdomain.com</h3>
          </div>
          <Badge tone="emerald">generated</Badge>
        </div>
        <div className="space-y-3">
          {dnsRecords.map((record) => (
            <div key={`${record.type}-${record.host}`} className="rounded-xl border border-white/10 bg-black/55 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="slate">{record.type}</Badge>
                <code className="text-sm text-white">{record.host}</code>
                <span className="text-slate-600">→</span>
                <code className="break-all text-sm text-emerald-100">{record.value}</code>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">{record.purpose}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </section>
  );
}

function LocalNode() {
  return (
    <section id="local-node" className="mx-auto max-w-7xl py-20">
      <SectionTitle eyebrow="Local node" title="A desktop control plane, not another hosted inbox." body="The new visual system makes Trail feel like a serious infra product: black surface, focused contrast, compact proof panels, and real local paths." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {localNodeModules.map((module) => (
          <GlassCard key={module.name} className="card-hover p-6">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-xl font-semibold text-white">{module.name}</h3>
              <Badge tone={module.privacyBoundary === "local plaintext" ? "emerald" : module.privacyBoundary === "metadata only" ? "amber" : "violet"}>{module.privacyBoundary}</Badge>
            </div>
            <code className="mt-5 block rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-emerald-100">{module.path}</code>
            <p className="mt-4 text-sm leading-6 text-slate-400">{module.description}</p>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}

function CommandInbox() {
  return (
    <section className="mx-auto grid max-w-7xl gap-8 py-20 lg:grid-cols-[1.05fr_.95fr]">
      <GlassCard className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-emerald-200/70">Command inbox</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">Local AI watches mail without uploading it.</h2>
          </div>
          <Badge tone="emerald">Ollama local</Badge>
        </div>
        <div className="space-y-3">
          {timeline.map((event) => (
            <div key={event.id} className="flex gap-3 rounded-xl border border-white/10 bg-black/55 p-4">
              <div className="timeline-line mt-2 w-1 rounded-full" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-white">{event.subject}</p>
                  <span className="text-xs text-slate-500">{event.at}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{event.actor}</p>
                <p className="mt-2 text-sm text-slate-300">{event.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">{event.tags.map(tag => <Badge key={tag} tone="slate">{tag}</Badge>)}</div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
      <div className="space-y-4">
        {watchers.map((watcher) => (
          <GlassCard key={watcher.id} className="p-5">
            <p className="text-xs uppercase tracking-widest text-emerald-200/70">{watcher.modelTarget}</p>
            <h3 className="mt-3 text-xl font-semibold text-white">{watcher.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">“{watcher.naturalLanguageRule}”</p>
            <div className="mt-4 flex flex-wrap gap-2">{watcher.allowedActions.map(action => <Badge key={action} tone="slate">{action}</Badge>)}</div>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}

function Graph() {
  const positions = ["left-[45%] top-[42%] h-28 w-28", "left-[12%] top-[18%] h-24 w-24", "right-[16%] top-[18%] h-20 w-20", "left-[18%] bottom-[16%] h-20 w-20", "right-[20%] bottom-[18%] h-24 w-24", "left-[48%] bottom-[7%] h-16 w-16", "right-[8%] top-[48%] h-16 w-16"];
  return (
    <section className="mx-auto grid max-w-7xl gap-8 py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
      <div>
        <SectionTitle align="left" eyebrow="Knowledge graph" title="The mail graph becomes a private second brain." body="People, domains, receipts, calendar events, aliases, attachments, and thread context are linked locally." />
        <div className="grid gap-3 sm:grid-cols-2">
          {apiSurface.map((route) => <code key={route} className="rounded-lg border border-white/10 bg-black/45 p-3 text-sm text-emerald-100">{route}</code>)}
        </div>
      </div>
      <div className="stage-card relative min-h-[430px] overflow-hidden rounded-2xl p-4 shadow-2xl">
        <div className="absolute inset-0 grid-bg" />
        <svg className="absolute inset-0 h-full w-full opacity-60" aria-hidden="true">
          <line x1="50%" y1="50%" x2="20%" y2="28%" stroke="#34d399" strokeOpacity=".35" />
          <line x1="50%" y1="50%" x2="78%" y2="28%" stroke="#60a5fa" strokeOpacity=".26" />
          <line x1="50%" y1="50%" x2="25%" y2="78%" stroke="#34d399" strokeOpacity=".24" />
          <line x1="50%" y1="50%" x2="76%" y2="76%" stroke="#60a5fa" strokeOpacity=".24" />
        </svg>
        {graphNodes.map((node, index) => (
          <div key={node.id} className={`graph-node absolute ${positions[index]} flex items-center justify-center rounded-full p-3 text-center shadow-[0_0_60px_rgba(52,211,153,.12)]`}>
            <div>
              <div className="text-xs font-semibold text-white">{node.label}</div>
              <div className="mt-1 text-[10px] uppercase tracking-widest text-emerald-100/60">{node.type}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SecurityAndRoadmap() {
  return (
    <section id="roadmap" className="mx-auto grid max-w-7xl gap-5 py-20 lg:grid-cols-2">
      <GlassCard className="p-7">
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/70">Security doctrine</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">If Trail can&apos;t decrypt it, Trail can&apos;t read it.</h2>
        <p className="mt-4 leading-7 text-slate-400"><strong>Crypto blueprint:</strong> {cryptoBlueprint.passwordKdf}; {cryptoBlueprint.messageEncryption}; {cryptoBlueprint.aiContext}.</p>
        <div className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm leading-6 text-emerald-50">This repo is still a scaffold. Real mail storage should wait for implemented encryption, connector hardening, threat modeling, and review.</div>
      </GlassCard>
      <GlassCard className="p-7">
        <p className="text-xs uppercase tracking-[0.35em] text-blue-200/70">Open-source roadmap</p>
        <div className="mt-4 space-y-3">
          {roadmap.map((phase) => (
            <div key={phase.phase} className="rounded-xl border border-white/10 bg-black/55 p-4">
              <div className="flex items-center gap-3"><Badge tone="cyan">Phase {phase.phase}</Badge><h3 className="font-semibold text-white">{phase.title}</h3></div>
              <p className="mt-2 text-sm text-slate-500">{phase.items.join(" · ")}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </section>
  );
}

export default function Home() {
  return (
    <main className="deep-page relative overflow-hidden px-5 py-6 md:px-8">
      <div className="spotlight spotlight-left" />
      <div className="spotlight spotlight-right" />
      <Nav />
      <section className="mx-auto grid max-w-7xl gap-10 pb-20 pt-16 lg:grid-cols-[.86fr_1.14fr] lg:items-center">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-emerald-300/15 bg-emerald-300/10 px-4 py-2 text-xs text-emerald-100">Bring Your Key · Bring Your Domain · Bring Your Computer</div>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[0.92] tracking-[-0.075em] text-white md:text-7xl">Build a private email OS around your own domain.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-400">Trail turns your domain into a local-first command center: mail routing, encrypted storage, private search, graph memory, and local AI watchers on your PC.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/install" className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-black shadow-[0_0_45px_rgba(255,255,255,.16)]">Run locally</a>
            <a href="/pass" className="rounded-md border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Erme Pass</a>
            <a href="/ecosystem" className="rounded-md border border-white/15 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10">Ecosystem</a>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 lg:hidden">
            {heroStats.map(([value, label]) => (
              <GlassCard key={label} className="p-4"><p className="text-2xl font-semibold text-white">{value}</p><p className="mt-1 text-xs text-slate-500">{label}</p></GlassCard>
            ))}
          </div>
        </div>
        <HeroMockup />
      </section>
      <MailModes />
      <DomainSetup />
      <LocalNode />
      <CommandInbox />
      <Graph />
      <SecurityAndRoadmap />
    </main>
  );
}
