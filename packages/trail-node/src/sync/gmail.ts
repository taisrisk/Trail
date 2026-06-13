import { gmail_v1, auth } from "@googleapis/gmail";
import { parseEml } from "../parser";
import { readTrailState, createMail, writeTrailState, appendEvent } from "../store";

export async function syncGmail(config: { clientId: string; clientSecret: string; refreshToken: string }) {
  const oAuth2Client = new auth.OAuth2(
    config.clientId,
    config.clientSecret,
    "urn:ietf:wg:oauth:2.0:oob" // Local/native callback usually
  );

  oAuth2Client.setCredentials({ refresh_token: config.refreshToken });

  const gmail = new gmail_v1.Gmail({ auth: oAuth2Client });

  const state = await readTrailState();
  const aliasTo = state.aliases[0]?.address || "inbox@yourdomain.com";

  let historyId = state.gmail?.historyId;
  let count = 0;

  try {
    if (historyId) {
      // Partial sync
      const res = await gmail.users.history.list({
        userId: "me",
        startHistoryId: historyId,
        historyTypes: ["messageAdded"],
      });

      const histories = res.data.history || [];
      for (const history of histories) {
        for (const added of history.messagesAdded || []) {
          const msgId = added.message?.id;
          if (msgId) {
            count += await importGmailMessage(gmail, msgId, aliasTo);
          }
        }
      }
      if (res.data.historyId) historyId = res.data.historyId;
    } else {
      // Full sync (limit to recent for safety)
      const res = await gmail.users.messages.list({
        userId: "me",
        q: "is:inbox",
        maxResults: 500, // production sync limit per batch
      });

      const messages = res.data.messages || [];
      for (const msg of messages) {
        if (msg.id) {
          count += await importGmailMessage(gmail, msg.id, aliasTo);
        }
      }

      // Get latest history ID to save
      const profile = await gmail.users.getProfile({ userId: "me" });
      if (profile.data.historyId) historyId = profile.data.historyId;
    }
  } catch (err: unknown) {
    console.error("Gmail sync failed", err instanceof Error ? err.message : String(err));
    throw err;
  }

  return { count, historyId };
}

async function importGmailMessage(gmail: gmail_v1.Gmail, msgId: string, aliasTo: string): Promise<number> {
  const state = await readTrailState();
  const msg = await gmail.users.messages.get({
    userId: "me",
    id: msgId,
    format: "raw",
  });

  if (!msg.data.raw) return 0;

  const rawDecoded = Buffer.from(msg.data.raw, "base64url").toString("utf-8");

  try {
    const parsed = await parseEml(rawDecoded);

    // Check if exists
    const exists = state.mail.some((mail) => mail.subject === parsed.subject && mail.tags.includes("gmail-import"));
    if (!exists) {
      await createMail({
        from: parsed.from,
        to: parsed.to || aliasTo,
        subject: parsed.subject,
        body: parsed.body,
        tags: ["gmail-import"],
      });
      return 1;
    }
  } catch (e: unknown) {
    console.error("Failed to parse/import Gmail message", e instanceof Error ? e.message : String(e));
  }
  return 0;
}
