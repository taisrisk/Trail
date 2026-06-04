import { ControlDashboard } from "@/components/control-dashboard";

export const metadata = {
  title: "Trail Control",
  description: "Local Trail node control surface for setup, aliases, watchers, vault, and inbox testing.",
};

export default function DashboardPage() {
  return <ControlDashboard />;
}
