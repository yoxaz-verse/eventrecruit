import { DualTextSpinner } from "@/components/dual-text-spinner";
import { DashboardShell } from "@/components/dashboard-shell";

export default function TalentLoading() {
  return (
    <DashboardShell active="talent">
      <div className="py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <DualTextSpinner
          size="md"
          label="Loading talent dashboard"
          sublabel="Fetching your active applications, booked shifts, verified reputation score & open roles..."
          quotes={[
            "Build your verified profile and earn placement track records.",
            "Apply for verified event & retail staffing roles across India.",
            "Fair daily pay in Rupees with transparent shift schedules.",
          ]}
        />
      </div>
    </DashboardShell>
  );
}
