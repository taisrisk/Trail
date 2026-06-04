import Link from "next/link";

import { Badge, GlassCard, SectionTitle, TerminalBlock } from "@/components/ui/primitives";
import { PassDashboard } from "@/components/pass-dashboard";
import { passArchitecture, passSecurityRules } from "@/lib/erme-ecosystem";
import { listDevices, listSafeItems, passSummary, readPassState } from "@/lib/server/pass-store";

const apps = [
  { name: "Chrome extension", detail: "Autofill, save-login prompts, password generator, passkey mediation where supported, and local node bridge." },
  { name: "iOS app", detail: "Face ID unlock, Password AutoFill provider, secure notes, identities, cards, and device pairing." },
  { name: "PC local helper", detail: "Windows Hello unlock, native messaging, offline vault, encrypted backups, and local session broker." },
  { name: "Web vault shell", detail: "Client-side decrypted vault UI for trusted devices; no server plaintext." },
];

const vaultItems = ["logins", "passkeys", "secure notes", "cards", "identities", "SSH keys", "API tokens", "recovery codes"];

export const metadata = {
  title: "Erme Pass",
  description: "Private password manager and passkey-compatible vault for iOS, PC, and Chrome extension ecosystems.",
};

export default async function PassPage() {
  const [state, initialItems, initialDevices] = await Promise.all([readPassState(), listSafeItems(), listDevices()]);
  const initialStatus = passSummary(state);

  return (
    <main className="relative overflow-hidden px-5 py-6 md:px-8">
      <div className="orb left-8 top-24 h-48 w-48 bg-violet-400/15" />
      <div className="orb right-12 top-32 h-56 w-56 bg-cyan-400/15 [animation-delay:1.2s]" />

      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 backdrop-blur-xl">
        <Link href="/ecosystem" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-300 text-sm font-black text-slate-950">P</div>
          <div>
            <p className="font-semibold text-white">Erme Pass</p>
            <p className="text-xs text-slate-400">pass.erme.onl</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/ecosystem" className="hidden rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 sm:inline-flex">Ecosystem</Link>
          <Badge tone="violet">zero-knowledge</Badge>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-10 pb-14 pt-16 lg:grid-cols-[1.02fr_.98fr] lg:items-center">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-violet-300/20 bg-violet-300/10 px-4 py-2 text-sm text-violet-100">Private password manager + passkey-compatible vault.</div>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.06em] text-white md:text-7xl">Passwords, passkeys, cards, notes, and recovery codes — owned locally.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Erme Pass should work across iOS, PC, and Chrome while keeping the vault local-first and zero-knowledge. The server can sync ciphertext, but it never gets readable secrets.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#architecture" className="rounded-full bg-violet-200 px-6 py-3 font-semibold text-slate-950 shadow-[0_0_40px_rgba(167,139,250,.25)]">Architecture</a>
            <a href="#apps" className="rounded-full border border-violet-300/25 px-6 py-3 font-semibold text-violet-100 hover:bg-violet-300/10">Apps</a>
            <Link href="/ecosystem" className="rounded-full border border-white/15 px-6 py-3 font-semibold text-white hover:bg-white/10">Domain map</Link>
          </div>
        </div>

        <GlassCard className="p-5">
          <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-5">
            <p className="text-sm text-slate-400">Vault design</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">Local unlock, encrypted sync</h2>
            <TerminalBlock lines={["pass.erme.onl -> product + web vault shell", "PC helper -> Windows Hello + native messaging", "iOS -> Face ID + Password AutoFill", "sync.erme.onl -> ciphertext only"]} />
          </div>
        </GlassCard>
      </section>

      <PassDashboard initialStatus={initialStatus} initialItems={initialItems} initialDevices={initialDevices} />

      <section className="mx-auto max-w-7xl py-12">
        <SectionTitle eyebrow="Vault scope" title="It should be a whole ecosystem, not a tiny password list." body="Start with normal passwords, but design the vault around everything people lose access to: passkeys, notes, cards, identities, tokens, and recovery codes." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {vaultItems.map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center text-sm font-semibold text-slate-100">{item}</div>
          ))}
        </div>
      </section>

      <section id="architecture" className="mx-auto max-w-7xl py-12">
        <SectionTitle eyebrow="Architecture" title="Keys stay with the user. Apps become vault clients." body="Chrome, iOS, PC, and web should all unlock the same encrypted vault without giving Erme servers the secrets." />
        <div className="grid gap-4 lg:grid-cols-5">
          {passArchitecture.map((layer) => (
            <GlassCard key={layer.layer} className="card-hover p-5">
              <Badge tone="cyan">{layer.layer}</Badge>
              <p className="mt-4 text-sm leading-6 text-slate-300">{layer.detail}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <section id="apps" className="mx-auto grid max-w-7xl gap-8 py-12 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
        <div>
          <SectionTitle align="left" eyebrow="Apps" title="Chrome extension, iOS app, and PC helper from day one." body="The Chrome extension should not become the whole product. It should be one client connected to a local/secure vault core." />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {apps.map((app) => (
            <GlassCard key={app.name} className="p-5">
              <h3 className="text-xl font-semibold text-white">{app.name}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{app.detail}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl py-12">
        <SectionTitle eyebrow="Security rules" title="This is where we cannot fake it." body="Password manager claims need to be precise. Until a crypto/passkey feature is implemented and tested, the UI should call it planned or scaffold." />
        <div className="grid gap-3 md:grid-cols-2">
          {passSecurityRules.map((rule) => (
            <div key={rule} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm leading-6 text-slate-300">{rule}</div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl pb-20 pt-12">
        <GlassCard className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Next build step</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Build the local vault scaffold next.</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">The first real backend step is `~/.erme/pass`, redacted status APIs, encrypted demo item storage, and no plaintext secrets in API responses.</p>
            </div>
            <Link href="/install" className="rounded-full bg-cyan-200 px-6 py-3 font-semibold text-slate-950 shadow-[0_0_40px_rgba(94,234,212,.25)]">Use installer pattern</Link>
          </div>
        </GlassCard>
      </section>
    </main>
  );
}
