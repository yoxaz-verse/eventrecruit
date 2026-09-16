import { DualTextSpinner } from "@/components/dual-text-spinner";
import { DashboardShell } from "@/components/dashboard-shell";

export default function AdminLoading() {
  return (
    <DashboardShell active="admin">
      <div className="py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <DualTextSpinner
          size="md"
          label="Loading admin portal & records"
          sublabel="Fetching platform accounts, verified talent, event submissions, and system audit logs..."
          quotes={[
            "Platform governance, identity verification & compliance oversight.",
            "Coordinating nationwide event staffing operations.",
            "Auditing placement records and user account verification.",
          ]}
        />
      </div>
    </DashboardShell>
  );
}
