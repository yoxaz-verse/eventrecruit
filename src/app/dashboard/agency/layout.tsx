import { DashboardShell } from "@/components/dashboard-shell";
import { requireAgencyWorkspace } from "@/lib/dashboard-workspace";

export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
  const { profile, entity } = await requireAgencyWorkspace();
  return <DashboardShell active="agency" identity={{ id: entity.id, label: entity.name || profile.full_name, imageUrl: entity.logo_path ? `/api/media/agency/${entity.id}` : null, imageFit: "contain" }}>{children}</DashboardShell>;
}
