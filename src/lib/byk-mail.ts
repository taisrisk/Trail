export type MailModeId = "quick-domain" | "relay-node" | "sovereign-mx";
export type NodeStatus = "local" | "optional-cloud" | "advanced";

export interface MailMode {
  id: MailModeId;
  name: string;
  tagline: string;
  bestFor: string;
  status: NodeStatus;
  flow: string[];
  pros: string[];
  tradeoffs: string[];
}

export interface DnsRecord {
  type: "MX" | "TXT" | "CNAME" | "SRV";
  host: string;
  value: string;
  purpose: string;
}

export interface LocalNodeModule {
  name: string;
  path: string;
  description: string;
  privacyBoundary: "local plaintext" | "encrypted at rest" | "metadata only";
}

export interface RoadmapItem {
  phase: string;
  title: string;
  items: string[];
}

export const bykPrinciples = [
  "Bring Your Key: readable mail and recovery secrets stay user-held.",
  "Bring Your Domain: public identity lives on a domain the user controls.",
  "Bring Your Computer: the local node owns vault, index, graph, and AI context.",
  "Cloud is a pipe, not the brain: relays, tunnels, and providers are swappable adapters.",
  "Human-gated outbound actions: local AI drafts and organizes before it sends.",
];

export const mailModes: MailMode[] = [
  {
    id: "quick-domain",
    name: "Quick Domain Mode",
    tagline: "Own the address today, keep the inbox local through a forwarding pipe.",
    bestFor: "First-time users, normal home internet, and fast production onboarding.",
    status: "optional-cloud",
    flow: ["Domain MX", "Cloudflare Email Routing", "Hidden relay inbox / connector", "Trail Local Node", "Encrypted vault"],
    pros: ["No port 25 problem", "Fast setup", "Works with cheap domains", "Still gives user-owned identity"],
    tradeoffs: ["Forwarding provider can see routing metadata", "Sending still needs SMTP provider or relay"],
  },
  {
    id: "relay-node",
    name: "Relay Node Mode",
    tagline: "A tiny reachable relay queues encrypted mail for the local node.",
    bestFor: "Users who want practical sovereignty without fighting residential ISP limits.",
    status: "local",
    flow: ["Domain MX", "VPS/Trail relay", "Encrypted queue", "Local sync", "Vault + AI + graph"],
    pros: ["Works while PC is offline", "Better network reachability", "Relays can be swapped", "Local vault remains source of truth"],
    tradeoffs: ["Needs relay infrastructure", "Threat model depends on pre-encryption point"],
  },
  {
    id: "sovereign-mx",
    name: "Sovereign MX Mode",
    tagline: "Run the public mail receiver yourself and store everything locally.",
    bestFor: "Advanced operators, homelabs, colocated boxes, and people who want maximum control.",
    status: "advanced",
    flow: ["Domain MX", "User-controlled SMTP receiver", "Spam filter", "Trail Local Node", "Encrypted vault"],
    pros: ["Maximum ownership", "No forwarding inbox", "True self-hosted receiving", "Great for learning mail infrastructure"],
    tradeoffs: ["Port 25/rDNS/IP reputation can be painful", "Needs uptime and deliverability hardening"],
  },
];

export const dnsRecords: DnsRecord[] = [
  { type: "MX", host: "@", value: "10 route1.trail-relay.example", purpose: "Receive mail for the domain through the selected ingress mode." },
  { type: "TXT", host: "@", value: "v=spf1 include:_spf.trail-relay.example ~all", purpose: "Declare who can send mail for the domain." },
  { type: "TXT", host: "_dmarc", value: "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com", purpose: "Tell receivers how to handle spoofed mail and where to send reports." },
  { type: "TXT", host: "trail._domainkey", value: "v=DKIM1; k=rsa; p=PUBLIC_KEY_HERE", purpose: "Cryptographically sign outbound messages." },
  { type: "CNAME", host: "trail", value: "local-node-tunnel.example", purpose: "Optional remote dashboard/API access through a tunnel." },
];

export const localNodeModules: LocalNodeModule[] = [
  { name: "Vault", path: "~/.trail/vault", description: "Encrypted message bodies, labels, and normalized mailbox objects.", privacyBoundary: "encrypted at rest" },
  { name: "Keys", path: "~/.trail/keys", description: "User-held key envelopes, device keys, and recovery metadata.", privacyBoundary: "local plaintext" },
  { name: "Index", path: "~/.trail/index", description: "Local search index for subjects, people, domains, receipts, and threads.", privacyBoundary: "local plaintext" },
  { name: "Graph", path: "~/.trail/graph", description: "Personal mail knowledge graph connecting people, orders, aliases, domains, and events.", privacyBoundary: "local plaintext" },
  { name: "Watchers", path: "~/.trail/watchers", description: "Natural-language rules executed by local Ollama/tiny models with approval gates.", privacyBoundary: "local plaintext" },
  { name: "Queues", path: "~/.trail/queues", description: "Inbound sync, outbound drafts, retry jobs, and relay handoff state.", privacyBoundary: "metadata only" },
];

export const roadmap: RoadmapItem[] = [
  { phase: "0", title: "Open-source scaffold", items: ["GitHub README", "product UI", "route-handler seams", "architecture docs"] },
  { phase: "1", title: "Local node", items: ["~/.trail folder", "SQLite metadata", "encrypted blob store", "event log"] },
  { phase: "2", title: "Domain setup", items: ["Cloudflare DNS guide", "MX/SPF/DKIM/DMARC generator", "health checks"] },
  { phase: "3", title: "Mail ingress", items: ["IMAP pull", "forwarding connector", "relay sync", "attachment import"] },
  { phase: "4", title: "Local AI", items: ["Ollama runner", "watcher DSL", "approval queue", "calendar/order extraction"] },
  { phase: "5", title: "Sovereign mail", items: ["SMTP receiver", "spam filter", "sending reputation", "advanced deploy docs"] },
];

export const apiSurface = [
  "/api/domain-setup",
  "/api/local-node",
  "/api/routing-modes",
  "/api/vault",
  "/api/connectors",
  "/api/watchers",
  "/api/security",
];
