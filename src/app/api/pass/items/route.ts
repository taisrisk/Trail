import { NextRequest, NextResponse } from "next/server";

import { addPassItem, listSafeItems, seedPassVault } from "@/lib/server/pass-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ items: await listSafeItems(), plaintextSecretsReturned: false });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (body?.seed === true) {
    return NextResponse.json(await seedPassVault(), { status: 201 });
  }

  const item = await addPassItem(body || {});
  return NextResponse.json({ item, plaintextSecretsReturned: false }, { status: 201 });
}
