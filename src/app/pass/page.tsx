import { PassDashboard } from "@/components/pass-dashboard";
import { HeroSlab, PageShell } from "@/components/single-slab-page";
import { listDevices, listSafeItems, passSummary, readPassState } from "@/lib/server/pass-store";

export const metadata = {
  title: "Erme Pass",
  description: "Private password manager and passkey-compatible vault for iOS, PC, and Chrome extension ecosystems.",
};

const navItems = [
  { href: "/", label: "Trail" },
  { href: "/ecosystem", label: "Ecosystem" },
  { href: "/dashboard", label: "Control" },
];

export default async function PassPage() {
  const [state, initialItems, initialDevices] = await Promise.all([readPassState(), listSafeItems(), listDevices()]);
  const initialStatus = passSummary(state);

  return (
    <PageShell brand="Erme Pass" brandHref="/pass" navItems={navItems} action={{ href: "/dashboard", label: "Vault" }} tone="pass">
      <HeroSlab
        eyebrow="Password manager and access layer"
        title="Your secrets should not become somebody else’s database."
        body="Erme Pass is the vault side of the Erme ecosystem. It is built for passwords, passkeys, secure notes, cards, recovery codes, and device unlock flows, with local-first storage and redacted APIs so the interface can be useful without dumping secrets into the page."
        topLeft="pass.erme.onl"
        topCenter="vault · passkeys · devices"
        topRight="03"
        coordinates={[
          { value: initialStatus.counts.items, label: "local vault items" },
          { value: initialStatus.counts.devices, label: "paired devices" },
          { value: initialItems.length, label: "safe redacted records" },
        ]}
        lines={[
          { label: "What it stores", value: "Passwords, passkeys, identities, secure notes, cards, SSH/API secrets, recovery codes, and account metadata can belong in the vault." },
          { label: "What the UI shows", value: "The web surface should show names, types, dates, device state, and safe status. It should not casually print passwords, tokens, raw keys, or private recovery material." },
          { label: "How unlock should work", value: "The trusted device owns the unlock ceremony first. Future clients can use Windows Hello, Face ID, or local helper sessions instead of putting long-lived secrets in the browser." },
          { label: "Why it connects to Trail", value: "Email and passwords are the two pieces of online identity people lose control of fastest. Trail and Pass are meant to protect both as one private stack." },
        ]}
        sections={[
          {
            kicker: "Product shape",
            title: "A vault that feels like part of the operating system.",
            body: "Pass should not feel like a random password list sitting on a website. It should feel like a private access layer: generate strong passwords, save accounts, unlock with a trusted device, fill only what the user chooses, and sync only encrypted state when sync is enabled.",
            lines: [
              { label: "Browser", value: "A Chrome extension can detect login forms, offer save/fill/generate actions, and talk to the local helper instead of carrying the whole vault around." },
              { label: "Desktop", value: "The PC helper can own the unlocked session, device trust, local storage, and native prompts for sensitive actions." },
              { label: "Mobile", value: "An iOS app can use Face ID/Touch ID and Password AutoFill patterns while respecting platform limits honestly." },
              { label: "Recovery", value: "Emergency kits and recovery codes should be encrypted, exportable, and explained clearly instead of hidden behind scary settings." },
            ],
          },
          {
            kicker: "Security posture",
            title: "Useful surface, strict boundaries.",
            body: "The point is not to decorate a vault with privacy words. The interface should make the safety boundaries obvious: what is stored locally, what is redacted, what can sync, what cannot leave the machine, and what actions require a user gesture.",
            lines: [
              { label: "Redaction", value: "APIs should return safe summaries by default: title, account, type, updated time, strength, and device status — not the actual secret." },
              { label: "Encryption", value: "Per-item authenticated encryption and strong key derivation are the intended direction for real vault storage and sync." },
              { label: "Sync relay", value: "If sync exists, it should move ciphertext, device manifests, version clocks, and conflicts — never plaintext vault content." },
              { label: "User control", value: "Filling credentials, exporting vaults, linking devices, and revealing secrets should be deliberate actions, not background magic." },
            ],
          },
        ]}
        primaryCta={{ href: "/dashboard", label: "Open vault control" }}
        secondaryCta={{ href: "/ecosystem", label: "View ecosystem" }}
      />
      <PassDashboard initialStatus={initialStatus} initialItems={initialItems} initialDevices={initialDevices} />
    </PageShell>
  );
}
