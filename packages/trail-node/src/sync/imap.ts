import { ImapFlow } from "imapflow";
import { parseEml } from "../parser";
import { readTrailState, createMail } from "../store";

export async function syncImap(config: { host: string; port: number; secure: boolean; user: string; pass: string }) {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    logger: false,
  });

  await client.connect();
  let count = 0;

  const state = await readTrailState();
  const aliasTo = state.aliases[0]?.address || "inbox@yourdomain.com";

  try {
    const lock = await client.getMailboxLock('INBOX');
    try {
      // Fetch unseen messages
      for await (const message of client.fetch({ seen: false }, { source: true, envelope: true })) {
        if (message.source) {
          try {
            const parsed = await parseEml(message.source.toString("utf-8"));

            // Check if exists
            const exists = state.mail.some((mail) => mail.subject === parsed.subject && mail.tags.includes("imap-import"));

            if (!exists) {
              await createMail({
                from: parsed.from,
                to: parsed.to || aliasTo,
                subject: parsed.subject,
                body: parsed.body,
                tags: ["imap-import"],
              });
              count++;
            }

            // Mark as read or remove unseen flag if needed, skip for now to be safe
          } catch (e: unknown) {
            console.error("Failed to parse/import IMAP message", e instanceof Error ? e.message : String(e));
          }
        }
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }

  return count;
}


export async function startImapIdle(config: { host: string; port: number; secure: boolean; user: string; pass: string }) {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    logger: false,
  });

  const state = await readTrailState();
  const aliasTo = state.aliases[0]?.address || "inbox@yourdomain.com";

  const handleMessage = async (uid: number) => {
    try {
      const message = await client.fetchOne(uid.toString(), { source: true, envelope: true }, { uid: true });
      if (message && message.source) {
        const parsed = await parseEml(message.source.toString("utf-8"));
        const exists = state.mail.some((mail) => mail.subject === parsed.subject && mail.tags.includes("imap-import"));

        if (!exists) {
          await createMail({
            from: parsed.from,
            to: parsed.to || aliasTo,
            subject: parsed.subject,
            body: parsed.body,
            tags: ["imap-import"],
          });
          console.log(`[IMAP] Imported new message: ${parsed.subject}`);
        }
      }
    } catch (e: unknown) {
      console.error("[IMAP] Failed to process new message", e instanceof Error ? e.message : String(e));
    }
  };

  await client.connect();
  const lock = await client.getMailboxLock('INBOX');

  // Initial sync
  try {
    for await (const message of client.fetch({ seen: false }, { source: true, envelope: true })) {
      if (message.source) {
        try {
          const parsed = await parseEml(message.source.toString("utf-8"));
          const exists = state.mail.some((mail) => mail.subject === parsed.subject && mail.tags.includes("imap-import"));

          if (!exists) {
            await createMail({
              from: parsed.from,
              to: parsed.to || aliasTo,
              subject: parsed.subject,
              body: parsed.body,
              tags: ["imap-import"],
            });
          }
        } catch (e: unknown) {
          console.error("Failed to parse/import IMAP message", e instanceof Error ? e.message : String(e));
        }
      }
    }
  } catch (err) {
    console.error("Initial sync failed", err);
  }

  // Setup IDLE
  client.on('exists', async (data) => {
    console.log(`[IMAP] New message count: ${data.count}`);
    try {
      // Safely fetch only unseen messages on exists event
      for await (const message of client.fetch({ seen: false }, { source: true, envelope: true })) {
        if (message.source) {
          const parsed = await parseEml(message.source.toString("utf-8"));
          const exists = state.mail.some((mail) => mail.subject === parsed.subject && mail.tags.includes("imap-import"));

          if (!exists) {
            await createMail({
              from: parsed.from,
              to: parsed.to || aliasTo,
              subject: parsed.subject,
              body: parsed.body,
              tags: ["imap-import"],
            });
            console.log(`[IMAP] Imported new message: ${parsed.subject}`);
          }
        }
      }
    } catch(e) {
      console.error("[IMAP] IDLE fetch failed", e instanceof Error ? e.message : String(e));
    }
  });

  console.log(`[IMAP] IDLE mode activated for ${config.user} on ${config.host}`);

  // Return cleanup function
  return () => {
    console.log(`[IMAP] Disconnecting...`);
    lock.release();
    client.logout().catch(console.error);
  };
}
