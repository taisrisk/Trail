import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import * as crypto from "crypto";
import * as os from "os";
import * as path from "path";

export type PassItemKind = "login" | "passkey" | "secure-note" | "card" | "identity" | "recovery-code" | "api-secret" | "ssh-key";
export type PassDeviceKind = "web" | "chrome-extension" | "ios" | "windows" | "local-node";

export interface PassVaultItem {
  id: string;
  kind: PassItemKind;
  title: string;
  username?: string;
  origin?: string;
  tags: string[];
  favorite: boolean;
  encryptedBlob: string;
  encryption: {
    alg: "aes-256-gcm";
    keyScope: "local-device" | "client-side";
    nonce: string;
    tag: string;
  };
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

export interface PassDevice {
  id: string;
  name: string;
  kind: PassDeviceKind;
  publicKey?: string;
  trusted: boolean;
  createdAt: string;
  lastSeenAt: string;
}

export interface PassEvent {
  id: string;
  type: string;
  message: string;
  at: string;
}

export interface PassState {
  version: 1;
  product: "Erme Pass";
  home: string;
  vaultId: string;
  domain: "pass.erme.onl";
  syncDomain: "sync.erme.onl";
  vaultState: "fresh" | "ready" | "locked";
  items: PassVaultItem[];
  devices: PassDevice[];
  events: PassEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface SafePassItem {
  id: string;
  kind: PassItemKind;
  title: string;
  username?: string;
  origin?: string;
  tags: string[];
  favorite: boolean;
  encryption: Pick<PassVaultItem["encryption"], "alg" | "keyScope">;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${crypto.randomBytes(7).toString("hex")}`;
const folders = ["config", "vault", "keys", "devices", "exports", "logs", "sync"];

export function getPassHome() {
  const configured = process.env.ERME_PASS_HOME?.trim() || process.env.PASS_HOME?.trim();
  if (configured) return configured.replace(/^~(?=$|[\\/])/, os.homedir());
  const trailHome = process.env.TRAIL_HOME?.trim();
  if (trailHome) return path.join(trailHome.replace(/^~(?=$|[\\/])/, os.homedir()), "pass");
  return path.join(os.homedir(), ".erme", "pass");
}

function statePath(home = getPassHome()) {
  return path.join(home, "config", "pass-state.json");
}

function deviceKeyPath(home = getPassHome()) {
  return path.join(home, "keys", "local-device.key");
}

async function ensureHome(home = getPassHome()) {
  await mkdir(home, { recursive: true });
  await Promise.all(folders.map((folder) => mkdir(path.join(home, folder), { recursive: true })));
}

async function getOrCreateLocalKey(home = getPassHome()) {
  await ensureHome(home);
  const file = deviceKeyPath(home);
  if (existsSync(file)) return Buffer.from((await readFile(file, "utf8")).trim(), "base64");
  const key = crypto.randomBytes(32);
  await writeFile(file, key.toString("base64"), { mode: 0o600 });
  return key;
}

function defaultState(home = getPassHome()): PassState {
  const at = now();
  return {
    version: 1,
    product: "Erme Pass",
    home,
    vaultId: id("vault"),
    domain: "pass.erme.onl",
    syncDomain: "sync.erme.onl",
    vaultState: "fresh",
    items: [],
    devices: [
      {
        id: id("dev"),
        name: "Local web vault",
        kind: "local-node",
        trusted: true,
        createdAt: at,
        lastSeenAt: at,
      },
    ],
    events: [{ id: id("evt"), type: "vault.created", message: "Erme Pass local vault state created.", at }],
    createdAt: at,
    updatedAt: at,
  };
}

function normalizeState(parsed: Partial<PassState>, home: string): PassState {
  const base = defaultState(home);
  const state = { ...base, ...parsed, home } as PassState;
  state.version = 1;
  state.product = "Erme Pass";
  state.domain = "pass.erme.onl";
  state.syncDomain = "sync.erme.onl";
  state.vaultState ||= state.items?.length ? "ready" : "fresh";
  state.items ||= [];
  state.devices ||= base.devices;
  state.events ||= [];
  return state;
}

async function saveState(state: PassState) {
  await ensureHome(state.home);
  state.updatedAt = now();
  await writeFile(statePath(state.home), JSON.stringify(state, null, 2));
  return state;
}

export async function readPassState() {
  const home = getPassHome();
  await ensureHome(home);
  const file = statePath(home);
  if (!existsSync(file)) return saveState(defaultState(home));
  const parsed = JSON.parse(await readFile(file, "utf8"));
  return saveState(normalizeState(parsed, home));
}

export function toSafeItem(item: PassVaultItem): SafePassItem {
  return {
    id: item.id,
    kind: item.kind,
    title: item.title,
    username: item.username,
    origin: item.origin,
    tags: item.tags,
    favorite: item.favorite,
    encryption: { alg: item.encryption.alg, keyScope: item.encryption.keyScope },
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    lastUsedAt: item.lastUsedAt,
  };
}

export function passSummary(state: PassState) {
  const byKind = state.items.reduce<Record<string, number>>((acc, item) => {
    acc[item.kind] = (acc[item.kind] || 0) + 1;
    return acc;
  }, {});
  return {
    product: state.product,
    domain: state.domain,
    syncDomain: state.syncDomain,
    vaultId: state.vaultId,
    home: state.home,
    vaultState: state.vaultState,
    counts: {
      items: state.items.length,
      devices: state.devices.length,
      events: state.events.length,
      byKind,
    },
    security: {
      plaintextSecretsReturned: false,
      encryptedAtRest: true,
      keyScope: "local-device scaffold; client-side master-key unlock is next",
      passkeyCompatible: "WebAuthn/passkey metadata lane is scaffolded; platform providers are next",
    },
    updatedAt: state.updatedAt,
  };
}

export async function listSafeItems() {
  const state = await readPassState();
  return state.items.map(toSafeItem).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function addPassItem(input: {
  kind?: PassItemKind;
  title?: string;
  username?: string;
  origin?: string;
  tags?: string[];
  favorite?: boolean;
  secret?: string;
  encryptedBlob?: string;
}) {
  const state = await readPassState();
  const at = now();
  const kind = input.kind || "login";
  const title = String(input.title || input.origin || "Untitled vault item").trim().slice(0, 120);
  const username = input.username ? String(input.username).trim().slice(0, 160) : undefined;
  const origin = input.origin ? String(input.origin).trim().slice(0, 240) : undefined;
  const tags = Array.isArray(input.tags) ? input.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 12) : [];

  let encryptedBlob = input.encryptedBlob;
  let encryption: PassVaultItem["encryption"] = { alg: "aes-256-gcm", keyScope: "client-side", nonce: "client", tag: "client" };

  if (!encryptedBlob) {
    const key = await getOrCreateLocalKey(state.home);
    const nonce = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, nonce);
    const payload = JSON.stringify({ secret: input.secret || crypto.randomBytes(24).toString("base64url"), title, username, origin, createdAt: at });
    encryptedBlob = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]).toString("base64");
    encryption = { alg: "aes-256-gcm", keyScope: "local-device", nonce: nonce.toString("base64"), tag: cipher.getAuthTag().toString("base64") };
  }

  const item: PassVaultItem = {
    id: id("item"),
    kind,
    title,
    username,
    origin,
    tags,
    favorite: Boolean(input.favorite),
    encryptedBlob,
    encryption,
    createdAt: at,
    updatedAt: at,
  };

  state.items.unshift(item);
  state.vaultState = "ready";
  state.events.unshift({ id: id("evt"), type: "item.added", message: `${kind} item added: ${title}`, at });
  await saveState(state);
  return toSafeItem(item);
}

export async function seedPassVault() {
  const state = await readPassState();
  if (state.items.length > 0) return { seeded: false, items: state.items.map(toSafeItem) };
  await addPassItem({ kind: "login", title: "Example login", username: "tai@example.com", origin: "https://example.com", tags: ["demo", "login"] });
  await addPassItem({ kind: "passkey", title: "Example passkey credential", username: "tai", origin: "https://passkeys.dev", tags: ["demo", "passkey"] });
  return { seeded: true, items: await listSafeItems() };
}

export async function listDevices() {
  const state = await readPassState();
  return state.devices.map(({ id, name, kind, publicKey, trusted, createdAt, lastSeenAt }) => ({ id, name, kind, publicKey, trusted, createdAt, lastSeenAt }));
}

export async function registerDevice(input: { name?: string; kind?: PassDeviceKind; publicKey?: string }) {
  const state = await readPassState();
  const at = now();
  const device: PassDevice = {
    id: id("dev"),
    name: String(input.name || "New device").trim().slice(0, 120),
    kind: input.kind || "web",
    publicKey: input.publicKey ? String(input.publicKey).slice(0, 4096) : undefined,
    trusted: false,
    createdAt: at,
    lastSeenAt: at,
  };
  state.devices.unshift(device);
  state.events.unshift({ id: id("evt"), type: "device.registered", message: `Pairing requested for ${device.name}.`, at });
  await saveState(state);
  return device;
}

export function generatePassword(length = 24) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+=?";
  const size = Math.min(Math.max(Number(length) || 24, 12), 64);
  let out = "";
  for (let i = 0; i < size; i += 1) out += alphabet[crypto.randomInt(0, alphabet.length)];
  return out;
}
