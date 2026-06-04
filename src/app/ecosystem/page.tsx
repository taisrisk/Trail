import { HeroSlab, PageShell } from "@/components/single-slab-page";
import { ecosystemDomains } from "@/lib/erme-ecosystem";

export const metadata = {
  title: "Erme Private Ecosystem",
  description: "Domain and product map for Erme email, password manager, passkeys, sync, iOS, PC, and Chrome extension surfaces.",
};

const navItems = [
  { href: "/", label: "Trail" },
  { href: "/pass", label: "Pass" },
  { href: "/dashboard", label: "Control" },
];

export default function EcosystemPage() {
  return (
    <PageShell brand="Ecosystem" brandHref="/ecosystem" navItems={navItems} action={{ href: "/install", label: "Install" }} tone="ecosystem">
      <HeroSlab
        eyebrow="Private Erme system"
        title="One identity stack, owned by the user."
        body="The Erme ecosystem is the umbrella around Trail, Erme Pass, local AI, encrypted sync, and future clients. The simple idea: your domain, inbox, passwords, keys, and assistant should feel like one private operating system instead of five disconnected apps begging for trust."
        topLeft="erme.onl"
        topCenter="identity · access · automation"
        topRight="02"
        coordinates={[
          { value: ecosystemDomains.length, label: "mapped domains and product lanes" },
          { value: "BYK", label: "user-held domain and keys" },
          { value: "Local", label: "desktop node is first-class" },
        ]}
        lines={ecosystemDomains.map((item) => ({ label: item.domain, value: `${item.role}: ${item.purpose}` }))}
        sections={[
          {
            kicker: "What belongs here",
            title: "Mail, passwords, sync, and AI are part of the same trust story.",
            body: "A normal product page makes every tool look separate. Erme should explain the whole map in one place: Trail is for email and knowledge, Pass is for access and secrets, Sync is the optional encrypted bridge, and the local node is the computer-owned engine that keeps the private parts close.",
            lines: [
              { label: "Trail", value: "The email OS: domain setup, aliases, inbox memory, local search, attachments, and AI watchers." },
              { label: "Pass", value: "The access layer: passwords, passkeys, secure notes, recovery codes, cards, devices, and unlock sessions." },
              { label: "Sync", value: "The optional relay: encrypted device state, version clocks, and conflict metadata without plaintext vault or mail content." },
              { label: "Clients", value: "The surfaces people touch: web dashboard, Windows helper, browser extension, iOS app, and future desktop/mobile shells." },
            ],
          },
          {
            kicker: "Design rule",
            title: "Do not make the user decode the architecture.",
            body: "Every page should say what the product does in human language, then show the real pieces underneath. No random cyber words, no empty privacy claims, no fake dashboards. If something is scaffolded, it should be labeled as a planned or local-test surface; if it works, it should have a control, API, or install path.",
            lines: [
              { label: "Honest claims", value: "Say encrypted, local, redacted, or zero-knowledge only where the code path actually supports that behavior." },
              { label: "One panel", value: "The website keeps the cinematic glass slab, but the slab is long enough to explain the full product instead of hiding everything in tiny cards." },
              { label: "Clear navigation", value: "Trail, Pass, Ecosystem, Control, and Install are the core routes. Each route should explain one part of the same private platform." },
              { label: "Future-ready", value: "The copy leaves room for Chrome extension, iOS, PC helper, sync relay, and native clients without pretending they are all complete today." },
            ],
          },
        ]}
        primaryCta={{ href: "/pass", label: "Open Erme Pass" }}
        secondaryCta={{ href: "/", label: "Back to Trail" }}
      />
    </PageShell>
  );
}
