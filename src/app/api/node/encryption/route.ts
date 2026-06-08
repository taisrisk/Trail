import { fail, ok, readJson } from "@/lib/server/api";
import { readTrailState, isLocked, enablePasswordEncryption, recoverVault } from "trail-node";

export async function GET() {
  try {
    const state = await readTrailState();
    return ok({
      encryption: state.settings.encryption,
      isLocked: isLocked(),
      vaultState: state.vaultState
    });
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson<{ action: string; password?: string; recoveryPhrase?: string }>(request);
    
    if (body.action === "enable-password") {
      if (!body.password) {
        return fail("Password is required to enable password encryption.", 400);
      }
      const { recoveryPhrase } = await enablePasswordEncryption(body.password);
      return ok({
        success: true,
        message: "Password encryption enabled.",
        recoveryPhrase
      });
    }

    if (body.action === "recover") {
      if (!body.recoveryPhrase) {
        return fail("Recovery phrase is required.", 400);
      }
      const success = await recoverVault(body.recoveryPhrase);
      if (success) {
        return ok({ success: true, message: "Vault recovered and unlocked." });
      } else {
        return fail("Recovery failed. Invalid recovery phrase.", 400);
      }
    }

    return fail("Invalid action.", 400);
  } catch (error) {
    return fail(error, 500);
  }
}
