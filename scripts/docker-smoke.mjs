const base = process.env.ERME_URL || "http://127.0.0.1:3000";
const paths = ["/", "/ecosystem", "/pass", "/api/pass/status", "/api/pass/items"];

for (const path of paths) {
  const res = await fetch(`${base}${path}`);
  if (!res.ok) {
    console.error(`${path} -> ${res.status}`);
    process.exit(1);
  }
  console.log(`${path} -> ${res.status}`);
}

const status = await fetch(`${base}/api/pass/status`).then((res) => res.json());
console.log(JSON.stringify({ product: status.product, domain: status.domain, items: status.counts?.items, plaintextSecretsReturned: status.security?.plaintextSecretsReturned }, null, 2));
