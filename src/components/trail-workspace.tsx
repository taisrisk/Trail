"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge, GlassCard } from "@/components/ui/primitives";

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
const views = [
  { id: "classic", label: "Classic inbox" },
  { id: "messages", label: "Message view" },
  { id: "knowledge", label: "Knowledge base" },
  { id: "timeline", label: "Timeline" },
] as const;

type ViewId = (typeof views)[number]["id"];

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) }, cache: "no-store" });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `Request failed: ${response.status}`);
  return payload as T;
}

function time(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function toneForImportance(importance: Mail["importance"]) {
  if (importance === "high") return "amber";
  if (importance === "low") return "slate";
  return "cyan";
}

function initials(email: string) {
  return email.split("@")[0].slice(0, 2).toUpperCase();
}

function Empty({ label }: { label: string }) {
  return <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-8 text-center text-sm text-slate-400">{label}</div>;
}

export function TrailWorkspace({ initialData = null }: { initialData?: Platform | null }) {
  const [data, setData] = useState<Platform | null>(initialData);
  const [view, setView] = useState<ViewId>("classic");
  const [folder, setFolder] = useState("inbox");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh(seed = false) {
    setError("");
    if (seed) await json("/api/platform", { method: "POST", body: JSON.stringify({ action: "seed-platform" }) });
    const url = query.trim() ? `/api/platform?q=${encodeURIComponent(query.trim())}` : "/api/platform";
    const next = await json<Platform>(url);
    setData(next);
    setSelectedId((current) => current || next.mail[0]?.id || "");
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refresh(true).catch((err) => setError(err instanceof Error ? err.message : String(err)));
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const mail = data?.mail || [];
    const q = query.toLowerCase().trim();
    return mail.filter((item) => {
      const folderMatch = folder === "inbox" ? item.folder === "inbox" || item.status === "inbox" || item.status === "flagged" : item.folder === folder;
      const queryMatch = !q || [item.from, item.to, item.subject, item.body, item.tags.join(" ")].join(" ").toLowerCase().includes(q);
      return folderMatch && queryMatch;
    });
  }, [data, folder, query]);

  const selected = filtered.find((item) => item.id === selectedId) || filtered[0] || data?.mail[0];
  const thread = selected ? (data?.mail || []).filter((mail) => mail.threadId === selected.threadId).sort((a, b) => a.receivedAt.localeCompare(b.receivedAt)) : [];
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
            subject: "Website reply and invoice deadline",
            body: "Can you send the updated landing page today? Also the invoice deadline is Friday, so Trail should flag this and keep it in the timeline.",
            tags: ["client", "deadline", "finance"],
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

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-4 text-white md:px-6">
      <div className="orb left-20 top-20 h-56 w-56 bg-cyan-400/15" />
      <div className="orb right-16 top-28 h-72 w-72 bg-violet-400/15 [animation-delay:1.3s]" />
      <div className="mx-auto grid max-w-[95rem] gap-4 lg:grid-cols-[17rem_minmax(0,1fr)_23rem]">
        <aside className="rounded-[2rem] border border-white/10 bg-slate-950/62 p-4 shadow-2xl shadow-black/30 backdrop-blur-2xl">
          <Link href="/" className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-200 font-black text-slate-950">T</div>
            <div><p className="font-semibold">Trail</p><p className="text-xs text-slate-400">Private email OS</p></div>
          </Link>

          <div className="space-y-2">
            {folders.map((item) => (
              <button key={item} onClick={() => setFolder(item)} className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition ${folder === item ? "bg-cyan-200 text-slate-950" : "text-slate-300 hover:bg-white/10"}`}>
                <span className="capitalize">{item}</span><span>{item === "inbox" ? data?.unread || 0 : data?.folders?.[item] || 0}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="mb-3 text-xs uppercase tracking-[0.28em] text-slate-500">Workspace</p>
            {views.map((item) => (
              <button key={item.id} onClick={() => setView(item.id)} className={`mb-2 block w-full rounded-2xl px-4 py-3 text-left text-sm ${view === item.id ? "bg-white/12 text-white" : "text-slate-400 hover:bg-white/8"}`}>{item.label}</button>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Domain</p>
            <p className="mt-2 break-all font-semibold">{domain}</p>
            <p className="mt-1 text-xs text-slate-500">{data?.status.runState || "loading"} · {data?.status.domain?.mode || "quick-domain"}</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs text-slate-400">
            <Link className="rounded-2xl border border-white/10 py-3 hover:bg-white/10" href="/dashboard">Control</Link>
            <Link className="rounded-2xl border border-white/10 py-3 hover:bg-white/10" href="/pass">Pass</Link>
            <Link className="rounded-2xl border border-white/10 py-3 hover:bg-white/10" href="/install">Install</Link>
            <Link className="rounded-2xl border border-white/10 py-3 hover:bg-white/10" href="/ecosystem">Map</Link>
          </div>
        </aside>

        <section className="min-w-0 rounded-[2rem] border border-white/10 bg-slate-950/50 p-4 backdrop-blur-2xl md:p-5">
          <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">Mail command center</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">Inbox, messages, memory, timeline.</h1>
            </div>
            <div className="flex min-w-0 flex-1 gap-2 xl:max-w-xl">
              <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void refresh(); }} placeholder="Search mail, people, tags, actions..." className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-cyan-300/50" />
              <button onClick={() => void refresh()} className="rounded-2xl border border-white/10 px-4 py-3 text-sm hover:bg-white/10">Search</button>
              <button onClick={addDemoMail} disabled={busy} className="rounded-2xl bg-cyan-200 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60">Add demo</button>
            </div>
          </div>

          {error && <div className="mb-4 rounded-2xl border border-red-300/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</div>}

          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <GlassCard className="p-4"><p className="text-2xl font-semibold">{data?.status.counts.mail ?? "—"}</p><p className="text-xs text-slate-400">local messages</p></GlassCard>
            <GlassCard className="p-4"><p className="text-2xl font-semibold">{data?.priority ?? "—"}</p><p className="text-xs text-slate-400">priority items</p></GlassCard>
            <GlassCard className="p-4"><p className="text-2xl font-semibold">{data?.contacts.length ?? "—"}</p><p className="text-xs text-slate-400">knowledge contacts</p></GlassCard>
            <GlassCard className="p-4"><p className="text-2xl font-semibold">{data?.actions.filter((a) => a.status === "queued").length ?? "—"}</p><p className="text-xs text-slate-400">queued actions</p></GlassCard>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {views.map((item) => <button key={item.id} onClick={() => setView(item.id)} className={`rounded-full px-4 py-2 text-sm ${view === item.id ? "bg-white text-slate-950" : "border border-white/10 text-slate-300"}`}>{item.label}</button>)}
          </div>

          {view === "classic" && (
            <div className="grid min-h-[38rem] gap-4 xl:grid-cols-[24rem_minmax(0,1fr)]">
              <div className="space-y-3 overflow-auto pr-1">
                {filtered.length ? filtered.map((mail) => (
                  <button key={mail.id} onClick={() => setSelectedId(mail.id)} className={`block w-full rounded-3xl border p-4 text-left transition ${selected?.id === mail.id ? "border-cyan-300/45 bg-cyan-300/10" : "border-white/10 bg-white/[0.035] hover:bg-white/[0.07]"}`}>
                    <div className="flex items-center justify-between gap-3"><p className="font-semibold">{mail.subject}</p><Badge tone={toneForImportance(mail.importance)}>{mail.folder}</Badge></div>
                    <p className="mt-1 text-xs text-slate-400">{mail.from} · {time(mail.receivedAt)}</p>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">{mail.bodyPreview}</p>
                  </button>
                )) : <Empty label="No messages in this folder yet." />}
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
                {selected ? <>
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
                    <div><h2 className="text-2xl font-semibold">{selected.subject}</h2><p className="mt-2 text-sm text-slate-400">{selected.from} → {selected.to}</p></div>
                    <div className="flex gap-2"><Badge tone={selected.unread ? "cyan" : "slate"}>{selected.unread ? "unread" : "read"}</Badge><Badge tone={toneForImportance(selected.importance)}>{selected.importance}</Badge></div>
                  </div>
                  <article className="prose prose-invert mt-6 max-w-none whitespace-pre-wrap text-base leading-8 text-slate-200">{selected.body || selected.bodyPreview}</article>
                  <div className="mt-8 flex flex-wrap gap-2">{selected.tags.map((tag) => <Badge key={tag} tone="slate">#{tag}</Badge>)}</div>
                </> : <Empty label="Select an email to read." />}
              </div>
            </div>
          )}

          {view === "messages" && (
            <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-black/20 p-5">
              {thread.length ? thread.map((mail) => (
                <div key={mail.id} className="mb-5 flex gap-3">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-200 text-sm font-black text-slate-950">{initials(mail.from)}</div>
                  <div className="max-w-[85%] rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-400"><span className="font-semibold text-white">{mail.from}</span><span>{time(mail.receivedAt)}</span></div>
                    <p className="whitespace-pre-wrap leading-7 text-slate-200">{mail.body || mail.bodyPreview}</p>
                  </div>
                </div>
              )) : <Empty label="Select a conversation to see message mode." />}
            </div>
          )}

          {view === "knowledge" && (
            <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
              <GlassCard className="p-5"><h2 className="text-xl font-semibold">People + companies</h2><div className="mt-4 space-y-3">{(data?.contacts || []).map((contact) => <div key={contact.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="font-semibold">{contact.name}</p><p className="text-sm text-slate-400">{contact.email} · {contact.messageCount} messages</p><div className="mt-2 flex flex-wrap gap-2">{contact.tags.map((tag) => <Badge key={tag} tone="slate">{tag}</Badge>)}</div></div>)}</div></GlassCard>
              <GlassCard className="p-5"><h2 className="text-xl font-semibold">Knowledge graph</h2><div className="mt-5 grid min-h-[28rem] place-items-center rounded-3xl border border-cyan-300/10 bg-[radial-gradient(circle_at_center,rgba(34,211,238,.16),transparent_55%)] p-5"><div className="relative h-80 w-80 rounded-full border border-cyan-200/20">{(data?.graph.nodes || []).slice(0, 18).map((node, index) => { const angle = (index / Math.max(1, Math.min(18, data?.graph.nodes.length || 1))) * Math.PI * 2; const radius = 120 - (index % 3) * 28; return <div key={node.id} className="absolute max-w-28 rounded-full border border-white/10 bg-slate-950/80 px-3 py-2 text-center text-[11px] shadow-lg" style={{ left: 150 + Math.cos(angle) * radius, top: 150 + Math.sin(angle) * radius, transform: "translate(-50%, -50%)" }}><span className="block truncate text-cyan-100">{node.label}</span><span className="text-slate-500">{node.type}</span></div>; })}<div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-cyan-200 text-center text-sm font-bold text-slate-950">Trail<br />Memory</div></div><p className="mt-4 text-xs text-slate-400">{data?.graph.nodes.length || 0} nodes · {data?.graph.edges.length || 0} links</p></div></GlassCard>
            </div>
          )}

          {view === "timeline" && (
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-semibold">Inbox timeline</h2><Badge tone="violet">mail → watcher → action</Badge></div>
              <div className="space-y-4">{(data?.mail || []).slice(0, 14).map((mail, index) => <div key={mail.id} className="grid gap-3 md:grid-cols-[8rem_1fr]"><p className="text-sm text-slate-500">{time(mail.receivedAt)}</p><div className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-4"><div className="absolute -left-[1.05rem] top-5 h-3 w-3 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(103,232,249,.8)]" /><p className="font-semibold">{mail.subject}</p><p className="mt-1 text-sm text-slate-400">{mail.from} · {mail.folder}</p><div className="mt-3 flex flex-wrap gap-2">{mail.tags.map((tag) => <Badge key={tag} tone="slate">{tag}</Badge>)}{index === 0 && <Badge tone="amber">latest</Badge>}</div></div></div>)}</div>
            </div>
          )}
        </section>

        <aside className="rounded-[2rem] border border-white/10 bg-slate-950/62 p-4 backdrop-blur-2xl">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-semibold">Action queue</h2><Badge tone="amber">human gate</Badge></div>
          <div className="space-y-3">{(data?.actions || []).slice(0, 8).map((action) => <div key={action.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"><div className="flex items-start justify-between gap-2"><p className="font-semibold">{action.title}</p><Badge tone={action.status === "queued" ? "amber" : "emerald"}>{action.status}</Badge></div><p className="mt-2 text-sm leading-6 text-slate-400">{action.detail}</p>{action.status === "queued" && <button onClick={() => void resolveAction(action)} className="mt-3 rounded-2xl bg-violet-200 px-4 py-2 text-sm font-semibold text-slate-950">Mark done</button>}</div>)}{!data?.actions.length && <Empty label="Watcher actions will appear here." />}</div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <h3 className="font-semibold">Drafts</h3>
            <div className="mt-3 space-y-3">{(data?.drafts || []).slice(0, 5).map((draft) => <div key={draft.id} className="rounded-2xl border border-white/10 bg-black/20 p-3"><p className="text-sm font-semibold">{draft.subject}</p><p className="text-xs text-slate-400">to {draft.to} · {draft.status}</p></div>)}</div>
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <h3 className="font-semibold">Watchers</h3>
            <div className="mt-3 space-y-3">{(data?.watchers || []).slice(0, 4).map((watcher) => <div key={watcher.id} className="rounded-2xl border border-white/10 bg-black/20 p-3"><p className="text-sm font-semibold">{watcher.name}</p><p className="mt-1 line-clamp-2 text-xs text-slate-400">{watcher.rule}</p></div>)}</div>
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <h3 className="font-semibold">Recent events</h3>
            <div className="mt-3 space-y-3">{(data?.events || []).slice(0, 5).map((event) => <p key={event.id} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-slate-300">{event.message}</p>)}</div>
          </div>
        </aside>
      </div>
    </main>
  );
}
