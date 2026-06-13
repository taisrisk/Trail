import { readTrailState, getTrailHome, writeTrailState } from "../store";
import { encrypt, decrypt } from "../crypto";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function createEncryptedBackup(password: string, destPath?: string) {
  const state = await readTrailState();
  const serialized = JSON.stringify(state);

  // Create a backup key derived from the given backup password
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 32);

  // Encrypt the state
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(serialized, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const backupData = Buffer.concat([
    salt,
    iv,
    authTag,
    encrypted
  ]);

  const finalPath = destPath || path.join(getTrailHome(), "backups", `trail-backup-${Date.now()}.enc`);
  await fs.mkdir(path.dirname(finalPath), { recursive: true });
  await fs.writeFile(finalPath, backupData);

  return { success: true, path: finalPath };
}

export async function restoreFromEncryptedBackup(password: string, backupPath: string) {
  const backupData = await fs.readFile(backupPath);

  if (backupData.length < 16 + 12 + 16) {
    throw new Error("Invalid backup file format");
  }

  const salt = backupData.subarray(0, 16);
  const iv = backupData.subarray(16, 28);
  const authTag = backupData.subarray(28, 44);
  const encrypted = backupData.subarray(44);

  const key = crypto.scryptSync(password, salt, 32);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    const state = JSON.parse(decrypted.toString("utf8"));

    // Validate state (basic)
    if (!state.version || !state.id) {
      throw new Error("Invalid Trail state data");
    }

    await writeTrailState(state);
    return { success: true };
  } catch (err) {
    throw new Error("Failed to decrypt backup (wrong password or corrupted data)");
  }
}
