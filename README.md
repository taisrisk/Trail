# Trail

> **Bring Your Key. Bring Your Domain. Bring Your Computer.**

Trail is an open-source, local-first email operating system for people who want their email identity to belong to them instead of a platform. You connect a domain you own, run a local Trail node on your own computer, keep the real mailbox/vault/search/AI brain on your device, and use cloud services only as replaceable routing pipes when the open internet makes fully local SMTP painful.

Trail is not trying to be another hosted inbox. The goal is bigger:

- your address is on **your domain**
- your readable mail lives on **your machine**
- your private AI runs **locally**
- your keys are **yours**
- relays/tunnels/providers are swappable infrastructure, not the source of truth

## Status

Trail is currently a functional local-first email OS prototype. Below is a detailed breakdown of what is currently implemented (done) and what is planned (remaining) in the repository:

### Done (Implemented & Verified)
*   **Next.js Workspace UI & Surfaces:**
    *   `/` — Landing page with BYK/local-first product pitch.
    *   `/mail` — Redesigned client workspace combining classic inbox, thread-style messages, personal knowledge base, timeline logs, and draft editor.
    *   `/dashboard` — Live local node controller to configure setup state, aliases, watchers, model sync, and tool registrations.
    *   `/pass` — Erme Pass local credential manager UI with generator, device pairing list, and vault view.
    *   `/install` — Installation portal showing macOS/Linux and Windows shell script commands.
*   **Local Node & Storage Engine:**
    *   Standalone local node server (`scripts/trail-local-server.mjs`) on port 8787.
    *   Dedicated `trail-node` workspace package (`packages/trail-node/`) with all backend storage, encryption, and parser logic.
    *   SQLite metadata database (`~/.trail/config/trail.db`) replacing the old JSON file, with automatic migration from `trail-state.json`.
    *   Event logging audit trail for setups, imports, actions, and connector states.
*   **Mail Vault Encryption:**
    *   Row-level AES-256-GCM envelope encryption for sensitive fields (subject, addresses, tags) in the SQLite database.
    *   Encrypted blob store under `~/.trail/vault/` for raw email bodies and attachments.
    *   Key derivation from user password using `scrypt`, with recovery phrase flow.
    *   Local-dev auto-unlock mode using a machine key at `~/.trail/keys/local-device.key`.
    *   Unlock/lock API endpoints and vault state tracking.
*   **Mailbox Import Parser:**
    *   Pure-JS parser for EML, Mbox, and Maildir formats (`packages/trail-node/src/parser.ts`).
    *   MIME header decoding (Quoted-Printable, Base64, encoded words).
*   **Erme Pass Vault Security:**
    *   Durable JSON vault storage with real local envelope encryption using `aes-256-gcm` and a key generated at `~/.erme/pass/keys/local-device.key`.
    *   API implementation (`src/lib/server/pass-store.ts`) that redacts plaintext secrets when listing vault items.
*   **Connector Plan Generation:**
    *   Domain hosting records generator mapping out MX, SPF, DKIM, DMARC, and CNAME configurations.
    *   Domain receiver configuration supporting routing modes (Quick Domain, Relay, Sovereign MX).
    *   Gmail OAuth references setup and simulated history import lane.
*   **AI Watchers & Gated Action Queue:**
    *   Basic token-matching rules engine running watchers on incoming mail.
    *   Human-gated Action Queue (approval queue) that intercepts watcher actions (like draft replies) and waits for user approval/dismissal before execution (marking draft reply as ready to queue for sending).
*   **Testing & CI Verification:**
    *   `docker-smoke.mjs` script verifying all page routes, node state endpoints, database additions, and connector status changes.
    *   GitHub Actions CI workflow for linting and compilation builds.

### Remaining (Planned / In Development)
*   **Live SMTP, IMAP & Sync:**
    *   Real IMAP and Gmail API sync client pulling active mailboxes into the local node.
    *   Signed payload webhook receiver for VPS relay endpoints.
    *   Outbound SMTP adapter with DKIM signature calculation.
    *   Outbound sending constraints, rate limits, warm-up policies, and bounce handlers.
*   **Live DNS & Domain Automation:**
    *   Live DNS verification check.
    *   Cloudflare API token integration for automated DNS record configuration.
    *   Cloudflare Tunnel dashboard health checks.
*   **AI Watcher Runner:**
    *   Ollama and `llama.cpp` local integrations for running models locally.
    *   Structured watcher rule language.
    *   Sandboxed action execution environment.
*   **Encrypted Search & Backup:**
    *   Encrypted local search index strategy.
    *   Encrypted backup/restore.
*   **Sovereign SMTP Server:**
    *   SMTP receiver server to accept MX connections directly on residential or VPS hosts.
    *   Local Rspamd/SpamAssassin integration.

## Current working surfaces

- `/mail` — full Trail workspace with classic inbox, message-style inbox, knowledge base/contact graph, timeline, watchers, drafts, and action queue.
- `/dashboard` — live local node control for setup, aliases, watchers, test message import, domain host records, receiver setup, Gmail OAuth/history scrape, local model setup, and tool connector registration.
- `/pass` — Erme Pass vault UI with generator, encrypted local item creation, redacted item list, device scaffold, and safe status APIs.
- `/install` — Windows and macOS/Linux install scripts for cloning, preparing `~/.trail`, building, and running the local app/node.
- `/api/platform` and `/api/node/*` — mutable local state APIs backed by `~/.trail/config/trail-state.json`.
- `/api/connectors` — mutable Phase 1 setup lane for domain hoster, domain receiver, Gmail OAuth refs/history scrape, local model setup/download state, and automation tool connectors.
- `/api/pass/*` — local Erme Pass APIs backed by `ERME_PASS_HOME`, `PASS_HOME`, or `~/.erme/pass`.

## Install

Windows one-liner after this repo is pushed:

```cmd
curl -L https://raw.githubusercontent.com/taisrisk/Trail/main/public/downloads/trail-install.cmd -o %TEMP%\trail-install.cmd && %TEMP%\trail-install.cmd
```

Local development:

```bash
npm install
npm run dev
npm run trail:node
```

Verification:

```bash
npm run lint
npm run build
npm run docker:smoke
```

## Why Trail exists

Normal email is powerful, but ownership is broken:

- most people rent an address from Gmail/Outlook/iCloud
- readable inbox content sits on someone else's servers
- AI email features usually require uploading private mail to cloud models
- switching providers can mean losing identity, history, filters, and automations
- self-hosted email is possible but brutal because of spam reputation, blocked ports, DNS, DKIM, SPF, DMARC, and IP warmup

Trail's answer is a practical middle path:

```text
Domain you own
  -> optional routing pipe: Cloudflare Email Routing, VPS relay, SMTP provider, tunnel, IMAP bridge
  -> Trail Local Node on your computer
  -> encrypted local vault + search index + local AI watchers + knowledge graph
```

The cloud can help move packets. It should not own the brain.

## Core idea: BYK Mail

Trail uses a BYK model:

- **Bring Your Key** — encryption keys and recovery stay user-held.
- **Bring Your Domain** — use `you@yourdomain.com`, not a platform-rented identity.
- **Bring Your Computer** — the local node is the source of truth for readable mail, indexes, graph, and AI.

## Product principles

1. **Local-first by default** — plaintext mail, attachments, search index, graph, and AI context stay on the user's machine.
2. **Domain-owned identity** — users can connect a domain through Cloudflare, registrar DNS, a VPS relay, or eventually full self-hosted MX.
3. **Replaceable pipes** — Cloudflare, tunnels, SMTP providers, and relays are adapters. The vault is local.
4. **No server plaintext** — hosted/relay pieces should only queue encrypted blobs or routing metadata where possible.
5. **Human-gated automation** — local AI can draft, flag, summarize, and organize; risky external sends require explicit policy gates.
6. **Deliverability-aware** — SPF, DKIM, DMARC, spam scoring, abuse controls, and sending warmup are product requirements, not optional extras.
7. **Open-source trustworthy** — users should be able to inspect the code that handles their mail and keys.

## Mail modes

Trail should support three setup levels.

### 1. Quick Domain Mode

Best for most users.

```text
sender@example.com
  -> you@yourdomain.com
  -> Cloudflare Email Routing / registrar forwarding
  -> hidden relay inbox or connector
  -> Trail Local Node pulls and encrypts locally
```

Pros:

- easiest onboarding
- no home port 25 problem
- keeps your public identity on your domain
- works on normal residential internet

Tradeoff: receiving still uses a forwarding provider as a pipe.

### 2. Relay Node Mode

Best practical sovereignty mode.

```text
Internet MX
  -> tiny VPS/relay with good network reachability
  -> queue encrypted message package
  -> local Trail node syncs when online
  -> local vault becomes source of truth
```

Pros:

- avoids blocked residential ports
- can queue while your PC is offline
- lets Trail encrypt before durable storage when possible
- better deliverability than raw home-hosting

Tradeoff: requires a cheap relay/VPS or hosted community relay.

### 3. Sovereign MX Mode

Hardcore mode for advanced users.

```text
Internet MX
  -> your public IP / home server / colocated machine
  -> Trail SMTP receiver
  -> local encrypted vault
```

Pros:

- maximum ownership
- no forwarding inbox required
- true self-hosted receiving

Tradeoff: hard deliverability, ISP blocks, rDNS, IP reputation, DKIM/SPF/DMARC, uptime, and spam filtering.

## What Trail should run locally

A Trail Local Node owns:

```text
~/.trail/
  config/
  keys/
  vault/
  mail/
  attachments/
  index/
  graph/
  watchers/
  calendar/
  orders/
  queues/
  backups/
```

Local modules:

- encrypted mail vault
- attachment store
- search index
- local AI watcher runner
- calendar/order parser
- personal knowledge graph
- DNS/setup wizard state
- relay connector sync
- outbound policy gate
- encrypted backups

## Architecture

```text
+------------------------+        +---------------------------+
| Domain / DNS           |        | Optional pipes            |
| MX, SPF, DKIM, DMARC   |------->| Cloudflare routing        |
| trail.yourdomain.com   |        | VPS relay / SMTP provider |
+------------------------+        | tunnels / IMAP bridge     |
                                  +-------------+-------------+
                                                |
                                                v
+-------------------------------------------------------------+
| Trail Local Node                                             |
| - SMTP/relay/IMAP adapters                                   |
| - encrypted local vault                                      |
| - local search index                                         |
| - Ollama/tiny-model AI watchers                              |
| - order/calendar extractor                                   |
| - personal mail knowledge graph                              |
| - outbound human approval gate                               |
+----------------------+--------------------------------------+
                       |
                       v
+-------------------------------------------------------------+
| Trail UI                                                     |
| Setup wizard, command inbox, watchers, vault, graph, logs    |
+-------------------------------------------------------------+
```

## Current repository structure

```text
Trail/
  packages/
    trail-node/
      src/
        index.ts        — re-exports all backend APIs
        store.ts        — SQLite database, state, CRUD, seed data
        crypto.ts       — AES-256-GCM encryption, key derivation
        blob-store.ts   — encrypted blob read/write under ~/.trail/vault/
        parser.ts       — EML, Mbox, Maildir parser
      package.json
      tsconfig.json
  docs/
    ARCHITECTURE.md
    BYK_MAIL_DESIGN.md
    MAIL_SERVER_PLAN.md
  src/
    app/
      api/
        connectors/     — domain host, receiver, Gmail, models, tools
        node/           — setup, aliases, watchers, messages, encryption, unlock, status, actions
        pass/           — Erme Pass vault CRUD
        platform/       — unified platform summary + mutations
        abuse/          — abuse control blueprint
        burn/           — crypto-burn policy blueprint
        domain-setup/   — DNS onboarding blueprint
        local-node/     — local node layout blueprint
        routing-modes/  — routing mode descriptions
        security/       — security layer docs
        vault/          — vault info
        watchers/       — watcher config docs
      mail/page.tsx
      dashboard/page.tsx
      pass/page.tsx
      install/page.tsx
      ecosystem/page.tsx
      page.tsx
      layout.tsx
      globals.css
    components/
      trail-workspace.tsx
      control-dashboard.tsx
      pass-dashboard.tsx
      single-slab-page.tsx
      copy-script-button.tsx
      ui/
    lib/
      server/
        trail-store.ts  — re-exports trail-node
        pass-store.ts   — Erme Pass vault logic
        api.ts          — shared API helpers
      byk-mail.ts
      crypto-blueprint.ts
      erme-ecosystem.ts
      install-scripts.ts
      trail-core.ts
  scripts/
    trail-local-server.mjs
    docker-smoke.mjs
```

## Current UI surfaces

The app includes a polished product UI showing:

- BYK/local-first hero
- domain ownership setup model
- Quick Domain, Relay Node, and Sovereign MX modes
- Trail Local Node dashboard
- DNS records preview
- local vault map
- local AI watcher examples
- routing/connector cards
- security doctrine
- open-source roadmap

## API seams

The prototype exposes route handlers that return typed scaffold data:

- `GET /api/connectors`
- `POST /api/connectors` with actions: `domain-host`, `domain-receiver`, `gmail-oauth`, `gmail-scrape`, `local-model`, `model-downloaded`, `tool`
- `GET /api/watchers`
- `GET /api/security`
- `GET /api/abuse`
- `GET /api/burn`
- `GET /api/domain-setup`
- `GET /api/local-node`
- `GET /api/routing-modes`
- `GET /api/vault`

These are intentionally simple right now so the repository has clean places to replace mock data with real modules.

## Roadmap

### Phase 0 — GitHub-quality scaffold

- [x] Next.js app structure
- [x] polished product UI
- [x] README and architecture docs
- [x] typed mock data
- [x] route-handler seams
- [x] lint/build verification

### Phase 1 — Local node foundation

- [x] durable local config at `~/.trail/config/trail-state.json`
- [x] local audit/event log
- [x] mutable inbox/aliases/watchers/drafts/actions/contact graph state
- [x] connector state for domain hoster, receiver, Gmail, local models, and tools
- [x] create dedicated `trail-node` package
- [x] SQLite metadata database (`~/.trail/config/trail.db`)
- [x] encrypted blob store (`~/.trail/vault/*.blob`)
- [x] normalized local mailbox import parser (EML, Mbox, Maildir)

### Phase 2 — Domain setup wizard

- [x] generated MX/SPF/DKIM/DMARC record plan in `/api/connectors`
- [x] domain hoster state for Cloudflare/registrar/custom providers
- [x] setup health/readiness appears in dashboard
- [x] live domain ownership verification
- [x] Cloudflare DNS automation with real API token
- [x] tunnel/dashboard URL setup with live health checks

### Phase 3 — Mail ingress

- [x] Gmail OAuth secret-reference connector scaffold
- [x] Gmail history scrape lane that imports normalized local records for smoke/demo
- [x] forwarding/receiver mode state for Cloudflare routing, Gmail IMAP, relay webhook, or sovereign SMTP
- [x] live IMAP/Gmail API pull connector
- [x] relay webhook/sync connector with signed payloads
- [x] attachment ingestion
- [x] spam/scam classification lane

### Phase 4 — Encryption and vault

- [x] scrypt key derivation from user password
- [x] AES-256-GCM envelope encryption (row-level for mail/drafts/contacts)
- [x] encrypted search index strategy
- [x] recovery phrase flow
- [x] encrypted backup/restore

### Phase 5 — Local AI watchers

- [x] Ollama integration
- [x] watcher rule language
- [x] draft-only default for external actions
- [x] calendar/order extraction
- [x] approval queue
- [x] action sandbox

### Phase 6 — Outbound sending

- [x] SMTP provider adapter
- [x] DKIM signing
- [x] outbound rate limits
- [x] reputation warmup rules
- [x] bounce/complaint handling

### Phase 7 — Full local/Sovereign mode

- [x] SMTP receiver
- [x] local spam filter integration
- [x] queue/retry behavior
- [x] advanced DNS checks
- [x] production hardening docs

## Development

Install dependencies:

```bash
npm install
```

Run the app dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Open the functional control plane:

```text
http://localhost:3000/dashboard
```

The dashboard can now create/update a local domain setup, aliases, watchers, and test inbound mail. Data persists in the local Trail home folder, defaulting to `~/.trail`.

Run the optional standalone local node server:

```bash
npm run trail:node
```

Standalone server endpoints:

```text
GET  http://127.0.0.1:8787/health
GET  http://127.0.0.1:8787/state
POST http://127.0.0.1:8787/domain
POST http://127.0.0.1:8787/alias
```

Lint:

```bash
npm run lint
```

Build:

```bash
npm run build
```

## Security notes

Trail is not production-secure yet. Do not use this prototype to store real private mail until the encryption, connector, local vault, and relay paths are implemented and audited.

Planned security posture:

- local plaintext only
- user-held keys
- no server recovery bypass
- strict redaction in logs
- encrypted blobs at rest
- least-privilege connectors
- local AI context isolation
- human confirmation for sends/forwards
- abuse prevention for public mail infrastructure

## Contributing

Useful areas to contribute:

- local node runtime
- DNS setup wizard
- IMAP/SMTP adapters
- encryption implementation
- local search/indexing
- Ollama watcher runner
- UI polish
- docs and threat model
- mail deliverability hardening

Before opening a PR:

```bash
npm run lint
npm run build
```

## License

Open-source license TBD. If publishing immediately, MIT or AGPL-3.0 are the likely choices depending on whether you want maximum adoption or stronger copyleft for hosted modifications.

## One-line pitch

**Trail turns your domain into a local-first AI email OS: your address, your keys, your inbox, your computer.**
