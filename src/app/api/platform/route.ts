import { fail, ok, readJson } from "@/lib/server/api";
import {
  createDraft,
  createMail,
  platformSummary,
  readTrailState,
  resolveAction,
  searchTrailState,

  updateMail,
  type ActionStatus,
  type MailFolder,
  type MailStatus,
} from "@/lib/server/trail-store";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") || "";
    const state = await readTrailState();
    return ok(platformSummary(state, q));
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson<{
      action: "seed-platform" | "create-mail" | "create-draft" | "update-mail" | "resolve-action" | "search";
      payload?: Record<string, unknown>;
    }>(request);
    const payload = body.payload || {};



    if (body.action === "create-mail") {
      const state = await createMail({
        from: String(payload.from || "sender@example.com"),
        to: String(payload.to || "inbox@yourdomain.com"),
        subject: String(payload.subject || "New message"),
        body: String(payload.body || ""),
        tags: Array.isArray(payload.tags) ? payload.tags.map(String) : ["manual"],
      });
      return ok(platformSummary(state), { status: 201 });
    }

    if (body.action === "create-draft") {
      const state = await createDraft({
        to: String(payload.to || ""),
        subject: String(payload.subject || ""),
        body: String(payload.body || ""),
        sourceMailId: payload.sourceMailId ? String(payload.sourceMailId) : undefined,
      });
      return ok(platformSummary(state), { status: 201 });
    }

    if (body.action === "update-mail") {
      const state = await updateMail({
        id: String(payload.id || ""),
        status: payload.status ? (String(payload.status) as MailStatus) : undefined,
        folder: payload.folder ? (String(payload.folder) as MailFolder) : undefined,
        unread: typeof payload.unread === "boolean" ? payload.unread : undefined,
        starred: typeof payload.starred === "boolean" ? payload.starred : undefined,
      });
      return ok(platformSummary(state));
    }

    if (body.action === "resolve-action") {
      const state = await resolveAction({ id: String(payload.id || ""), status: String(payload.status || "done") as ActionStatus });
      return ok(platformSummary(state));
    }

    if (body.action === "search") {
      const state = await readTrailState();
      return ok({ search: searchTrailState(state, String(payload.q || "")) });
    }

    return fail(new Error("Unknown platform action."), 400);
  } catch (error) {
    return fail(error);
  }
}
