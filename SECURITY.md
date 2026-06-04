# Security Policy

Trail is currently an early prototype/scaffold. Do **not** use it to store real private mail until the vault, connector, relay, and crypto paths are implemented and independently reviewed.

## Supported versions

No production-supported version exists yet.

## Reporting vulnerabilities

Open a private security advisory on GitHub if available, or contact the maintainer directly before public disclosure.

## Security goals

- Plaintext mail stays on the user's device.
- Keys and recovery material stay user-held.
- Hosted/relay components store encrypted blobs or minimal routing metadata only where possible.
- Logs redact bodies, tokens, credentials, cookies, API keys, and recovery phrases.
- Local AI receives decrypted context only on the user's device.
- External sends/forwards require explicit policy gates.

## Known prototype limitations

- Real encryption is not implemented yet.
- Real SMTP/IMAP connectors are not implemented yet.
- DNS automation is scaffolded only.
- Relay and self-hosted MX behavior is design-stage only.
