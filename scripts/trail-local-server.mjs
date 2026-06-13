#!/usr/bin/env node
import { createServer } from "node:http";
import {
  readTrailState,
  setupDomain,
  createAlias,
  createWatcher,
  createMail,
  setRunState,
  configureDomainHost,
  configureDomainReceiver,
  configureGmailConnector,
  scrapeGmailHistory,
  configureLocalModel,
  markLocalModelDownloaded,
  configureTool,
  seedPlatformData,
  publicStatus,
  platformSummary,
  unlockVault,
  enablePasswordEncryption,
  recoverVault,
  getTrailHome
,  verifyAndProcessWebhook
,  startImapIdle
} from "../packages/trail-node/src/index.ts";


const home = getTrailHome();
const port = Number(process.env.TRAIL_NODE_PORT || 8787);

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function send(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data, null, 2));
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") return send(res, 204, {});
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const state = await readTrailState();



let imapCleanup = null;
    if (req.method === "POST" && url.pathname === "/api/ingress/imap-start") {
      const body = await parseBody(req);
      try {
        if (imapCleanup) imapCleanup();
        imapCleanup = await startImapIdle({ host: body.host, port: body.port, secure: body.secure, user: body.user, pass: body.pass });
        return send(res, 200, { success: true, message: "IMAP IDLE started" });
      } catch (err) {
        console.error("IMAP IDLE start failed:", err.message);
        return send(res, 500, { error: err.message });
      }
    }

    if (req.method === "POST" && url.pathname === "/api/ingress/imap-stop") {
      if (imapCleanup) {
        imapCleanup();
        imapCleanup = null;
        return send(res, 200, { success: true, message: "IMAP IDLE stopped" });
      }
      return send(res, 200, { success: true, message: "IMAP IDLE not running" });
    }

    if (req.method === "GET" && url.pathname === "/api/ingress/health") {
      return send(res, 200, { ok: true, timestamp: Date.now(), service: "trail-node-ingress" });
    }

    if (req.method === "GET" && ["/health", "/status"].includes(url.pathname)) {
      return send(res, 200, { ok: true, status: publicStatus(state) });
    }
    if (req.method === "GET" && url.pathname === "/state") {
      return send(res, 200, state);
    }
    if (req.method === "GET" && url.pathname === "/platform") {
      return send(res, 200, platformSummary(state));
    }
    if (req.method === "GET" && url.pathname === "/aliases") {
      return send(res, 200, { aliases: state.aliases });
    }
    if (req.method === "GET" && url.pathname === "/watchers") {
      return send(res, 200, { watchers: state.watchers });
    }
    if (req.method === "GET" && url.pathname === "/messages") {
      return send(res, 200, { mail: state.mail });
    }
    if (req.method === "GET" && url.pathname === "/connectors") {
      return send(res, 200, { connectors: platformSummary(state).connectors });
    }


    if (req.method === "POST" && url.pathname === "/api/ingress/webhook") {
      const signature = req.headers["x-trail-signature"];
      const timestamp = req.headers["x-trail-timestamp"];

      if (!signature || !timestamp) {
        return send(res, 401, { error: "Missing required signature headers" });
      }


      try {
        const result = await verifyAndProcessWebhook(req, Array.isArray(signature) ? signature[0] : signature, Array.isArray(timestamp) ? timestamp[0] : timestamp);
        return send(res, 200, { success: true });
      } catch (err) {
        console.error("Webhook processing error:", err.message);
        return send(res, 401, { error: err.message });
      }
    }

    if (req.method === "POST" && url.pathname === "/connectors") {
      const body = await parseBody(req);
      let nextState = state;
      if (body.action === "domain-host") {
        nextState = await configureDomainHost({ provider: body.provider, domain: body.domain });
      } else if (body.action === "domain-receiver") {
        nextState = await configureDomainReceiver({ mode: body.mode, targetAddress: body.targetAddress });
      } else if (body.action === "gmail-oauth") {
        nextState = await configureGmailConnector({ clientIdRef: body.clientIdRef, tokenRef: body.tokenRef });
      } else if (body.action === "gmail-scrape") {
        nextState = await scrapeGmailHistory({ limit: 1 });
      } else if (body.action === "local-model" || body.action === "model-downloaded") {
        await configureLocalModel({ provider: body.provider, model: body.model, purpose: body.purpose });
        if (body.action === "model-downloaded") {
          nextState = await markLocalModelDownloaded({ model: body.model });
        } else {
          nextState = await readTrailState();
        }
      } else if (body.action === "tool") {
        nextState = await configureTool({ name: body.name, type: body.type, notes: body.notes, status: body.status });
      } else {
        return send(res, 400, { error: "unknown connector action" });
      }
      return send(res, 201, platformSummary(nextState));
    }

    if (req.method === "POST" && ["/setup", "/domain"].includes(url.pathname)) {
      const body = await parseBody(req);
      const domain = String(body.domain || "").trim().toLowerCase();
      if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
        return send(res, 400, { error: "valid domain required" });
      }
      const nextState = await setupDomain({ domain, mode: body.mode || "quick-domain", catchAll: Boolean(body.catchAll) });
      return send(res, 201, platformSummary(nextState));
    }

    if (req.method === "POST" && ["/alias", "/aliases"].includes(url.pathname)) {
      const body = await parseBody(req);
      const nextState = await createAlias({ address: body.address, destination: body.destination, label: body.label });
      return send(res, 201, { aliases: nextState.aliases, latest: nextState.aliases[0] });
    }

    if (req.method === "POST" && url.pathname === "/watchers") {
      const body = await parseBody(req);
      const nextState = await createWatcher({ name: body.name, rule: body.rule, actions: body.actions, humanApprovalRequired: body.humanApprovalRequired });
      return send(res, 201, { watchers: nextState.watchers, latest: nextState.watchers[0] });
    }

    if (req.method === "POST" && url.pathname === "/messages") {
      const body = await parseBody(req);
      const nextState = await createMail({ from: body.from, to: body.to, subject: body.subject, body: body.body, tags: body.tags });
      return send(res, 201, { mail: nextState.mail, latest: nextState.mail[0] });
    }

    if (req.method === "POST" && url.pathname === "/actions") {
      const body = await parseBody(req);
      if (body.action === "seed") {
        const nextState = await seedPlatformData();
        return send(res, 201, platformSummary(nextState));
      }
      const runState = body.action === "pause" ? "paused" : body.action === "reset-fresh" ? "fresh" : "running";
      const nextState = await setRunState(runState);
      return send(res, 200, { status: publicStatus(nextState) });
    }

    // New crypto endpoints for standalone server
    if (req.method === "POST" && url.pathname === "/unlock") {
      const body = await parseBody(req);
      if (!body.password) {
        return send(res, 400, { error: "Password is required" });
      }
      const success = await unlockVault(body.password);
      if (success) {
        return send(res, 200, { unlocked: true, message: "Vault unlocked successfully." });
      } else {
        return send(res, 401, { error: "Incorrect password" });
      }
    }

    if (req.method === "POST" && url.pathname === "/encryption") {
      const body = await parseBody(req);
      if (body.action === "enable-password") {
        if (!body.password) {
          return send(res, 400, { error: "Password is required" });
        }
        const { recoveryPhrase } = await enablePasswordEncryption(body.password);
        return send(res, 200, { success: true, message: "Password encryption enabled.", recoveryPhrase });
      }
      if (body.action === "recover") {
        if (!body.recoveryPhrase) {
          return send(res, 400, { error: "Recovery phrase is required" });
        }
        const success = await recoverVault(body.recoveryPhrase);
        if (success) {
          return send(res, 200, { success: true, message: "Vault recovered and unlocked." });
        } else {
          return send(res, 400, { error: "Invalid recovery phrase" });
        }
      }
      return send(res, 400, { error: "invalid action" });
    }

    return send(res, 404, {
      error: "not found",
      routes: [
        "GET /health",
        "GET /status",
        "GET /state",
        "GET /platform",
        "GET/POST /connectors",
        "GET/POST /aliases",
        "GET/POST /watchers",
        "GET/POST /messages",
        "POST /setup",
        "POST /actions",
        "POST /unlock",
        "POST /encryption"
      ]
    });
  } catch (error) {
    return send(res, 500, { error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Trail local server running at http://127.0.0.1:${port}`);
  console.log(`Trail home: ${home}`);
});
