"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/primitives";

type Mail = {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  bodyPreview: string;
  tags: string[];
  status: string;
  folder: string;
  unread: boolean;
  starred: boolean;
  importance: "low" | "normal" | "high";
  watcherMatches: string[];
  receivedAt: string;
};

type Contact = { id: string; email: string; name: string; company?: string; lastSeenAt: string; messageCount: number; tags: string[] };
type Action = { id: string; type: string; status: string; title: string; detail: string; mailId?: string; createdAt: string };
type Draft = { id: string; to: string; subject: string; body: string; status: string; sourceMailId?: string; createdAt: string };
type GraphNode = { id: string; type: string; label: string; weight: number };
type GraphEdge = { id: string; source: string; target: string; label: string; weight: number };

type Platform = {
  status: { runState: string; home: string; counts: Record<string, number>; domain?: { domain: string; mode: string } };
  folders: Record<string, number>;
  unread: number;
  priority: number;
  connectors: { domainHost?: { status: string; provider: string }; receiver?: { status: string; mode: string }; gmail?: { syncState: string; imported: number }; localModels: { model: string; status: string }[]; tools: { name: string; status: string }[] };
  aliases: { id: string; address: string; label: string }[];
  watchers: { id: string; name: string; rule: string; actions: string[] }[];
  mail: Mail[];
  drafts: Draft[];
  contacts: Contact[];
  actions: Action[];
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  events: { id: string; message: string; at: string }[];
};

const folders = ["inbox", "priority", "orders", "finance", "archive"];
const views = ["inbox", "thread", "knowledge", "timeline"] as const;
type ViewId = (typeof views)[number];

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) }, cache: "no-store" });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `Request failed: ${response.status}`);
  return payload as T;
}

function time(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function initials(value: string) {
  return value.split("@")[0].replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase() || "T";
}

function Shell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`border border-white/10 bg-[#08100d]/70 shadow-[0_30px_90px_rgba(0,0,0,.42)] backdrop-blur-2xl ${className}`}>{children}</div>;
}

function Empty({ title, body }: { title: string; body: string }) {
  return <div className="rounded-[1.5rem] border border-dashed border-white/14 bg-white/[0.025] p-8 text-center"><p className="font-semibold text-white/78">{title}</p><p className="mt-2 text-sm text-white/42">{body}</p></div>;
}

function toneFor(mail: Mail) {
  if (mail.importance === "high" || mail.folder === "priority") return "amber";
  if (mail.folder === "orders") return "violet";
  if (mail.folder === "finance") return "emerald";
  return "cyan";
}

export function TrailWorkspace({ initialData = null }: { initialData?: Platform | null }) {
  const [data, setData] = useState<Platform | null>(initialData);
  const [view, setView] = useState<ViewId>("inbox");
  const [folder, setFolder] = useState("inbox");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(initialData?.mail[0]?.id || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeSending, setComposeSending] = useState(false);


  async function refresh(seed = false) {
    setError("");
    if (seed) await json("/api/platform", { method: "POST", body: JSON.stringify({ action: "seed-platform" }) });
    const url = query.trim() ? `/api/platform?q=${encodeURIComponent(query.trim())}` : "/api/platform";
    const next = await json<Platform>(url);
    setData(next);
    setSelectedId((current) => current || next.mail[0]?.id || "");
  }

  useEffect(() => {
    const timer = window.setTimeout(() => refresh(false).catch((err) => setError(err instanceof Error ? err.message : String(err))), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setComposeSending(true);
    try {
      const response = await fetch("/api/node/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: composeTo, subject: composeSubject, body: composeBody }),
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Failed to send");

      alert("Mail sent successfully!");
      setComposeOpen(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      refresh(false);
    } catch(err) {
      alert("Error sending mail: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setComposeSending(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return (data?.mail || []).filter((mail) => {
      const folderMatch = folder === "inbox" ? ["inbox", "priority", "orders", "finance"].includes(mail.folder) || mail.status === "flagged" : mail.folder === folder;
      const queryMatch = !q || [mail.from, mail.to, mail.subject, mail.body, mail.tags.join(" ")].join(" ").toLowerCase().includes(q);
      return folderMatch && queryMatch;
    });
  }, [data, folder, query]);

  const selected = filtered.find((mail) => mail.id === selectedId) || filtered[0] || data?.mail[0];
  const thread = selected ? (data?.mail || []).filter((mail) => mail.threadId === selected.threadId).sort((a, b) => a.receivedAt.localeCompare(b.receivedAt)) : [];
  const openActions = data?.actions.filter((action) => action.status === "queued") || [];
  const domain = data?.status.domain?.domain || "yourdomain.com";

  async function addDemoMail() {
    setBusy(true);
    try {
      await json("/api/platform", {
        method: "POST",
        body: JSON.stringify({
          action: "create-mail",
          payload: {
            from: "client@zrorisc.example",
            to: data?.aliases[0]?.address || `inbox@${domain}`,
            subject: "Website reply, invoice, and delivery deadline",
            body: "Can you send the updated landing page today? Also the invoice deadline is Friday and the package changed delivery times again. Trail should flag this and keep it in the timeline.",
            tags: ["client", "deadline", "finance", "orders"],
          },
        }),
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function resolveAction(action: Action, status = "done") {
    await json("/api/platform", { method: "POST", body: JSON.stringify({ action: "resolve-action", payload: { id: action.id, status } }) });
    await refresh();
  }

  async function updateSelected(payload: Partial<Pick<Mail, "folder" | "unread" | "starred"> & { status: string }>) {
    if (!selected) return;
    await json("/api/platform", { method: "POST", body: JSON.stringify({ action: "update-mail", payload: { id: selected.id, ...payload } }) });
    await refresh();
  }

  return (
    <>
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={handleSend} className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#08100d] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">New Message</h2>
              <button type="button" onClick={() => setComposeOpen(false)} className="text-white/40 hover:text-white"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="grid gap-4">
              <input required disabled={composeSending} value={composeTo} onChange={e => setComposeTo(e.target.value)} type="email" placeholder="To:" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50" />
              <input required disabled={composeSending} value={composeSubject} onChange={e => setComposeSubject(e.target.value)} type="text" placeholder="Subject:" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50" />
              <textarea required disabled={composeSending} value={composeBody} onChange={e => setComposeBody(e.target.value)} rows={8} placeholder="Message body..." className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50"></textarea>
              <button disabled={composeSending} type="submit" className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-50">
                {composeSending ? "Sending..." : "Send via Outbound SMTP"}
              </button>
            </div>
          </form>
        </div>
      )}

    <main className="natural-page relative min-h-screen overflow-hidden px-4 py-5 text-white md:px-7">
      <div className="forest-depth" />
      <div className="ambient-fog" />
      <div className="forest-tree forest-tree-left" />
      <div className="forest-tree forest-tree-right" />

      <div className="mx-auto grid max-w-[100rem] gap-4 2xl:grid-cols-[17rem_minmax(0,1fr)_22rem]">
        <aside className="single-slab rounded-[2rem] p-4 2xl:sticky 2xl:top-5 2xl:h-[calc(100vh-2.5rem)] 2xl:overflow-auto">
          <Link href="/" className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.05] p-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-lg font-black text-[#10120f]">T</div>
            <div><p className="font-semibold">Trail Mail</p><p className="text-xs text-white/42">Phase 1 workspace</p></div>
          </Link>

          <div className="mt-5 rounded-3xl border border-emerald-200/14 bg-emerald-200/[0.06] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-100/70">Local domain</p>
            <p className="mt-2 break-all text-lg font-semibold">{domain}</p>
            <p className="mt-1 text-xs text-white/40">{data?.status.runState || "loading"} · {data?.status.domain?.mode || "quick-domain"}</p>
          </div>


            <button onClick={() => setComposeOpen(true)} className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/30">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Compose
            </button>

<div className="mt-5 space-y-2">
            {folders.map((item) => (
              <button key={item} onClick={() => setFolder(item)} className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${folder === item ? "border-white/25 bg-white text-black" : "border-white/8 bg-white/[0.035] text-white/70 hover:bg-white/[0.08]"}`}>
                <span className="capitalize">{item}</span><span className="font-semibold">{item === "inbox" ? data?.unread || 0 : data?.folders?.[item] || 0}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 text-center text-xs text-white/50">
            <Link className="rounded-2xl border border-white/10 py-3 hover:bg-white/10" href="/dashboard">Control</Link>
            <Link className="rounded-2xl border border-white/10 py-3 hover:bg-white/10" href="/pass">Pass</Link>
            <Link className="rounded-2xl border border-white/10 py-3 hover:bg-white/10" href="/install">Install</Link>
            <Link className="rounded-2xl border border-white/10 py-3 hover:bg-white/10" href="/ecosystem">Map</Link>
          </div>
        </aside>

        <section className="min-w-0 space-y-4">
          <Shell className="overflow-hidden rounded-[2.25rem]">
            <div className="grid gap-6 p-5 md:p-7 xl:grid-cols-[minmax(0,1fr)_24rem]">
              <div>
                <p className="section-kicker">Mail OS · redesigned</p>
                <h1 className="mt-3 max-w-4xl text-5xl font-semibold leading-[0.9] tracking-[-0.075em] md:text-7xl">Inbox that turns mail into memory and action.</h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/62">Classic email, chat-style threads, local knowledge base, and timeline now sit in one workspace instead of the old split dashboard panels.</p>
              </div>
              <div className="rounded-[1.7rem] border border-white/10 bg-black/25 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-3xl font-semibold">{data?.status.counts.mail ?? "—"}</p><p className="text-xs uppercase tracking-[0.18em] text-white/35">mail</p></div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-3xl font-semibold">{data?.priority ?? "—"}</p><p className="text-xs uppercase tracking-[0.18em] text-white/35">priority</p></div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-3xl font-semibold">{data?.contacts.length ?? "—"}</p><p className="text-xs uppercase tracking-[0.18em] text-white/35">people</p></div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-3xl font-semibold">{openActions.length}</p><p className="text-xs uppercase tracking-[0.18em] text-white/35">queued</p></div>
                </div>
              </div>
            </div>
          </Shell>

          <Shell className="rounded-[2rem] p-4 md:p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-2">{views.map((item) => <button key={item} onClick={() => setView(item)} className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${view === item ? "bg-white text-black" : "border border-white/10 bg-white/[0.03] text-white/62 hover:bg-white/[0.08]"}`}>{item === "thread" ? "message view" : item}</button>)}</div>
              <div className="flex min-w-0 gap-2 xl:w-[36rem]"><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void refresh(); }} placeholder="Search mail, people, tags, actions..." className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-emerald-200/45" /><button onClick={() => void refresh()} className="rounded-2xl border border-white/10 px-4 py-3 text-sm hover:bg-white/10">Search</button><button onClick={addDemoMail} disabled={busy} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-50">Add</button></div>
            </div>
            {error && <div className="mt-4 rounded-2xl border border-red-300/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</div>}
          </Shell>

          {view === "inbox" && (
            <div className="grid gap-4 xl:grid-cols-[25rem_minmax(0,1fr)]">
              <Shell className="max-h-[46rem] overflow-auto rounded-[2rem] p-3">
                <div className="space-y-2">{filtered.length ? filtered.map((mail) => <button key={mail.id} onClick={() => setSelectedId(mail.id)} className={`block w-full rounded-[1.45rem] border p-4 text-left transition ${selected?.id === mail.id ? "border-emerald-100/45 bg-emerald-100/[0.08]" : "border-white/10 bg-white/[0.035] hover:bg-white/[0.075]"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold leading-tight">{mail.subject}</p><p className="mt-1 text-xs text-white/38">{mail.from} · {time(mail.receivedAt)}</p></div><Badge tone={toneFor(mail)}>{mail.folder}</Badge></div><p className="mt-3 line-clamp-2 text-sm leading-6 text-white/55">{mail.bodyPreview}</p><div className="mt-3 flex flex-wrap gap-1.5">{mail.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-white/[0.06] px-2 py-1 text-[10px] text-white/45">#{tag}</span>)}</div></button>) : <Empty title="No mail here" body="Change folders, search less, or wait for inbound messages." />}</div>
              </Shell>
              <Shell className="rounded-[2rem] p-5 md:p-6">
                {selected ? <><div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5"><div><div className="mb-3 flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-sm font-black text-black">{initials(selected.from)}</div><div><p className="font-semibold">{selected.from}</p><p className="text-xs text-white/40">to {selected.to}</p></div></div><h2 className="text-3xl font-semibold tracking-[-0.055em]">{selected.subject}</h2></div><div className="flex flex-wrap gap-2"><Badge tone={selected.unread ? "cyan" : "slate"}>{selected.unread ? "unread" : "read"}</Badge><Badge tone={toneFor(selected)}>{selected.importance}</Badge></div></div><article className="mt-6 whitespace-pre-wrap text-base leading-8 text-white/72">{selected.body || selected.bodyPreview}</article><div className="mt-7 flex flex-wrap gap-2">{selected.tags.map((tag) => <Badge key={tag} tone="slate">#{tag}</Badge>)}</div><div className="mt-7 flex flex-wrap gap-2"><button onClick={() => void updateSelected({ unread: false })} className="rounded-2xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10">Mark read</button><button onClick={() => void updateSelected({ folder: "priority", status: "flagged" })} className="rounded-2xl border border-amber-200/20 bg-amber-200/10 px-4 py-2 text-sm text-amber-100">Flag priority</button><button onClick={() => void updateSelected({ folder: "archive", status: "archived" })} className="rounded-2xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10">Archive</button></div></> : <Empty title="Select a message" body="The full local-vault message will show here." />}
              </Shell>
            </div>
          )}

          {view === "thread" && (
            <Shell className="rounded-[2rem] p-5 md:p-7">
              <div className="mx-auto max-w-4xl space-y-5">{thread.length ? thread.map((mail) => <div key={mail.id} className="flex gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-sm font-black text-black">{initials(mail.from)}</div><div className="rounded-[1.6rem] border border-white/10 bg-white/[0.055] p-4"><div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-white/38"><span className="font-semibold text-white/82">{mail.from}</span><span>{time(mail.receivedAt)}</span></div><p className="whitespace-pre-wrap leading-7 text-white/68">{mail.body || mail.bodyPreview}</p></div></div>) : <Empty title="No thread selected" body="Choose a message from the inbox view first." />}</div>
            </Shell>
          )}

          {view === "knowledge" && (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
              <Shell className="rounded-[2rem] p-5"><h2 className="text-2xl font-semibold tracking-[-0.05em]">People and companies</h2><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-1">{(data?.contacts || []).map((contact) => <div key={contact.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-xs font-black text-black">{initials(contact.email)}</div><div><p className="font-semibold">{contact.name}</p><p className="text-xs text-white/40">{contact.email} · {contact.messageCount} messages</p></div></div><div className="mt-3 flex flex-wrap gap-1.5">{contact.tags.slice(0, 4).map((tag) => <span key={tag} className="rounded-full bg-white/[0.06] px-2 py-1 text-[10px] text-white/45">{tag}</span>)}</div></div>)}</div></Shell>
              <Shell className="rounded-[2rem] p-5"><div className="flex items-center justify-between"><h2 className="text-2xl font-semibold tracking-[-0.05em]">Entity graph</h2><Badge tone="emerald">{data?.graph.nodes.length || 0} nodes</Badge></div><div className="mt-5 grid min-h-[32rem] place-items-center rounded-[1.7rem] border border-emerald-200/10 bg-[radial-gradient(circle_at_center,rgba(208,255,222,.14),transparent_58%)] p-5"><div className="relative h-80 w-80 rounded-full border border-white/10">{(data?.graph.nodes || []).slice(0, 20).map((node, index) => { const angle = (index / Math.max(1, Math.min(20, data?.graph.nodes.length || 1))) * Math.PI * 2; const radius = 128 - (index % 4) * 24; return <div key={node.id} className="absolute max-w-28 rounded-full border border-white/10 bg-[#08100d]/90 px-3 py-2 text-center text-[11px] shadow-lg" style={{ left: 160 + Math.cos(angle) * radius, top: 160 + Math.sin(angle) * radius, transform: "translate(-50%, -50%)" }}><span className="block truncate text-emerald-100">{node.label}</span><span className="text-white/32">{node.type}</span></div>; })}<div className="absolute left-1/2 top-1/2 grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-center text-sm font-black text-black">Trail<br />Memory</div></div><p className="mt-4 text-xs text-white/38">{data?.graph.edges.length || 0} links from local mail evidence</p></div></Shell>
            </div>
          )}

          {view === "timeline" && (
            <Shell className="rounded-[2rem] p-5 md:p-6"><div className="mb-6 flex items-center justify-between"><div><p className="section-kicker">Chronology</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">Mail → watcher → action</h2></div><Badge tone="violet">local history</Badge></div><div className="space-y-4">{(data?.mail || []).slice(0, 16).map((mail, index) => <div key={mail.id} className="grid gap-3 md:grid-cols-[9rem_1fr]"><p className="text-sm text-white/38">{time(mail.receivedAt)}</p><div className="relative rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4"><div className="absolute -left-[1.05rem] top-5 h-3 w-3 rounded-full bg-emerald-100 shadow-[0_0_18px_rgba(210,255,220,.8)]" /><p className="font-semibold">{mail.subject}</p><p className="mt-1 text-sm text-white/42">{mail.from} · {mail.folder}</p><div className="mt-3 flex flex-wrap gap-2">{mail.tags.map((tag) => <Badge key={tag} tone="slate">{tag}</Badge>)}{index === 0 && <Badge tone="amber">latest</Badge>}</div></div></div>)}</div></Shell>
          )}
        </section>

        <aside className="space-y-4 2xl:sticky 2xl:top-5 2xl:h-[calc(100vh-2.5rem)] 2xl:overflow-auto">
          <Shell className="rounded-[2rem] p-5"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Action queue</h2><Badge tone="amber">human gate</Badge></div><div className="mt-4 space-y-3">{openActions.slice(0, 7).map((action) => <div key={action.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="font-semibold">{action.title}</p><p className="mt-2 text-sm leading-6 text-white/45">{action.detail}</p><button onClick={() => void resolveAction(action)} className="mt-3 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black">Mark done</button></div>)}{!openActions.length && <Empty title="Queue clear" body="Watcher actions that need approval appear here." />}</div></Shell>
          <Shell className="rounded-[2rem] p-5"><h3 className="font-semibold">Drafts</h3><div className="mt-3 space-y-3">{(data?.drafts || []).slice(0, 5).map((draft) => <div key={draft.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"><p className="text-sm font-semibold">{draft.subject}</p><p className="text-xs text-white/40">to {draft.to} · {draft.status}</p></div>)}</div></Shell>
          <Shell className="rounded-[2rem] p-5"><h3 className="font-semibold">Watchers</h3><div className="mt-3 space-y-3">{(data?.watchers || []).slice(0, 5).map((watcher) => <div key={watcher.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"><p className="text-sm font-semibold">{watcher.name}</p><p className="mt-1 line-clamp-2 text-xs text-white/42">{watcher.rule}</p></div>)}</div></Shell>
          <Shell className="rounded-[2rem] p-5"><h3 className="font-semibold">Connectors</h3><div className="mt-3 grid gap-2 text-xs text-white/50"><p className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">Domain hoster: {data?.connectors.domainHost?.provider || "not wired"} · {data?.connectors.domainHost?.status || "needed"}</p><p className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">Receiver: {data?.connectors.receiver?.mode || "not wired"} · {data?.connectors.receiver?.status || "needed"}</p><p className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">Gmail scrape: {data?.connectors.gmail?.syncState || "needed"} · {data?.connectors.gmail?.imported || 0} imports</p><p className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">Model: {data?.connectors.localModels?.[0]?.model || "not selected"} · {data?.connectors.localModels?.[0]?.status || "needed"}</p></div></Shell>
          <Shell className="rounded-[2rem] p-5"><h3 className="font-semibold">Recent events</h3><div className="mt-3 space-y-3">{(data?.events || []).slice(0, 5).map((event) => <p key={event.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs leading-5 text-white/48">{event.message}</p>)}</div></Shell>
        </aside>
      </div>
    </main>
    </>
  );
}
