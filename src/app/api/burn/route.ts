import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    policy: "inactive-account-crypto-burn",
    inactiveAfterDays: 365,
    burnDeletes: [
      "encrypted message blobs",
      "attachment blobs",
      "wrapped key envelopes",
      "connector token envelopes",
      "search index shards",
      "knowledge graph shards",
      "calendar and order tracker blobs",
      "pending queues",
    ],
    note: "This endpoint is a blueprint. Production burn jobs must be idempotent, audited internally, and impossible to reverse after key/blob deletion.",
  });
}
