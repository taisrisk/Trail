import { fail, ok, readJson } from "@/lib/server/api";
import { readTrailState, writeTrailState } from "@/lib/server/trail-store";
import crypto from "crypto";

const id = (prefix: string) => `${prefix}_${crypto.randomBytes(4).toString("hex")}`;
const now = () => new Date().toISOString();
import { sendOutboundMail } from "trail-node";

export async function POST(request: Request) {
  try {
    const body = await readJson<{ to: string; subject: string; body: string }>(request);

    // Call the underlying node package
    await sendOutboundMail({
      to: body.to,
      subject: body.subject,
      text: body.body,
    });

    // Log it in state as a sent item
    const state = await readTrailState();
    const from = state.aliases[0]?.address || `hello@${state.domain?.domain || "yourdomain.com"}`;

    state.mail.unshift({
      id: id("mail"),
      threadId: id("thread"),
      from,
      to: body.to,
      subject: body.subject,
      bodyPreview: body.body.substring(0, 50),
      body: body.body,
      receivedAt: now(),
      folder: "archive", // Or "sent" if supported
      status: "inbox",
      tags: ["sent"],
      unread: false,
      watcherMatches: [], starred: false, importance: "normal" as const,
    });

    await writeTrailState(state);

    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
