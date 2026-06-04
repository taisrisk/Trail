import { fail, ok, readJson } from "@/lib/server/api";
import { createMail, readTrailState } from "@/lib/server/trail-store";

export async function GET() {
  try {
    const state = await readTrailState();
    return ok({ mail: state.mail });
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson<{ from: string; to: string; subject: string; body: string; tags?: string[] }>(request);
    const state = await createMail(body);
    return ok({ mail: state.mail, latest: state.mail[0] }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
