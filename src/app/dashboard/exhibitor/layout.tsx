import { DashboardShell } from "@/components/dashboard-shell";
import { requireExhibitorWorkspace } from "@/lib/dashboard-workspace";

export default async function ExhibitorLayout({ children }: { children: React.ReactNode }) {
  const { entity } = await requireExhibitorWorkspace();
  return <DashboardShell active="exhibitor" identity={{ id: entity.id, label: entity.company_name, imageUrl: entity.logo_path ? `/api/media/exhibitor/${entity.id}` : null, imageFit: "contain" }}>{children}</DashboardShell>;
}
