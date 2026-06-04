import Link from "next/link";

const coordinates = [
  ["BYK", "key · domain · computer"],
  ["LOCAL", "vault + graph + AI"],
  ["ZERO", "server plaintext target"],
];

const quietLines = [
  ["Domain", "Routing is replaceable infrastructure around your owned address."],
  ["Inbox", "Readable mail, receipts, aliases, people, and attachments stay on the local node."],
  ["AI", "Watchers summarize and act from private context without turning the inbox into a hosted brain."],
];

function SlabNav() {
  return (
    <nav className="single-nav mx-auto flex max-w-6xl items-center justify-between px-2 py-2 text-[11px] uppercase tracking-[0.24em] text-smoke-200/70">
      <Link href="/" className="text-white/90">Trail</Link>
      <div className="hidden items-center gap-8 md:flex">
        <Link href="/pass">Erme Pass</Link>
        <Link href="/ecosystem">Ecosystem</Link>
        <Link href="/dashboard">Dashboard</Link>
      </div>
      <Link href="/install" className="rounded-full border border-white/15 px-4 py-2 text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,.12)]">Install</Link>
    </nav>
  );
}

function Coordinate({ value, label }: { value: string; label: string }) {
  return (
    <div className="quiet-coordinate">
      <p>{value}</p>
      <span>{label}</span>
    </div>
  );
}

function QuietLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="quiet-line">
      <span>{label}</span>
      <p>{value}</p>
    </div>
  );
}

export default function Home() {
  return (
    <main className="natural-page trail-forest relative min-h-screen overflow-hidden px-5 py-6 text-white md:px-8">
      <div className="forest-depth" />
      <div className="forest-tree forest-tree-left" />
      <div className="forest-tree forest-tree-right" />
      <div className="wood-form wood-form-left" />
      <div className="wood-form wood-form-right" />
      <div className="ambient-fog" />

      <SlabNav />

      <section className="single-slab cinematic-slab mx-auto mt-10 flex max-w-6xl flex-col rounded-[2.25rem] px-6 py-7 md:px-12 md:py-10 lg:px-16 lg:py-14">
        <div className="slab-topbar flex items-center justify-between pb-8 text-[10px] uppercase tracking-[0.28em] text-white/46">
          <span>Bring your key</span>
          <span className="hidden md:inline">Quiet local node</span>
          <span>01 / 03</span>
        </div>

        <div className="grid flex-1 gap-10 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
          <div>
            <p className="mb-5 text-xs uppercase tracking-[0.38em] text-amber-100/62">Private email OS</p>
            <h1 className="max-w-4xl text-5xl font-light leading-[0.94] tracking-[-0.075em] text-white md:text-7xl">
              Your inbox, floating quietly above your machine.
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/54 md:text-lg">
              Trail turns your domain into a calm local command surface: mail, vault, graph memory, and AI automation without giving a server the readable center.
            </p>
          </div>

          <div className="glass-column">
            {coordinates.map(([value, label]) => <Coordinate key={label} value={value} label={label} />)}
          </div>
        </div>

        <div className="mt-12 grid gap-8 border-t border-white/10 pt-8 lg:grid-cols-[1fr_.72fr]">
          <div className="space-y-1">
            {quietLines.map(([label, value]) => <QuietLine key={label} label={label} value={value} />)}
          </div>
          <div className="flex items-end justify-start gap-3 lg:justify-end">
            <Link href="/install" className="soft-glass-button">Run locally</Link>
            <Link href="/pass" className="soft-glass-button ghost">Erme Pass</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
