"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/primitives";

type Mode = "quick-domain" | "relay-node" | "sovereign-mx";
type RunState = "fresh" | "running" | "paused";
type MailFolder = "inbox" | "priority" | "orders" | "finance" | "sent" | "archive";

type Status = {
  nodeId: string;
  runState: RunState;
  home: string;
  domain?: { domain: string; mode: Mode; catchAll: boolean; createdAt: string };
  counts: Record<string, number>;
  updatedAt: string;
};

type AliasRecord = { id: string; address: string; destination: string; label: string; active: boolean; createdAt: string };
type WatcherRecord = { id: string; name: string; rule: string; actions: string[]; humanApprovalRequired: boolean; active: boolean; createdAt: string };
type MailRecord = { id: string; from: string; to: string; subject: string; body: string; bodyPreview: string; tags: string[]; status: string; folder: MailFolder; unread: boolean; importance: "low" | "normal" | "high"; receivedAt: string };
type QueueAction = { id: string; type: string; status: string; title: string; detail: string; createdAt: string };
type TrailEvent = { id: string; type: string; message: string; at: string };
type ConnectorStatus = "not-started" | "configured" | "connected" | "syncing" | "ready" | "error";
type Connectors = {
  domainHost?: { provider: string; domain: string; nameservers: string[]; records: { type: string; host: string; value: string; status: ConnectorStatus }[]; status: ConnectorStatus; updatedAt: string };
  receiver?: { mode: string; targetAddress: string; webhookPath: string; inboundSecretRef: string; status: ConnectorStatus; updatedAt: string };
  gmail?: { clientIdRef: string; tokenRef: string; scopes: string[]; historyId?: string; syncState: ConnectorStatus; lastScrapeAt?: string; imported: number; updatedAt: string };
  localModels: { id: string; provider: string; model: string; purpose: string; installCommand: string; status: ConnectorStatus; updatedAt: string; downloadedAt?: string }[];
  tools: { id: string; name: string; type: string; status: ConnectorStatus; notes: string; updatedAt: string }[];
};

type Platform = {
  status: Status;
  folders: Record<string, number>;
  unread: number;
  priority: number;
  connectors: Connectors;
  aliases: AliasRecord[];
  watchers: WatcherRecord[];
  mail: MailRecord[];
  actions: QueueAction[];
  drafts: { id: string; to: string; subject: string; status: string; createdAt: string }[];
  contacts: { id: string; email: string; name: string; messageCount: number; tags: string[] }[];
  graph: { nodes: { id: string; type: string; label: string; weight: number }[]; edges: { id: string }[] };
  events: TrailEvent[];
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) }, cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Request failed: ${response.status}`);
  return data as T;
}

function time(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function Shell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`border border-white/10 bg-[#08100d]/70 shadow-[0_30px_90px_rgba(0,0,0,.42)] backdrop-blur-2xl ${className}`}>{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/42"><span>{label}</span>{children}</label>;
}

const input = "min-h-12 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/22 focus:border-emerald-200/45 focus:bg-black/42";

function Metric({ label, value, note }: { label: string; value: React.ReactNode; note: string }) {
  return <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4"><p className="text-3xl font-semibold tracking-[-0.05em] text-white">{value}</p><p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/38">{label}</p><p className="mt-3 text-xs leading-5 text-white/48">{note}</p></div>;
}

export function ControlDashboard({ initialData = null }: { initialData?: Platform | null }) {
  const [data, setData] = useState<Platform | null>(initialData);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [domain, setDomain] = useState(initialData?.status.domain?.domain || "yourdomain.com");
  const [mode, setMode] = useState<Mode>(initialData?.status.domain?.mode || "quick-domain");
  const [catchAll, setCatchAll] = useState(initialData?.status.domain?.catchAll ?? true);
  const [aliasLocal, setAliasLocal] = useState("hello");
  const [aliasLabel, setAliasLabel] = useState("Public inbox");
  const [watcherName, setWatcherName] = useState("Money + orders guard");
  const [watcherRule, setWatcherRule] = useState("Flag invoices, payment failures, receipts, shipping delays, refunds, and deadlines.");
  const [mailFrom, setMailFrom] = useState("client@zrorisc.example");
  const [mailSubject, setMailSubject] = useState("Invoice deadline and package update");
  const [mailBody, setMailBody] = useState("Payment is due Friday and the package delivery changed again. Trail should classify this, add it to the timeline, and queue a draft reply.");

  const liveAddress = useMemo(() => data?.aliases[0]?.address || `hello@${data?.status.domain?.domain || domain}`, [data, domain]);
  const openActions = data?.actions.filter((action) => action.status === "queued").length || 0;
  const topFolders = ["inbox", "priority", "orders", "finance"].map((folder) => ({ folder, count: data?.folders?.[folder] || 0 }));

  async function refresh() {
    const next = await api<Platform>("/api/platform");
    setData(next);
    if (next.status.domain?.domain) setDomain(next.status.domain.domain);
    if (next.status.domain?.mode) setMode(next.status.domain.mode);
    if (typeof next.status.domain?.catchAll === "boolean") setCatchAll(next.status.domain.catchAll);
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
    const timer = window.setTimeout(() => refresh().catch((err) => setError(err instanceof Error ? err.message : String(err))), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function setup(e: FormEvent) {
    e.preventDefault();
    void run("setup", () => api("/api/node/setup", { method: "POST", body: JSON.stringify({ domain, mode, catchAll }) }).then(() => undefined));
  }

  function createAlias(e: FormEvent) {
    e.preventDefault();
    void run("alias", () => api("/api/node/aliases", { method: "POST", body: JSON.stringify({ address: aliasLocal, destination: "local-vault", label: aliasLabel }) }).then(() => undefined));
  }

  function createWatcher(e: FormEvent) {
    e.preventDefault();
    void run("watcher", () => api("/api/node/watchers", { method: "POST", body: JSON.stringify({ name: watcherName, rule: watcherRule, actions: ["scan", "flag", "draft_reply", "order_update"], humanApprovalRequired: true }) }).then(() => undefined));
  }

  function importMail(e: FormEvent) {
    e.preventDefault();
    void run("mail", () => api("/api/node/messages", { method: "POST", body: JSON.stringify({ from: mailFrom, to: liveAddress, subject: mailSubject, body: mailBody, tags: ["phase-1", "local-import"] }) }).then(() => undefined));
  }



  const checkTunnelHealth = async () => {
    try {
      const url = `https://tunnel.${domain}/api/ingress/health`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          alert(`Tunnel is healthy! Local background service responded. Timestamp: ${data.timestamp}`);
          return;
        }
      }
      alert("Tunnel responded, but not with the expected local node payload.");
    } catch (err: unknown) {
      alert(`Tunnel check failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  function connectDomainHost() {
    void run("domain-host", async () => {
      const token = window.prompt("Enter your Cloudflare API token (leave blank to just generate records):");
      await api("/api/connectors", { method: "POST", body: JSON.stringify({ action: "domain-host", provider: "cloudflare", domain, token: token || undefined }) });
    });
  }

  function connect(action: string, payload: Record<string, unknown> = {}) {
    void run(action, () => api("/api/connectors", { method: "POST", body: JSON.stringify({ action, ...payload }) }).then(() => undefined));
  }

  function autoWireEverything() {
    void run("auto-wire", async () => {
      await api("/api/connectors", { method: "POST", body: JSON.stringify({ action: "domain-host", provider: "cloudflare", domain }) });
      await api("/api/connectors", { method: "POST", body: JSON.stringify({ action: "domain-receiver", mode: mode === "sovereign-mx" ? "sovereign-smtp" : "cloudflare-email-routing", targetAddress: liveAddress }) });
      await api("/api/connectors", { method: "POST", body: JSON.stringify({ action: "gmail-oauth", clientIdRef: "GOOGLE_CLIENT_ID", tokenRef: "GOOGLE_REFRESH_TOKEN" }) });
      await api("/api/connectors", { method: "POST", body: JSON.stringify({ action: "gmail-scrape", limit: 5 }) });
      await api("/api/connectors", { method: "POST", body: JSON.stringify({ action: "local-model", provider: "ollama", model: "llama3.2:3b", purpose: "watchers" }) });
      await api("/api/connectors", { method: "POST", body: JSON.stringify({ action: "tool", name: "Local approval queue", type: "automation", notes: "Draft-only external actions with human approval gates." }) });
    });
  }

  return (
    <main className="natural-page relative min-h-screen overflow-hidden px-4 py-5 text-white md:px-7">
      <div className="forest-depth" />
      <div className="ambient-fog" />
      <div className="forest-tree forest-tree-left" />
      <div className="forest-tree forest-tree-right" />

      <div className="mx-auto grid max-w-[96rem] gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="single-slab sticky top-5 h-fit rounded-[2rem] p-4">
          <Link href="/" className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.045] p-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-lg font-black text-[#10120f]">T</div>
            <div><p className="font-semibold">Trail</p><p className="text-xs text-white/42">Phase 1 control</p></div>
          </Link>

          <div className="mt-5 space-y-2">
            {[{ href: "/dashboard", label: "Control Room", note: "setup + node" }, { href: "/mail", label: "Mail OS", note: "inbox + memory" }, { href: "/pass", label: "Pass", note: "local vault" }, { href: "/install", label: "Install", note: "one-click scripts" }].map((item) => (
              <Link key={item.href} href={item.href} className={`block rounded-2xl border px-4 py-3 transition ${item.href === "/dashboard" ? "border-white/22 bg-white/12" : "border-white/8 bg-white/[0.03] hover:bg-white/[0.07]"}`}>
                <span className="block text-sm font-semibold">{item.label}</span><span className="text-xs text-white/38">{item.note}</span>
              </Link>
            ))}
          </div>

          <div className="mt-5 rounded-3xl border border-emerald-200/14 bg-emerald-200/[0.06] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-100/70">Node state</p>
            <div className="mt-3 flex items-center justify-between"><span className="text-2xl font-semibold capitalize">{data?.status.runState || "loading"}</span><Badge tone={data?.status.runState === "running" ? "emerald" : "amber"}>{data?.status.runState || "syncing"}</Badge></div>
            <p className="mt-3 break-all text-xs leading-5 text-white/45">{data?.status.home || "Loading local Trail home..."}</p>
          </div>
        </aside>

        <section className="min-w-0 space-y-4">
          <Shell className="overflow-hidden rounded-[2.25rem]">
            <div className="grid gap-6 p-5 md:p-8 xl:grid-cols-[minmax(0,1fr)_26rem]">
              <div>
                <p className="section-kicker">Phase 1 remake · local-first email OS</p>
                <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-[0.9] tracking-[-0.075em] text-white md:text-7xl">Control room for your private mail node.</h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/62 md:text-lg">This page now acts like the first real Trail cockpit: domain routing, aliases, watchers, local mail import, queues, graph health, and recent node events all in one usable surface.</p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <button onClick={() => void run("seed", () => api("/api/platform", { method: "POST", body: JSON.stringify({ action: "seed-platform" }) }).then(() => undefined))} className="soft-glass-button">Seed working local data</button>
                  <Link href="/mail" className="soft-glass-button ghost">Open redesigned mail</Link>
                  <button onClick={() => void refresh()} className="soft-glass-button ghost">Refresh node</button>
                  <button onClick={autoWireEverything} className="soft-glass-button">Auto-wire remaining connectors</button>
                </div>
              </div>
              <div className="rounded-[1.7rem] border border-white/10 bg-black/24 p-5">
                <div className="flex items-center justify-between"><p className="text-sm font-semibold text-white/82">Phase 1 readiness</p><span className="text-xs text-white/38">updated {time(data?.status.updatedAt)}</span></div>
                <div className="mt-5 space-y-3">
                  {["Domain configured", "Alias routes into local vault", "Watchers create gated actions", "Mail feeds contacts + graph"].map((item, index) => <div key={item} className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-white text-xs font-black text-black">{index + 1}</span><p className="text-sm text-white/68">{item}</p></div>)}
                </div>
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-xs uppercase tracking-[0.22em] text-white/36">Active address</p><p className="mt-2 break-all text-lg font-semibold text-emerald-100">{liveAddress}</p></div>
              </div>
            </div>
          </Shell>

          {error && <div className="rounded-3xl border border-red-300/25 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Metric label="messages" value={data?.status.counts.mail ?? "—"} note="stored in the local vault" />
            <Metric label="aliases" value={data?.status.counts.aliases ?? "—"} note="addresses routing privately" />
            <Metric label="watchers" value={data?.status.counts.watchers ?? "—"} note="local rules with approval" />
            <Metric label="queued" value={openActions} note="actions waiting on you" />
            <Metric label="graph" value={data?.graph.nodes.length ?? "—"} note={`${data?.graph.edges.length || 0} entity links`} />
            <Metric label="connectors" value={data?.status.counts.connectors ?? "—"} note="domain, Gmail, models, tools" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]">
            <Shell className="rounded-[2rem] p-5 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="section-kicker">Launch lane</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">Configure the node</h2></div><Badge tone="emerald">durable local state</Badge></div>
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <form onSubmit={setup} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <h3 className="font-semibold">Domain + routing</h3><p className="mt-1 text-sm text-white/42">Sets the identity Trail routes around.</p>
                  <div className="mt-4 grid gap-3"><Field label="Domain"><input className={input} value={domain} onChange={(e) => setDomain(e.target.value)} /></Field><Field label="Mode"><select className={input} value={mode} onChange={(e) => setMode(e.target.value as Mode)}><option value="quick-domain">Quick Domain</option><option value="relay-node">Relay Node</option><option value="sovereign-mx">Sovereign MX</option></select></Field><label className="flex items-center gap-3 text-sm text-white/58"><input type="checkbox" checked={catchAll} onChange={(e) => setCatchAll(e.target.checked)} /> Catch-all routing</label><button disabled={busy === "setup"} className="rounded-2xl bg-white px-4 py-3 font-semibold text-black disabled:opacity-50">Save routing</button></div>
                </form>
                <form onSubmit={createAlias} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <h3 className="font-semibold">Alias</h3><p className="mt-1 text-sm text-white/42">Create a new public address into the vault.</p>
                  <div className="mt-4 grid gap-3"><Field label="Address"><input className={input} value={aliasLocal} onChange={(e) => setAliasLocal(e.target.value)} /></Field><Field label="Label"><input className={input} value={aliasLabel} onChange={(e) => setAliasLabel(e.target.value)} /></Field><button disabled={busy === "alias"} className="rounded-2xl bg-emerald-100 px-4 py-3 font-semibold text-black disabled:opacity-50">Create alias</button></div>
                </form>
                <form onSubmit={createWatcher} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 lg:col-span-2">
                  <div className="grid gap-4 lg:grid-cols-[18rem_1fr_auto]"><div><h3 className="font-semibold">Local watcher</h3><p className="mt-1 text-sm text-white/42">Plain English rule. Actions stay gated.</p></div><div className="grid gap-3 md:grid-cols-2"><Field label="Name"><input className={input} value={watcherName} onChange={(e) => setWatcherName(e.target.value)} /></Field><Field label="Rule"><textarea className={`${input} min-h-12`} value={watcherRule} onChange={(e) => setWatcherRule(e.target.value)} /></Field></div><button disabled={busy === "watcher"} className="h-12 self-end rounded-2xl bg-white px-5 font-semibold text-black disabled:opacity-50">Add</button></div>
                </form>
              </div>
            </Shell>

            <Shell className="rounded-[2rem] p-5 md:p-6">
              <div className="flex items-center justify-between"><div><p className="section-kicker">Test lane</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">Import mail</h2></div><Badge tone="cyan">vault write</Badge></div>
              <form onSubmit={importMail} className="mt-5 grid gap-3"><Field label="From"><input className={input} value={mailFrom} onChange={(e) => setMailFrom(e.target.value)} /></Field><Field label="Subject"><input className={input} value={mailSubject} onChange={(e) => setMailSubject(e.target.value)} /></Field><Field label="Body"><textarea className={`${input} min-h-32`} value={mailBody} onChange={(e) => setMailBody(e.target.value)} /></Field><button disabled={busy === "mail"} className="rounded-2xl bg-white px-4 py-3 font-semibold text-black disabled:opacity-50">Import and classify</button></form>
              <div className="mt-5 grid grid-cols-4 gap-2">{topFolders.map((item) => <div key={item.folder} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3"><p className="text-xl font-semibold">{item.count}</p><p className="text-[10px] uppercase tracking-[0.18em] text-white/35">{item.folder}</p></div>)}</div>
            </Shell>
          </div>

          <div className="grid gap-4 xl:grid-cols-4">
            <Shell className="rounded-[2rem] p-5">
              <div className="flex items-center justify-between gap-3"><div><p className="section-kicker">Domain hoster</p><h2 className="mt-2 text-xl font-semibold">Main domain connector</h2></div><Badge tone={data?.connectors.domainHost ? "emerald" : "amber"}>{data?.connectors.domainHost?.status || "needed"}</Badge></div>
              <p className="mt-3 text-sm leading-6 text-white/50">Cloudflare/registrar DNS plan with MX, SPF, DKIM, DMARC, and dashboard CNAME records.</p>
              <button onClick={connectDomainHost} className="mt-4 w-full rounded-2xl bg-white px-4 py-3 font-semibold text-black">Generate DNS host records</button>
              <div className="mt-4 space-y-2">{data?.connectors.domainHost?.records.slice(0, 4).map((record) => <p key={`${record.type}-${record.host}`} className="truncate rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-white/55">{record.type} {record.host} → {record.value}</p>)}</div>
            </Shell>
            <Shell className="rounded-[2rem] p-5">
              <div className="flex items-center justify-between gap-3"><div><p className="section-kicker">Receiver</p><h2 className="mt-2 text-xl font-semibold">Domain receiver</h2></div><Badge tone={data?.connectors.receiver ? "emerald" : "amber"}>{data?.connectors.receiver?.status || "needed"}</Badge></div>
              <p className="mt-3 text-sm leading-6 text-white/50">Inbound path for Cloudflare Email Routing, Gmail IMAP/OAuth, relay webhook, or sovereign SMTP.</p>
              <button onClick={() => connect("domain-receiver", { mode: mode === "sovereign-mx" ? "sovereign-smtp" : "cloudflare-email-routing", targetAddress: liveAddress })} className="mt-4 w-full rounded-2xl bg-emerald-100 px-4 py-3 font-semibold text-black">Configure receiver</button>

              <p className="mt-4 break-all text-xs text-white/42">{data?.connectors.receiver ? `${data.connectors.receiver.mode} → ${data.connectors.receiver.targetAddress}` : "No receiver wired yet."}</p>
              <button onClick={checkTunnelHealth} className="mt-4 w-full rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-3 font-semibold text-white">Check end-to-end tunnel health</button>

            </Shell>
            <Shell className="rounded-[2rem] p-5">
              <div className="flex items-center justify-between gap-3"><div><p className="section-kicker">Gmail OAuth</p><h2 className="mt-2 text-xl font-semibold">History scrape lane</h2></div><Badge tone={data?.connectors.gmail?.syncState === "ready" ? "emerald" : "amber"}>{data?.connectors.gmail?.syncState || "needed"}</Badge></div>
              <p className="mt-3 text-sm leading-6 text-white/50">Stores only secret refs, then imports history records into the local vault/index path.</p>
              <div className="mt-4 grid gap-2"><button onClick={() => connect("gmail-oauth", { clientIdRef: "GOOGLE_CLIENT_ID", tokenRef: "GOOGLE_REFRESH_TOKEN" })} className="rounded-2xl bg-white px-4 py-3 font-semibold text-black">Connect OAuth refs</button><button onClick={() => connect("gmail-scrape", { limit: 5 })} className="rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-3 font-semibold text-white">Scrape Gmail history</button></div>
              <p className="mt-3 text-xs text-white/42">Imported: {data?.connectors.gmail?.imported ?? 0} · last {time(data?.connectors.gmail?.lastScrapeAt)}</p>
            </Shell>
            <Shell className="rounded-[2rem] p-5">
              <div className="flex items-center justify-between gap-3"><div><p className="section-kicker">Local model + tools</p><h2 className="mt-2 text-xl font-semibold">AI runner</h2></div><Badge tone={data?.connectors.localModels?.length ? "emerald" : "amber"}>{data?.connectors.localModels?.[0]?.status || "needed"}</Badge></div>
              <p className="mt-3 text-sm leading-6 text-white/50">Ollama/llama.cpp model setup commands plus automation tools for draft-only mail actions.</p>
              <div className="mt-4 grid gap-2"><button onClick={() => connect("local-model", { provider: "ollama", model: "llama3.2:3b", purpose: "watchers" })} className="rounded-2xl bg-white px-4 py-3 font-semibold text-black">Setup Ollama model</button><button onClick={() => connect("model-downloaded", { model: data?.connectors.localModels?.[0]?.model || "local-rule-engine" })} className="rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-3 font-semibold text-white">Mark model ready</button></div>
              <p className="mt-3 break-all text-xs text-white/42">{data?.connectors.localModels?.[0]?.installCommand || "No local model selected."}</p>
            </Shell>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Shell className="rounded-[2rem] p-5"><h2 className="text-xl font-semibold">Aliases</h2><div className="mt-4 space-y-3">{data?.aliases.slice(0, 6).map((alias) => <div key={alias.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="break-all font-semibold text-emerald-100">{alias.address}</p><p className="mt-1 text-xs text-white/42">{alias.label} → {alias.destination}</p></div>)}{!data?.aliases.length && <p className="text-sm text-white/42">No aliases yet.</p>}</div></Shell>
            <Shell className="rounded-[2rem] p-5"><h2 className="text-xl font-semibold">Watchers</h2><div className="mt-4 space-y-3">{data?.watchers.slice(0, 6).map((watcher) => <div key={watcher.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="flex justify-between gap-3"><p className="font-semibold">{watcher.name}</p><Badge tone={watcher.humanApprovalRequired ? "amber" : "emerald"}>{watcher.humanApprovalRequired ? "gated" : "auto"}</Badge></div><p className="mt-2 text-sm leading-6 text-white/50">{watcher.rule}</p></div>)}</div></Shell>
            <Shell className="rounded-[2rem] p-5"><h2 className="text-xl font-semibold">Node log</h2><div className="mt-4 space-y-3">{data?.events.slice(0, 7).map((event) => <div key={event.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3"><p className="text-sm text-white/68">{event.message}</p><p className="mt-1 text-[11px] text-white/32">{time(event.at)}</p></div>)}</div></Shell>
          </div>
        </section>
      </div>
    </main>
  );
}
