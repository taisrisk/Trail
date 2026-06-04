import { ControlDashboard } from "@/components/control-dashboard";

export const metadata = {
  title: "Trail Control Dashboard",
  description: "Local Trail node control plane for BYK mail setup, aliases, watchers, and local inbox testing.",
};

export default function DashboardPage() {
  return <ControlDashboard />;
}
