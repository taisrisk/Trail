import * as crypto from "crypto";
import * as path from "path";
import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";

let transientVaultKey: Buffer | null = null;

export function setTransientKey(key: Buffer | null) {
  transientVaultKey = key;
}

export function getTransientKey(): Buffer | null {
  return transientVaultKey;
}

export function isLocked(): boolean {
  return transientVaultKey === null;
}

export async function getOrCreateLocalKey(home: string): Promise<Buffer> {
  const keysDir = path.join(home, "keys");
  await mkdir(keysDir, { recursive: true });
  const keyFile = path.join(keysDir, "local-device.key");
  if (existsSync(keyFile)) {
    const raw = await readFile(keyFile, "utf8");
    return Buffer.from(raw.trim(), "base64");
  }
  const key = crypto.randomBytes(32);
  await writeFile(keyFile, key.toString("base64"), { mode: 0o600 });
  return key;
}

export function deriveKeyFromPassword(password: string, salt: string): Buffer {
  // Use crypto.scryptSync for high-performance, secure key derivation
  // standard parameters for password hashing
  return crypto.scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 });
}

export interface EncryptedEnvelope {
  ciphertext: string;
  nonce: string;
  tag: string;
}

export function encrypt(plaintext: string, key: Buffer): EncryptedEnvelope {
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, nonce);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final()
  ]);
  return {
    ciphertext: ciphertext.toString("base64"),
    nonce: nonce.toString("base64"),
    tag: cipher.getAuthTag().toString("base64")
  };
}

export function decrypt(ciphertext: string, nonce: string, tag: string, key: Buffer): string {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(nonce, "base64")
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64")),
    decipher.final()
  ]);
  return decrypted.toString("utf8");
}

export function generateVerifyBlock(key: Buffer): { verifyBlock: string; nonce: string; tag: string } {
  const enc = encrypt("Trail Vault Unlock Verify", key);
  return {
    verifyBlock: enc.ciphertext,
    nonce: enc.nonce,
    tag: enc.tag
  };
}

export function checkVerifyBlock(key: Buffer, verifyBlock: string, nonce: string, tag: string): boolean {
  try {
    const decrypted = decrypt(verifyBlock, nonce, tag, key);
    return decrypted === "Trail Vault Unlock Verify";
  } catch {
    return false;
  }
}

export async function unlockWithLocalDevKey(home: string): Promise<void> {
  const key = await getOrCreateLocalKey(home);
  setTransientKey(key);
}

export function unlockWithPassword(
  password: string,
  salt: string,
  verifyBlock: string,
  nonce: string,
  tag: string
): boolean {
  const key = deriveKeyFromPassword(password, salt);
  if (checkVerifyBlock(key, verifyBlock, nonce, tag)) {
    setTransientKey(key);
    return true;
  }
  return false;
}
