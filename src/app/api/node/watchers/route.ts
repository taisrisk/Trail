import { fail, ok, readJson } from "@/lib/server/api";
import { createWatcher, readTrailState } from "@/lib/server/trail-store";

export async function GET() {
  try {
    const state = await readTrailState();
    return ok({ watchers: state.watchers });
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson<{ name: string; rule: string; actions?: string[]; humanApprovalRequired?: boolean }>(request);
    const state = await createWatcher(body);
    return ok({ watchers: state.watchers, latest: state.watchers[0] }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
