#!/usr/bin/env node
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

const home = (process.env.TRAIL_HOME || path.join(os.homedir(), ".trail")).replace(/^~(?=$|[\\/])/, os.homedir());
const port = Number(process.env.TRAIL_NODE_PORT || 8787);
const folders = ["config", "keys", "vault", "mail", "attachments", "index", "graph", "watchers", "calendar", "orders", "queues", "backups", "logs", "drafts", "contacts"];
const dbFile = path.join(home, "config", "trail-state.json");
const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}_${crypto.randomBytes(6).toString("hex")}`;

async function ensureHome() {
  await mkdir(home, { recursive: true });
  await Promise.all(folders.map((folder) => mkdir(path.join(home, folder), { recursive: true })));
}

function defaultState() {
  const at = now();
  return {
    version: 2,
    nodeId: id("node"),
    runState: "running",
    home,
    aliases: [],
    watchers: [],
    mail: [],
    drafts: [],
    contacts: [],
    actions: [],
    graph: { nodes: [], edges: [] },
    settings: { localAiModel: "local-rule-engine", approvalRequired: true, retentionDays: 3650, encryption: "local-dev" },
    events: [{ id: id("evt"), type: "node.server", message: "Standalone Trail local server started.", at }],
    createdAt: at,
    updatedAt: at,
  };
}

function normalizeState(raw = {}) {
  const base = defaultState();
  const state = { ...base, ...raw, home, version: 2 };
  state.aliases ||= [];
  state.watchers ||= [];
  state.mail ||= [];
  state.drafts ||= [];
  state.contacts ||= [];
  state.actions ||= [];
  state.graph ||= { nodes: [], edges: [] };
  state.graph.nodes ||= [];
  state.graph.edges ||= [];
  state.settings = { ...base.settings, ...(state.settings || {}) };
  state.events ||= [];
  return state;
}

async function readState() {
  await ensureHome();
  if (!existsSync(dbFile)) return writeState(defaultState());
  return normalizeState(JSON.parse(await readFile(dbFile, "utf8")));
}

async function writeState(state) {
  await ensureHome();
  const next = normalizeState({ ...state, updatedAt: now() });
  await writeFile(dbFile, JSON.stringify(next, null, 2), "utf8");
  return next;
}

function event(state, type, message) {
  state.events.unshift({ id: id("evt"), type, message, at: now() });
  state.events = state.events.slice(0, 160);
}

function bodyPreview(body) {
  const text = String(body || "").replace(/\s+/g, " ").trim();
  return text.length > 220 ? `${text.slice(0, 220)}…` : text || "No body preview.";
}

function folderFor(subject, body, tags = []) {
  const text = `${subject} ${body} ${tags.join(" ")}`.toLowerCase();
  if (/order|package|delivery|receipt|refund|shipping/.test(text)) return "orders";
  if (/invoice|payment|bank|subscription|tax/.test(text)) return "finance";
  if (/urgent|security|deadline|delayed|important/.test(text)) return "priority";
  return "inbox";
}

function importanceFor(subject, body) {
  const text = `${subject} ${body}`.toLowerCase();
  if (/urgent|overdue|failed|refund|security|invoice|payment|deadline|delayed/.test(text)) return "high";
  if (/newsletter|receipt|digest/.test(text)) return "low";
  return "normal";
}

function threadIdFor(subject, from = "") {
  const cleaned = String(subject || "thread").toLowerCase().replace(/^(re|fwd):\s*/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "thread";
  const domain = String(from).split("@")[1]?.replace(/[^a-z0-9]+/g, "-") || "local";
  return `thread_${cleaned}_${domain}`;
}

function displayName(email) {
  return String(email).split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function upsertContact(state, email, tags = []) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) return;
  const existing = state.contacts.find((c) => c.email === normalized);
  if (existing) {
    existing.messageCount += 1;
    existing.lastSeenAt = now();
    existing.tags = Array.from(new Set([...(existing.tags || []), ...tags]));
  } else {
    state.contacts.unshift({ id: id("contact"), email: normalized, name: displayName(normalized), company: normalized.split("@")[1], lastSeenAt: now(), messageCount: 1, tags });
  }
}

function addMail(state, input) {
  const subject = String(input.subject || "New message").trim();
  const body = String(input.body || "");
  const tags = Array.isArray(input.tags) ? input.tags.map(String) : ["local-import"];
  const mail = {
    id: id("mail"),
    threadId: threadIdFor(subject, input.from),
    from: String(input.from || "sender@example.com").trim(),
    to: String(input.to || state.aliases[0]?.address || "inbox@yourdomain.com").trim(),
    subject,
    body,
    bodyPreview: bodyPreview(body),
    tags,
    status: "inbox",
    folder: folderFor(subject, body, tags),
    unread: true,
    starred: false,
    importance: importanceFor(subject, body),
    watcherMatches: [],
    receivedAt: now(),
  };
  for (const watcher of state.watchers.filter((w) => w.active)) {
    const text = `${mail.subject}\n${mail.body}\n${mail.tags.join(" ")}`.toLowerCase();
    const terms = String(watcher.rule || "").toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 4);
    if (terms.some((term) => text.includes(term))) {
      mail.watcherMatches.push(watcher.id);
      if (watcher.actions?.includes("flag")) mail.status = "flagged";
      if (watcher.actions?.includes("draft_reply")) {
        const draft = { id: id("draft"), threadId: mail.threadId, to: mail.from, subject: mail.subject.toLowerCase().startsWith("re:") ? mail.subject : `Re: ${mail.subject}`, body: "Thanks for the update. I saw this and will follow up shortly.\n\n— Sent from Trail local draft assistant", sourceMailId: mail.id, status: "draft", createdAt: now(), updatedAt: now() };
        state.drafts.unshift(draft);
        state.actions.unshift({ id: id("act"), type: "draft_reply", status: watcher.humanApprovalRequired ? "queued" : "approved", mailId: mail.id, draftId: draft.id, title: `Draft reply for ${mail.subject}`, detail: `Generated by ${watcher.name}.`, createdAt: now() });
      }
    }
  }
  state.mail.unshift(mail);
  upsertContact(state, mail.from, tags);
  upsertContact(state, mail.to, ["alias"]);
  event(state, "mail.imported", `Imported message into ${mail.folder}: ${mail.subject}.`);
  return mail;
}

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function publicStatus(state) {
  return {
    nodeId: state.nodeId,
    runState: state.runState,
    home,
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
    },
    updatedAt: state.updatedAt,
  };
}

function platformSummary(state) {
  return { status: publicStatus(state), aliases: state.aliases, watchers: state.watchers, mail: state.mail, drafts: state.drafts, contacts: state.contacts, actions: state.actions, graph: state.graph, events: state.events.slice(0, 30) };
}

async function seed(state) {
  if (!state.domain) state.domain = { domain: "yourdomain.com", mode: "quick-domain", catchAll: true, createdAt: now() };
  if (!state.aliases.length) state.aliases.unshift({ id: id("alias"), address: `inbox@${state.domain.domain}`, destination: "local-vault", label: "Main inbox", active: true, createdAt: now() });
  if (!state.watchers.length) {
    state.watchers.unshift({ id: id("watcher"), name: "Order watcher", rule: "Track receipts, shipping changes, refunds, delivery delays, and package updates.", actions: ["scan", "order_update", "flag", "draft_reply"], humanApprovalRequired: true, active: true, createdAt: now() });
  }
  const samples = [
    { from: "orders@shop.example", subject: "Your package is delayed", body: "Delivery moved by two days. Trail should update the local order timeline and flag if it changes again.", tags: ["order", "delivery"] },
    { from: "security@cloudflare.example", subject: "Security alert: DNS record changed", body: "A DNS record was changed for your domain. Review SPF, DKIM, DMARC, and routing settings.", tags: ["security", "domain"] },
  ];
  for (const sample of samples) if (!state.mail.some((m) => m.subject === sample.subject)) addMail(state, { ...sample, to: state.aliases[0].address });
  event(state, "platform.seeded", "Standalone node seeded platform data.");
  return state;
}

function send(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
  res.end(JSON.stringify(data, null, 2));
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") return send(res, 204, {});
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const state = await readState();

    if (req.method === "GET" && ["/health", "/status"].includes(url.pathname)) return send(res, 200, { ok: true, status: publicStatus(state) });
    if (req.method === "GET" && url.pathname === "/state") return send(res, 200, state);
    if (req.method === "GET" && url.pathname === "/platform") return send(res, 200, platformSummary(state));
    if (req.method === "GET" && url.pathname === "/aliases") return send(res, 200, { aliases: state.aliases });
    if (req.method === "GET" && url.pathname === "/watchers") return send(res, 200, { watchers: state.watchers });
    if (req.method === "GET" && url.pathname === "/messages") return send(res, 200, { mail: state.mail });

    if (req.method === "POST" && ["/setup", "/domain"].includes(url.pathname)) {
      const body = await parseBody(req);
      const domain = String(body.domain || "").trim().toLowerCase();
      if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) return send(res, 400, { error: "valid domain required" });
      state.domain = { domain, mode: body.mode || "quick-domain", catchAll: Boolean(body.catchAll), createdAt: now() };
      state.runState = "running";
      event(state, "domain.configured", `Domain ${domain} configured.`);
      return send(res, 201, platformSummary(await writeState(state)));
    }

    if (req.method === "POST" && ["/alias", "/aliases"].includes(url.pathname)) {
      const body = await parseBody(req);
      const domain = state.domain?.domain || "yourdomain.com";
      let address = String(body.address || "inbox").trim().toLowerCase();
      if (!address.includes("@")) address = `${address}@${domain}`;
      state.aliases.unshift({ id: id("alias"), address, destination: body.destination || "local-vault", label: body.label || "General", active: true, createdAt: now() });
      event(state, "alias.created", `Alias ${address} created.`);
      return send(res, 201, { aliases: (await writeState(state)).aliases, latest: state.aliases[0] });
    }

    if (req.method === "POST" && url.pathname === "/watchers") {
      const body = await parseBody(req);
      const watcher = { id: id("watcher"), name: String(body.name || "Watcher").trim(), rule: String(body.rule || "Scan important local mail.").trim(), actions: Array.isArray(body.actions) ? body.actions.map(String) : ["scan", "flag", "draft_reply"], humanApprovalRequired: body.humanApprovalRequired ?? true, active: true, createdAt: now() };
      state.watchers.unshift(watcher);
      event(state, "watcher.created", `Watcher ${watcher.name} added.`);
      return send(res, 201, { watchers: (await writeState(state)).watchers, latest: watcher });
    }

    if (req.method === "POST" && url.pathname === "/messages") {
      const body = await parseBody(req);
      const latest = addMail(state, body);
      return send(res, 201, { mail: (await writeState(state)).mail, latest });
    }

    if (req.method === "POST" && url.pathname === "/actions") {
      const body = await parseBody(req);
      if (body.action === "seed") return send(res, 201, platformSummary(await writeState(await seed(state))));
      state.runState = body.action === "pause" ? "paused" : body.action === "reset-fresh" ? "fresh" : "running";
      event(state, "node.state", `Local node set to ${state.runState}.`);
      return send(res, 200, { status: publicStatus(await writeState(state)) });
    }

    return send(res, 404, { error: "not found", routes: ["GET /health", "GET /status", "GET /state", "GET /platform", "GET/POST /aliases", "GET/POST /watchers", "GET/POST /messages", "POST /setup", "POST /actions"] });
  } catch (error) {
    return send(res, 500, { error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Trail local server running at http://127.0.0.1:${port}`);
  console.log(`Trail home: ${home}`);
});
