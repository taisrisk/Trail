import Link from "next/link";

import { Badge, GlassCard, SectionTitle, TerminalBlock } from "@/components/ui/primitives";
import { ecosystemBuildPhases, ecosystemDomains, passPillars } from "@/lib/erme-ecosystem";

export const metadata = {
  title: "Erme Private Ecosystem",
  description: "Domain and product map for Erme email, password manager, passkeys, sync, iOS, PC, and Chrome extension surfaces.",
};

export default function EcosystemPage() {
  return (
    <main className="relative overflow-hidden px-5 py-6 md:px-8">
      <div className="orb left-10 top-24 h-44 w-44 bg-cyan-400/15" />
      <div className="orb right-16 top-36 h-52 w-52 bg-violet-400/15 [animation-delay:1.2s]" />

      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300 text-sm font-black text-slate-950">E</div>
          <div>
            <p className="font-semibold text-white">Erme Ecosystem</p>
            <p className="text-xs text-slate-400">email · passkeys · passwords · local AI</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/pass" className="rounded-full border border-cyan-300/25 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/10">Pass</Link>
          <Link href="/install" className="hidden rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 sm:inline-flex">Install</Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-10 pb-14 pt-16 lg:grid-cols-[1.02fr_.98fr] lg:items-center">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">Use the domains you already own as the trust layer.</div>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.06em] text-white md:text-7xl">Erme becomes the private identity OS.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Use `email.erme.onl` for Trail mail, `pass.erme.onl` for the password/passkey manager, and `sync.erme.onl` only as an encrypted relay. Kairo stays clean for a separate public product or lab.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/pass" className="rounded-full bg-cyan-200 px-6 py-3 font-semibold text-slate-950 shadow-[0_0_40px_rgba(94,234,212,.25)]">Open Erme Pass plan</Link>
            <Link href="/install" className="rounded-full border border-cyan-300/25 px-6 py-3 font-semibold text-cyan-100 hover:bg-cyan-300/10">Trail installer</Link>
            <a href="#domains" className="rounded-full border border-white/15 px-6 py-3 font-semibold text-white hover:bg-white/10">Domain map</a>
          </div>
        </div>

        <GlassCard className="p-5">
          <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-5">
            <p className="text-sm text-slate-400">Recommended domain split</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">erme.onl as the trust root</h2>
            <TerminalBlock lines={["email.erme.onl -> Trail BYK mail", "pass.erme.onl -> Erme Pass vault", "sync.erme.onl -> encrypted relay only", "kairo.onl -> separate brand lane"]} />
          </div>
        </GlassCard>
      </section>

      <section id="domains" className="mx-auto max-w-7xl py-12">
        <SectionTitle eyebrow="Domain map" title="Subdomains make the ecosystem feel real and safer." body="Each product gets a clean surface and security boundary. The pass manager can use stricter security headers than marketing or email onboarding pages." />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ecosystemDomains.map((item) => (
            <GlassCard key={item.domain} className="card-hover p-6">
              <Badge tone={item.domain.includes("pass") ? "violet" : item.domain.includes("email") ? "emerald" : "cyan"}>{item.role}</Badge>
              <h3 className="mt-4 text-2xl font-semibold text-white">{item.domain}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{item.purpose}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 py-12 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
        <div>
          <SectionTitle align="left" eyebrow="Erme Pass" title="A private passkey-compatible password manager is the right next product." body="Email owns identity. Passwords and passkeys own access. Putting them together makes Erme feel like a serious private ecosystem, not only an inbox." />
          <Link href="/pass" className="inline-flex rounded-full bg-cyan-200 px-6 py-3 font-semibold text-slate-950 shadow-[0_0_40px_rgba(94,234,212,.25)]">Build Pass</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {passPillars.map((pillar) => (
            <div key={pillar} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-200">{pillar}</div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl pb-20 pt-12">
        <SectionTitle eyebrow="Build phases" title="Ship it as an ecosystem, not a random extra feature." body="Start with product surfaces, then local vault, extension, iOS/PC, and encrypted sync. Keep unimplemented security claims labeled as planned until tested." />
        <div className="grid gap-4 lg:grid-cols-5">
          {ecosystemBuildPhases.map((phase) => (
            <GlassCard key={phase.phase} className="p-5">
              <Badge tone="violet">Phase {phase.phase}</Badge>
              <h3 className="mt-4 text-xl font-semibold text-white">{phase.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{phase.items.join(" · ")}</p>
            </GlassCard>
          ))}
        </div>
      </section>
    </main>
  );
}
