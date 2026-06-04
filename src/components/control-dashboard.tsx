"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Badge, GlassCard } from "@/components/ui/primitives";

type Mode = "quick-domain" | "relay-node" | "sovereign-mx";
type RunState = "fresh" | "running" | "paused";

interface StatusPayload {
  status: {
    nodeId: string;
    runState: RunState;
    home: string;
    domain?: { domain: string; mode: Mode; catchAll: boolean; createdAt: string };
    counts: { aliases: number; watchers: number; mail: number; events: number };
    updatedAt: string;
  };
  events: { id: string; type: string; message: string; at: string }[];
}

interface AliasRecord { id: string; address: string; destination: string; label: string; active: boolean; createdAt: string }
interface WatcherRecord { id: string; name: string; rule: string; actions: string[]; humanApprovalRequired: boolean; active: boolean; createdAt: string }
interface MailRecord { id: string; from: string; to: string; subject: string; bodyPreview: string; tags: string[]; status: string; receivedAt: string }

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) }, cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Request failed: ${response.status}`);
  return data as T;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm text-slate-300"><span>{label}</span>{children}</label>;
}

function inputClass() {
  return "rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/50";
}

export function ControlDashboard() {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [aliases, setAliases] = useState<AliasRecord[]>([]);
  const [watchers, setWatchers] = useState<WatcherRecord[]>([]);
  const [mail, setMail] = useState<MailRecord[]>([]);
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState<string>("");

  const [domain, setDomain] = useState("yourdomain.com");
  const [mode, setMode] = useState<Mode>("quick-domain");
  const [catchAll, setCatchAll] = useState(true);
  const [aliasLocal, setAliasLocal] = useState("inbox");
  const [aliasLabel, setAliasLabel] = useState("Main inbox");
  const [watcherName, setWatcherName] = useState("Order watcher");
  const [watcherRule, setWatcherRule] = useState("Track receipts, shipping changes, refunds, and delivery dates.");
  const [mailSubject, setMailSubject] = useState("Your package is delayed");
  const [mailFrom, setMailFrom] = useState("orders@shop.example");
  const [mailBody, setMailBody] = useState("Delivery moved by two days. Trail should update the local order timeline and flag if it changes again.");

  const activeAddress = useMemo(() => aliases[0]?.address || `inbox@${status?.status.domain?.domain || domain}`, [aliases, status, domain]);

  async function refresh() {
    const [statusPayload, aliasPayload, watcherPayload, mailPayload] = await Promise.all([
      api<StatusPayload>("/api/node/status"),
      api<{ aliases: AliasRecord[] }>("/api/node/aliases"),
      api<{ watchers: WatcherRecord[] }>("/api/node/watchers"),
      api<{ mail: MailRecord[] }>("/api/node/messages"),
    ]);
    setStatus(statusPayload);
    setAliases(aliasPayload.aliases);
    setWatchers(watcherPayload.watchers);
    setMail(mailPayload.mail);
  }

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label);
    setError("");
    try {
      await fn();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refresh().catch((err) => setError(err instanceof Error ? err.message : String(err)));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function setup(e: FormEvent) {
    e.preventDefault();
    void run("setup", async () => {
      await api("/api/node/setup", { method: "POST", body: JSON.stringify({ domain, mode, catchAll }) });
    });
  }

  function createAlias(e: FormEvent) {
    e.preventDefault();
    void run("alias", async () => {
      await api("/api/node/aliases", { method: "POST", body: JSON.stringify({ address: aliasLocal, destination: "local-vault", label: aliasLabel }) });
    });
  }

  function createWatcher(e: FormEvent) {
    e.preventDefault();
    void run("watcher", async () => {
      await api("/api/node/watchers", { method: "POST", body: JSON.stringify({ name: watcherName, rule: watcherRule, actions: ["scan", "flag", "draft_reply"], humanApprovalRequired: true }) });
    });
  }

  function importMail(e: FormEvent) {
    e.preventDefault();
    void run("mail", async () => {
      await api("/api/node/messages", { method: "POST", body: JSON.stringify({ from: mailFrom, to: activeAddress, subject: mailSubject, body: mailBody, tags: ["local-import", "demo"] }) });
    });
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-5 py-6 md:px-8">
      <div className="orb left-10 top-24 h-44 w-44 bg-cyan-400/15" />
      <div className="orb right-16 top-36 h-52 w-52 bg-violet-400/15 [animation-delay:1.2s]" />

      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300 text-sm font-black text-slate-950">T</div>
          <div><p className="font-semibold text-white">Trail Control</p><p className="text-xs text-slate-400">Local node dashboard</p></div>
        </Link>
        <div className="flex items-center gap-2">
          <Badge tone={status?.status.runState === "running" ? "emerald" : status?.status.runState === "paused" ? "amber" : "slate"}>{status?.status.runState || "loading"}</Badge>
          <button onClick={() => void run("seed", async () => { await api("/api/node/actions", { method: "POST", body: JSON.stringify({ action: "seed" }) }); })} className="rounded-full bg-cyan-200 px-4 py-2 text-sm font-semibold text-slate-950">Seed demo</button>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl pb-10 pt-12">
        <div className="mb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/80">Backend live</p>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.06em] text-white md:text-7xl">Control the local Trail node.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">This is now more than a landing page: create the domain config, aliases, local AI watchers, and test inbound mail. Everything persists into the local Trail home folder.</p>
        </div>

        {error && <div className="mb-5 rounded-3xl border border-red-300/30 bg-red-400/10 p-4 text-red-100">{error}</div>}

        <div className="grid gap-4 md:grid-cols-4">
          <GlassCard className="p-5"><p className="text-sm text-slate-400">Trail home</p><p className="mt-2 break-all text-sm font-semibold text-white">{status?.status.home || "..."}</p></GlassCard>
          <GlassCard className="p-5"><p className="text-sm text-slate-400">Domain</p><p className="mt-2 text-2xl font-semibold text-white">{status?.status.domain?.domain || "not set"}</p></GlassCard>
          <GlassCard className="p-5"><p className="text-sm text-slate-400">Aliases</p><p className="mt-2 text-3xl font-semibold text-white">{status?.status.counts.aliases ?? 0}</p></GlassCard>
          <GlassCard className="p-5"><p className="text-sm text-slate-400">Watchers / Mail</p><p className="mt-2 text-3xl font-semibold text-white">{status?.status.counts.watchers ?? 0} / {status?.status.counts.mail ?? 0}</p></GlassCard>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 pb-16 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h2 className="text-2xl font-semibold text-white">1. Create domain setup</h2>
          <form onSubmit={setup} className="mt-5 grid gap-4">
            <Field label="Domain"><input className={inputClass()} value={domain} onChange={(e) => setDomain(e.target.value)} /></Field>
            <Field label="Mode"><select className={inputClass()} value={mode} onChange={(e) => setMode(e.target.value as Mode)}><option value="quick-domain">Quick Domain</option><option value="relay-node">Relay Node</option><option value="sovereign-mx">Sovereign MX</option></select></Field>
            <label className="flex items-center gap-3 text-sm text-slate-300"><input type="checkbox" checked={catchAll} onChange={(e) => setCatchAll(e.target.checked)} /> Enable catch-all routing</label>
            <button disabled={busy === "setup"} className="rounded-2xl bg-cyan-200 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60">Create / update setup</button>
          </form>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-2xl font-semibold text-white">2. Create alias</h2>
          <form onSubmit={createAlias} className="mt-5 grid gap-4">
            <Field label="Alias local-part or full address"><input className={inputClass()} value={aliasLocal} onChange={(e) => setAliasLocal(e.target.value)} /></Field>
            <Field label="Label"><input className={inputClass()} value={aliasLabel} onChange={(e) => setAliasLabel(e.target.value)} /></Field>
            <button disabled={busy === "alias"} className="rounded-2xl bg-cyan-200 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60">Create alias</button>
          </form>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-2xl font-semibold text-white">3. Create local AI watcher</h2>
          <form onSubmit={createWatcher} className="mt-5 grid gap-4">
            <Field label="Watcher name"><input className={inputClass()} value={watcherName} onChange={(e) => setWatcherName(e.target.value)} /></Field>
            <Field label="Natural language rule"><textarea className={`${inputClass()} min-h-28`} value={watcherRule} onChange={(e) => setWatcherRule(e.target.value)} /></Field>
            <button disabled={busy === "watcher"} className="rounded-2xl bg-cyan-200 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60">Create watcher</button>
          </form>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-2xl font-semibold text-white">4. Import test local mail</h2>
          <form onSubmit={importMail} className="mt-5 grid gap-4">
            <Field label="From"><input className={inputClass()} value={mailFrom} onChange={(e) => setMailFrom(e.target.value)} /></Field>
            <Field label="Subject"><input className={inputClass()} value={mailSubject} onChange={(e) => setMailSubject(e.target.value)} /></Field>
            <Field label="Body"><textarea className={`${inputClass()} min-h-24`} value={mailBody} onChange={(e) => setMailBody(e.target.value)} /></Field>
            <button disabled={busy === "mail"} className="rounded-2xl bg-cyan-200 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60">Import into local vault</button>
          </form>
        </GlassCard>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 pb-20 lg:grid-cols-3">
        <GlassCard className="p-6"><h2 className="text-xl font-semibold text-white">Aliases</h2><div className="mt-4 space-y-3">{aliases.map((a) => <div key={a.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"><p className="font-semibold text-white">{a.address}</p><p className="text-sm text-slate-400">{a.label} → {a.destination}</p></div>)}</div></GlassCard>
        <GlassCard className="p-6"><h2 className="text-xl font-semibold text-white">Watchers</h2><div className="mt-4 space-y-3">{watchers.map((w) => <div key={w.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"><p className="font-semibold text-white">{w.name}</p><p className="mt-1 text-sm text-slate-400">{w.rule}</p><div className="mt-3 flex flex-wrap gap-2">{w.actions.map((action) => <Badge key={action} tone="slate">{action}</Badge>)}</div></div>)}</div></GlassCard>
        <GlassCard className="p-6"><h2 className="text-xl font-semibold text-white">Local inbox + event log</h2><div className="mt-4 space-y-3">{mail.map((m) => <div key={m.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"><p className="font-semibold text-white">{m.subject}</p><p className="text-sm text-slate-400">{m.from} → {m.to}</p><p className="mt-2 text-sm text-slate-300">{m.bodyPreview}</p></div>)}{status?.events.map((event) => <div key={event.id} className="rounded-2xl border border-cyan-300/10 bg-cyan-300/5 p-3 text-sm text-cyan-100">{event.message}</div>)}</div></GlassCard>
      </section>
    </main>
  );
}
