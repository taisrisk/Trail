import { TrailWorkspace } from "@/components/trail-workspace";
import { platformSummary, readTrailState, seedPlatformData } from "@/lib/server/trail-store";

export const metadata = {
  title: "Trail Mail",
  description: "Classic inbox, message view, knowledge base, timeline, watchers, and action queue for Trail local email.",
};

export const dynamic = "force-dynamic";

export default async function MailPage() {
  let state = await readTrailState();
  if (state.mail.length === 0 || state.watchers.length === 0 || state.aliases.length === 0) {
    state = await seedPlatformData();
  }
  return <TrailWorkspace initialData={platformSummary(state)} />;
}
