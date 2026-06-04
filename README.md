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

Trail is currently an early open-source MVP scaffold/prototype. The repository contains a working Next.js product UI, mutable local JSON-backed APIs, a standalone local node smoke server, installer scripts, Erme Pass local encrypted item storage, and demo data flows for inbox/watchers/knowledge graph/action queue. Real SMTP receiving, IMAP sync, production-grade encryption review, DNS automation, browser-extension autofill, and mobile clients are still planned modules.

## Current working surfaces

- `/mail` — full Trail workspace with classic inbox, message-style inbox, knowledge base/contact graph, timeline, watchers, drafts, and action queue.
- `/dashboard` — live local node control for setup, aliases, watchers, and test message import.
- `/pass` — Erme Pass vault UI with generator, encrypted local item creation, redacted item list, device scaffold, and safe status APIs.
- `/install` — Windows and macOS/Linux install scripts for cloning, preparing `~/.trail`, building, and running the local app/node.
- `/api/platform` and `/api/node/*` — mutable local state APIs backed by `~/.trail/config/trail-state.json`.
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
  docs/
    ARCHITECTURE.md
    BYK_MAIL_DESIGN.md
    MAIL_SERVER_PLAN.md
  src/
    app/
      api/
        abuse/
        burn/
        connectors/
        domain-setup/
        local-node/
        routing-modes/
        security/
        vault/
        watchers/
      page.tsx
      layout.tsx
      globals.css
    components/
      sections/
      ui/
    lib/
      byk-mail.ts
      crypto-blueprint.ts
      trail-core.ts
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

- [ ] create `trail-node` package
- [ ] local config at `~/.trail/config`
- [ ] SQLite metadata database
- [ ] encrypted blob store
- [ ] local mailbox import format
- [ ] local audit/event log

### Phase 2 — Domain setup wizard

- [ ] domain ownership verification
- [ ] Cloudflare DNS instructions
- [ ] generated MX/SPF/DKIM/DMARC records
- [ ] tunnel/dashboard URL setup
- [ ] setup health checks

### Phase 3 — Mail ingress

- [ ] IMAP pull connector
- [ ] forwarding inbox connector
- [ ] relay webhook/sync connector
- [ ] message normalization
- [ ] attachment ingestion
- [ ] spam/scam classification lane

### Phase 4 — Encryption and vault

- [ ] Argon2id key derivation
- [ ] XChaCha20-Poly1305 or AES-GCM envelope encryption
- [ ] encrypted search index strategy
- [ ] recovery phrase flow
- [ ] encrypted backup/restore

### Phase 5 — Local AI watchers

- [ ] Ollama integration
- [ ] watcher rule language
- [ ] draft-only default for external actions
- [ ] calendar/order extraction
- [ ] approval queue
- [ ] action sandbox

### Phase 6 — Outbound sending

- [ ] SMTP provider adapter
- [ ] DKIM signing
- [ ] outbound rate limits
- [ ] reputation warmup rules
- [ ] bounce/complaint handling

### Phase 7 — Full local/Sovereign mode

- [ ] SMTP receiver
- [ ] local spam filter integration
- [ ] queue/retry behavior
- [ ] advanced DNS checks
- [ ] production hardening docs

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
