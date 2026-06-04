
import { NextResponse } from "next/server";
import { connectors } from "@/lib/trail-core";

export async function GET() {
  return NextResponse.json({ connectors, policy: "Connector tokens must be encrypted at rest and scoped to least privilege." });
}
