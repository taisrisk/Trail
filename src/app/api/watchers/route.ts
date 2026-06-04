
import { NextResponse } from "next/server";
import { watchers } from "@/lib/trail-core";

export async function GET() {
  return NextResponse.json({ watchers, defaultMode: "local-ai-human-confirm-before-send" });
}
