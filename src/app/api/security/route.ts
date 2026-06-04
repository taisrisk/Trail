
import { NextResponse } from "next/server";
import { productPrinciples, securityLayers } from "@/lib/trail-core";
import { cryptoBlueprint } from "@/lib/crypto-blueprint";

export async function GET() {
  return NextResponse.json({ productPrinciples, securityLayers, cryptoBlueprint });
}
