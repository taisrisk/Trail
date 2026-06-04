import { HeroSlab, PageShell } from "@/components/single-slab-page";

const navItems = [
  { href: "/mail", label: "Mail" },
  { href: "/pass", label: "Pass" },
  { href: "/ecosystem", label: "Ecosystem" },
  { href: "/dashboard", label: "Control" },
];

export default function Home() {
  return (
    <PageShell brand="Trail" navItems={navItems} action={{ href: "/install", label: "Install" }} tone="trail">
      <HeroSlab
        eyebrow="Local-first email OS"
        title="Your inbox should live with you."
        body="Trail is the private email layer for Erme. It lets you bring your own domain, run a local node on your computer, keep a searchable mail memory on your machine, and add AI watchers that help with the inbox without turning the cloud into the owner of your identity."
        topLeft="trail / email.erme.onl"
        topCenter="domain · inbox · local AI"
        topRight="01"
        coordinates={[
          { value: "BYK", label: "bring your own key and domain" },
          { value: "Local", label: "mail memory lives on your device" },
          { value: "Private", label: "AI works from your trusted node" },
        ]}
        lines={[
          { label: "Plain English", value: "Trail is not just a pretty inbox page. It is the layer that connects your domain, aliases, messages, receipts, attachments, people, and local assistant into one private workspace." },
          { label: "Why it exists", value: "Normal email makes you rent your identity from a provider. Trail is built so your address, rules, history, and AI context can follow you even if the routing service changes later." },
          { label: "What runs locally", value: "The node stores searchable state, handles private watchers, keeps your graph memory, and gives the web app a safe way to control mail tools without exposing everything to a hosted dashboard." },
          { label: "What the cloud does", value: "Cloud services can relay mail, sync encrypted blobs, or host the website, but the important private brain stays with the user. No server should need your whole life in plaintext." },
        ]}
        sections={[
          {
            kicker: "How it feels",
            title: "One glass control room for the whole mail identity.",
            body: "The product should feel like opening a private command center: one calm panel with the full story inside it. You see what Trail is, why it matters, what pieces are real, and where to go next without jumping through tiny cards that say vague startup words.",
            lines: [
              { label: "Inbox", value: "Read mail, save important context, search old conversations, and see people/companies as connected entities instead of random message threads." },
              { label: "Aliases", value: "Create purpose-based addresses for school, projects, accounts, shopping, and outreach so your main identity is not sprayed everywhere." },
              { label: "Watchers", value: "Local AI rules can notice receipts, school messages, client replies, security alerts, and deadlines, then surface actions without reading from a public hosted brain." },
              { label: "Memory", value: "Trail turns inbox history into a private knowledge base: contacts, domains, attachments, links, orders, tasks, and recurring patterns." },
            ],
          },
          {
            kicker: "Build promise",
            title: "A real local app first, not a fake privacy slogan.",
            body: "The point is to make privacy operational. The user should be able to install the node, inspect where data is stored, run the dashboard, test aliases, and connect future clients like Chrome, Windows, and iOS without pretending everything is already magically finished.",
            lines: [
              { label: "Install", value: "The install page gives a clear local setup path so the private node can run beside the website instead of being an abstract diagram." },
              { label: "Control", value: "The dashboard is where setup, aliases, watchers, messages, and vault status become actual controls instead of marketing bullets." },
              { label: "Pass", value: "Erme Pass handles passwords, passkeys, secure notes, recovery codes, and unlock flows that connect back to the same private ecosystem." },
              { label: "Ecosystem", value: "The domain map explains how erme.onl, email.erme.onl, pass.erme.onl, and sync.erme.onl fit together without confusing the user." },
            ],
          },
        ]}
        primaryCta={{ href: "/mail", label: "Open mail workspace" }}
        secondaryCta={{ href: "/dashboard", label: "Open control" }}
      />
    </PageShell>
  );
}
