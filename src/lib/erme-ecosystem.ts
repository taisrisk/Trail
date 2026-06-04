export const ecosystemDomains = [
  {
    domain: "erme.onl",
    role: "Main trust domain",
    purpose: "Landing, identity, downloads, docs, and the private AI / ownership ecosystem.",
  },
  {
    domain: "email.erme.onl",
    role: "Trail mail OS",
    purpose: "BYK email onboarding, local node installer, domain DNS guide, aliases, and mail watchers.",
  },
  {
    domain: "pass.erme.onl",
    role: "Erme Pass",
    purpose: "Password manager, passkey support, browser extension, iOS/PC apps, and vault sync docs.",
  },
  {
    domain: "sync.erme.onl",
    role: "Encrypted relay",
    purpose: "Optional ciphertext-only device sync. No plaintext passwords, passkeys, mail, or notes.",
  },
  {
    domain: "kairo.onl",
    role: "Separate brand lane",
    purpose: "Keep available for a public lab, studio, consumer app, or future umbrella brand.",
  },
];

export const passPillars = [
  "Zero-knowledge encrypted vault",
  "Passkey/WebAuthn compatible design",
  "Windows Hello + Face ID unlock",
  "Chrome extension autofill",
  "iOS Password AutoFill provider",
  "Offline-first local node",
  "Optional encrypted sync relay",
  "Emergency encrypted recovery kit",
];

export const passArchitecture = [
  {
    layer: "Vault core",
    detail: "Passwords, secure notes, identities, cards, recovery codes, SSH/API secrets, and passkey metadata are encrypted per item before sync or export.",
  },
  {
    layer: "Local node / desktop helper",
    detail: "Runs on the PC, owns the unlocked session, mediates browser extension requests, and avoids long-lived keys inside content scripts.",
  },
  {
    layer: "Chrome extension",
    detail: "Detects login forms, offers autofill/save/generate actions, and talks to the local helper or encrypted sync session.",
  },
  {
    layer: "iOS app",
    detail: "Uses Face ID/Touch ID, Keychain/Secure Enclave where available, Password AutoFill extension, and passkey APIs.",
  },
  {
    layer: "Sync relay",
    detail: "Optional `sync.erme.onl` service stores only encrypted blobs, device manifests, version clocks, and conflict metadata.",
  },
];

export const passSecurityRules = [
  "Server never receives master password, vault key, passkey private material, plaintext logins, notes, cards, or recovery codes.",
  "Argon2id-derived vault keys for password unlock; platform secure storage for device unlock sessions.",
  "Per-item authenticated encryption with unique nonces and explicit safe metadata boundaries.",
  "Browser content scripts receive only the minimum selected credential, never the whole vault.",
  "Every external action, including filling/sending credentials, has a visible user gesture or policy gate.",
  "Passkey features are implemented through standards APIs and labeled honestly where platform limits apply.",
];

export const ecosystemBuildPhases = [
  {
    phase: "01",
    title: "Product surfaces",
    items: ["/ecosystem", "/pass", "domain map", "install CTAs", "security doctrine"],
  },
  {
    phase: "02",
    title: "Local vault scaffold",
    items: ["~/.erme/pass", "redacted status APIs", "demo encrypted item storage"],
  },
  {
    phase: "03",
    title: "Chrome extension",
    items: ["Manifest V3", "native messaging", "autofill", "password generator"],
  },
  {
    phase: "04",
    title: "iOS + PC apps",
    items: ["Password AutoFill", "Face ID", "Windows Hello", "device-to-device pairing"],
  },
  {
    phase: "05",
    title: "Encrypted sync",
    items: ["sync.erme.onl", "ciphertext relay", "conflict resolution", "recovery kit"],
  },
];
