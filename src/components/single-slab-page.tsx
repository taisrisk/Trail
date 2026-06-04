import Link from "next/link";
import type { ReactNode } from "react";

type NavItem = { href: string; label: string };
type Coordinate = { value: string | number; label: string };
type QuietLine = { label: string; value: string };
type DeepSection = { kicker: string; title: string; body: string; lines?: QuietLine[] };
type SectionBlock = { kicker: string; title: string; body: string; lines?: QuietLine[]; cta?: { href: string; label: string } };

export function AmbientScene() {
  return (
    <>
      <div className="forest-depth" />
      <div className="forest-tree forest-tree-left" />
      <div className="forest-tree forest-tree-right" />
      <div className="wood-form wood-form-left" />
      <div className="wood-form wood-form-right" />
      <div className="ambient-fog" />
    </>
  );
}

export function SlabNav({ brand, brandHref = "/", items, action }: { brand: string; brandHref?: string; items: NavItem[]; action: NavItem }) {
  return (
    <nav className="single-nav mx-auto flex max-w-5xl items-center justify-between px-2 py-2 text-[10px] uppercase tracking-[0.28em] text-white/58">
      <Link href={brandHref} className="text-white/88">{brand}</Link>
      <div className="hidden items-center gap-7 md:flex">
        {items.map((item) => <Link key={`${item.href}-${item.label}`} href={item.href}>{item.label}</Link>)}
      </div>
      <Link href={action.href} className="rounded-full border border-white/15 px-4 py-2 text-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,.12)]">{action.label}</Link>
    </nav>
  );
}

function CoordinateItem({ value, label }: Coordinate) {
  return (
    <div className="quiet-coordinate">
      <p>{value}</p>
      <span>{label}</span>
    </div>
  );
}

export function QuietLineItem({ label, value }: QuietLine) {
  return (
    <div className="quiet-line">
      <span>{label}</span>
      <p>{value}</p>
    </div>
  );
}

export function HeroSlab({
  eyebrow,
  title,
  body,
  topLeft,
  topCenter,
  topRight,
  coordinates,
  lines,
  sections = [],
  primaryCta,
  secondaryCta,
}: {
  eyebrow: string;
  title: string;
  body: string;
  topLeft: string;
  topCenter: string;
  topRight: string;
  coordinates: Coordinate[];
  lines: QuietLine[];
  sections?: DeepSection[];
  primaryCta: NavItem;
  secondaryCta: NavItem;
}) {
  return (
    <section className="mx-auto mt-10 flex max-w-6xl justify-center pb-10">
      <div className="single-slab landing-hero-slab mx-auto flex w-full max-w-[880px] flex-col rounded-[2.25rem] px-7 py-8 md:min-h-[920px] md:px-12 md:py-11">
        <div className="slab-topbar flex items-center justify-between pb-9 text-[9px] uppercase tracking-[0.32em] text-white/48">
          <span>{topLeft}</span>
          <span className="hidden sm:inline">{topCenter}</span>
          <span>{topRight}</span>
        </div>

        <div className="grid gap-10 py-8 md:grid-cols-[1.08fr_.92fr] md:items-end md:py-12">
          <div>
            <p className="mb-5 text-[10px] uppercase tracking-[0.42em] text-amber-100/62">{eyebrow}</p>
            <h1 className="max-w-2xl text-5xl font-semibold leading-[0.92] tracking-[-0.08em] text-white md:text-7xl">{title}</h1>
          </div>
          <div className="space-y-5">
            <p className="max-w-xl text-base leading-8 text-white/62">{body}</p>
            <div className="flex flex-wrap gap-3">
              <Link href={primaryCta.href} className="soft-glass-button">{primaryCta.label}</Link>
              <Link href={secondaryCta.href} className="soft-glass-button ghost">{secondaryCta.label}</Link>
            </div>
          </div>
        </div>

        <div className="glass-column mt-2">
          {coordinates.slice(0, 3).map((item) => <CoordinateItem key={item.label} {...item} />)}
        </div>

        <div className="mt-10 border-t border-white/10 pt-3">
          <div className="space-y-1">
            {lines.map((line) => <QuietLineItem key={line.label} {...line} />)}
          </div>
        </div>

        {sections.length ? (
          <div className="mt-12 grid gap-10 border-t border-white/10 pt-10">
            {sections.map((section) => (
              <section key={section.kicker} className="deep-section">
                <p className="section-kicker">{section.kicker}</p>
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                {section.lines?.length ? (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {section.lines.map((line) => (
                      <div className="deep-point" key={`${section.kicker}-${line.label}`}>
                        <span>{line.label}</span>
                        <p>{line.value}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function LandingSection({ kicker, title, body, lines = [], cta }: SectionBlock) {
  return (
    <section className="single-slab landing-section-slab mx-auto mt-10 max-w-[560px] rounded-[1.6rem] px-7 py-8 md:px-10">
      <p className="section-kicker">{kicker}</p>
      <h2 className="mt-4 text-3xl font-semibold leading-[0.98] tracking-[-0.06em] text-white">{title}</h2>
      <p className="mt-5 text-sm leading-7 text-white/48">{body}</p>
      <div className="mt-6 space-y-1">
        {lines.slice(0, 3).map((line) => <QuietLineItem key={line.label} {...line} />)}
      </div>
      {cta ? <Link href={cta.href} className="soft-text-link mt-7 inline-flex">{cta.label}</Link> : null}
    </section>
  );
}

export function PageShell({ brand, brandHref, navItems, action, children, tone = "trail" }: { brand: string; brandHref?: string; navItems: NavItem[]; action: NavItem; children: ReactNode; tone?: "trail" | "pass" | "ecosystem" | "dashboard" }) {
  return (
    <main className={`natural-page ${tone}-forest relative min-h-screen overflow-hidden px-5 py-7 pb-20 text-white md:px-8`}>
      <AmbientScene />
      <SlabNav brand={brand} brandHref={brandHref} items={navItems} action={action} />
      {children}
    </main>
  );
}
