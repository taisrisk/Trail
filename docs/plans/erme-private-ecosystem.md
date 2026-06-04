# Erme Private Ecosystem Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Turn Erme/Trail into a private identity ecosystem spanning owned email, passwords, passkeys, browser autofill, iOS, and PC.

**Architecture:** Use `erme.onl` as the trust/product domain, with `email.erme.onl` for Trail mail and `pass.erme.onl` for Erme Pass. Kairo can remain a separate public/creative/business domain or become a higher-level lab/brand later. The actual sensitive data model stays local-first: encrypted vaults live on the user's devices/local node, while cloud/subdomains provide marketing, update, relay, and optional encrypted sync surfaces.

**Tech Stack:** Next.js App Router product web, local node storage under user home, WebCrypto/WebAuthn/passkeys, browser extension using Manifest V3, iOS app with AuthenticationServices/Passkey APIs, Windows desktop helper, optional end-to-end encrypted sync relay.

---

## Domain Strategy

### Primary recommendation

- `erme.onl` — main private AI/identity ecosystem brand.
- `email.erme.onl` — Trail / BYK email OS onboarding, dashboards, install scripts, docs.
- `pass.erme.onl` — Erme Pass password/passkey manager marketing, install, docs, extension links.
- `sync.erme.onl` — optional encrypted sync relay; never stores plaintext secrets.
- `api.erme.onl` — public metadata/update API only; keep sensitive local APIs on `127.0.0.1`.
- `vault.erme.onl` — optional future web vault shell; only decrypts client-side.
- `kairo.onl` — keep clean for a separate product/lab/consumer brand unless Tai wants Kairo to be the umbrella.

### Why not put everything directly on one domain?

Subdomains make the product feel bigger and cleaner while keeping security boundaries understandable. Password manager surfaces should have stricter CSP/security headers than marketing pages, and email onboarding has different routing/DNS language from passkey/password manager onboarding.

---

## Product Definition: Erme Pass

Erme Pass should be a private password manager with passkey support and cross-device ecosystem:

- Password vault: logins, secure notes, identities, cards, recovery codes, SSH/API secrets.
- Passkey-compatible: store/discover WebAuthn credentials where platform rules allow, and act as a passkey provider/autofill provider on supported systems.
- iOS app: Face ID/Touch ID unlock, iCloud Keychain-style autofill provider, share sheet import.
- PC app/local node: Windows unlock with Windows Hello, local encrypted vault, browser native messaging bridge.
- Chrome extension: autofill, save-login prompts, generator, vault unlock, passkey mediation where supported.
- Recovery: export encrypted emergency kit, device-to-device transfer, optional passphrase recovery key.
- Sync: optional encrypted sync relay; server sees ciphertext only.

---

## Security Doctrine

- Zero-knowledge by default: server never sees master password, vault key, passkeys, plaintext passwords, notes, cards, or recovery codes.
- Device-bound unlock: master key protected by platform secure storage where possible: Windows Hello, Secure Enclave/Keychain, Android Keystore later.
- Strong KDF: Argon2id for password-derived keys, per-user salt, tunable memory cost.
- Vault encryption: XChaCha20-Poly1305 or AES-GCM with per-item nonce and authenticated metadata.
- Passkey caveat: WebAuthn/passkeys have platform restrictions; implement standards-compatible passkey creation/use through official APIs and be explicit about what is scaffold vs implemented.
- Browser extension: content scripts never hold long-lived vault keys; use short-lived session tokens and native messaging/local node broker.
- Local-first: app works offline; sync is optional.

---

## MVP Build Order

### Task 1: Product surfaces

**Objective:** Add public `/ecosystem` and `/pass` pages describing the domain map and Erme Pass.

**Files:**
- Create: `src/lib/erme-ecosystem.ts`
- Create: `src/app/ecosystem/page.tsx`
- Create: `src/app/pass/page.tsx`
- Modify: `src/app/page.tsx`

**Verification:**
- `npm run lint`
- `npm run build`
- Browser-load `/ecosystem` and `/pass`.

### Task 2: Local vault data model scaffold

**Objective:** Add local Erme Pass state types and file layout without storing real secrets yet.

**Files:**
- Create: `src/lib/server/pass-store.ts`
- Create: `src/app/api/pass/status/route.ts`
- Create: `src/app/api/pass/items/route.ts`

**Verification:**
- API returns a redacted status object and no plaintext secret fields.

### Task 3: Vault crypto primitives

**Objective:** Add tested WebCrypto/Node crypto wrapper for deriving keys and encrypting/decrypting demo vault items.

**Files:**
- Create: `src/lib/crypto/pass-vault.ts`
- Create: `src/lib/crypto/pass-vault.test.ts` or project-appropriate test.

**Verification:**
- Round-trip encryption/decryption test passes.
- Wrong password/key fails authentication.

### Task 4: Browser extension scaffold

**Objective:** Add a `extensions/chrome` Manifest V3 extension that talks to the local node.

**Files:**
- Create: `extensions/chrome/manifest.json`
- Create: `extensions/chrome/src/background.ts`
- Create: `extensions/chrome/src/content.ts`
- Create: `extensions/chrome/src/popup.html`

**Verification:**
- Chrome can load unpacked extension.
- Popup can read `http://127.0.0.1:<port>/api/pass/status`.

### Task 5: Desktop/local bridge

**Objective:** Add native messaging/local node bridge design so the extension does not directly hold long-lived vault keys.

**Files:**
- Create: `docs/pass/native-messaging.md`
- Create: `scripts/erme-pass-local-server.mjs`

**Verification:**
- Local health endpoint returns running state.

### Task 6: iOS implementation plan

**Objective:** Add docs for iOS app architecture with Password AutoFill Credential Provider and passkey APIs.

**Files:**
- Create: `docs/pass/ios-app.md`

**Verification:**
- Plan states what is supported natively vs future scaffold.

---

## Acceptance Criteria

- Users can understand the ecosystem from `erme.onl`, `email.erme.onl`, and `pass.erme.onl` pages.
- Erme Pass is clearly positioned as zero-knowledge/local-first, not a hosted plaintext vault.
- Password manager scope includes iOS, PC, Chrome extension, local node, and encrypted sync.
- Any unimplemented passkey/autofill features are labeled honestly until implemented and tested.
- Builds pass before claiming work is complete.
