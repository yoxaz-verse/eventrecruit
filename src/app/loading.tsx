import { DualTextSpinner } from "@/components/dual-text-spinner";

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg mx-auto flex flex-col items-center">
        <DualTextSpinner
          size="lg"
          label="Loading exporb platform"
          sublabel="Connecting event organizers, verified talent, exhibitors & agencies across India..."
          quotes={[
            "The right people make every moment matter.",
            "India-wide event & retail talent operations.",
            "Coordinating hosts, promoters, registration crews & store teams...",
            "Verified placement track records & real-time shift execution.",
          ]}
        />
      </div>
    </div>
  );
}
