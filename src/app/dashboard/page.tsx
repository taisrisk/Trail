import { ControlDashboard } from "@/components/control-dashboard";
import { platformSummary, readTrailState } from "@/lib/server/trail-store";

export const metadata = {
  title: "Trail Control",
  description: "Phase 1 Trail local node command center for setup, aliases, watchers, local vault mail, and approvals.",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const state = await readTrailState();
  return <ControlDashboard initialData={platformSummary(state)} />;
}
