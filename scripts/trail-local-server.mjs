#!/usr/bin/env node
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

const home = (process.env.TRAIL_HOME || path.join(os.homedir(), ".trail")).replace(/^~(?=$|[\\/])/, os.homedir());
const port = Number(process.env.TRAIL_NODE_PORT || 8787);
const folders = ["config", "keys", "vault", "mail", "attachments", "index", "graph", "watchers", "calendar", "orders", "queues", "backups", "logs"];
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
    version: 1,
    nodeId: id("node"),
    runState: "running",
    home,
    aliases: [],
    watchers: [],
    mail: [],
    events: [{ id: id("evt"), type: "node.server", message: "Standalone Trail local server started.", at }],
    createdAt: at,
    updatedAt: at,
  };
}

async function readState() {
  await ensureHome();
  if (!existsSync(dbFile)) {
    const state = defaultState();
    await writeState(state);
    return state;
  }
  return JSON.parse(await readFile(dbFile, "utf8"));
}

async function writeState(state) {
  await ensureHome();
  const next = { ...state, home, updatedAt: now() };
  await writeFile(dbFile, JSON.stringify(next, null, 2), "utf8");
  return next;
}

function send(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
  res.end(JSON.stringify(data, null, 2));
}

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") return send(res, 204, {});
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const state = await readState();

    if (req.method === "GET" && url.pathname === "/health") {
      return send(res, 200, { ok: true, nodeId: state.nodeId, runState: state.runState, home, updatedAt: state.updatedAt });
    }

    if (req.method === "GET" && url.pathname === "/state") {
      return send(res, 200, state);
    }

    if (req.method === "POST" && url.pathname === "/domain") {
      const body = await parseBody(req);
      const domain = String(body.domain || "").trim().toLowerCase();
      if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) return send(res, 400, { error: "valid domain required" });
      state.domain = { domain, mode: body.mode || "quick-domain", catchAll: Boolean(body.catchAll), createdAt: now() };
      state.runState = "running";
      state.events.unshift({ id: id("evt"), type: "domain.configured", message: `Domain ${domain} configured.`, at: now() });
      return send(res, 201, await writeState(state));
    }

    if (req.method === "POST" && url.pathname === "/alias") {
      const body = await parseBody(req);
      const domain = state.domain?.domain || "yourdomain.com";
      let address = String(body.address || "inbox").trim().toLowerCase();
      if (!address.includes("@")) address = `${address}@${domain}`;
      state.aliases.unshift({ id: id("alias"), address, destination: body.destination || "local-vault", label: body.label || "General", active: true, createdAt: now() });
      state.events.unshift({ id: id("evt"), type: "alias.created", message: `Alias ${address} created.`, at: now() });
      return send(res, 201, await writeState(state));
    }

    return send(res, 404, { error: "not found", routes: ["GET /health", "GET /state", "POST /domain", "POST /alias"] });
  } catch (error) {
    return send(res, 500, { error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Trail local server running at http://127.0.0.1:${port}`);
  console.log(`Trail home: ${home}`);
});
