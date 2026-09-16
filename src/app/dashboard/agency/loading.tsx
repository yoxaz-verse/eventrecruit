import { DualTextSpinner } from "@/components/dual-text-spinner";
import { DashboardShell } from "@/components/dashboard-shell";

export default function AgencyLoading() {
  return (
    <DashboardShell active="agency">
      <div className="py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <DualTextSpinner
          size="md"
          label="Loading agency workspace"
          sublabel="Loading your client roster, staffing proposals, active placements, and space inquiries..."
          quotes={[
            "Manage agency clients, bulk staffing requests, and talent rosters.",
            "Scale event & retail activations across 10+ Indian cities.",
            "Verified workforce coordination from a unified portal.",
          ]}
        />
      </div>
    </DashboardShell>
  );
}
