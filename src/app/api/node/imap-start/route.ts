import { fail, ok, readJson } from "@/lib/server/api";

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const res = await fetch("http://127.0.0.1:8787/api/ingress/imap-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    const data = await res.json();
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
