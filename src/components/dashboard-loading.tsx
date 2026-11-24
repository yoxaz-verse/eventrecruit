import { LoadingSkeleton } from "@/components/loading-skeleton";
import type { UserRole } from "@/lib/types";

const labels: Record<UserRole, string> = {
  admin: "Loading admin records",
  agency: "Loading agency workspace",
  sponsor_agency: "Loading sponsor agency workspace",
  exhibitor: "Loading exhibitor workspace",
  organizer: "Loading organizer workspace",
  talent: "Loading talent dashboard",
};

export function DashboardLoading({ role }: { role: UserRole }) {
  return <div className="py-4"><LoadingSkeleton label={labels[role]} /></div>;
}
