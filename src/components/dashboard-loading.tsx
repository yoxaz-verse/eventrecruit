import { PageLoadingScreen } from "@/components/page-loading-screen";
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
  return (
    <PageLoadingScreen
      title={labels[role]}
      subtitle="Preparing schedules, staffing requests, applicants, and placement updates..."
      showTopNav={false}
    />
  );
}
