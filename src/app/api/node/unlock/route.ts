import { fail, ok, readJson } from "@/lib/server/api";
import { unlockVault } from "trail-node";

export async function POST(request: Request) {
  try {
    const { password } = await readJson<{ password: string }>(request);
    if (!password) {
      return fail("Password is required.", 400);
    }
    const success = await unlockVault(password);
    if (success) {
      return ok({ unlocked: true, message: "Vault unlocked successfully." });
    } else {
      return fail("Incorrect password.", 401);
    }
  } catch (error) {
    return fail(error, 500);
  }
}
