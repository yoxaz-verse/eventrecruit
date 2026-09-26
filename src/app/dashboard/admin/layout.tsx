import { DashboardShell } from "@/components/dashboard-shell";
import { requireAdminWorkspace } from "@/lib/dashboard-workspace";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdminWorkspace();
  return <DashboardShell active="admin" identity={{ id: profile.id, label: profile.full_name, imageUrl: profile.avatar_url ? `/api/media/profile/${profile.id}` : null }}>{children}</DashboardShell>;
}
