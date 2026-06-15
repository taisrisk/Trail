import { syncGmail } from "./sync/gmail";
import { configureCloudflareDNS } from "./dns/cloudflare";
import { mkdir, readFile, rename } from "fs/promises";
import { existsSync } from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";
import { DatabaseSync } from "node:sqlite";

import {
  getTransientKey,
  setTransientKey,
  isLocked,
  getOrCreateLocalKey,
  deriveKeyFromPassword,
  encrypt,
  decrypt,
  generateVerifyBlock,
  unlockWithLocalDevKey,
  unlockWithPassword
} from "./crypto";

import { writeBlob, readBlob } from "./blob-store";

export type NodeMode = "quick-domain" | "relay-node" | "sovereign-mx";
export type NodeRunState = "fresh" | "running" | "paused";
export type MailStatus = "inbox" | "flagged" | "archived" | "drafted";
export type MailFolder = "inbox" | "priority" | "orders" | "finance" | "sent" | "archive";
export type ActionStatus = "queued" | "approved" | "done" | "dismissed";
export type ConnectorStatus = "not-started" | "configured" | "connected" | "syncing" | "ready" | "error";

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
  searchIndex?: Record<string, string[]>;
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
  vaultState: "fresh" | "ready" | "locked";
}

// Database Row Interfaces
interface SettingsRow {
  key: string;
  value: string;
}
interface AliasRow {
  id: string;
  address: string;
  destination: string;
  label: string;
  active: number;
  createdAt: string;
}
interface WatcherRow {
  id: string;
  name: string;
  rule: string;
  actions: string;
  humanApprovalRequired: number;
  active: number;
  createdAt: string;
}
interface MailRow {
  id: string;
  threadId: string;
  status: string;
  folder: string;
  unread: number;
  starred: number;
  importance: string;
  receivedAt: string;
  encrypted_data: string | null;
  nonce: string | null;
  tag: string | null;
}
interface DraftRow {
  id: string;
  threadId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  encrypted_data: string | null;
  nonce: string | null;
  tag: string | null;
}
interface ContactRow {
  id: string;
  email_hash: string;
  lastSeenAt: string;
  messageCount: number;
  encrypted_data: string | null;
  nonce: string | null;
  tag: string | null;
}
interface ActionRow {
  id: string;
  type: string;
  status: string;
  mailId: string | null;
  draftId: string | null;
  title: string;
  detail: string;
  createdAt: string;
  resolvedAt: string | null;
}
interface GraphNodeRow {
  id: string;
  type: string;
  label: string;
  weight: number;
}
interface GraphEdgeRow {
  id: string;
  source: string;
  target: string;
  label: string;
  weight: number;
}
interface EventRow {
  id: string;
  type: string;
  message: string;
  at: string;
}

interface LocalModelRow {
  id: string;
  provider: string;
  model: string;
  purpose: string;
  installCommand: string;
  status: string;
  downloadedAt: string | null;
  updatedAt: string;
}
interface ToolRow {
  id: string;
  name: string;
  type: string;
  status: string;
  notes: string | null;
  updatedAt: string;
}

// Plaintext Schema Migration Row Interfaces
interface OldMailRow {
  id: string;
  threadId: string;
  from_address: string;
  to_address: string;
  subject: string;
  body: string;
  bodyPreview: string;
  tags: string;
  status: string;
  folder: string;
  unread: number;
  starred: number;
  importance: string;
  watcherMatches: string;
  receivedAt: string;
}
interface OldDraftRow {
  id: string;
  threadId: string | null;
  to_address: string;
  subject: string;
  body: string;
  sourceMailId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}
interface OldContactRow {
  id: string;
  email: string;
  name: string;
  company: string | null;
  lastSeenAt: string;
  messageCount: number;
  tags: string;
}

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
const folders = ["config", "keys", "vault", "mail", "attachments", "index", "graph", "watchers", "calendar", "orders", "queues", "backups", "logs", "drafts", "contacts"];

const wordlist = [
  "apple", "banana", "cherry", "depth", "earth", "forest", "grape", "house", "island", "jungle",
  "light", "mountain", "ocean", "river", "stone", "tiger", "valley", "water", "winter", "yellow",
  "anchor", "bridge", "canyon", "desert", "engine", "flower", "garden", "harbor", "jacket", "lantern"
];

export function generateRecoveryPhrase(): string {
  const words: string[] = [];
  for (let i = 0; i < 12; i++) {
    const idx = crypto.randomInt(0, wordlist.length);
    words.push(wordlist[idx]);
  }
  return words.join(" ");
}

export function getTrailHome() {
  const configured = process.env.TRAIL_HOME?.trim();
  if (configured) return configured.replace(/^~(?=$|[\\/])/, os.homedir());
  return path.join(os.homedir(), ".trail");
}

async function ensureHome(home = getTrailHome()) {
  await mkdir(home, { recursive: true });
  await Promise.all(folders.map((folder) => mkdir(path.join(home, folder), { recursive: true })));
}

function sqlitePath(home = getTrailHome()) {
  return path.join(home, "config", "trail.db");
}

let _db: DatabaseSync | null = null;
let pendingMigrationData: {
  mail: OldMailRow[];
  drafts: OldDraftRow[];
  contacts: OldContactRow[];
} | null = null;
let initPromise: Promise<void> | null = null;

export function getDb() {
  if (_db) return _db;
  const home = getTrailHome();
  const file = sqlitePath(home);
  _db = new DatabaseSync(file);
  initSchema(_db);
  return _db;
}

function initSchema(db: DatabaseSync) {
  const checkOldTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='mail'").get() as { name: string } | undefined;
  let oldMailData: OldMailRow[] = [];
  let oldDraftData: OldDraftRow[] = [];
  let oldContactData: OldContactRow[] = [];

  if (checkOldTable) {
    const colInfo = db.prepare("PRAGMA table_info(mail)").all() as Array<{ name: string }>;
    const hasEncryptedData = colInfo.some((col) => col.name === "encrypted_data");
    
    if (!hasEncryptedData) {
      console.log("Upgrading Trail database from plaintext SQLite to encrypted SQLite schema...");
      try {
        oldMailData = db.prepare("SELECT * FROM mail").all() as unknown as OldMailRow[];
        oldDraftData = db.prepare("SELECT * FROM drafts").all() as unknown as OldDraftRow[];
        oldContactData = db.prepare("SELECT * FROM contacts").all() as unknown as OldContactRow[];
        
        pendingMigrationData = {
          mail: oldMailData,
          drafts: oldDraftData,
          contacts: oldContactData
        };
      } catch (err) {
        console.error("Failed to read old database values:", err);
      }
      
      db.exec("DROP TABLE IF EXISTS mail");
      db.exec("DROP TABLE IF EXISTS drafts");
      db.exec("DROP TABLE IF EXISTS contacts");
    }
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS aliases (
      id TEXT PRIMARY KEY,
      address TEXT UNIQUE,
      destination TEXT,
      label TEXT,
      active INTEGER,
      createdAt TEXT
    );
    CREATE TABLE IF NOT EXISTS watchers (
      id TEXT PRIMARY KEY,
      name TEXT,
      rule TEXT,
      actions TEXT,
      humanApprovalRequired INTEGER,
      active INTEGER,
      createdAt TEXT
    );
    CREATE TABLE IF NOT EXISTS mail (
      id TEXT PRIMARY KEY,
      threadId TEXT,
      status TEXT,
      folder TEXT,
      unread INTEGER,
      starred INTEGER,
      importance TEXT,
      receivedAt TEXT,
      encrypted_data TEXT,
      nonce TEXT,
      tag TEXT
    );
    CREATE TABLE IF NOT EXISTS drafts (
      id TEXT PRIMARY KEY,
      threadId TEXT,
      status TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      encrypted_data TEXT,
      nonce TEXT,
      tag TEXT
    );
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      email_hash TEXT UNIQUE,
      lastSeenAt TEXT,
      messageCount INTEGER,
      encrypted_data TEXT,
      nonce TEXT,
      tag TEXT
    );
    CREATE TABLE IF NOT EXISTS actions (
      id TEXT PRIMARY KEY,
      type TEXT,
      status TEXT,
      mailId TEXT,
      draftId TEXT,
      title TEXT,
      detail TEXT,
      createdAt TEXT,
      resolvedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS graph_nodes (
      id TEXT PRIMARY KEY,
      type TEXT,
      label TEXT,
      weight INTEGER
    );
    CREATE TABLE IF NOT EXISTS graph_edges (
      id TEXT PRIMARY KEY,
      source TEXT,
      target TEXT,
      label TEXT,
      weight INTEGER
    );
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      type TEXT,
      message TEXT,
      at TEXT
    );
    CREATE TABLE IF NOT EXISTS connectors (
      name TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS local_models (
      id TEXT PRIMARY KEY,
      provider TEXT,
      model TEXT,
      purpose TEXT,
      installCommand TEXT,
      status TEXT,
      downloadedAt TEXT,
      updatedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS tools (
      id TEXT PRIMARY KEY,
      name TEXT,
      type TEXT,
      status TEXT,
      notes TEXT,
      updatedAt TEXT
    );
  `);
}

async function performPlaintextSqlMigration(db: DatabaseSync, home: string, data: { mail: OldMailRow[]; drafts: OldDraftRow[]; contacts: OldContactRow[] }) {
  try {
    const key = await getOrCreateLocalKey(home);

    // 1. Write blobs asynchronously before starting the SQLite transaction
    const mailWithBlobs = [];
    for (const m of data.mail) {
      const bodyBlobId = await writeBlob(home, m.body || "", key);
      mailWithBlobs.push({ m, bodyBlobId });
    }

    const draftsWithBlobs = [];
    for (const d of data.drafts) {
      const bodyBlobId = await writeBlob(home, d.body || "", key);
      draftsWithBlobs.push({ d, bodyBlobId });
    }

    // 2. Perform SQLite transaction synchronously without yielding the event loop
    db.exec("BEGIN TRANSACTION");
    try {
      const insertMail = db.prepare("INSERT INTO mail (id, threadId, status, folder, unread, starred, importance, receivedAt, encrypted_data, nonce, tag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
      for (const { m, bodyBlobId } of mailWithBlobs) {
        const rawPayload = JSON.stringify({
          from: m.from_address,
          to: m.to_address,
          subject: m.subject,
          bodyPreview: m.bodyPreview,
          bodyRef: bodyBlobId,
          tags: JSON.parse(m.tags || "[]"),
          watcherMatches: JSON.parse(m.watcherMatches || "[]")
        });
        const enc = encrypt(rawPayload, key);
        insertMail.run(m.id, m.threadId, m.status, m.folder, m.unread, m.starred, m.importance, m.receivedAt, enc.ciphertext, enc.nonce, enc.tag);
      }

      const insertDraft = db.prepare("INSERT INTO drafts (id, threadId, status, createdAt, updatedAt, encrypted_data, nonce, tag) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
      for (const { d, bodyBlobId } of draftsWithBlobs) {
        const rawPayload = JSON.stringify({
          to: d.to_address,
          subject: d.subject,
          bodyRef: bodyBlobId,
          sourceMailId: d.sourceMailId
        });
        const enc = encrypt(rawPayload, key);
        insertDraft.run(d.id, d.threadId, d.status, d.createdAt, d.updatedAt, enc.ciphertext, enc.nonce, enc.tag);
      }

      const insertContact = db.prepare("INSERT INTO contacts (id, email_hash, lastSeenAt, messageCount, encrypted_data, nonce, tag) VALUES (?, ?, ?, ?, ?, ?, ?)");
      for (const c of data.contacts) {
        const emailHash = crypto.createHash("sha256").update(c.email).digest("hex");
        const rawPayload = JSON.stringify({
          email: c.email,
          name: c.name,
          company: c.company,
          tags: JSON.parse(c.tags || "[]")
        });
        const enc = encrypt(rawPayload, key);
        insertContact.run(c.id, emailHash, c.lastSeenAt, c.messageCount, enc.ciphertext, enc.nonce, enc.tag);
      }
      db.exec("COMMIT");
      console.log(`Successfully migrated ${data.mail.length} mails, ${data.drafts.length} drafts, and ${data.contacts.length} contacts.`);
    } catch (err) {
      db.exec("ROLLBACK");
      console.error("Migration transactions failed:", err);
    }
  } catch (err) {
    console.error("Migration key generation failed:", err);
  }
}

async function migrateFromJsonIfNecessary(db: DatabaseSync, home: string) {
  const jsonFile = path.join(home, "config", "trail-state.json");
  if (!existsSync(jsonFile)) return;
  try {
    const raw = await readFile(jsonFile, "utf8");
    const state = JSON.parse(raw);
    const checkRow = db.prepare("SELECT COUNT(*) as count FROM events").get() as { count: number } | undefined;
    if (checkRow && checkRow.count > 1) {
      await rename(jsonFile, jsonFile + ".bak");
      return;
    }

    const key = await getOrCreateLocalKey(home);
    setTransientKey(key);

    const insertSetting = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    if (state.settings) {
      for (const [k, val] of Object.entries(state.settings)) {
        insertSetting.run(k, typeof val === "object" ? JSON.stringify(val) : String(val));
      }
    }
    insertSetting.run("nodeId", state.nodeId || id("node"));
    insertSetting.run("runState", state.runState || "running");
    insertSetting.run("createdAt", state.createdAt || now());

    if (state.aliases) {
      const stmt = db.prepare("INSERT OR REPLACE INTO aliases (id, address, destination, label, active, createdAt) VALUES (?, ?, ?, ?, ?, ?)");
      for (const a of state.aliases) {
        stmt.run(a.id, a.address, a.destination, a.label, a.active ? 1 : 0, a.createdAt);
      }
    }
    if (state.watchers) {
      const stmt = db.prepare("INSERT OR REPLACE INTO watchers (id, name, rule, actions, humanApprovalRequired, active, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)");
      for (const w of state.watchers) {
        stmt.run(w.id, w.name, w.rule, JSON.stringify(w.actions), w.humanApprovalRequired ? 1 : 0, w.active ? 1 : 0, w.createdAt);
      }
    }
    if (state.mail) {
      const stmt = db.prepare("INSERT OR REPLACE INTO mail (id, threadId, status, folder, unread, starred, importance, receivedAt, encrypted_data, nonce, tag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
      for (const m of state.mail) {
        const bodyBlobId = await writeBlob(home, m.body || "", key);
        const payload = JSON.stringify({
          from: m.from,
          to: m.to,
          subject: m.subject,
          bodyPreview: m.bodyPreview,
          bodyRef: bodyBlobId,
          tags: m.tags || [],
          watcherMatches: m.watcherMatches || []
        });
        const enc = encrypt(payload, key);
        stmt.run(m.id, m.threadId, m.status, m.folder, m.unread ? 1 : 0, m.starred ? 1 : 0, m.importance, m.receivedAt, enc.ciphertext, enc.nonce, enc.tag);
      }
    }
    if (state.drafts) {
      const stmt = db.prepare("INSERT OR REPLACE INTO drafts (id, threadId, status, createdAt, updatedAt, encrypted_data, nonce, tag) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
      for (const d of state.drafts) {
        const bodyBlobId = await writeBlob(home, d.body || "", key);
        const payload = JSON.stringify({
          to: d.to,
          subject: d.subject,
          bodyRef: bodyBlobId,
          sourceMailId: d.sourceMailId
        });
        const enc = encrypt(payload, key);
        stmt.run(d.id, d.threadId || null, d.status, d.createdAt, d.updatedAt, enc.ciphertext, enc.nonce, enc.tag);
      }
    }
    if (state.contacts) {
      const stmt = db.prepare("INSERT OR REPLACE INTO contacts (id, email_hash, lastSeenAt, messageCount, encrypted_data, nonce, tag) VALUES (?, ?, ?, ?, ?, ?, ?)");
      for (const c of state.contacts) {
        const emailHash = crypto.createHash("sha256").update(c.email).digest("hex");
        const payload = JSON.stringify({
          email: c.email,
          name: c.name,
          company: c.company,
          tags: c.tags || []
        });
        const enc = encrypt(payload, key);
        stmt.run(c.id, emailHash, c.lastSeenAt, c.messageCount, enc.ciphertext, enc.nonce, enc.tag);
      }
    }
    if (state.actions) {
      const stmt = db.prepare("INSERT OR REPLACE INTO actions (id, type, status, mailId, draftId, title, detail, createdAt, resolvedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
      for (const act of state.actions) {
        stmt.run(act.id, act.type, act.status, act.mailId || null, act.draftId || null, act.title, act.detail, act.createdAt, act.resolvedAt || null);
      }
    }
    if (state.graph?.nodes) {
      const stmt = db.prepare("INSERT OR REPLACE INTO graph_nodes (id, type, label, weight) VALUES (?, ?, ?, ?)");
      for (const n of state.graph.nodes) {
        stmt.run(n.id, n.type, n.label, n.weight);
      }
    }
    if (state.graph?.edges) {
      const stmt = db.prepare("INSERT OR REPLACE INTO graph_edges (id, source, target, label, weight) VALUES (?, ?, ?, ?, ?)");
      for (const e of state.graph.edges) {
        stmt.run(e.id, e.source, e.target, e.label, e.weight);
      }
    }
    if (state.events) {
      const stmt = db.prepare("INSERT OR REPLACE INTO events (id, type, message, at) VALUES (?, ?, ?, ?)");
      for (const ev of state.events) {
        stmt.run(ev.id, ev.type, ev.message, ev.at);
      }
    }
    const insertConnector = db.prepare("INSERT OR REPLACE INTO connectors (name, value) VALUES (?, ?)");
    if (state.domainHost) insertConnector.run("domainHost", JSON.stringify(state.domainHost));
    if (state.receiver) insertConnector.run("receiver", JSON.stringify(state.receiver));
    if (state.gmail) insertConnector.run("gmail", JSON.stringify(state.gmail));
    if (state.domain) insertConnector.run("domain", JSON.stringify(state.domain));
    if (state.localModels) {
      const stmt = db.prepare("INSERT OR REPLACE INTO local_models (id, provider, model, purpose, installCommand, status, downloadedAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
      for (const m of state.localModels) {
        stmt.run(m.id, m.provider, m.model, m.purpose, m.installCommand, m.status, m.downloadedAt || null, m.updatedAt);
      }
    }
    if (state.tools) {
      const stmt = db.prepare("INSERT OR REPLACE INTO tools (id, name, type, status, notes, updatedAt) VALUES (?, ?, ?, ?, ?, ?)");
      for (const t of state.tools) {
        stmt.run(t.id, t.name, t.type, t.status, t.notes || null, t.updatedAt);
      }
    }
    const insertEvent = db.prepare("INSERT INTO events (id, type, message, at) VALUES (?, ?, ?, ?)");
    insertEvent.run(id("evt"), "node.sqlite_migrated", "Migrated local node state from JSON to SQLite.", now());
    await rename(jsonFile, jsonFile + ".bak");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

async function doInitialization(db: DatabaseSync, home: string) {
  if (pendingMigrationData) {
    const data = pendingMigrationData;
    pendingMigrationData = null;
    await performPlaintextSqlMigration(db, home, data);
  }
  await migrateFromJsonIfNecessary(db, home);
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
    vaultState: "fresh"
  };
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

// Function to map settings key/values with types
interface DbSettings {
  nodeId?: string;
  runState?: NodeRunState;
  createdAt?: string;
  localAiModel?: string;
  approvalRequired?: boolean;
  retentionDays?: number;
  encryption?: "local-dev" | "user-key";
  passwordSalt?: string;
  verifyBlock?: string;
  verifyNonce?: string;
  verifyTag?: string;
  recoverySalt?: string;
  recoveryBlock?: string;
  recoveryNonce?: string;
  recoveryTag?: string;
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
  const db = getDb();
  
  if (!initPromise) {
    initPromise = doInitialization(db, home);
  }
  await initPromise;

  const checkSettings = db.prepare("SELECT COUNT(*) as count FROM settings").get() as { count: number } | undefined;
  if (!checkSettings || checkSettings.count === 0) {
    const state = defaultState(home);
    await writeTrailState(state);
    return state;
  }

  const settingsRows = db.prepare("SELECT * FROM settings").all() as unknown as SettingsRow[];
  const settingsObj: DbSettings = {};
  for (const row of settingsRows) {
    if (row.key === "approvalRequired") settingsObj[row.key] = row.value === "true";
    else if (row.key === "retentionDays") settingsObj[row.key] = Number(row.value);
    else if (row.key === "encryption") settingsObj[row.key] = row.value as "local-dev" | "user-key";
    else settingsObj[row.key as keyof DbSettings] = row.value as unknown as never;
  }

  const encryption = settingsObj.encryption || "local-dev";
  const settings = {
    localAiModel: String(settingsObj.localAiModel || "local-rule-engine"),
    approvalRequired: settingsObj.approvalRequired !== false,
    retentionDays: Number(settingsObj.retentionDays ?? 3650),
    encryption
  };

  const nodeId = String(settingsObj.nodeId || id("node"));
  const runState = settingsObj.runState || "fresh";
  const createdAt = String(settingsObj.createdAt || now());

  // Handle local-dev auto unlock
  if (encryption === "local-dev" && isLocked()) {
    try {
      await unlockWithLocalDevKey(home);
    } catch (err) {
      console.error("Auto unlock with local device key failed:", err);
    }
  }

  let vaultState: TrailState["vaultState"] = "locked";
  if (isLocked()) {
    vaultState = "locked";
  } else {
    vaultState = "ready";
  }

  const aliasesRows = db.prepare("SELECT * FROM aliases ORDER BY createdAt DESC").all() as unknown as AliasRow[];
  const aliases: AliasRecord[] = aliasesRows.map((r) => ({
    id: r.id,
    address: r.address,
    destination: r.destination,
    label: r.label,
    active: r.active === 1,
    createdAt: r.createdAt
  }));

  const watchersRows = db.prepare("SELECT * FROM watchers ORDER BY createdAt DESC").all() as unknown as WatcherRow[];
  const watchers: WatcherRecord[] = watchersRows.map((r) => ({
    id: r.id,
    name: r.name,
    rule: r.rule,
    actions: JSON.parse(r.actions || "[]"),
    humanApprovalRequired: r.humanApprovalRequired === 1,
    active: r.active === 1,
    createdAt: r.createdAt
  }));

  const actionsRows = db.prepare("SELECT * FROM actions ORDER BY createdAt DESC").all() as unknown as ActionRow[];
  const actions: QueueAction[] = actionsRows.map((r) => ({
    id: r.id,
    type: r.type as QueueAction["type"],
    status: r.status as ActionStatus,
    mailId: r.mailId || undefined,
    draftId: r.draftId || undefined,
    title: r.title,
    detail: r.detail,
    createdAt: r.createdAt,
    resolvedAt: r.resolvedAt || undefined
  }));

  const graphNodesRows = db.prepare("SELECT * FROM graph_nodes").all() as unknown as GraphNodeRow[];
  const graphNodes: GraphNode[] = graphNodesRows.map((r) => ({
    id: r.id,
    type: r.type as GraphNode["type"],
    label: r.label,
    weight: r.weight
  }));

  const graphEdgesRows = db.prepare("SELECT * FROM graph_edges").all() as unknown as GraphEdgeRow[];
  const graphEdges: GraphEdge[] = graphEdgesRows.map((r) => ({
    id: r.id,
    source: r.source,
    target: r.target,
    label: r.label,
    weight: r.weight
  }));

  const eventsRows = db.prepare("SELECT * FROM events ORDER BY at DESC LIMIT 160").all() as unknown as EventRow[];
  const events: TrailEvent[] = eventsRows.map((r) => ({
    id: r.id,
    type: r.type,
    message: r.message,
    at: r.at
  }));

  const getConnector = (name: string) => {
    const r = db.prepare("SELECT value FROM connectors WHERE name = ?").get(name) as { value: string } | undefined;
    return r ? JSON.parse(r.value) : undefined;
  };
  const domainHost = getConnector("domainHost");
  const receiver = getConnector("receiver");
  const gmail = getConnector("gmail");
  const domain = getConnector("domain");

  const localModelsRows = db.prepare("SELECT * FROM local_models").all() as unknown as LocalModelRow[];
  const localModels: LocalModelConfig[] = localModelsRows.map((r) => ({
    id: r.id,
    provider: r.provider as LocalModelConfig["provider"],
    model: r.model,
    purpose: r.purpose as LocalModelConfig["purpose"],
    installCommand: r.installCommand,
    status: r.status as ConnectorStatus,
    downloadedAt: r.downloadedAt || undefined,
    updatedAt: r.updatedAt
  }));

  const toolsRows = db.prepare("SELECT * FROM tools ORDER BY updatedAt DESC").all() as unknown as ToolRow[];
  const tools: ToolConnectorConfig[] = toolsRows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type as ToolConnectorConfig["type"],
    status: r.status as ConnectorStatus,
    notes: r.notes || "",
    updatedAt: r.updatedAt
  }));

  // Decrypt Mail, Drafts, Contacts if unlocked; otherwise return redacted/empty placeholders
  let mail: MailRecord[] = [];
  let drafts: DraftRecord[] = [];
  const contacts: ContactRecord[] = [];

  const key = getTransientKey();

  if (key) {
    // Read and decrypt Mail
    const mailRows = db.prepare("SELECT * FROM mail ORDER BY receivedAt DESC").all() as unknown as MailRow[];
    for (const r of mailRows) {
      try {
        if (!r.encrypted_data || !r.nonce || !r.tag) throw new Error("Empty envelope");
        const payloadStr = decrypt(r.encrypted_data, r.nonce, r.tag, key);
        const payload = JSON.parse(payloadStr);
        let body = "";
        if (payload.bodyRef) {
          try {
            body = await readBlob(home, payload.bodyRef, key);
          } catch {
            body = payload.bodyPreview || "(failed to load decrypted body file)";
          }
        } else {
          body = payload.body || payload.bodyPreview || "";
        }
        mail.push({
          id: r.id,
          threadId: r.threadId,
          from: payload.from,
          to: payload.to,
          subject: payload.subject,
          body,
          bodyPreview: payload.bodyPreview,
          tags: payload.tags || [],
          status: r.status as MailStatus,
          folder: r.folder as MailFolder,
          unread: r.unread === 1,
          starred: r.starred === 1,
          importance: r.importance as MailRecord["importance"],
          watcherMatches: payload.watcherMatches || [],
          receivedAt: r.receivedAt
        });
      } catch (err) {
        console.error(`Decryption failed for mail row ${r.id}:`, err);
        mail.push({
          id: r.id,
          threadId: r.threadId,
          from: "encrypted@locked.invalid",
          to: "encrypted@locked.invalid",
          subject: "[Decryption Failed]",
          body: "[Mail decryption failed. Locked or wrong key.]",
          bodyPreview: "[Decryption Failed]",
          tags: [],
          status: r.status as MailStatus,
          folder: r.folder as MailFolder,
          unread: r.unread === 1,
          starred: r.starred === 1,
          importance: r.importance as MailRecord["importance"],
          watcherMatches: [],
          receivedAt: r.receivedAt
        });
      }
    }

    // Read and decrypt Drafts
    const draftsRows = db.prepare("SELECT * FROM drafts ORDER BY createdAt DESC").all() as unknown as DraftRow[];
    for (const r of draftsRows) {
      try {
        if (!r.encrypted_data || !r.nonce || !r.tag) throw new Error("Empty envelope");
        const payloadStr = decrypt(r.encrypted_data, r.nonce, r.tag, key);
        const payload = JSON.parse(payloadStr);
        let body = "";
        if (payload.bodyRef) {
          try {
            body = await readBlob(home, payload.bodyRef, key);
          } catch {
            body = "(failed to load decrypted draft body file)";
          }
        } else {
          body = payload.body || "";
        }
        drafts.push({
          id: r.id,
          threadId: r.threadId || undefined,
          to: payload.to,
          subject: payload.subject,
          body,
          sourceMailId: payload.sourceMailId || undefined,
          status: r.status as DraftRecord["status"],
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        });
      } catch {
        drafts.push({
          id: r.id,
          threadId: r.threadId || undefined,
          to: "encrypted@locked.invalid",
          subject: "[Decryption Failed]",
          body: "[Draft decryption failed. Locked or wrong key.]",
          status: r.status as DraftRecord["status"],
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        });
      }
    }

    // Read and decrypt Contacts
    const contactsRows = db.prepare("SELECT * FROM contacts ORDER BY lastSeenAt DESC").all() as unknown as ContactRow[];
    for (const r of contactsRows) {
      try {
        if (!r.encrypted_data || !r.nonce || !r.tag) throw new Error("Empty envelope");
        const payloadStr = decrypt(r.encrypted_data, r.nonce, r.tag, key);
        const payload = JSON.parse(payloadStr);
        contacts.push({
          id: r.id,
          email: payload.email,
          name: payload.name,
          company: payload.company || undefined,
          lastSeenAt: r.lastSeenAt,
          messageCount: r.messageCount,
          tags: payload.tags || []
        });
      } catch {
        // Hiding contact secrets on failure
      }
    }
  } else {
    // Vault is LOCKED
    const mailRows = db.prepare("SELECT id, threadId, status, folder, unread, starred, importance, receivedAt FROM mail").all() as unknown as MailRow[];
    mail = mailRows.map((r) => ({
      id: r.id,
      threadId: r.threadId,
      from: "encrypted@locked.invalid",
      to: "encrypted@locked.invalid",
      subject: "[Mailbox Locked]",
      body: "[Enter password to unlock mail bodies]",
      bodyPreview: "[Mailbox Locked]",
      tags: [],
      status: r.status as MailStatus,
      folder: r.folder as MailFolder,
      unread: r.unread === 1,
      starred: r.starred === 1,
      importance: r.importance as MailRecord["importance"],
      watcherMatches: [],
      receivedAt: r.receivedAt
    }));

    const draftsRows = db.prepare("SELECT id, threadId, status, createdAt, updatedAt FROM drafts").all() as unknown as DraftRow[];
    drafts = draftsRows.map((r) => ({
      id: r.id,
      threadId: r.threadId || undefined,
      to: "encrypted@locked.invalid",
      subject: "[Mailbox Locked]",
      body: "[Enter password to unlock drafts]",
      status: r.status as DraftRecord["status"],
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }));
  }

  return {
    version: 2,
    nodeId,
    runState,
    home,
    domain,
    aliases,
    watchers,
    mail,
    drafts,
    contacts,
    actions,
    graph: { nodes: graphNodes, edges: graphEdges },
    settings,
    domainHost,
    receiver,
    gmail,
    localModels,
    tools,
    events,
    createdAt,
    updatedAt: now(),
    vaultState
  };
}

export async function writeTrailState(state: TrailState) {
  const home = getTrailHome();
  const db = getDb();

  // If encryption is local-dev and locked, try auto unlocking first
  if (state.settings.encryption === "local-dev" && isLocked()) {
    await unlockWithLocalDevKey(home);
  }

  const key = getTransientKey();
  if (state.settings.encryption === "user-key" && !key) {
    throw new Error("Cannot save state. Database is locked and encryption mode is set to 'user-key'.");
  }

  // 1. Process files asynchronously before starting the SQLite transaction to avoid event loop yields
  const mailWithRefs = await Promise.all(state.mail.map(async (m) => {
    let bodyRef = "";
    if (m.body && key) {
      if (m.body.startsWith("blob_")) {
        bodyRef = m.body; // already stored in a blob file
      } else {
        bodyRef = await writeBlob(home, m.body, key);
      }
    }
    return { m, bodyRef };
  }));

  const draftsWithRefs = await Promise.all(state.drafts.map(async (d) => {
    let bodyRef = "";
    if (d.body && key) {
      if (d.body.startsWith("blob_")) {
        bodyRef = d.body;
      } else {
        bodyRef = await writeBlob(home, d.body, key);
      }
    }
    return { d, bodyRef };
  }));

  // 2. Perform SQLite transaction synchronously
  db.exec("BEGIN TRANSACTION");
  try {
    const insertSetting = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    insertSetting.run("nodeId", state.nodeId);
    insertSetting.run("runState", state.runState);
    insertSetting.run("createdAt", state.createdAt);
    if (state.settings) {
      for (const [k, val] of Object.entries(state.settings)) {
        insertSetting.run(k, typeof val === "object" ? JSON.stringify(val) : String(val));
      }
    }

    db.exec("DELETE FROM aliases");
    const insertAlias = db.prepare("INSERT INTO aliases (id, address, destination, label, active, createdAt) VALUES (?, ?, ?, ?, ?, ?)");
    for (const a of state.aliases) {
      insertAlias.run(a.id, a.address, a.destination, a.label, a.active ? 1 : 0, a.createdAt);
    }

    db.exec("DELETE FROM watchers");
    const insertWatcher = db.prepare("INSERT INTO watchers (id, name, rule, actions, humanApprovalRequired, active, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)");
    for (const w of state.watchers) {
      insertWatcher.run(w.id, w.name, w.rule, JSON.stringify(w.actions), w.humanApprovalRequired ? 1 : 0, w.active ? 1 : 0, w.createdAt);
    }

    // Encrypt and save Mail
    db.exec("DELETE FROM mail");
    const insertMail = db.prepare("INSERT INTO mail (id, threadId, status, folder, unread, starred, importance, receivedAt, encrypted_data, nonce, tag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    for (const { m, bodyRef } of mailWithRefs) {
      const payload = JSON.stringify({
        from: m.from,
        to: m.to,
        subject: m.subject,
        bodyPreview: m.bodyPreview,
        bodyRef: bodyRef || undefined,
        tags: m.tags || [],
        watcherMatches: m.watcherMatches || []
      });

      if (key) {
        const enc = encrypt(payload, key);
        insertMail.run(m.id, m.threadId, m.status, m.folder, m.unread ? 1 : 0, m.starred ? 1 : 0, m.importance, m.receivedAt, enc.ciphertext, enc.nonce, enc.tag);
      } else {
        insertMail.run(m.id, m.threadId, m.status, m.folder, m.unread ? 1 : 0, m.starred ? 1 : 0, m.importance, m.receivedAt, null, null, null);
      }
    }

    // Encrypt and save Drafts
    db.exec("DELETE FROM drafts");
    const insertDraft = db.prepare("INSERT INTO drafts (id, threadId, status, createdAt, updatedAt, encrypted_data, nonce, tag) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    for (const { d, bodyRef } of draftsWithRefs) {
      const payload = JSON.stringify({
        to: d.to,
        subject: d.subject,
        bodyRef: bodyRef || undefined,
        sourceMailId: d.sourceMailId
      });

      if (key) {
        const enc = encrypt(payload, key);
        insertDraft.run(d.id, d.threadId || null, d.status, d.createdAt, d.updatedAt, enc.ciphertext, enc.nonce, enc.tag);
      } else {
        insertDraft.run(d.id, d.threadId || null, d.status, d.createdAt, d.updatedAt, null, null, null);
      }
    }

    // Encrypt and save Contacts
    db.exec("DELETE FROM contacts");
    const insertContact = db.prepare("INSERT INTO contacts (id, email_hash, lastSeenAt, messageCount, encrypted_data, nonce, tag) VALUES (?, ?, ?, ?, ?, ?, ?)");
    for (const c of state.contacts) {
      const emailHash = crypto.createHash("sha256").update(c.email).digest("hex");
      const payload = JSON.stringify({
        email: c.email,
        name: c.name,
        company: c.company,
        tags: c.tags || []
      });

      if (key) {
        const enc = encrypt(payload, key);
        insertContact.run(c.id, emailHash, c.lastSeenAt, c.messageCount, enc.ciphertext, enc.nonce, enc.tag);
      } else {
        insertContact.run(c.id, emailHash, c.lastSeenAt, c.messageCount, null, null, null);
      }
    }

    db.exec("DELETE FROM actions");
    const insertAction = db.prepare("INSERT INTO actions (id, type, status, mailId, draftId, title, detail, createdAt, resolvedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    for (const act of state.actions) {
      insertAction.run(act.id, act.type, act.status, act.mailId || null, act.draftId || null, act.title, act.detail, act.createdAt, act.resolvedAt || null);
    }

    db.exec("DELETE FROM graph_nodes");
    const insertNode = db.prepare("INSERT INTO graph_nodes (id, type, label, weight) VALUES (?, ?, ?, ?)");
    for (const n of state.graph.nodes) {
      insertNode.run(n.id, n.type, n.label, n.weight);
    }

    db.exec("DELETE FROM graph_edges");
    const insertEdge = db.prepare("INSERT INTO graph_edges (id, source, target, label, weight) VALUES (?, ?, ?, ?, ?)");
    for (const e of state.graph.edges) {
      insertEdge.run(e.id, e.source, e.target, e.label, e.weight);
    }

    db.exec("DELETE FROM events");
    const insertEvent = db.prepare("INSERT INTO events (id, type, message, at) VALUES (?, ?, ?, ?)");
    for (const ev of state.events) {
      insertEvent.run(ev.id, ev.type, ev.message, ev.at);
    }

    db.exec("DELETE FROM connectors");
    const insertConnector = db.prepare("INSERT INTO connectors (name, value) VALUES (?, ?)");
    if (state.domainHost) insertConnector.run("domainHost", JSON.stringify(state.domainHost));
    if (state.receiver) insertConnector.run("receiver", JSON.stringify(state.receiver));
    if (state.gmail) insertConnector.run("gmail", JSON.stringify(state.gmail));
    if (state.domain) insertConnector.run("domain", JSON.stringify(state.domain));

    db.exec("DELETE FROM local_models");
    const insertModel = db.prepare("INSERT INTO local_models (id, provider, model, purpose, installCommand, status, downloadedAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    for (const m of state.localModels) {
      insertModel.run(m.id, m.provider, m.model, m.purpose, m.installCommand, m.status, m.downloadedAt || null, m.updatedAt);
    }

    db.exec("DELETE FROM tools");
    const insertTool = db.prepare("INSERT INTO tools (id, name, type, status, notes, updatedAt) VALUES (?, ?, ?, ?, ?, ?)");
    for (const t of state.tools) {
      insertTool.run(t.id, t.name, t.type, t.status, t.notes || null, t.updatedAt);
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    console.error("writeTrailState failed:", error);
    throw error;
  }
  return state;
}

export async function unlockVault(password: string): Promise<boolean> {
  const db = getDb();
  const settingsRows = db.prepare("SELECT * FROM settings").all() as unknown as SettingsRow[];
  const settings: Record<string, string> = {};
  for (const r of settingsRows) {
    settings[r.key] = r.value;
  }

  const salt = settings.passwordSalt;
  const block = settings.verifyBlock;
  const nonce = settings.verifyNonce;
  const tag = settings.verifyTag;

  if (!salt || !block || !nonce || !tag) {
    return false;
  }

  const success = unlockWithPassword(password, salt, block, nonce, tag);
  if (success) {
    const state = await readTrailState();
    await appendEvent(state, "node.unlocked", "Vault decrypted successfully with user password.");
    await writeTrailState(state);
  }
  return success;
}

export async function enablePasswordEncryption(password: string): Promise<{ recoveryPhrase: string }> {
  const home = getTrailHome();
  const db = getDb();
  
  let currentKey = getTransientKey();
  if (!currentKey) {
    if (existsSync(path.join(home, "keys", "local-device.key"))) {
      currentKey = await getOrCreateLocalKey(home);
    } else {
      currentKey = crypto.randomBytes(32);
    }
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const newUserKey = deriveKeyFromPassword(password, salt);

  const state = await readTrailState();
  state.settings.encryption = "user-key";
  
  const verify = generateVerifyBlock(newUserKey);
  
  db.exec("BEGIN TRANSACTION");
  try {
    const insertSetting = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    insertSetting.run("encryption", "user-key");
    insertSetting.run("passwordSalt", salt);
    insertSetting.run("verifyBlock", verify.verifyBlock);
    insertSetting.run("verifyNonce", verify.nonce);
    insertSetting.run("verifyTag", verify.tag);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  setTransientKey(newUserKey);
  await writeTrailState(state);

  const phrase = generateRecoveryPhrase();
  const phraseSalt = crypto.randomBytes(16).toString("hex");
  const recoveryKey = deriveKeyFromPassword(phrase, phraseSalt);
  const recoveryEnvelope = encrypt(newUserKey.toString("base64"), recoveryKey);
  
  db.exec("BEGIN TRANSACTION");
  try {
    const insertSetting = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    insertSetting.run("recoverySalt", phraseSalt);
    insertSetting.run("recoveryBlock", recoveryEnvelope.ciphertext);
    insertSetting.run("recoveryNonce", recoveryEnvelope.nonce);
    insertSetting.run("recoveryTag", recoveryEnvelope.tag);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  await appendEvent(state, "node.encryption_upgraded", "Vault encryption upgraded to user password with recovery phrase.");
  await writeTrailState(state);

  return { recoveryPhrase: phrase };
}

export async function recoverVault(phrase: string): Promise<boolean> {
  const db = getDb();
  const settingsRows = db.prepare("SELECT * FROM settings").all() as unknown as SettingsRow[];
  const settings: Record<string, string> = {};
  for (const r of settingsRows) {
    settings[r.key] = r.value;
  }

  const phraseSalt = settings.recoverySalt;
  const block = settings.recoveryBlock;
  const nonce = settings.recoveryNonce;
  const tag = settings.recoveryTag;

  if (!phraseSalt || !block || !nonce || !tag) return false;

  try {
    const recoveryKey = deriveKeyFromPassword(phrase.trim().toLowerCase(), phraseSalt);
    const decryptedKeyB64 = decrypt(block, nonce, tag, recoveryKey);
    const originalKey = Buffer.from(decryptedKeyB64, "base64");
    setTransientKey(originalKey);
    const state = await readTrailState();
    await appendEvent(state, "node.recovered", "Vault recovered and unlocked successfully via recovery phrase.");
    await writeTrailState(state);
    return true;
  } catch {
    return false;
  }
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
  // Real processing requires async execution; we queue it so we don't block mail ingestion
  setImmediate(async () => {
    try {
      const { processMailWithOllama } = await import("./watchers/ai");
      const rules = state.watchers.filter(w => w.active).map(w => w.rule);
      if (rules.length === 0) return;

      const result = await processMailWithOllama(mail, rules);
      if (result && result.match && result.action) {
        // Read fresh state
        const currentState = await readTrailState();
        const currentMail = currentState.mail.find(m => m.id === mail.id);
        if (!currentMail) return;

        const activeWatcher = currentState.watchers.find(w => w.active);
        if (!activeWatcher) return;

        if (!currentMail.watcherMatches) currentMail.watcherMatches = [];
        currentMail.watcherMatches.push(activeWatcher.id);

        if (result.action === "flag" && activeWatcher.actions.includes("flag")) currentMail.status = "flagged";

        if (result.action === "draft_reply" && activeWatcher.actions.includes("draft_reply")) {
          const draft = makeReplyDraft(currentMail);
          currentState.drafts.unshift(draft);
          currentState.actions.unshift({ id: id("act"), type: "draft_reply", status: activeWatcher.humanApprovalRequired ? "queued" : "approved", mailId: currentMail.id, draftId: draft.id, title: `Draft reply for ${currentMail.subject}`, detail: result.reason || `Generated by ${activeWatcher.name}.`, createdAt: now() });
        }

        if (result.action === "order_update" && activeWatcher.actions.includes("order_update")) {
          currentState.actions.unshift({ id: id("act"), type: "order_update", status: "queued", mailId: currentMail.id, title: `Review order update`, detail: result.reason || currentMail.bodyPreview, createdAt: now() });
        }

        await writeTrailState(currentState);
      }
    } catch (e: unknown) {
      console.error("[Watchers] AI processing failed:", e instanceof Error ? e.message : String(e));
    }
  });
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
  if (state.vaultState === "locked") throw new Error("Vault is locked.");
  const domain = input.domain.trim().toLowerCase().replace(/^@/, "");
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) throw new Error("Enter a valid domain like example.com.");
  state.domain = { domain, mode: input.mode, catchAll: Boolean(input.catchAll), createdAt: now() };
  state.runState = "running";
  await appendEvent(state, "domain.configured", `Domain ${domain} configured in ${input.mode} mode.`);
  return writeTrailState(state);
}

export async function setRunState(runState: NodeRunState) {
  const state = await readTrailState();
  if (state.vaultState === "locked") throw new Error("Vault is locked.");
  state.runState = runState;
  await appendEvent(state, "node.state", `Local node set to ${runState}.`);
  return writeTrailState(state);
}

export async function createAlias(input: { address: string; destination: string; label?: string }) {
  const state = await readTrailState();
  if (state.vaultState === "locked") throw new Error("Vault is locked.");
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
  if (state.vaultState === "locked") throw new Error("Vault is locked.");
  if (!input.name.trim() || !input.rule.trim()) throw new Error("Watcher name and rule are required.");
  const watcher: WatcherRecord = { id: id("watcher"), name: input.name.trim(), rule: input.rule.trim(), actions: input.actions?.length ? input.actions : ["scan", "flag", "draft_reply"], humanApprovalRequired: input.humanApprovalRequired ?? true, active: true, createdAt: now() };
  state.watchers.unshift(watcher);
  await appendEvent(state, "watcher.created", `Watcher ${watcher.name} added with local approval gate.`);
  return writeTrailState(state);
}

export async function createMail(input: { from: string; to: string; subject: string; body: string; tags?: string[] }) {
  const state = await readTrailState();
  if (state.vaultState === "locked") throw new Error("Vault is locked.");
  const mail = normalizeMail({ from: input.from.trim(), to: input.to.trim(), subject: input.subject.trim() || "(no subject)", body: input.body, tags: input.tags?.length ? input.tags : ["local-import"], status: "inbox", unread: true });
  evaluateWatchers(state, mail);
  state.mail.unshift(mail);
  indexMail(state, mail);

  // Update the new search index
  const { indexMailSearch } = await import("./vault/search");
  await indexMailSearch(state, mail);

  await appendEvent(state, "mail.imported", `Imported message into ${mail.folder}: ${mail.subject}.`);
  return writeTrailState(state);
}

export async function createDraft(input: { to: string; subject: string; body: string; sourceMailId?: string }) {
  const state = await readTrailState();
  if (state.vaultState === "locked") throw new Error("Vault is locked.");
  const source = input.sourceMailId ? state.mail.find((mail) => mail.id === input.sourceMailId) : undefined;
  const draft: DraftRecord = { id: id("draft"), threadId: source?.threadId, to: input.to.trim(), subject: input.subject.trim() || "(no subject)", body: input.body.trim(), sourceMailId: source?.id, status: "draft", createdAt: now(), updatedAt: now() };
  state.drafts.unshift(draft);
  if (source) source.status = "drafted";
  await appendEvent(state, "draft.created", `Draft created for ${draft.to}.`);
  return writeTrailState(state);
}

export async function updateMail(input: { id: string; status?: MailStatus; folder?: MailFolder; unread?: boolean; starred?: boolean }) {
  const state = await readTrailState();
  if (state.vaultState === "locked") throw new Error("Vault is locked.");
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
  if (state.vaultState === "locked") throw new Error("Vault is locked.");
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
    { type: "TXT" as const, host: "trail._domainkey", value: `v=DKIM1; k=rsa; p=${process.env.TRAIL_DKIM_PUBLIC_KEY || ""}`, status: "not-started" as ConnectorStatus },
    { type: "CNAME" as const, host: "trail", value: "127-0-0-1.local-trail.invalid", status: "configured" as ConnectorStatus },
  ];
}

export async function configureDomainHost(input: { provider?: DomainHostConfig["provider"]; domain?: string; zoneId?: string; nameservers?: string[]; token?: string }) {
  const state = await readTrailState();
  if (state.vaultState === "locked") throw new Error("Vault is locked.");
  const domain = String(input.domain || state.domain?.domain || "yourdomain.com").trim().toLowerCase();
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) throw new Error("Enter a valid domain for the domain hoster.");

  let zoneId = input.zoneId;
  const provider = input.provider || "cloudflare";

  if (provider === "cloudflare" && input.token) {
    try {
      zoneId = await configureCloudflareDNS(domain, input.token, { receiver: state.receiver?.mode === "sovereign-smtp" ? "Sovereign SMTP" : "Cloudflare Email Routing" });
    } catch (err: unknown) {
      console.error("Failed to configure Cloudflare DNS automatically:", err instanceof Error ? err.message : String(err));
    }
  }

  state.domainHost = { provider, domain, zoneId, nameservers: input.nameservers?.length ? input.nameservers : ["connect.cloudflare.com", "secure.cloudflare.com"], records: dnsForDomain(domain), status: "configured", updatedAt: now() };
  await appendEvent(state, "connector.domain_host", `${state.domainHost.provider} domain hoster configured for ${domain}.`);
  return writeTrailState(state);
}

export async function configureDomainReceiver(input: { mode?: DomainReceiverConfig["mode"]; targetAddress?: string }) {
  const state = await readTrailState();
  if (state.vaultState === "locked") throw new Error("Vault is locked.");
  const domain = state.domainHost?.domain || state.domain?.domain || "yourdomain.com";
  state.receiver = { mode: input.mode || "cloudflare-email-routing", targetAddress: input.targetAddress || state.aliases[0]?.address || `inbox@${domain}`, webhookPath: "/api/ingress/relay", inboundSecretRef: "TRAIL_INBOUND_SECRET", status: "configured", updatedAt: now() };
  await appendEvent(state, "connector.receiver", `Domain receiver set to ${state.receiver.mode}.`);
  return writeTrailState(state);
}

export async function configureGmailConnector(input: { clientIdRef?: string; tokenRef?: string; scopes?: string[] }) {
  const state = await readTrailState();
  if (state.vaultState === "locked") throw new Error("Vault is locked.");
  state.gmail = { clientIdRef: input.clientIdRef || "GOOGLE_CLIENT_ID", tokenRef: input.tokenRef || "GOOGLE_REFRESH_TOKEN", scopes: input.scopes?.length ? input.scopes : ["gmail.readonly", "gmail.modify"], historyId: state.gmail?.historyId || "local-history-start", syncState: "connected", imported: state.gmail?.imported || 0, lastScrapeAt: state.gmail?.lastScrapeAt, updatedAt: now() };
  await appendEvent(state, "connector.gmail", "Gmail OAuth connector configured with secret references only.");
  return writeTrailState(state);
}

export async function scrapeGmailHistory(input: { limit?: number } = {}) {
  let state = await readTrailState();
  if (state.vaultState === "locked") throw new Error("Vault is locked.");
  if (!state.gmail) state = await configureGmailConnector({});
  state = await readTrailState();

  let count = 0;
  let historyId = state.gmail?.historyId;

  const clientId = process.env[state.gmail?.clientIdRef || "GOOGLE_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_CLIENT_SECRET"]; // Assuming a standard env var for secret
  const refreshToken = process.env[state.gmail?.tokenRef || "GOOGLE_REFRESH_TOKEN"];

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing real Gmail OAuth credentials in environment. Cannot perform sync.");
  }

  const result = await syncGmail({ clientId, clientSecret, refreshToken });
  count = result.count;
  if (result.historyId) historyId = result.historyId;

  state = await readTrailState();
  state.gmail = { ...(state.gmail || { clientIdRef: "GOOGLE_CLIENT_ID", tokenRef: "GOOGLE_REFRESH_TOKEN", scopes: ["gmail.readonly"], syncState: "connected", imported: 0, updatedAt: now() }), imported: (state.gmail?.imported || 0) + count, syncState: "ready", lastScrapeAt: now(), historyId, updatedAt: now() };
  await appendEvent(state, "connector.gmail_scrape", `Gmail history scrape imported ${count} local message records.`);
  return writeTrailState(state);
}

export async function configureLocalModel(input: { provider?: LocalModelConfig["provider"]; model?: string; purpose?: LocalModelConfig["purpose"] }) {
  const state = await readTrailState();
  if (state.vaultState === "locked") throw new Error("Vault is locked.");
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
  if (state.vaultState === "locked") throw new Error("Vault is locked.");
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
  if (state.vaultState === "locked") throw new Error("Vault is locked.");
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
  // Purged to remove mock/demo data generator.
  // Production builds should not inject fake simulated records.
  const state = await readTrailState();
  if (state.vaultState === "locked") throw new Error("Vault is locked.");
  await appendEvent(state, "platform.init", "Platform initialized cleanly without mock data.");
  return writeTrailState(state);
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
    vaultState: state.vaultState
  };
}
