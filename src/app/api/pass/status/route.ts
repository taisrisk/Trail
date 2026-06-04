import { NextResponse } from "next/server";

import { passSummary, readPassState } from "@/lib/server/pass-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const state = await readPassState();
  return NextResponse.json(passSummary(state));
}
