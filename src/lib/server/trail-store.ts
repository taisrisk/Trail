import { mkdir, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";

export type NodeMode = "quick-domain" | "relay-node" | "sovereign-mx";
export type NodeRunState = "fresh" | "running" | "paused";

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
  from: string;
  to: string;
  subject: string;
  bodyPreview: string;
  tags: string[];
  status: "inbox" | "flagged" | "archived" | "drafted";
  receivedAt: string;
}

export interface TrailEvent {
  id: string;
  type: string;
  message: string;
  at: string;
}

export interface TrailState {
  version: 1;
  nodeId: string;
  runState: NodeRunState;
  home: string;
  domain?: DomainConfig;
  aliases: AliasRecord[];
  watchers: WatcherRecord[];
  mail: MailRecord[];
  events: TrailEvent[];
  createdAt: string;
  updatedAt: string;
}

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${crypto.randomBytes(6).toString("hex")}`;

export function getTrailHome() {
  const configured = process.env.TRAIL_HOME?.trim();
  if (configured) return configured.replace(/^~(?=$|[\\/])/, os.homedir());
  return path.join(os.homedir(), ".trail");
}

const folders = ["config", "keys", "vault", "mail", "attachments", "index", "graph", "watchers", "calendar", "orders", "queues", "backups", "logs"];

async function ensureHome(home = getTrailHome()) {
  await mkdir(home, { recursive: true });
  await Promise.all(folders.map((folder) => mkdir(path.join(home, folder), { recursive: true })));
}

function dbPath(home = getTrailHome()) {
  return path.join(home, "config", "trail-state.json");
}

function redactBody(body: string) {
  const trimmed = body.replace(/\s+/g, " ").trim();
  if (!trimmed) return "No body preview.";
  return trimmed.length > 180 ? `${trimmed.slice(0, 180)}…` : trimmed;
}

function defaultState(home = getTrailHome()): TrailState {
  const at = now();
  return {
    version: 1,
    nodeId: id("node"),
    runState: "fresh",
    home,
    aliases: [],
    watchers: [],
    mail: [],
    events: [{ id: id("evt"), type: "node.created", message: "Trail local node state created.", at }],
    createdAt: at,
    updatedAt: at,
  };
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
  const parsed = JSON.parse(raw) as TrailState;
  return { ...parsed, home };
}

export async function writeTrailState(state: TrailState) {
  const home = getTrailHome();
  await ensureHome(home);
  const next = { ...state, home, updatedAt: now() };
  await writeFile(dbPath(home), JSON.stringify(next, null, 2), "utf8");
  return next;
}

export async function appendEvent(state: TrailState, type: string, message: string) {
  state.events.unshift({ id: id("evt"), type, message, at: now() });
  state.events = state.events.slice(0, 80);
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
  const alias: AliasRecord = {
    id: id("alias"),
    address,
    destination: input.destination.trim() || "local-vault",
    label: input.label?.trim() || "General",
    active: true,
    createdAt: now(),
  };
  state.aliases.unshift(alias);
  await appendEvent(state, "alias.created", `Alias ${alias.address} routes to ${alias.destination}.`);
  return writeTrailState(state);
}

export async function createWatcher(input: { name: string; rule: string; actions?: string[]; humanApprovalRequired?: boolean }) {
  const state = await readTrailState();
  if (!input.name.trim() || !input.rule.trim()) throw new Error("Watcher name and rule are required.");
  const watcher: WatcherRecord = {
    id: id("watcher"),
    name: input.name.trim(),
    rule: input.rule.trim(),
    actions: input.actions?.length ? input.actions : ["scan", "flag", "draft_reply"],
    humanApprovalRequired: input.humanApprovalRequired ?? true,
    active: true,
    createdAt: now(),
  };
  state.watchers.unshift(watcher);
  await appendEvent(state, "watcher.created", `Watcher ${watcher.name} added with local approval gate.`);
  return writeTrailState(state);
}

export async function createMail(input: { from: string; to: string; subject: string; body: string; tags?: string[] }) {
  const state = await readTrailState();
  const mail: MailRecord = {
    id: id("mail"),
    from: input.from.trim(),
    to: input.to.trim(),
    subject: input.subject.trim() || "(no subject)",
    bodyPreview: redactBody(input.body),
    tags: input.tags?.length ? input.tags : ["local-import"],
    status: "inbox",
    receivedAt: now(),
  };
  state.mail.unshift(mail);
  await appendEvent(state, "mail.imported", `Imported local test message: ${mail.subject}.`);
  return writeTrailState(state);
}

export async function seedDemoData() {
  let state = await readTrailState();
  if (!state.domain) state = await setupDomain({ domain: "yourdomain.com", mode: "quick-domain", catchAll: true });
  if (!state.aliases.length) state = await createAlias({ address: "inbox", destination: "local-vault", label: "Main inbox" });
  if (!state.watchers.length) state = await createWatcher({ name: "Order watcher", rule: "Track receipts, shipping changes, refunds, and delivery dates.", actions: ["scan", "order_update", "flag"], humanApprovalRequired: false });
  state = await readTrailState();
  if (!state.mail.length) state = await createMail({ from: "orders@shop.example", to: state.aliases[0]?.address || "inbox@yourdomain.com", subject: "Your package is delayed", body: "Delivery moved by two days. Trail should update the local order timeline and flag if it changes again.", tags: ["order", "delivery"] });
  await appendEvent(state, "demo.seeded", "Demo local node data is ready.");
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
      events: state.events.length,
    },
    updatedAt: state.updatedAt,
  };
}
