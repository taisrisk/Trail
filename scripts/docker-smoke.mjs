const base = process.env.ERME_URL || "http://127.0.0.1:3000";

async function check(path, options = {}) {
  const res = await fetch(`${base}${path}`, options);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`${path} -> ${res.status}\n${text.slice(0, 500)}`);
    process.exit(1);
  }
  console.log(`${options.method || "GET"} ${path} -> ${res.status}`);
  const type = res.headers.get("content-type") || "";
  return type.includes("application/json") ? res.json() : res.text();
}

for (const path of ["/", "/mail", "/ecosystem", "/pass", "/dashboard", "/install"]) {
  await check(path);
}

for (const path of [
  "/api/node/status",
  "/api/node/aliases",
  "/api/node/watchers",
  "/api/node/messages",
  "/api/platform",
  "/api/pass/status",
  "/api/pass/items",
  "/api/connectors",
  "/install/trail-install.cmd",
  "/install/trail-install.sh",
]) {
  await check(path);
}

await check("/api/node/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain: "yourdomain.com", mode: "quick-domain", catchAll: true }) });
await check("/api/node/aliases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address: `smoke-${Date.now()}`, destination: "local-vault", label: "Smoke alias" }) });
await check("/api/node/watchers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Smoke watcher", rule: "Flag smoke test invoices and package delays", actions: ["scan", "flag", "draft_reply"], humanApprovalRequired: true }) });
await check("/api/node/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ from: "smoke@example.com", to: "inbox@yourdomain.com", subject: "Smoke invoice package delay", body: "This verifies inbox, timeline, knowledge graph, watcher matching, and action queue.", tags: ["smoke", "invoice", "package"] }) });
await check("/api/platform", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "seed-platform" }) });
await check("/api/pass/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: `Smoke vault ${Date.now()}`, username: "tai", origin: "https://trail.local", tags: ["smoke"] }) });
await check("/api/connectors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "domain-host", provider: "cloudflare", domain: "yourdomain.com" }) });
await check("/api/connectors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "domain-receiver", mode: "cloudflare-email-routing", targetAddress: "inbox@yourdomain.com" }) });
await check("/api/connectors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "gmail-oauth", clientIdRef: "GOOGLE_CLIENT_ID", tokenRef: "GOOGLE_REFRESH_TOKEN" }) });
await check("/api/connectors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "gmail-scrape", limit: 2 }) });
await check("/api/connectors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "local-model", provider: "ollama", model: "llama3.2:3b", purpose: "watchers" }) });
await check("/api/connectors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "model-downloaded", model: "llama3.2:3b" }) });
await check("/api/connectors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "tool", name: "Smoke tool", type: "automation", notes: "Smoke-tested tool connector" }) });

const platform = await check("/api/platform");
const pass = await check("/api/pass/status");
const items = await check("/api/pass/items");
const leaked = JSON.stringify(items).includes("encryptedBlob") || JSON.stringify(items).includes("local-device.key");
if (leaked || items.plaintextSecretsReturned !== false) {
  console.error("Pass API leaked private fields or did not report redaction.");
  process.exit(1);
}

console.log(JSON.stringify({
  mail: platform.status?.counts?.mail,
  contacts: platform.contacts?.length,
  graphNodes: platform.graph?.nodes?.length,
  actions: platform.actions?.length,
  connectors: platform.status?.counts?.connectors,
  gmailImported: platform.connectors?.gmail?.imported,
  localModels: platform.connectors?.localModels?.length,
  passItems: pass.counts?.items,
  plaintextSecretsReturned: pass.security?.plaintextSecretsReturned,
}, null, 2));
