import { SMTPServer } from "smtp-server";
import { readTrailState, createMail } from "../store";
import { parseEml } from "../parser";

export async function startSovereignSMTPServer(port = 25) {
  const server = new SMTPServer({
    secure: false, // TLS is handled if certs are provided, or behind a reverse proxy
    authOptional: true,

    async onData(stream, session, callback) {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk) => chunks.push(chunk));

      stream.on("end", async () => {
        try {
          const rawBody = Buffer.concat(chunks);
          const state = await readTrailState();

          // Verify it's meant for a configured alias
          const validDomains = [state.domain?.domain, state.domainHost?.domain].filter(Boolean);
          const toAddress = session.envelope.rcptTo.map(r => r.address)[0] || "";
          const domainMatch = validDomains.some(d => toAddress.endsWith(`@${d}`));

          if (!domainMatch) {
            console.warn(`[SMTP] Rejected message for unknown domain: ${toAddress}`);
            return callback(new Error("Relay access denied"));
          }

          const parsed = await parseEml(rawBody.toString('utf8'));

          await createMail({
            from: parsed.from,
            to: parsed.to || toAddress,
            subject: parsed.subject,
            body: parsed.body,
            tags: ["sovereign-inbound"],
          });

          callback();
        } catch (err: unknown) {
          console.error("[SMTP] Inbound parse failed:", err instanceof Error ? err.message : String(err));
          callback(new Error("Internal error processing message"));
        }
      });
    }
  });

  server.listen(port, () => {
    console.log(`[SMTP] Sovereign inbound server listening on port ${port}`);
  });

  return server;
}
