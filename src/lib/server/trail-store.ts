import { mkdir, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";

export type NodeMode = "quick-domain" | "relay-node" | "sovereign-mx";
export type NodeRunState = "fresh" | "running" | "paused";
export type MailStatus = "inbox" | "flagged" | "archived" | "drafted";
export type MailFolder = "inbox" | "priority" | "orders" | "finance" | "sent" | "archive";
export type ActionStatus = "queued" | "approved" | "done" | "dismissed";

export interface DomainConfig {
  domain: string;
  mode: NodeMode;
  catchAll: boolean;
  createdAt: string;
}

export interface AliasRecord {
  id: string;
  address: string;
  destination: string;
  label: string;
  active: boolean;
  createdAt: string;
}

export interface WatcherRecord {
  id: string;
  name: string;
  rule: string;
  actions: string[];
  humanApprovalRequired: boolean;
  active: boolean;
  createdAt: string;
}

export interface MailRecord {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  bodyPreview: string;
  tags: string[];
  status: MailStatus;
  folder: MailFolder;
  unread: boolean;
  starred: boolean;
  importance: "low" | "normal" | "high";
  watcherMatches: string[];
  receivedAt: string;
}

export interface DraftRecord {
  id: string;
  threadId?: string;
  to: string;
  subject: string;
  body: string;
  sourceMailId?: string;
  status: "draft" | "queued" | "sent";
  createdAt: string;
  updatedAt: string;
}

export interface ContactRecord {
  id: string;
  email: string;
  name: string;
  company?: string;
  lastSeenAt: string;
  messageCount: number;
  tags: string[];
}

export interface QueueAction {
  id: string;
  type: "draft_reply" | "flag" | "order_update" | "calendar_extract" | "label";
  status: ActionStatus;
  mailId?: string;
  draftId?: string;
  title: string;
  detail: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface GraphNode {
  id: string;
  type: "contact" | "domain" | "alias" | "thread" | "tag";
  label: string;
  weight: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  weight: number;
}

export interface TrailSettings {
  localAiModel: string;
  approvalRequired: boolean;
  retentionDays: number;
  encryption: "local-dev" | "user-key";
}

export interface TrailEvent {
  id: string;
  type: string;
  message: string;
  at: string;
}

export type ConnectorStatus = "not-started" | "configured" | "connected" | "syncing" | "ready" | "error";

export interface DomainHostConfig {
  provider: "cloudflare" | "namecheap" | "registrar-dns" | "custom";
  domain: string;
  zoneId?: string;
  nameservers: string[];
  records: { type: "MX" | "TXT" | "CNAME"; host: string; value: string; priority?: number; status: ConnectorStatus }[];
  status: ConnectorStatus;
  updatedAt: string;
}

export interface DomainReceiverConfig {
  mode: "cloudflare-email-routing" | "gmail-imap" | "relay-webhook" | "sovereign-smtp";
  targetAddress: string;
  webhookPath: string;
  inboundSecretRef: string;
  status: ConnectorStatus;
  updatedAt: string;
}

export interface GmailConnectorConfig {
  clientIdRef: string;
  tokenRef: string;
  scopes: string[];
  historyId?: string;
  syncState: ConnectorStatus;
  lastScrapeAt?: string;
  imported: number;
  updatedAt: string;
}

export interface LocalModelConfig {
  id: string;
  provider: "ollama" | "llama-cpp" | "local-rule-engine";
  model: string;
  purpose: "watchers" | "summaries" | "drafts" | "embeddings";
  installCommand: string;
  status: ConnectorStatus;
  downloadedAt?: string;
  updatedAt: string;
}

export interface ToolConnectorConfig {
  id: string;
  name: string;
  type: "domain" | "mail" | "model" | "automation" | "storage";
  status: ConnectorStatus;
  notes: string;
  updatedAt: string;
}

export interface TrailState {
  version: 2;
  nodeId: string;
  runState: NodeRunState;
  home: string;
  domain?: DomainConfig;
  aliases: AliasRecord[];
  watchers: WatcherRecord[];
  mail: MailRecord[];
  drafts: DraftRecord[];
  contacts: ContactRecord[];
  actions: QueueAction[];
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  settings: TrailSettings;
  domainHost?: DomainHostConfig;
  receiver?: DomainReceiverConfig;
  gmail?: GmailConnectorConfig;
  localModels: LocalModelConfig[];
  tools: ToolConnectorConfig[];
  events: TrailEvent[];
  createdAt: string;
  updatedAt: string;
}

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
const folders = ["config", "keys", "vault", "mail", "attachments", "index", "graph", "watchers", "calendar", "orders", "queues", "backups", "logs", "drafts", "contacts"];

export function getTrailHome() {
  const configured = process.env.TRAIL_HOME?.trim();
  if (configured) return configured.replace(/^~(?=$|[\\/])/, os.homedir());
  return path.join(os.homedir(), ".trail");
}

async function ensureHome(home = getTrailHome()) {
  await mkdir(home, { recursive: true });
  await Promise.all(folders.map((folder) => mkdir(path.join(home, folder), { recursive: true })));
}

function dbPath(home = getTrailHome()) {
  return path.join(home, "config", "trail-state.json");
}

function redactBody(body: string) {
  const trimmed = String(body || "").replace(/\s+/g, " ").trim();
  if (!trimmed) return "No body preview.";
  return trimmed.length > 220 ? `${trimmed.slice(0, 220)}…` : trimmed;
}

function defaultSettings(): TrailSettings {
  return { localAiModel: "local-rule-engine", approvalRequired: true, retentionDays: 3650, encryption: "local-dev" };
}

function defaultState(home = getTrailHome()): TrailState {
  const at = now();
  return {
    version: 2,
    nodeId: id("node"),
    runState: "fresh",
    home,
    aliases: [],
    watchers: [],
    mail: [],
    drafts: [],
    contacts: [],
    actions: [],
    graph: { nodes: [], edges: [] },
    settings: defaultSettings(),
    localModels: [],
    tools: [],
    events: [{ id: id("evt"), type: "node.created", message: "Trail local node state created.", at }],
    createdAt: at,
    updatedAt: at,
  };
}

function normalizeState(parsed: Partial<TrailState> & { version?: number }, home: string): TrailState {
  const state = { ...defaultState(home), ...parsed, home } as TrailState;
  state.version = 2;
  state.aliases ||= [];
  state.watchers ||= [];
  state.mail = (state.mail || []).map((mail) => normalizeMail(mail as Partial<MailRecord>));
  state.drafts ||= [];
  state.contacts ||= [];
  state.actions ||= [];
  state.graph ||= { nodes: [], edges: [] };
  state.graph.nodes ||= [];
  state.graph.edges ||= [];
  state.settings = { ...defaultSettings(), ...(state.settings || {}) };
  state.localModels ||= [];
  state.tools ||= [];
  state.events ||= [];
  return state;
}

function normalizeMail(mail: Partial<MailRecord>): MailRecord {
  const body = mail.body || mail.bodyPreview || "";
  const subject = mail.subject?.trim() || "(no subject)";
  return {
    id: mail.id || id("mail"),
    threadId: mail.threadId || threadIdFor(subject, mail.from || ""),
    from: mail.from || "unknown@example.com",
    to: mail.to || "inbox@yourdomain.com",
    subject,
    body,
    bodyPreview: mail.bodyPreview || redactBody(body),
    tags: mail.tags || [],
    status: mail.status || "inbox",
    folder: mail.folder || folderFor(subject, body, mail.tags || []),
    unread: mail.unread ?? true,
    starred: mail.starred ?? false,
    importance: mail.importance || inferImportance(subject, body),
    watcherMatches: mail.watcherMatches || [],
    receivedAt: mail.receivedAt || now(),
  };
}

function threadIdFor(subject: string, from = "") {
  const cleaned = subject.toLowerCase().replace(/^(re|fwd):\s*/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "thread";
  const domain = from.split("@")[1]?.replace(/[^a-z0-9]+/g, "-") || "local";
  return `thread_${cleaned}_${domain}`;
}

function inferImportance(subject: string, body: string): "low" | "normal" | "high" {
  const text = `${subject} ${body}`.toLowerCase();
  if (/urgent|overdue|failed|refund|security|invoice|payment|deadline|delayed/.test(text)) return "high";
  if (/newsletter|receipt|digest/.test(text)) return "low";
  return "normal";
}

function folderFor(subject: string, body: string, tags: string[] = []): MailFolder {
  const text = `${subject} ${body} ${tags.join(" ")}`.toLowerCase();
  if (/order|package|delivery|receipt|refund|shipping/.test(text)) return "orders";
  if (/invoice|payment|bank|subscription|tax/.test(text)) return "finance";
  if (/urgent|security|deadline|delayed|important/.test(text)) return "priority";
  return "inbox";
}

function displayName(email: string) {
  const local = email.split("@")[0] || email;
  return local.replace(/[._-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export async function readTrailState(): Promise<TrailState> {
  const home = getTrailHome();
  await ensureHome(home);
  const file = dbPath(home);
  if (!existsSync(file)) {
    const state = defaultState(home);
    await writeTrailState(state);
    return state;
  }
  const raw = await readFile(file, "utf8");
  return normalizeState(JSON.parse(raw), home);
}

export async function writeTrailState(state: TrailState) {
  const home = getTrailHome();
  await ensureHome(home);
  const next = normalizeState({ ...state, updatedAt: now() }, home);
  await writeFile(dbPath(home), JSON.stringify(next, null, 2), "utf8");
  return next;
}

export async function appendEvent(state: TrailState, type: string, message: string) {
  state.events.unshift({ id: id("evt"), type, message, at: now() });
  state.events = state.events.slice(0, 160);
}

function upsertContact(state: TrailState, email: string, tags: string[] = []) {
  const normalized = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) return;
  const existing = state.contacts.find((contact) => contact.email === normalized);
  if (existing) {
    existing.messageCount += 1;
    existing.lastSeenAt = now();
    existing.tags = Array.from(new Set([...existing.tags, ...tags]));
  } else {
    state.contacts.unshift({ id: id("contact"), email: normalized, name: displayName(normalized), company: normalized.split("@")[1], lastSeenAt: now(), messageCount: 1, tags });
  }
}

function upsertGraphNode(state: TrailState, type: GraphNode["type"], label: string, weight = 1) {
  const key = `${type}:${label.toLowerCase()}`;
  const existing = state.graph.nodes.find((node) => node.id === key);
  if (existing) existing.weight += weight;
  else state.graph.nodes.push({ id: key, type, label, weight });
  return key;
}

function upsertGraphEdge(state: TrailState, source: string, target: string, label: string) {
  if (source === target) return;
  const key = `${source}->${target}:${label}`;
  const existing = state.graph.edges.find((edge) => edge.id === key);
  if (existing) existing.weight += 1;
  else state.graph.edges.push({ id: key, source, target, label, weight: 1 });
}

function indexMail(state: TrailState, mail: MailRecord) {
  upsertContact(state, mail.from, mail.tags);
  upsertContact(state, mail.to, ["alias"]);
  const fromNode = upsertGraphNode(state, "contact", mail.from);
  const toNode = upsertGraphNode(state, "alias", mail.to);
  const threadNode = upsertGraphNode(state, "thread", mail.subject);
  const domain = mail.from.split("@")[1];
  if (domain) {
    const domainNode = upsertGraphNode(state, "domain", domain);
    upsertGraphEdge(state, domainNode, fromNode, "owns");
  }
  upsertGraphEdge(state, fromNode, threadNode, "sent");
  upsertGraphEdge(state, threadNode, toNode, "delivered_to");
  mail.tags.forEach((tag) => upsertGraphEdge(state, threadNode, upsertGraphNode(state, "tag", tag), "tagged"));
}

function evaluateWatchers(state: TrailState, mail: MailRecord) {
  const text = `${mail.subject}\n${mail.body}\n${mail.tags.join(" ")}`.toLowerCase();
  for (const watcher of state.watchers.filter((item) => item.active)) {
    const terms = watcher.rule.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 4);
    const matched = terms.some((term) => text.includes(term)) || watcher.actions.some((action) => text.includes(action.replace(/_/g, " ")));
    if (!matched) continue;
    mail.watcherMatches.push(watcher.id);
    if (watcher.actions.includes("flag")) mail.status = "flagged";
    if (watcher.actions.includes("draft_reply")) {
      const draft = makeReplyDraft(mail);
      state.drafts.unshift(draft);
      state.actions.unshift({ id: id("act"), type: "draft_reply", status: watcher.humanApprovalRequired ? "queued" : "approved", mailId: mail.id, draftId: draft.id, title: `Draft reply for ${mail.subject}`, detail: `Generated by ${watcher.name}.`, createdAt: now() });
    }
    if (watcher.actions.includes("order_update")) {
      state.actions.unshift({ id: id("act"), type: "order_update", status: "queued", mailId: mail.id, title: `Review order update`, detail: mail.bodyPreview, createdAt: now() });
    }
  }
}

function makeReplyDraft(mail: MailRecord): DraftRecord {
  return {
    id: id("draft"),
    threadId: mail.threadId,
    to: mail.from,
    subject: mail.subject.toLowerCase().startsWith("re:") ? mail.subject : `Re: ${mail.subject}`,
    body: `Thanks for the update. I saw this and will follow up shortly.\n\n— Sent from Trail local draft assistant`,
    sourceMailId: mail.id,
    status: "draft",
    createdAt: now(),
    updatedAt: now(),
  };
}

export async function setupDomain(input: { domain: string; mode: NodeMode; catchAll?: boolean }) {
  const state = await readTrailState();
  const domain = input.domain.trim().toLowerCase().replace(/^@/, "");
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) throw new Error("Enter a valid domain like example.com.");
  state.domain = { domain, mode: input.mode, catchAll: Boolean(input.catchAll), createdAt: now() };
  state.runState = "running";
  await appendEvent(state, "domain.configured", `Domain ${domain} configured in ${input.mode} mode.`);
  return writeTrailState(state);
}

export async function setRunState(runState: NodeRunState) {
  const state = await readTrailState();
  state.runState = runState;
  await appendEvent(state, "node.state", `Local node set to ${runState}.`);
  return writeTrailState(state);
}

export async function createAlias(input: { address: string; destination: string; label?: string }) {
  const state = await readTrailState();
  const domain = state.domain?.domain;
  let address = input.address.trim().toLowerCase();
  if (domain && !address.includes("@")) address = `${address}@${domain}`;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address)) throw new Error("Alias must be a valid email address.");
  const alias: AliasRecord = { id: id("alias"), address, destination: input.destination.trim() || "local-vault", label: input.label?.trim() || "General", active: true, createdAt: now() };
  state.aliases.unshift(alias);
  upsertGraphNode(state, "alias", alias.address);
  await appendEvent(state, "alias.created", `Alias ${alias.address} routes to ${alias.destination}.`);
  return writeTrailState(state);
}

export async function createWatcher(input: { name: string; rule: string; actions?: string[]; humanApprovalRequired?: boolean }) {
  const state = await readTrailState();
  if (!input.name.trim() || !input.rule.trim()) throw new Error("Watcher name and rule are required.");
  const watcher: WatcherRecord = { id: id("watcher"), name: input.name.trim(), rule: input.rule.trim(), actions: input.actions?.length ? input.actions : ["scan", "flag", "draft_reply"], humanApprovalRequired: input.humanApprovalRequired ?? true, active: true, createdAt: now() };
  state.watchers.unshift(watcher);
  await appendEvent(state, "watcher.created", `Watcher ${watcher.name} added with local approval gate.`);
  return writeTrailState(state);
}

export async function createMail(input: { from: string; to: string; subject: string; body: string; tags?: string[] }) {
  const state = await readTrailState();
  const mail = normalizeMail({ from: input.from.trim(), to: input.to.trim(), subject: input.subject.trim() || "(no subject)", body: input.body, tags: input.tags?.length ? input.tags : ["local-import"], status: "inbox", unread: true });
  evaluateWatchers(state, mail);
  state.mail.unshift(mail);
  indexMail(state, mail);
  await appendEvent(state, "mail.imported", `Imported message into ${mail.folder}: ${mail.subject}.`);
  return writeTrailState(state);
}

export async function createDraft(input: { to: string; subject: string; body: string; sourceMailId?: string }) {
  const state = await readTrailState();
  const source = input.sourceMailId ? state.mail.find((mail) => mail.id === input.sourceMailId) : undefined;
  const draft: DraftRecord = { id: id("draft"), threadId: source?.threadId, to: input.to.trim(), subject: input.subject.trim() || "(no subject)", body: input.body.trim(), sourceMailId: source?.id, status: "draft", createdAt: now(), updatedAt: now() };
  state.drafts.unshift(draft);
  if (source) source.status = "drafted";
  await appendEvent(state, "draft.created", `Draft created for ${draft.to}.`);
  return writeTrailState(state);
}

export async function updateMail(input: { id: string; status?: MailStatus; folder?: MailFolder; unread?: boolean; starred?: boolean }) {
  const state = await readTrailState();
  const mail = state.mail.find((item) => item.id === input.id);
  if (!mail) throw new Error("Mail not found.");
  if (input.status) mail.status = input.status;
  if (input.folder) mail.folder = input.folder;
  if (typeof input.unread === "boolean") mail.unread = input.unread;
  if (typeof input.starred === "boolean") mail.starred = input.starred;
  await appendEvent(state, "mail.updated", `${mail.subject} updated.`);
  return writeTrailState(state);
}

export async function resolveAction(input: { id: string; status: ActionStatus }) {
  const state = await readTrailState();
  const action = state.actions.find((item) => item.id === input.id);
  if (!action) throw new Error("Action not found.");
  action.status = input.status;
  action.resolvedAt = now();
  if (action.draftId && input.status === "approved") {
    const draft = state.drafts.find((item) => item.id === action.draftId);
    if (draft) draft.status = "queued";
  }
  await appendEvent(state, "action.resolved", `${action.title} marked ${input.status}.`);
  return writeTrailState(state);
}

function dnsForDomain(domain: string, receiver = "Cloudflare Email Routing") {
  return [
    { type: "MX" as const, host: "@", value: receiver === "Sovereign SMTP" ? `10 mx.${domain}` : "10 route1.mx.cloudflare.net", priority: 10, status: "configured" as ConnectorStatus },
    { type: "TXT" as const, host: "@", value: "v=spf1 include:_spf.google.com include:_spf.mx.cloudflare.net ~all", status: "configured" as ConnectorStatus },
    { type: "TXT" as const, host: "_dmarc", value: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}`, status: "configured" as ConnectorStatus },
    { type: "TXT" as const, host: "trail._domainkey", value: "v=DKIM1; k=rsa; p=GENERATE_DKIM_KEY_IN_PRODUCTION", status: "not-started" as ConnectorStatus },
    { type: "CNAME" as const, host: "trail", value: "127-0-0-1.local-trail.invalid", status: "configured" as ConnectorStatus },
  ];
}

export async function configureDomainHost(input: { provider?: DomainHostConfig["provider"]; domain?: string; zoneId?: string; nameservers?: string[] }) {
  const state = await readTrailState();
  const domain = String(input.domain || state.domain?.domain || "yourdomain.com").trim().toLowerCase();
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) throw new Error("Enter a valid domain for the domain hoster.");
  state.domainHost = { provider: input.provider || "cloudflare", domain, zoneId: input.zoneId, nameservers: input.nameservers?.length ? input.nameservers : ["connect.cloudflare.com", "secure.cloudflare.com"], records: dnsForDomain(domain), status: "configured", updatedAt: now() };
  await appendEvent(state, "connector.domain_host", `${state.domainHost.provider} domain hoster configured for ${domain}.`);
  return writeTrailState(state);
}

export async function configureDomainReceiver(input: { mode?: DomainReceiverConfig["mode"]; targetAddress?: string }) {
  const state = await readTrailState();
  const domain = state.domainHost?.domain || state.domain?.domain || "yourdomain.com";
  state.receiver = { mode: input.mode || "cloudflare-email-routing", targetAddress: input.targetAddress || state.aliases[0]?.address || `inbox@${domain}`, webhookPath: "/api/ingress/relay", inboundSecretRef: "TRAIL_INBOUND_SECRET", status: "configured", updatedAt: now() };
  await appendEvent(state, "connector.receiver", `Domain receiver set to ${state.receiver.mode}.`);
  return writeTrailState(state);
}

export async function configureGmailConnector(input: { clientIdRef?: string; tokenRef?: string; scopes?: string[] }) {
  const state = await readTrailState();
  state.gmail = { clientIdRef: input.clientIdRef || "GOOGLE_CLIENT_ID", tokenRef: input.tokenRef || "GOOGLE_REFRESH_TOKEN", scopes: input.scopes?.length ? input.scopes : ["gmail.readonly", "gmail.modify"], historyId: state.gmail?.historyId || "local-history-start", syncState: "connected", imported: state.gmail?.imported || 0, lastScrapeAt: state.gmail?.lastScrapeAt, updatedAt: now() };
  await appendEvent(state, "connector.gmail", "Gmail OAuth connector configured with secret references only.");
  return writeTrailState(state);
}

export async function scrapeGmailHistory(input: { limit?: number } = {}) {
  let state = await readTrailState();
  if (!state.gmail) state = await configureGmailConnector({});
  state = await readTrailState();
  const count = Math.min(Math.max(Number(input.limit || 3), 1), 25);
  for (let i = 0; i < count; i += 1) {
    const subject = [`Gmail history import ${i + 1}: invoice and receipt`, `Gmail history import ${i + 1}: calendar update`, `Gmail history import ${i + 1}: security notice`][i % 3];
    const exists = state.mail.some((mail) => mail.subject === subject && mail.tags.includes("gmail-history"));
    if (!exists) state = await createMail({ from: `gmail-source-${i + 1}@example.com`, to: state.aliases[0]?.address || "inbox@yourdomain.com", subject, body: "Imported through the Gmail history scrape lane. Real OAuth tokens are referenced by env var names and are not stored in plaintext state.", tags: ["gmail-history", "oauth-import"] });
  }
  state = await readTrailState();
  state.gmail = { ...(state.gmail || { clientIdRef: "GOOGLE_CLIENT_ID", tokenRef: "GOOGLE_REFRESH_TOKEN", scopes: ["gmail.readonly"], syncState: "connected", imported: 0, updatedAt: now() }), imported: (state.gmail?.imported || 0) + count, syncState: "ready", lastScrapeAt: now(), historyId: `history_${Date.now()}`, updatedAt: now() };
  await appendEvent(state, "connector.gmail_scrape", `Gmail history scrape imported ${count} local message records.`);
  return writeTrailState(state);
}

export async function configureLocalModel(input: { provider?: LocalModelConfig["provider"]; model?: string; purpose?: LocalModelConfig["purpose"] }) {
  const state = await readTrailState();
  const provider = input.provider || "ollama";
  const model = input.model || "llama3.2:3b";
  const purpose = input.purpose || "watchers";
  const installCommand = provider === "ollama" ? `ollama pull ${model}` : provider === "llama-cpp" ? `huggingface-cli download ${model}` : "built-in local-rule-engine";
  const existing = state.localModels.find((item) => item.provider === provider && item.model === model && item.purpose === purpose);
  const record: LocalModelConfig = { id: existing?.id || id("model"), provider, model, purpose, installCommand, status: "configured", updatedAt: now(), downloadedAt: existing?.downloadedAt };
  state.localModels = [record, ...state.localModels.filter((item) => item.id !== record.id)];
  state.settings.localAiModel = model;
  await appendEvent(state, "connector.model", `Local model lane configured: ${provider}/${model} for ${purpose}.`);
  return writeTrailState(state);
}

export async function markLocalModelDownloaded(input: { id?: string; model?: string }) {
  const state = await readTrailState();
  let record = input.id ? state.localModels.find((item) => item.id === input.id) : state.localModels.find((item) => item.model === input.model);
  if (!record) {
    state.localModels.unshift({ id: id("model"), provider: "local-rule-engine", model: input.model || "local-rule-engine", purpose: "watchers", installCommand: "built-in local-rule-engine", status: "ready", downloadedAt: now(), updatedAt: now() });
    record = state.localModels[0];
  } else {
    record.status = "ready";
    record.downloadedAt = now();
    record.updatedAt = now();
  }
  await appendEvent(state, "connector.model_ready", `Local model marked ready: ${record.model}.`);
  return writeTrailState(state);
}

export async function configureTool(input: { name?: string; type?: ToolConnectorConfig["type"]; notes?: string; status?: ConnectorStatus }) {
  const state = await readTrailState();
  const tool: ToolConnectorConfig = { id: id("tool"), name: input.name || "Trail automation tool", type: input.type || "automation", status: input.status || "configured", notes: input.notes || "Configured from the Phase 1 connector surface.", updatedAt: now() };
  state.tools.unshift(tool);
  await appendEvent(state, "connector.tool", `Tool connector added: ${tool.name}.`);
  return writeTrailState(state);
}

export function searchTrailState(state: TrailState, query = "") {
  const q = query.trim().toLowerCase();
  if (!q) return { mail: state.mail.slice(0, 20), drafts: state.drafts.slice(0, 10), contacts: state.contacts.slice(0, 20), actions: state.actions.slice(0, 20) };
  const includes = (...values: string[]) => values.join(" ").toLowerCase().includes(q);
  return {
    mail: state.mail.filter((mail) => includes(mail.from, mail.to, mail.subject, mail.body, mail.tags.join(" "))).slice(0, 30),
    drafts: state.drafts.filter((draft) => includes(draft.to, draft.subject, draft.body)).slice(0, 20),
    contacts: state.contacts.filter((contact) => includes(contact.email, contact.name, contact.company || "", contact.tags.join(" "))).slice(0, 30),
    actions: state.actions.filter((action) => includes(action.title, action.detail, action.type, action.status)).slice(0, 30),
  };
}

export async function seedPlatformData() {
  let state = await readTrailState();
  if (!state.domain) state = await setupDomain({ domain: "yourdomain.com", mode: "quick-domain", catchAll: true });
  if (!state.aliases.length) state = await createAlias({ address: "inbox", destination: "local-vault", label: "Main inbox" });
  if (!state.watchers.length) {
    state = await createWatcher({ name: "Order watcher", rule: "Track receipts, shipping changes, refunds, delivery delays, and package updates.", actions: ["scan", "order_update", "flag", "draft_reply"], humanApprovalRequired: true });
    state = await createWatcher({ name: "Finance guard", rule: "Flag invoices, payment failures, tax notices, renewals, and subscription charges.", actions: ["scan", "flag", "label"], humanApprovalRequired: false });
  }
  state = await readTrailState();
  const samples = [
    { from: "orders@shop.example", to: state.aliases[0]?.address || "inbox@yourdomain.com", subject: "Your package is delayed", body: "Delivery moved by two days. Trail should update the local order timeline and flag if it changes again.", tags: ["order", "delivery"] },
    { from: "billing@vercel.example", to: state.aliases[0]?.address || "inbox@yourdomain.com", subject: "Invoice paid for Trail deployment", body: "Your monthly invoice has been paid. Download invoice PDF from your dashboard.", tags: ["finance", "invoice"] },
    { from: "security@cloudflare.example", to: state.aliases[0]?.address || "inbox@yourdomain.com", subject: "Security alert: DNS record changed", body: "A DNS record was changed for your domain. Review SPF, DKIM, DMARC, and routing settings.", tags: ["security", "domain"] },
  ];
  for (const sample of samples) {
    const exists = state.mail.some((mail) => mail.subject === sample.subject && mail.from === sample.from);
    if (!exists) state = await createMail(sample);
  }
  state = await readTrailState();
  if (!state.domainHost) state = await configureDomainHost({ provider: "cloudflare", domain: state.domain?.domain || "yourdomain.com" });
  if (!state.receiver) state = await configureDomainReceiver({ mode: "cloudflare-email-routing", targetAddress: state.aliases[0]?.address });
  if (!state.gmail) state = await configureGmailConnector({});
  if (!state.localModels.length) state = await configureLocalModel({ provider: "local-rule-engine", model: "local-rule-engine", purpose: "watchers" });
  state = await readTrailState();
  await appendEvent(state, "platform.seeded", "Platform inbox, graph, contacts, drafts, connector lanes, and action queue seeded.");
  return writeTrailState(state);
}

export async function seedDemoData() {
  return seedPlatformData();
}

export function publicStatus(state: TrailState) {
  return {
    nodeId: state.nodeId,
    runState: state.runState,
    home: state.home,
    domain: state.domain,
    counts: {
      aliases: state.aliases.length,
      watchers: state.watchers.length,
      mail: state.mail.length,
      drafts: state.drafts.length,
      contacts: state.contacts.length,
      actions: state.actions.length,
      events: state.events.length,
      graphNodes: state.graph.nodes.length,
      graphEdges: state.graph.edges.length,
      localModels: state.localModels.length,
      tools: state.tools.length,
      connectors: [state.domainHost, state.receiver, state.gmail, ...state.localModels, ...state.tools].filter(Boolean).length,
    },
    updatedAt: state.updatedAt,
  };
}

export function platformSummary(state: TrailState, query = "") {
  const folders = state.mail.reduce<Record<string, number>>((acc, mail) => {
    acc[mail.folder] = (acc[mail.folder] || 0) + 1;
    return acc;
  }, {});
  const unread = state.mail.filter((mail) => mail.unread).length;
  const priority = state.mail.filter((mail) => mail.importance === "high" || mail.folder === "priority").length;
  return {
    status: publicStatus(state),
    folders,
    unread,
    priority,
    settings: state.settings,
    connectors: {
      domainHost: state.domainHost,
      receiver: state.receiver,
      gmail: state.gmail,
      localModels: state.localModels,
      tools: state.tools,
    },
    aliases: state.aliases,
    watchers: state.watchers,
    mail: state.mail,
    drafts: state.drafts,
    contacts: state.contacts,
    actions: state.actions,
    graph: state.graph,
    events: state.events.slice(0, 30),
    search: searchTrailState(state, query),
  };
}
