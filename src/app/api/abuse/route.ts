import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    outboundProtection: [
      "new-account warmup",
      "per-account rate limits",
      "per-domain reputation scoring",
      "spam/phishing/malware scoring",
      "complaint feedback loops",
      "attachment and link risk checks",
      "temporary send holds",
    ],
    privacyBoundary: "Abuse controls should operate on routing metadata, spam scores, user reports, and outbound payload checks; stored mailbox plaintext remains unavailable to the server.",
  });
}
