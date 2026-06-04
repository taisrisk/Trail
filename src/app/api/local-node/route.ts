import { NextResponse } from "next/server";
import { localNodeModules } from "@/lib/byk-mail";

export async function GET() {
  return NextResponse.json({
    purpose: "Describe the local Trail node layout and privacy boundary.",
    root: "~/.trail",
    modules: localNodeModules,
    runtimeGoals: [
      "Local readable mail only",
      "Encrypted blob storage",
      "SQLite metadata and event log",
      "Ollama/tiny-model watcher runner",
      "Approval queue for external sends",
    ],
  });
}
