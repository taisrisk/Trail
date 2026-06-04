# Docker Hosting Erme + Trail + Erme Pass

This repo now has a Docker stack that hosts the full current web app:

- `erme.onl` product/ecosystem pages
- `email.erme.onl` / Trail local-first email OS surfaces
- `pass.erme.onl` Erme Pass password-manager dashboard and APIs
- `/api/pass/*` local-first vault APIs
- persistent Docker volume for Trail and Pass runtime data

## Quick start

```bash
docker compose up -d --build
```

Open:

- Main app: `http://localhost:3000/`
- Erme Pass: `http://localhost:3000/pass`
- Pass API status: `http://localhost:3000/api/pass/status`

Smoke test:

```bash
npm run docker:smoke
```

Stop:

```bash
docker compose down
```

## Data volumes

Docker stores runtime data in the named volume:

```text
erme-private-os-data -> /data
/data/trail -> Trail mail/local-node data
/data/pass  -> Erme Pass vault state, local-device key, devices, exports, logs
```

Do not bake real password vaults, mailbox data, private keys, recovery phrases, or tokens into Docker images. Keep them in mounted volumes or user-controlled external secret managers.

## Environment

Default compose environment:

```text
TRAIL_HOME=/data/trail
ERME_PASS_HOME=/data/pass
PUBLIC_ERME_DOMAIN=erme.onl
PUBLIC_EMAIL_DOMAIN=email.erme.onl
PUBLIC_PASS_DOMAIN=pass.erme.onl
PUBLIC_SYNC_DOMAIN=sync.erme.onl
```

## Production subdomain routing

Put a reverse proxy/CDN in front of this container and route these hostnames to port `3000`:

- `erme.onl` -> `/`
- `email.erme.onl` -> `/install`, `/dashboard`, `/api/node/*`
- `pass.erme.onl` -> `/pass`, `/api/pass/*`
- `sync.erme.onl` -> future encrypted-sync service; not plaintext vault storage

Recommended proxy headers:

```text
X-Forwarded-Host
X-Forwarded-Proto
X-Forwarded-For
```

## Current Erme Pass backend scope

Implemented now:

- persistent vault state under `ERME_PASS_HOME`
- status endpoint: `GET /api/pass/status`
- safe redacted item list: `GET /api/pass/items`
- encrypted local-device item creation: `POST /api/pass/items`
- demo seed path: `POST /api/pass/items` with `{ "seed": true }`
- devices list/register: `GET/POST /api/pass/devices`
- local password generator: `GET /api/pass/generate?length=28`
- `/pass` dashboard wired to these APIs

Important: current item encryption is the local-device scaffold. The next hardening step is client-side master-key unlock with Argon2id/WebCrypto and platform passkey providers, so even the local web process never handles plaintext long-term vault secrets.
