import { DualTextSpinner } from "@/components/dual-text-spinner";
import { DashboardShell } from "@/components/dashboard-shell";

export default function ExhibitorLoading() {
  return (
    <DashboardShell active="exhibitor">
      <div className="py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <DualTextSpinner
          size="md"
          label="Loading exhibitor workspace"
          sublabel="Loading your booth presence, staffing requests, and talent applicant reviews..."
          quotes={[
            "Find verified people for booth management, lead capture & demonstrations.",
            "Review verified talent profiles and placement histories.",
            "Ensure flawless booth execution at top Indian expos.",
          ]}
        />
      </div>
    </DashboardShell>
  );
}
