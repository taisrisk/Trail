import { fail, ok, readJson } from "@/lib/server/api";
import { readTrailState, setupDomain, type NodeMode } from "@/lib/server/trail-store";

export async function GET() {
  try {
    const state = await readTrailState();
    return ok({ domain: state.domain, runState: state.runState, home: state.home });
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson<{ domain: string; mode: NodeMode; catchAll?: boolean }>(request);
    const state = await setupDomain({ domain: body.domain, mode: body.mode || "quick-domain", catchAll: body.catchAll });
    return ok({ domain: state.domain, status: "configured" }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
