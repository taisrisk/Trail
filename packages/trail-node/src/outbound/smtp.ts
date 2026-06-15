import nodemailer from "nodemailer";
import { readTrailState } from "../store";

export async function sendOutboundMail(options: { to: string; subject: string; text: string; html?: string; replyTo?: string }) {
  const state = await readTrailState();
  const domain = state.domain?.domain || "yourdomain.com";
  const from = state.aliases[0]?.address || `hello@${domain}`;

  // Retrieve SMTP credentials from environment
  const smtpHost = state.smtp?.host;
  const smtpPort = state.smtp?.port || 587;
  const smtpUser = state.smtp?.user;
  const smtpPass = state.smtp?.pass;

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error("SMTP credentials not configured in local state. Please add them via the dashboard.");
  }

  // Retrieve DKIM key if available
  const dkimPrivateKey = state.smtp?.dkimPrivateKey;

  const transportConfig: Record<string, unknown> = {
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  };


  // TryCloudflare logic (Skip DKIM signing since we don't control the trycloudflare.com DNS root)
  const isTryCloudflare = domain.endsWith("trycloudflare.com");

  if (dkimPrivateKey && !isTryCloudflare) {
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
