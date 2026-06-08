import * as crypto from "crypto";
import * as path from "path";
import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import { encrypt, decrypt, EncryptedEnvelope } from "./crypto";

function getBlobPath(home: string, id: string): string {
  // Safe filename matching only alphanumeric and underscores
  const cleanId = id.replace(/[^a-zA-Z0-9_-]/g, "");
  return path.join(home, "vault", `${cleanId}.blob`);
}

export async function writeBlob(home: string, data: string, key: Buffer): Promise<string> {
  const vaultDir = path.join(home, "vault");
  await mkdir(vaultDir, { recursive: true });
  
  const blobId = `blob_${crypto.randomUUID()}`;
  const filePath = getBlobPath(home, blobId);
  
  const envelope = encrypt(data, key);
  await writeFile(filePath, JSON.stringify(envelope, null, 2), { mode: 0o600 });
  
  return blobId;
}

export async function readBlob(home: string, id: string, key: Buffer): Promise<string> {
  const filePath = getBlobPath(home, id);
  if (!existsSync(filePath)) {
    throw new Error(`Blob file not found for ID: ${id}`);
  }
  
  const raw = await readFile(filePath, "utf8");
  const envelope: EncryptedEnvelope = JSON.parse(raw);
  
  return decrypt(envelope.ciphertext, envelope.nonce, envelope.tag, key);
}
