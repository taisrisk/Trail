# BYK Mail Design

Trail's open-source direction is BYK Mail: **Bring Your Key, Bring Your Domain, Bring Your Computer**.

## Purpose

Trail should let a user turn a domain they own into a local-first email OS. The public address can be `you@yourdomain.com`, but the readable mailbox, local AI context, search index, calendar/order memory, and knowledge graph live on the user's own machine.

Cloud services can be used when useful, but only as pipes:

- Cloudflare Email Routing
- registrar forwarding
- SMTP providers
- a tiny VPS relay
- Cloudflare Tunnel / Tailscale / ngrok for dashboard/API access
- IMAP bridges for existing inboxes

The local node remains the source of truth.

## Key distinction

Cloudflare Tunnel does not magically make public email local because email delivery uses SMTP/MX, not normal HTTP. Tunnels are excellent for dashboard/API access. Inbound email still needs one of:

1. forwarding provider
2. reachable relay
3. public SMTP receiver
4. existing IMAP inbox connector

## Recommended MVP path

Start with Quick Domain Mode:

```text
Domain on Cloudflare
  -> Cloudflare Email Routing
  -> hidden relay inbox / IMAP connector
  -> Trail Local Node pulls mail
  -> local encrypted vault
  -> local AI watchers/search/graph
```

For sending:

```text
Trail compose/draft
  -> local policy gate
  -> SMTP provider or relay
  -> DKIM signed as user@domain.com
```

This gives the user-owned domain and local brain without immediately fighting deliverability.

## Practical production path

After the MVP, add Relay Node Mode:

```text
Domain MX
  -> tiny VPS Trail relay
  -> encrypted queue
  -> local Trail node syncs when online
  -> local vault and AI process privately
```

This avoids residential port 25 blocks while preserving local-first storage.

## Advanced path

Sovereign MX Mode:

```text
Domain MX
  -> user's own public SMTP receiver
  -> local spam filter
  -> Trail vault
```

This mode needs serious docs around:

- static IP or stable public host
- rDNS
- SPF
- DKIM
- DMARC
- outbound reputation
- bounce handling
- spam filtering
- uptime
- queue retry behavior

## Security model goals

- Plaintext only on the local device.
- Server/relay stores encrypted blobs where possible.
- Logs must redact email body content, tokens, credentials, and recovery data.
- Watchers run locally by default.
- External sends require policy gates.
- If recovery secrets are lost, old encrypted data is unrecoverable.

## Repository implementation targets

- `src/lib/byk-mail.ts` — typed mode/DNS/local-node data.
- `/api/domain-setup` — generated setup model.
- `/api/local-node` — local module map.
- `/api/routing-modes` — setup mode descriptions.
- `/api/vault` — vault schema/scaffold posture.
- `src/app/page.tsx` — GitHub-level product UI.

## Non-goals for the first version

- Do not promise production-secure mail storage yet.
- Do not run open relay SMTP.
- Do not auto-send AI replies by default.
- Do not market full self-hosted deliverability as easy.
- Do not store real private mail until encryption and connector hardening are implemented and reviewed.
