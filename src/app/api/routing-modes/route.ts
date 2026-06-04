import { NextResponse } from "next/server";
import { mailModes } from "@/lib/byk-mail";

export async function GET() {
  return NextResponse.json({
    purpose: "Expose Trail's three BYK mail setup modes.",
    modes: mailModes,
    recommendation: "Start with Quick Domain Mode for MVP, then add Relay Node Mode before full Sovereign MX Mode.",
  });
}
