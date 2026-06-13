import nodemailer from "nodemailer";
import { readTrailState } from "../store";

export async function sendOutboundMail(options: { to: string; subject: string; text: string; html?: string; replyTo?: string }) {
  const state = await readTrailState();
  const domain = state.domain?.domain || "yourdomain.com";
  const from = state.aliases[0]?.address || `hello@${domain}`;

  // Retrieve SMTP credentials from environment
  const smtpHost = process.env.TRAIL_SMTP_HOST;
  const smtpPort = process.env.TRAIL_SMTP_PORT ? parseInt(process.env.TRAIL_SMTP_PORT, 10) : 587;
  const smtpUser = process.env.TRAIL_SMTP_USER;
  const smtpPass = process.env.TRAIL_SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error("SMTP credentials not configured in environment (TRAIL_SMTP_HOST, TRAIL_SMTP_USER, TRAIL_SMTP_PASS)");
  }

  // Retrieve DKIM key if available
  const dkimPrivateKey = process.env.TRAIL_DKIM_PRIVATE_KEY;

  const transportConfig: Record<string, unknown> = {
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  };

  if (dkimPrivateKey) {
    transportConfig.dkim = {
      domainName: domain,
      keySelector: "trail",
      privateKey: dkimPrivateKey,
    };
  }

  const transporter = nodemailer.createTransport(transportConfig);

  const mailOptions = {
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    replyTo: options.replyTo,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}
