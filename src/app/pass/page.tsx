import Link from "next/link";

import { Badge, GlassCard, SectionTitle } from "@/components/ui/primitives";
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

function PassNav() {
  return (
    <nav className="stage-card mx-auto flex max-w-7xl items-center justify-between rounded-xl px-4 py-3 text-[11px]">
      <Link href="/pass" className="flex items-center gap-2 font-semibold text-white">
        <span className="grid h-6 w-6 place-items-center rounded-md border border-violet-300/20 bg-violet-300/10 text-[10px] text-violet-100">P</span>
        Erme Pass
      </Link>
      <div className="hidden items-center gap-5 text-slate-300 md:flex">
        <a href="#vault" className="hover:text-white">Vault</a>
        <a href="#apps" className="hover:text-white">Apps</a>
        <a href="#architecture" className="hover:text-white">Architecture</a>
        <Link href="/ecosystem" className="hover:text-white">Ecosystem</Link>
        <Link href="/" className="hover:text-white">Trail</Link>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/ecosystem" className="rounded-md border border-white/15 px-3 py-1.5 font-semibold text-white hover:bg-white/10">Domain map</Link>
        <a href="#vault" className="rounded-md bg-white px-3 py-1.5 font-semibold text-black hover:bg-slate-200">Open vault</a>
      </div>
    </nav>
  );
}

function PassHero({ itemCount, deviceCount }: { itemCount: number; deviceCount: number }) {
  return (
    <section className="mx-auto grid max-w-7xl gap-10 pb-16 pt-16 lg:grid-cols-[.88fr_1.12fr] lg:items-center">
      <div>
        <div className="mb-6 inline-flex rounded-full border border-violet-300/15 bg-violet-300/10 px-4 py-2 text-xs text-violet-100">pass.erme.onl · local-first password manager</div>
        <h1 className="max-w-4xl text-5xl font-semibold leading-[0.92] tracking-[-0.075em] text-white md:text-7xl">Build a vault that never gives servers your secrets.</h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-slate-400">Erme Pass is the password/passkey surface for the private Erme ecosystem: local encrypted vault state, redacted APIs, device pairing, and future Chrome/iOS/PC clients.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#vault" className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-black shadow-[0_0_45px_rgba(255,255,255,.16)]">Use local vault</a>
          <a href="#architecture" className="rounded-md border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Architecture</a>
          <Link href="/ecosystem" className="rounded-md border border-white/15 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10">Ecosystem</Link>
        </div>
      </div>

      <div className="relative min-h-[560px] lg:min-h-[620px]">
        <div className="stage-card absolute left-0 top-14 hidden w-[76%] rounded-2xl p-6 opacity-80 md:block">
          <div className="mb-8 text-center">
            <p className="text-[11px] uppercase tracking-[0.35em] text-violet-200/70">Vault foundations</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">All access objects</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {vaultItems.slice(0, 6).map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-black/50 p-4">
                <div className="h-20 rounded-lg border border-violet-300/10 bg-[radial-gradient(circle_at_center,rgba(139,92,246,.2),rgba(2,6,23,.72)_55%,rgba(0,0,0,.9))]" />
                <p className="mt-4 text-sm font-semibold capitalize text-white">{item}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">Stored as redacted metadata + encrypted local blob.</p>
              </div>
            ))}
          </div>
        </div>

        <div className="stage-card absolute right-0 top-0 z-10 w-full rounded-2xl p-5 shadow-[0_40px_120px_rgba(0,0,0,.65)] md:w-[78%]">
          <div className="mb-10 flex items-center justify-between text-[11px] text-slate-300">
            <span className="font-semibold text-white">Erme Pass</span>
            <span>zero-knowledge target</span>
          </div>
          <div className="grid gap-7 lg:grid-cols-[.92fr_1.08fr] lg:items-center">
            <div>
              <Badge tone="violet">private vault core</Badge>
              <h2 className="mt-5 text-4xl font-semibold leading-[1.02] tracking-[-0.055em] text-white md:text-5xl">Passwords, passkeys, cards, and recovery codes.</h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-400">One shell for Chrome, iOS, PC helper, and web vault — local unlock first, ciphertext sync later.</p>
              <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3"><p className="text-lg font-semibold text-white">{itemCount}</p><p className="text-[10px] text-slate-500">items</p></div>
                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3"><p className="text-lg font-semibold text-white">{deviceCount}</p><p className="text-[10px] text-slate-500">devices</p></div>
                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3"><p className="text-lg font-semibold text-white">0</p><p className="text-[10px] text-slate-500">leaks</p></div>
              </div>
            </div>
            <div className="relative min-h-[275px] overflow-hidden rounded-2xl border border-white/10 bg-black/55 p-4">
              <div className="grid-bg absolute inset-0 opacity-60" />
              <div className="preview-glow preview-glow-violet absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full" />
              {["local unlock", "redacted API", "encrypted blob", "device pair", "ciphertext sync"].map((label, index) => (
                <div key={label} className={`absolute rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-xs text-slate-200 shadow-2xl ${[
                  "left-5 top-7", "right-5 top-12", "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2", "left-7 bottom-10", "right-7 bottom-8",
                ][index]}`}>
                  <span className="mr-2 text-violet-200">0{index + 1}</span>{label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="stage-card absolute bottom-0 left-[17%] z-20 hidden w-[58%] rounded-xl p-5 text-center shadow-[0_35px_90px_rgba(0,0,0,.7)] lg:block">
          <p className="text-sm font-semibold text-white">Unbeatable security posture, no plaintext API responses</p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              ["AES", "local-device blobs"],
              ["WebAuthn", "passkey lane"],
              ["BYK", "bring your key"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <p className="text-lg font-semibold text-white">{value}</p>
                <p className="mt-1 text-[10px] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function PassPage() {
  const [state, initialItems, initialDevices] = await Promise.all([readPassState(), listSafeItems(), listDevices()]);
  const initialStatus = passSummary(state);

  return (
    <main className="deep-page relative overflow-hidden px-5 py-6 md:px-8">
      <div className="spotlight spotlight-left" />
      <div className="spotlight spotlight-right spotlight-violet" />
      <PassNav />
      <PassHero itemCount={initialStatus.counts.items} deviceCount={initialStatus.counts.devices} />

      <section id="vault" className="mx-auto max-w-7xl py-12">
        <PassDashboard initialStatus={initialStatus} initialItems={initialItems} initialDevices={initialDevices} />
      </section>

      <section className="mx-auto max-w-7xl py-16">
        <SectionTitle eyebrow="Vault scope" title="Everything people lose access to, not a tiny password list." body="Logins are just the first lane. The vault is designed for passkeys, cards, identities, secure notes, tokens, SSH keys, and recovery codes." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {vaultItems.map((item) => (
            <div key={item} className="stage-card rounded-xl p-4 text-center text-sm font-semibold capitalize text-slate-100">{item}</div>
          ))}
        </div>
      </section>

      <section id="architecture" className="mx-auto max-w-7xl py-16">
        <SectionTitle eyebrow="Architecture" title="Keys stay with the user. Apps become vault clients." body="Chrome, iOS, PC, and web should all unlock the same encrypted vault without giving Erme servers the secrets." />
        <div className="grid gap-4 lg:grid-cols-5">
          {passArchitecture.map((layer) => (
            <GlassCard key={layer.layer} className="card-hover p-5">
              <Badge tone="cyan">{layer.layer}</Badge>
              <p className="mt-4 text-sm leading-6 text-slate-400">{layer.detail}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <section id="apps" className="mx-auto grid max-w-7xl gap-8 py-16 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
        <div>
          <SectionTitle align="left" eyebrow="Apps" title="Chrome extension, iOS app, and PC helper from day one." body="The Chrome extension should not become the whole product. It should be one client connected to a local/secure vault core." />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {apps.map((app) => (
            <GlassCard key={app.name} className="p-5">
              <h3 className="text-xl font-semibold text-white">{app.name}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{app.detail}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl py-16">
        <SectionTitle eyebrow="Security rules" title="This is where we cannot fake it." body="Password manager claims need to be precise. Until a crypto/passkey feature is implemented and tested, the UI should call it planned or scaffold." />
        <div className="grid gap-3 md:grid-cols-2">
          {passSecurityRules.map((rule) => (
            <div key={rule} className="rounded-xl border border-white/10 bg-black/45 p-4 text-sm leading-6 text-slate-400">{rule}</div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl pb-20 pt-12">
        <GlassCard className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-violet-200/70">Next build step</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">Client-side master-key unlock + real passkey flows.</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">The local vault scaffold is live. The next serious move is WebCrypto unlock, import/export, and native autofill clients.</p>
            </div>
            <Link href="/install" className="rounded-md bg-white px-6 py-3 font-semibold text-black shadow-[0_0_40px_rgba(255,255,255,.14)]">Use installer pattern</Link>
          </div>
        </GlassCard>
      </section>
    </main>
  );
}
