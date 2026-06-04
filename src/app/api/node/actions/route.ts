import { fail, ok, readJson } from "@/lib/server/api";
import { publicStatus, readTrailState, seedDemoData, setRunState, type NodeRunState } from "@/lib/server/trail-store";

export async function POST(request: Request) {
  try {
    const body = await readJson<{ action: "start" | "pause" | "seed" | "reset-fresh" }>(request);
    if (body.action === "seed") {
      const state = await seedDemoData();
      return ok({ status: publicStatus(state), events: state.events.slice(0, 12) });
    }
    const nextState: NodeRunState = body.action === "pause" ? "paused" : body.action === "reset-fresh" ? "fresh" : "running";
    const state = await setRunState(nextState);
    return ok({ status: publicStatus(state), events: state.events.slice(0, 12) });
  } catch (error) {
    return fail(error);
  }
}

export async function GET() {
  try {
    const state = await readTrailState();
    return ok({ actions: ["start", "pause", "seed", "reset-fresh"], status: publicStatus(state) });
  } catch (error) {
    return fail(error, 500);
  }
}
