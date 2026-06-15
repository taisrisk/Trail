export async function configureCloudflareDNS(domain: string, token: string, options: { receiver?: string } = {}) {
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // 1. Get Zone ID
  const zoneRes = await fetch(`https://api.cloudflare.com/client/v4/zones?name=${encodeURIComponent(domain)}`, { headers });
  if (!zoneRes.ok) throw new Error(`Cloudflare API error: ${zoneRes.statusText}`);
  const zoneData = await zoneRes.json();
  if (!zoneData.success || zoneData.result.length === 0) throw new Error("Cloudflare zone not found for domain");
  const zoneId = zoneData.result[0].id;

  // 2. Get existing records
  const recordsRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, { headers });
  if (!recordsRes.ok) throw new Error(`Cloudflare API error: ${recordsRes.statusText}`);
  const recordsData = await recordsRes.json();
  const existingRecords = recordsData.result;

  const receiver = options.receiver || "Cloudflare Email Routing";

  // Desired records
  const desiredRecords = [
    { type: "MX", name: domain, content: receiver === "Sovereign SMTP" ? `mx.${domain}` : "route1.mx.cloudflare.net", priority: 10, proxied: false },
    { type: "TXT", name: domain, content: "v=spf1 include:_spf.google.com include:_spf.mx.cloudflare.net ~all", proxied: false },
    { type: "TXT", name: `_dmarc.${domain}`, content: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}`, proxied: false },
    { type: "TXT", name: `trail._domainkey.${domain}`, content: `v=DKIM1; k=rsa; p=${process.env.TRAIL_DKIM_PUBLIC_KEY || ""}`, proxied: false },
    { type: "CNAME", name: `trail.${domain}`, content: "127-0-0-1.local-trail.invalid", proxied: false },
  ];

  // Helper to check if a record matches
  const isMatch = (existing: Record<string, unknown>, desired: Record<string, unknown>) => {
    if (existing.type !== desired.type) return false;
    if (existing.name !== desired.name) return false;
    if (existing.type === "MX" && existing.priority !== desired.priority) return false;
    if (existing.content !== desired.content) return false;
    return true;
  };

  // Process desired records
  for (const desired of desiredRecords) {
    const existing = existingRecords.find((r: Record<string, unknown>) => r.type === desired.type && r.name === desired.name);

    if (existing) {
      if (!isMatch(existing, desired)) {
        // Update
        const updateRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${existing.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(desired),
        });
        if (!updateRes.ok) console.warn(`Failed to update ${desired.name} ${desired.type}`);
      }
    } else {
      // Create
      const createRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
        method: "POST",
        headers,
        body: JSON.stringify(desired),
      });
      if (!createRes.ok) {
        const errorData = await createRes.json();
        console.warn(`Failed to create ${desired.name} ${desired.type}`, errorData);
      }
    }
  }

  return zoneId;
}
