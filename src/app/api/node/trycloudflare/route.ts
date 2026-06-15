import { fail, ok } from "@/lib/server/api";

export async function POST() {
  try {
    const res = await fetch("http://127.0.0.1:8787/api/ingress/trycloudflare", { method: "POST" });
    const data = await res.json();
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
