import { ok, fail } from "@/lib/server/api";
import { publicStatus, readTrailState } from "@/lib/server/trail-store";

export async function GET() {
  try {
    const state = await readTrailState();
    return ok({ status: publicStatus(state), events: state.events.slice(0, 12) });
  } catch (error) {
    return fail(error, 500);
  }
}
