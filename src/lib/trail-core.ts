
export type ConnectorKind = "gmail" | "outlook" | "imap" | "custom-domain" | "forward-only";
export type MessageAction = "scan" | "flag" | "archive" | "draft_reply" | "send_reply" | "forward" | "calendar_note" | "order_update";
export type TrustLevel = "local-only" | "zero-access" | "server-blind";

export interface TrailAccount {
  id: string;
  plan: "$4.99-unlimited";
  paidUntil: string;
  identityMode: "number-only";
  inactiveBurnAfterDays: 365;
  recovery: "user-held-key-or-seed-only";
}

export interface Connector {
  id: string;
  kind: ConnectorKind;
  label: string;
  status: "connected" | "needs-attention" | "paused";
  direction: "inbound" | "outbound" | "both";
  privacy: TrustLevel;
  description: string;
}

export interface Watcher {
  id: string;
  title: string;
  naturalLanguageRule: string;
  allowedActions: MessageAction[];
  modelTarget: "ollama-local" | "tiny-local" | "manual-review";
  requiresHumanConfirmBeforeSend: boolean;
}

export interface TimelineEvent {
  id: string;
  actor: string;
  subject: string;
  at: string;
  tags: string[];
  summary: string;
}

export interface KnowledgeNode {
  id: string;
  label: string;
  type: "person" | "domain" | "thread" | "order" | "calendar" | "alias" | "attachment";
  weight: number;
}

export const productPrinciples = [
  "The user owns the mailbox, keys, recovery phrase, timeline, and knowledge base.",
  "Server stores encrypted blobs and routing metadata only; private content is decrypted client-side.",
  "Password reset cannot recover old mail. If password and recovery key are lost, the mailbox is gone.",
  "Inactive paid/expired accounts older than one year are cryptographically burned by deleting encrypted blobs and key envelopes.",
  "AI automation defaults to local Ollama/tiny models and never needs server-side plaintext.",
  "Heavy abuse controls protect deliverability without requiring real-world identity.",
];

export const connectors: Connector[] = [
  {
    id: "gmail-primary",
    kind: "gmail",
    label: "Current Gmail bridge",
    status: "connected",
    direction: "both",
    privacy: "server-blind",
    description: "OAuth connector imports headers, encrypts message bodies client-side, and forwards through Trail aliases.",
  },
  {
    id: "imap-legacy",
    kind: "imap",
    label: "Legacy IMAP vault",
    status: "paused",
    direction: "inbound",
    privacy: "zero-access",
    description: "Pulls existing inboxes into encrypted local history while preserving folder labels and CC chains.",
  },
  {
    id: "domain-routing",
    kind: "custom-domain",
    label: "Custom domain MX",
    status: "connected",
    direction: "both",
    privacy: "zero-access",
    description: "Routes unlimited addresses and aliases into encrypted inboxes with DKIM, SPF, DMARC, and spam controls.",
  },
  {
    id: "forwarding",
    kind: "forward-only",
    label: "Auto-forward mesh",
    status: "connected",
    direction: "outbound",
    privacy: "server-blind",
    description: "Rules can forward, archive, tag, or fan-out messages without storing readable content on Trail servers.",
  },
];

export const watchers: Watcher[] = [
  {
    id: "boss-trip",
    title: "Boss trip watcher",
    naturalLanguageRule: "Watch for an email from my boss about the trip next month, make a calendar note, and draft a reply asking if I can bring my son.",
    allowedActions: ["scan", "flag", "calendar_note", "draft_reply"],
    modelTarget: "ollama-local",
    requiresHumanConfirmBeforeSend: true,
  },
  {
    id: "order-tracker",
    title: "Order tracker",
    naturalLanguageRule: "Find receipts, shipping emails, delivery changes, refunds, and warranty messages. Keep a live order timeline.",
    allowedActions: ["scan", "order_update", "archive", "flag"],
    modelTarget: "tiny-local",
    requiresHumanConfirmBeforeSend: false,
  },
  {
    id: "sensitive-mail",
    title: "Sensitive mail shield",
    naturalLanguageRule: "Flag legal, school, billing, security, and account recovery messages; never auto-send without review.",
    allowedActions: ["scan", "flag", "draft_reply"],
    modelTarget: "ollama-local",
    requiresHumanConfirmBeforeSend: true,
  },
];

export const timeline: TimelineEvent[] = [
  { id: "t1", actor: "boss@company.com", subject: "July trip planning", at: "09:14", tags: ["travel", "calendar", "needs reply"], summary: "Mentions dates next month; AI drafted a polite question about bringing son." },
  { id: "t2", actor: "orders@shop.com", subject: "Package delayed", at: "10:22", tags: ["order", "delivery"], summary: "Delivery moved by 2 days; order tracker updated expected date." },
  { id: "t3", actor: "security@bank.com", subject: "New login", at: "11:03", tags: ["security", "high priority"], summary: "Flagged as sensitive; no AI reply allowed." },
  { id: "t4", actor: "newsletter@tools.dev", subject: "Local LLM digest", at: "12:48", tags: ["ai", "archive"], summary: "Summarized locally and archived into knowledge base." },
];

export const graphNodes: KnowledgeNode[] = [
  { id: "n1", label: "You", type: "person", weight: 100 },
  { id: "n2", label: "boss@company.com", type: "person", weight: 82 },
  { id: "n3", label: "July trip", type: "calendar", weight: 70 },
  { id: "n4", label: "Shop order #4821", type: "order", weight: 64 },
  { id: "n5", label: "bank.com", type: "domain", weight: 76 },
  { id: "n6", label: "family context", type: "thread", weight: 48 },
  { id: "n7", label: "alias: travel@", type: "alias", weight: 54 },
];

export const securityLayers = [
  "Client-side Argon2id key derivation",
  "User-held recovery phrase; no server recovery bypass",
  "Encrypted message body, attachment, index, and knowledge graph blobs",
  "Minimal routing metadata with retention windows",
  "Automatic crypto-burn for inactive accounts after 1 year",
  "Rspamd + DKIM/SPF/DMARC + outbound reputation guardrails",
  "Human approval gate for risky AI sends",
  "Local Ollama/TinyLLM tool sandbox for private automation",
];
