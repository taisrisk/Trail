"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge, GlassCard } from "@/components/ui/primitives";

type Status = {
  product: string;
  domain: string;
  syncDomain: string;
  vaultId: string;
  home: string;
  vaultState: string;
  counts: { items: number; devices: number; events: number; byKind: Record<string, number> };
  security: { plaintextSecretsReturned: boolean; encryptedAtRest: boolean; keyScope: string; passkeyCompatible: string };
  updatedAt: string;
};

type SafeItem = {
  id: string;
  kind: string;
  title: string;
  username?: string;
  origin?: string;
  tags: string[];
  favorite: boolean;
  encryption: { alg: string; keyScope: string };
  createdAt: string;
  updatedAt: string;
};

type Device = { id: string; name: string; kind: string; trusted: boolean; createdAt: string; lastSeenAt: string };

const kinds = ["login", "passkey", "secure-note", "card", "identity", "recovery-code", "api-secret", "ssh-key"];

export function PassDashboard({
  initialStatus = null,
  initialItems = [],
  initialDevices = [],
}: {
  initialStatus?: Status | null;
  initialItems?: SafeItem[];
  initialDevices?: Device[];
}) {
  const [status, setStatus] = useState<Status | null>(initialStatus);
  const [items, setItems] = useState<SafeItem[]>(initialItems);
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ kind: "login", title: "", username: "", origin: "", tags: "" });

  async function refresh() {
    const [statusRes, itemsRes, devicesRes] = await Promise.all([
      fetch("/api/pass/status", { cache: "no-store" }),
      fetch("/api/pass/items", { cache: "no-store" }),
      fetch("/api/pass/devices", { cache: "no-store" }),
    ]);
    setStatus(await statusRes.json());
    setItems((await itemsRes.json()).items || []);
    setDevices((await devicesRes.json()).devices || []);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const byKind = useMemo(() => Object.entries(status?.counts.byKind || {}), [status]);

async function addItem() {
    setBusy(true);
    try {
      await fetch("/api/pass/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        }),
      });
      setForm({ kind: "login", title: "", username: "", origin: "", tags: "" });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function generate() {
    const res = await fetch("/api/pass/generate?length=28", { cache: "no-store" });
    setPassword((await res.json()).password || "");
  }

  return (
    <section className="mx-auto max-w-7xl py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-violet-200/80">Live vault</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">pass.erme.onl is the password manager.</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">This is now wired to local Erme Pass storage and APIs. API responses return redacted metadata only — not decrypted passwords.</p>
        </div>

      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <GlassCard className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Status</p>
              <h3 className="mt-1 text-2xl font-semibold text-white">{status?.vaultState || "loading"}</h3>
            </div>
            <Badge tone="violet">{status?.domain || "pass.erme.onl"}</Badge>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-2xl font-semibold text-white">{status?.counts.items ?? "—"}</p><p className="text-xs text-slate-400">vault items</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-2xl font-semibold text-white">{status?.counts.devices ?? "—"}</p><p className="text-xs text-slate-400">devices</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-2xl font-semibold text-white">0</p><p className="text-xs text-slate-400">plaintext leaks</p></div>
          </div>
          <p className="mt-5 text-xs leading-6 text-slate-400">Vault home: <span className="text-slate-200">{status?.home || "loading"}</span></p>
          <p className="mt-2 text-xs leading-6 text-slate-400">{status?.security.keyScope}</p>
        </GlassCard>

        <GlassCard className="p-5 lg:col-span-2">
          <p className="text-sm text-slate-400">Password generator</p>
          <h3 className="mt-1 text-2xl font-semibold text-white">Generate, copy, then encrypt/save</h3>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input value={password} readOnly placeholder="Generated password appears here" className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 font-mono text-sm text-cyan-100 outline-none" />
            <button onClick={generate} className="rounded-2xl border border-cyan-300/25 px-5 py-3 font-semibold text-cyan-100 hover:bg-cyan-300/10">Generate</button>
            <button onClick={() => navigator.clipboard?.writeText(password)} disabled={!password} className="rounded-2xl bg-cyan-200 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60">Copy</button>
          </div>
          <p className="mt-3 text-xs text-slate-500">Generator output is not stored by this action.</p>
        </GlassCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
        <GlassCard className="p-5">
          <p className="text-sm text-slate-400">Add encrypted vault item</p>
          <div className="mt-4 grid gap-3">
            <select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value })} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none">
              {kinds.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
            </select>
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Title" className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none" />
            <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="Username / handle" className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none" />
            <input value={form.origin} onChange={(event) => setForm({ ...form, origin: event.target.value })} placeholder="Origin / website" className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none" />
            <input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="tags, comma, separated" className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none" />
            <button onClick={addItem} disabled={busy || !form.title.trim()} className="rounded-2xl bg-violet-200 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60">Encrypt + add item</button>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-2xl font-semibold text-white">Vault items</h3>
            <Badge tone="cyan">redacted list</Badge>
          </div>
          <div className="mt-4 max-h-[30rem] space-y-3 overflow-auto pr-1">
            {items.length === 0 ? <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400">No vault items yet. Add a new vault item.</p> : items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{item.username || "no username"} · {item.origin || "no origin"}</p>
                  </div>
                  <Badge tone={item.kind === "passkey" ? "violet" : "cyan"}>{item.kind}</Badge>
                </div>
                <p className="mt-3 text-xs text-slate-500">{item.encryption.alg} · {item.encryption.keyScope} · secret hidden</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-5">
          <h3 className="text-2xl font-semibold text-white">Device ecosystem</h3>
          <div className="mt-4 space-y-3">
            {devices.map((device) => (
              <div key={device.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div><p className="font-semibold text-white">{device.name}</p><p className="text-xs text-slate-400">{device.kind}</p></div>
                <Badge tone={device.trusted ? "emerald" : "amber"}>{device.trusted ? "trusted" : "pending"}</Badge>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <h3 className="text-2xl font-semibold text-white">Kind breakdown</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {byKind.length === 0 ? <p className="text-sm text-slate-400">No items yet.</p> : byKind.map(([kind, count]) => (
              <div key={kind} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-xl font-semibold text-white">{count}</p><p className="text-xs text-slate-400">{kind}</p></div>
            ))}
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
