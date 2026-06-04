import { apiSurface, bykPrinciples, dnsRecords, localNodeModules, mailModes, roadmap } from "@/lib/byk-mail";
import { graphNodes, timeline, watchers } from "@/lib/trail-core";
import { cryptoBlueprint } from "@/lib/crypto-blueprint";
import { Badge, GlassCard, SectionTitle, TerminalBlock } from "@/components/ui/primitives";

const heroStats = [
  ["BYK", "bring your key/domain/computer"],
  ["local", "vault, index, graph, AI"],
  ["3", "mail setup modes"],
  ["0", "server plaintext goal"],
];

const flow = ["Your domain", "Routing pipe", "Trail Local Node", "Encrypted vault", "Local AI"];

function Nav() {
  return (
    <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300 text-sm font-black text-slate-950">T</div>
        <div>
          <p className="font-semibold text-white">Trail</p>
          <p className="text-xs text-slate-400">BYK Local Email OS</p>
        </div>
      </div>
      <div className="hidden items-center gap-2 md:flex">
        <a href="/ecosystem" className="rounded-full border border-violet-300/25 bg-violet-300/10 px-3 py-1 text-xs font-medium text-violet-100 hover:bg-violet-300/15">Ecosystem</a>
        <a href="/pass" className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100 hover:bg-cyan-300/15">Pass</a>
        <a href="/install" className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100 hover:bg-cyan-300/15">Install</a>
        <Badge>Open source</Badge>
        <Badge tone="violet">Local-first</Badge>
        <Badge tone="emerald">Domain-owned</Badge>
      </div>
    </nav>
  );
}

function HeroMockup() {
  return (
    <GlassCard className="relative overflow-hidden p-4">
      <div className="absolute right-6 top-5 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">node online</div>
      <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-5">
        <p className="text-sm text-slate-400">Trail Local Node</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">you@yourdomain.com</h2>
        <div className="mt-6 grid gap-3">
          {flow.map((item, index) => (
            <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300/10 text-sm font-semibold text-cyan-100">{index + 1}</div>
              <div>
                <p className="font-medium text-white">{item}</p>
                <p className="text-xs text-slate-400">{index === 1 ? "Cloudflare, relay, tunnel, IMAP, or self-hosted MX" : "Owned by the user, replaceable by design"}</p>
              </div>
            </div>
          ))}
        </div>
        <TerminalBlock lines={["trail node status", "vault: encrypted + local", "ai: ollama/local runner", "domain: MX/SPF/DKIM/DMARC ready"]} />
      </div>
    </GlassCard>
  );
}

function MailModes() {
  return (
    <section id="modes" className="mx-auto max-w-7xl py-16">
      <SectionTitle eyebrow="Mail modes" title="Start easy. Scale toward sovereignty." body="Trail is designed around three operating modes, from Cloudflare-powered domain forwarding to full self-hosted MX. The local node stays the brain in every mode." />
      <div className="grid gap-4 lg:grid-cols-3">
        {mailModes.map((mode) => (
          <GlassCard key={mode.id} className="card-hover p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <Badge tone={mode.status === "advanced" ? "amber" : mode.status === "local" ? "emerald" : "cyan"}>{mode.status}</Badge>
              <span className="text-xs text-slate-500">{mode.id}</span>
            </div>
            <h3 className="text-2xl font-semibold text-white">{mode.name}</h3>
            <p className="mt-3 leading-7 text-slate-300">{mode.tagline}</p>
            <p className="mt-4 text-sm text-slate-400">Best for: {mode.bestFor}</p>
            <div className="mt-5 space-y-2">
              {mode.flow.map((step, index) => (
                <div key={step} className="flex items-center gap-2 text-sm text-slate-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                  <span>{index + 1}. {step}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {mode.pros.slice(0, 3).map((pro) => <Badge key={pro} tone="slate">{pro}</Badge>)}
            </div>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}

function DomainSetup() {
  return (
    <section id="domain" className="mx-auto grid max-w-7xl gap-8 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <div>
        <SectionTitle align="left" eyebrow="Domain setup" title="A GitHub-ready wizard for real DNS ownership" body="Trail should generate provider-specific steps for Cloudflare, registrar DNS, relay mode, or full MX. This scaffold shows the data model and user-facing record preview." />
        <div className="space-y-3">
          {bykPrinciples.map((principle) => <div key={principle} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-300">{principle}</div>)}
        </div>
      </div>
      <GlassCard className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">DNS preview</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">yourdomain.com</h3>
          </div>
          <Badge tone="emerald">generated</Badge>
        </div>
        <div className="space-y-3">
          {dnsRecords.map((record) => (
            <div key={`${record.type}-${record.host}`} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{record.type}</Badge>
                <code className="text-sm text-white">{record.host}</code>
                <span className="text-slate-500">→</span>
                <code className="break-all text-sm text-cyan-100">{record.value}</code>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-400">{record.purpose}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </section>
  );
}

function LocalNode() {
  return (
    <section id="local-node" className="mx-auto max-w-7xl py-16">
      <SectionTitle eyebrow="Local node" title="The inbox brain lives under ~/.trail" body="The local node owns readable data: mail vault, attachments, search, graph, watchers, queues, and backups. Hosted pieces are adapters around it." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {localNodeModules.map((module) => (
          <GlassCard key={module.name} className="card-hover p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-white">{module.name}</h3>
              <Badge tone={module.privacyBoundary === "local plaintext" ? "emerald" : module.privacyBoundary === "metadata only" ? "amber" : "violet"}>{module.privacyBoundary}</Badge>
            </div>
            <code className="mt-4 block rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-cyan-100">{module.path}</code>
            <p className="mt-4 leading-7 text-slate-300">{module.description}</p>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}

function CommandInbox() {
  return (
    <section className="mx-auto grid max-w-7xl gap-8 py-16 lg:grid-cols-[1.05fr_.95fr]">
      <GlassCard className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Command inbox</p>
            <h2 className="text-2xl font-semibold text-white">Local AI watches mail without uploading it</h2>
          </div>
          <Badge tone="emerald">Ollama local</Badge>
        </div>
        <div className="space-y-3">
          {timeline.map((event) => (
            <div key={event.id} className="flex gap-3 rounded-3xl border border-white/10 bg-slate-950/70 p-4">
              <div className="timeline-line mt-2 w-1 rounded-full" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-white">{event.subject}</p>
                  <span className="text-xs text-slate-400">{event.at}</span>
                </div>
                <p className="mt-1 text-sm text-slate-400">{event.actor}</p>
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
            <p className="text-xs uppercase tracking-widest text-cyan-200">{watcher.modelTarget}</p>
            <h3 className="mt-3 text-xl font-semibold text-white">{watcher.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">“{watcher.naturalLanguageRule}”</p>
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
    <section className="mx-auto grid max-w-7xl gap-8 py-16 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
      <div>
        <SectionTitle align="left" eyebrow="Knowledge graph" title="The mail graph becomes a private second brain" body="People, domains, receipts, calendar events, aliases, attachments, and thread context are linked locally. It feels like Obsidian for email, but no server needs to read it." />
        <div className="grid gap-3 sm:grid-cols-2">
          {apiSurface.map((route) => <code key={route} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-cyan-100">{route}</code>)}
        </div>
      </div>
      <div className="relative min-h-[430px] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 p-4 shadow-2xl">
        <div className="absolute inset-0 grid-bg" />
        <svg className="absolute inset-0 h-full w-full opacity-60" aria-hidden="true">
          <line x1="50%" y1="50%" x2="20%" y2="28%" stroke="#5eead4" strokeOpacity=".35" />
          <line x1="50%" y1="50%" x2="78%" y2="28%" stroke="#60a5fa" strokeOpacity=".35" />
          <line x1="50%" y1="50%" x2="25%" y2="78%" stroke="#a78bfa" strokeOpacity=".3" />
          <line x1="50%" y1="50%" x2="76%" y2="76%" stroke="#5eead4" strokeOpacity=".3" />
          <line x1="78%" y1="28%" x2="91%" y2="53%" stroke="#f0abfc" strokeOpacity=".25" />
          <line x1="76%" y1="76%" x2="53%" y2="87%" stroke="#60a5fa" strokeOpacity=".25" />
        </svg>
        {graphNodes.map((node, index) => (
          <div key={node.id} className={`graph-node absolute ${positions[index]} flex items-center justify-center rounded-full p-3 text-center shadow-[0_0_60px_rgba(94,234,212,.12)]`}>
            <div>
              <div className="text-xs font-semibold text-white">{node.label}</div>
              <div className="mt-1 text-[10px] uppercase tracking-widest text-cyan-100/60">{node.type}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SecurityAndRoadmap() {
  return (
    <section id="roadmap" className="mx-auto grid max-w-7xl gap-5 py-16 lg:grid-cols-2">
      <GlassCard className="p-7">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Security doctrine</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">If Trail can&apos;t decrypt it, Trail can&apos;t read it.</h2>
        <p className="mt-4 leading-7 text-slate-300"><strong>Crypto blueprint:</strong> {cryptoBlueprint.passwordKdf}; {cryptoBlueprint.messageEncryption}; {cryptoBlueprint.aiContext}.</p>
        <div className="mt-5 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm leading-6 text-cyan-50">This repo is still a scaffold. Real mail storage should wait for implemented encryption, connector hardening, threat modeling, and review.</div>
      </GlassCard>
      <GlassCard className="p-7">
        <p className="text-xs uppercase tracking-[0.3em] text-violet-200">Open-source roadmap</p>
        <div className="mt-4 space-y-3">
          {roadmap.map((phase) => (
            <div key={phase.phase} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="flex items-center gap-3"><Badge tone="violet">Phase {phase.phase}</Badge><h3 className="font-semibold text-white">{phase.title}</h3></div>
              <p className="mt-2 text-sm text-slate-400">{phase.items.join(" · ")}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </section>
  );
}

export default function Home() {
  return (
    <main className="relative overflow-hidden px-5 py-6 md:px-8">
      <div className="orb left-10 top-24 h-44 w-44 bg-cyan-400/15" />
      <div className="orb right-16 top-36 h-52 w-52 bg-violet-400/15 [animation-delay:1.2s]" />
      <Nav />
      <section className="mx-auto grid max-w-7xl gap-10 pb-20 pt-16 lg:grid-cols-[1.02fr_.98fr] lg:items-center">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">Open-source BYK mail: Bring Your Key, Domain, and Computer.</div>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.06em] text-white md:text-7xl">Your domain becomes a local-first AI email OS.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Trail lets users own `you@yourdomain.com`, route mail through replaceable pipes, and keep the real inbox, vault, search, knowledge graph, and AI watchers on their own PC.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/ecosystem" className="rounded-full bg-cyan-200 px-6 py-3 font-semibold text-slate-950 shadow-[0_0_40px_rgba(94,234,212,.25)]">Erme ecosystem</a>
            <a href="/pass" className="rounded-full border border-violet-300/25 px-6 py-3 font-semibold text-violet-100 hover:bg-violet-300/10">Erme Pass</a>
            <a href="/install" className="rounded-full border border-cyan-300/25 px-6 py-3 font-semibold text-cyan-100 hover:bg-cyan-300/10">Install Trail</a>
            <a href="/dashboard" className="rounded-full border border-cyan-300/25 px-6 py-3 font-semibold text-cyan-100 hover:bg-cyan-300/10">Open control dashboard</a>
            <a href="#roadmap" className="rounded-full border border-white/15 px-6 py-3 font-semibold text-white hover:bg-white/10">GitHub roadmap</a>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
            {heroStats.map(([value, label]) => (
              <GlassCard key={label} className="p-4"><p className="text-2xl font-semibold text-white">{value}</p><p className="mt-1 text-xs text-slate-400">{label}</p></GlassCard>
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
