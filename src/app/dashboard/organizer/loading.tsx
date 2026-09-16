import { DualTextSpinner } from "@/components/dual-text-spinner";
import { DashboardShell } from "@/components/dashboard-shell";

export default function OrganizerLoading() {
  return (
    <DashboardShell active="organizer">
      <div className="py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <DualTextSpinner
          size="md"
          label="Loading organizer panel"
          sublabel="Syncing your published events, active staffing requests & venue participant lists..."
          quotes={[
            "Publish events and hire verified crews for exhibitions & launches.",
            "Coordinate hosts, promoters, registration crews & floor managers.",
            "Seamless event execution across India.",
          ]}
        />
      </div>
    </DashboardShell>
  );
}
