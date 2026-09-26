import { DashboardShell } from "@/components/dashboard-shell";
import { requireTalentWorkspace } from "@/lib/dashboard-workspace";

export default async function TalentLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireTalentWorkspace();
  return <DashboardShell active="talent" identity={{ id: profile.id, label: profile.full_name, imageUrl: profile.avatar_url ? `/api/media/talent/${profile.id}` : null }}>{children}</DashboardShell>;
}
