# Contributing to Trail

Trail is an early open-source BYK/local-first email OS. Contributions should protect the core promise: user-owned domain, user-held keys, local-first readable data, and replaceable cloud pipes.

## Good first contribution areas

- UI polish and accessibility
- DNS setup wizard improvements
- local node storage design
- IMAP/SMTP adapter research
- encryption threat model docs
- local AI watcher runner prototypes
- tests and CI hardening

## Development setup

```bash
npm install
npm run dev
```

Before submitting changes:

```bash
npm run lint
npm run build
```

## Security rules

- Do not log message bodies, tokens, cookies, credentials, recovery phrases, private keys, or auth headers.
- Do not add server-side plaintext mail storage.
- Do not create open relay behavior.
- AI actions that send/forward externally must go through an approval/policy gate.
- New connector code should be least-privilege and clearly document what the provider can see.

## Pull request checklist

- [ ] I ran `npm run lint`.
- [ ] I ran `npm run build`.
- [ ] I updated docs if architecture or setup behavior changed.
- [ ] I did not add secret logging or server-side plaintext mail storage.
- [ ] I labeled prototype/scaffold behavior clearly where real functionality is not implemented.
