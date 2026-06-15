import { TrailWorkspace } from "@/components/trail-workspace";
import { platformSummary, readTrailState } from "@/lib/server/trail-store";

export const metadata = {
  title: "Trail Mail",
  description: "Classic inbox, message view, knowledge base, timeline, watchers, and action queue for Trail local email.",
};

export const dynamic = "force-dynamic";

export default async function MailPage() {
  const state = await readTrailState();
  return <TrailWorkspace initialData={platformSummary(state)} />;
}
