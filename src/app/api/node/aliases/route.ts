import { fail, ok, readJson } from "@/lib/server/api";
import { createAlias, readTrailState } from "@/lib/server/trail-store";

export async function GET() {
  try {
    const state = await readTrailState();
    return ok({ aliases: state.aliases });
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson<{ address: string; destination: string; label?: string }>(request);
    const state = await createAlias(body);
    return ok({ aliases: state.aliases, latest: state.aliases[0] }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
