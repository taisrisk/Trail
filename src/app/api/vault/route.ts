import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    purpose: "Describe the encrypted local vault scaffold.",
    root: "~/.trail/vault",
    plaintextBoundary: "User device only",
    plannedStorage: {
      metadata: "SQLite for message ids, labels, timestamps, participants, and local event log",
      blobs: "Encrypted body and attachment blobs",
      index: "Local search index generated after decrypting on-device",
      backups: "Optional encrypted export bundles",
    },
    plannedCrypto: [
      "Argon2id password key derivation",
      "Device key envelope",
      "Per-message content keys",
      "XChaCha20-Poly1305 or AES-GCM authenticated encryption",
      "No server recovery bypass",
    ],
    warning: "Prototype only: do not store real mail until vault encryption is implemented and reviewed.",
  });
}
