import crypto from 'node:crypto';
import { readTrailState, createMail, appendEvent } from '../store';
import { parseEml } from '../parser';


import { IncomingMessage } from 'node:http';

// Tolerated delay in ms (e.g. 5 minutes)
const MAX_TIME_DIFF = 5 * 60 * 1000;

export async function verifyAndProcessWebhook(reqStream: IncomingMessage, signature: string, timestampStr: string) {
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    throw new Error('Invalid timestamp');
  }

  const now = Date.now();
  if (Math.abs(now - timestamp) > MAX_TIME_DIFF) {
    throw new Error('Timestamp out of range (replay protection)');
  }

  const state = await readTrailState();

  // The secret reference should match what is stored in state.receiver.inboundSecretRef
  const secretRef = state.receiver?.inboundSecretRef || "TRAIL_INBOUND_SECRET";
  const secret = process.env[secretRef];

  if (!secret) {
    throw new Error(`Inbound webhook secret not configured in environment (${secretRef})`);
  }

  // Calculate signature on the fly
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${timestamp}.`);

  // Process stream into memory for parsing later (ideally would stream straight to disk/parser but EML parser needs buffer currently)
  const chunks: Buffer[] = [];

  for await (const chunk of reqStream) {
    hmac.update(chunk);
    chunks.push(chunk as Buffer);
  }

  const rawBody = Buffer.concat(chunks);
  const calculatedSignature = hmac.digest('hex');

  // Constant-time comparison
  try {
    const calcBuf = Buffer.from(calculatedSignature);
    const sigBuf = Buffer.from(signature);
    if (calcBuf.length !== sigBuf.length || !crypto.timingSafeEqual(calcBuf, sigBuf)) {
       throw new Error('Invalid signature');
    }
  } catch (e: unknown) {
     throw new Error('Invalid signature format');
  }

  // Parse and Import
  const parsed = await parseEml(rawBody.toString('utf8'));
  const aliasTo = state.aliases[0]?.address || "inbox@yourdomain.com";

  await createMail({
    from: parsed.from,
    to: parsed.to || aliasTo,
    subject: parsed.subject,
    body: parsed.body,
    tags: ["webhook-import"],
  });

  return { success: true };
}
