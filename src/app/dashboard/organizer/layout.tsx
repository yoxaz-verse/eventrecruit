import { DashboardShell } from "@/components/dashboard-shell";
import { requireOrganizerWorkspace } from "@/lib/dashboard-workspace";

export default async function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const { profile, entity } = await requireOrganizerWorkspace();
  return <DashboardShell active="organizer" identity={{ id: profile.id, label: entity[0]?.name || profile.full_name, imageUrl: profile.avatar_url ? `/api/media/profile/${profile.id}` : null }}>{children}</DashboardShell>;
}
