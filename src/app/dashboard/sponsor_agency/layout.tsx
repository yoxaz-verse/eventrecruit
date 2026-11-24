import { DashboardShell } from "@/components/dashboard-shell";
import { requireSponsorAgencyWorkspace } from "@/lib/dashboard-workspace";

export default async function SponsorAgencyLayout({ children }: { children: React.ReactNode }) {
  const { profile, entity } = await requireSponsorAgencyWorkspace();
  return <DashboardShell active="sponsor_agency" identity={{ id: entity.id, label: entity.name || profile.full_name, imageUrl: entity.logo_path ? `/api/media/sponsor_agency/${entity.id}` : null, imageFit: "contain" }}>{children}</DashboardShell>;
}
