
export const cryptoBlueprint = {
  passwordKdf: "Argon2id with per-account salt",
  mailboxKey: "Generated client-side; wrapped only by password key and optional recovery phrase key",
  messageEncryption: "XChaCha20-Poly1305 or AES-256-GCM per message with unique nonce",
  searchIndex: "Client-side encrypted lexical/vector index; server stores opaque shards",
  aiContext: "Local-only decrypted context window streamed to Ollama/tiny model; server never sees plaintext",
  deletion: "Crypto-burn by deleting encrypted blobs, key envelopes, queues, connector tokens, and local index sync state",
};

export function publicAccountNumber() {
  const groups = Array.from({ length: 4 }, () => Math.floor(1000 + Math.random() * 9000));
  return groups.join(" ");
}
