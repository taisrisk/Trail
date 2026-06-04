import { NextRequest, NextResponse } from "next/server";

import { generatePassword } from "@/lib/server/pass-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const length = Number(request.nextUrl.searchParams.get("length") || 24);
  return NextResponse.json({ password: generatePassword(length), stored: false, warning: "Generated locally for copy/use; not persisted unless encrypted into a vault item." });
}
