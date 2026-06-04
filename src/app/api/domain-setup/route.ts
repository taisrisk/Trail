import { NextResponse } from "next/server";
import { bykPrinciples, dnsRecords } from "@/lib/byk-mail";

export async function GET() {
  return NextResponse.json({
    purpose: "Generate domain onboarding instructions for BYK/local-first mail.",
    supportedProviders: ["cloudflare", "registrar-dns", "custom-vps-relay", "self-hosted-mx"],
    records: dnsRecords,
    principles: bykPrinciples,
    caveat: "Cloudflare Tunnel is useful for the dashboard/API, but MX email still needs forwarding, relay, IMAP, or SMTP receiver ingress.",
  });
}
