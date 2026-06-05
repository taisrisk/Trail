# Trail architecture

## Goal
Trail is a private email OS built around current email connectors first, then full hosted mailboxes. The design assumes hostile infrastructure: servers should never need plaintext mailbox contents, private keys, personal history, or local AI context.

## Core services

1. **Web app / client vault**
   - Derives keys locally from password + recovery phrase.
   - Decrypts mailbox, knowledge graph, calendar, order history, and local search index.
   - Runs Ollama/tiny LLM watchers locally when available.

2. **API server**
   - Account number creation and paid-time balance.
   - Connector registration with encrypted token envelopes.
   - Alias/routing rule management.
   - Encrypted blob synchronization.
   - Abuse/rate-limit decisions based on metadata and reputation signals.

3. **Mail edge**
   - Postfix/OpenSMTPD for SMTP receive/send.
   - Rspamd for spam/phishing/malware scoring.
   - DKIM signing, SPF/DMARC policy checks.
   - New-account outbound warmup and rate limiting.

4. **Connector workers**
   - Gmail/Outlook OAuth import.
   - IMAP import.
   - Forward-only bridges.
   - Message body encryption before durable storage.

5. **Burner worker**
   - Detects accounts inactive > 365 days.
   - Deletes encrypted blobs, key envelopes, connector tokens, local-sync manifests, outbound queues, and indexes.
   - Leaves only anonymous aggregate accounting/abuse counters where legally required.

## Data classes

- **Plaintext local only:** message bodies, attachments, AI context, private knowledge graph, decrypted calendar/order history.
- **Server encrypted:** message blobs, attachments, search shards, graph shards, calendar/order blobs, connector token envelopes.
- **Server minimal metadata:** account number, paidUntil, alias routing hashes, queue IDs, spam/reputation counters, DKIM/domain config, legal/abuse hold flags if required.

## Phase 1 connector control plane

Current MVP connector state is local and durable in `~/.trail/config/trail-state.json` through `/api/connectors`:

- **Domain hoster:** provider, domain, nameservers, and generated MX/SPF/DKIM/DMARC/CNAME record plan.
- **Domain receiver:** selected ingress mode (`cloudflare-email-routing`, `gmail-imap`, `relay-webhook`, or `sovereign-smtp`), target address, webhook seam, and inbound secret reference.
- **Gmail OAuth:** OAuth client/token references only, approved scopes, current history cursor, last scrape time, and imported count.
- **Local model:** Ollama/llama.cpp/local-rule-engine model, purpose, install/download command, and ready status.
- **Tools:** automation/storage/domain/mail tool registrations used by the dashboard and smoke tests.

These records are scaffolds, not production credentials. Live provider tokens belong in env/secrets and must be encrypted before any production sync.

## AI policy

- Local AI is the default and preferred mode.
- AI can scan, flag, archive, label, summarize, calendar-block, order-track, forward, and draft.
- External sends/replies/forwards default to human confirmation unless a watcher explicitly allows safe automatic behavior.
- Sensitive categories always require review: legal, financial, account recovery, school, healthcare, government, security alerts.

## Recovery policy

If password and recovery phrase are lost, old mailbox content is gone. Trail should not add admin recovery bypasses.
