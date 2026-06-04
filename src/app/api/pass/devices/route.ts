import { NextRequest, NextResponse } from "next/server";

import { listDevices, registerDevice } from "@/lib/server/pass-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ devices: await listDevices() });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const device = await registerDevice(body || {});
  return NextResponse.json({ device, trusted: false, next: "Confirm this device from the local vault before it can decrypt anything." }, { status: 201 });
}
