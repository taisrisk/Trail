# Mail server plan

## MVP receive path

1. MX receives message at mail edge.
2. Rspamd scores spam/phishing/malware.
3. Router maps recipient alias/custom address to account ID without storing identity.
4. Worker encrypts message body and attachments into account vault.
5. Header/routing metadata is minimized and retention-scoped.
6. Optional forwarding sends a copy to connector destination according to encrypted/user-defined rules.

## MVP send path

1. Client drafts locally.
2. Client signs/encrypts local copy.
3. Server receives outbound envelope and MIME payload.
4. Abuse gate checks rate limits, age/warmup, complaint score, domain reputation, and spam score.
5. Mail edge DKIM-signs and sends.
6. Sent copy is stored as encrypted blob only.

## DNS requirements

- MX for inbound.
- SPF for allowed senders.
- DKIM per domain.
- DMARC policy + reports.
- PTR/rDNS for mail IPs.
- TLS certs for SMTP and web.

## Deliverability rules

- New accounts start with low outbound limits.
- Bulk/mass mailing is prohibited.
- High complaint rates pause sending.
- Suspicious links/attachments can be blocked without decrypting stored mailbox history.
- Alias receiving can remain unlimited normal-use; sending is guarded.
