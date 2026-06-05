import { ok, fail, readJson } from "@/lib/server/api";
import {
  configureDomainHost,
  configureDomainReceiver,
  configureGmailConnector,
  configureLocalModel,
  configureTool,
  markLocalModelDownloaded,
  platformSummary,
  readTrailState,
  scrapeGmailHistory,
} from "@/lib/server/trail-store";

export async function GET() {
  try {
    const state = await readTrailState();
    return ok({
      connectors: platformSummary(state).connectors,
      policy: "Connector tokens must be referenced by env/secret names, encrypted at rest, and scoped to least privilege. No OAuth tokens are returned here.",
      supportedActions: ["domain-host", "domain-receiver", "gmail-oauth", "gmail-scrape", "local-model", "model-downloaded", "tool"],
    });
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson<Record<string, unknown>>(request);
    const action = String(body.action || "");
    let state;
    if (action === "domain-host") {
      state = await configureDomainHost(body as Parameters<typeof configureDomainHost>[0]);
    } else if (action === "domain-receiver") {
      state = await configureDomainReceiver(body as Parameters<typeof configureDomainReceiver>[0]);
    } else if (action === "gmail-oauth") {
      state = await configureGmailConnector(body as Parameters<typeof configureGmailConnector>[0]);
    } else if (action === "gmail-scrape") {
      state = await scrapeGmailHistory(body as Parameters<typeof scrapeGmailHistory>[0]);
    } else if (action === "local-model") {
      state = await configureLocalModel(body as Parameters<typeof configureLocalModel>[0]);
    } else if (action === "model-downloaded") {
      state = await markLocalModelDownloaded(body as Parameters<typeof markLocalModelDownloaded>[0]);
    } else if (action === "tool") {
      state = await configureTool(body as Parameters<typeof configureTool>[0]);
    } else {
      throw new Error("Unknown connector action. Use domain-host, domain-receiver, gmail-oauth, gmail-scrape, local-model, model-downloaded, or tool.");
    }
    return ok(platformSummary(state), { status: 201 });
  } catch (error) {
    return fail(error, 400);
  }
}
