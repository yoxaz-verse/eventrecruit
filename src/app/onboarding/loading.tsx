import { DualTextSpinner } from "@/components/dual-text-spinner";

export default function OnboardingLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg mx-auto flex flex-col items-center">
        <DualTextSpinner
          size="md"
          label="Setting up your account"
          sublabel="Initializing your role configuration, identity verification, and workspace preferences..."
          quotes={[
            "The right people make every moment matter.",
            "Choose your account role: Talent, Exhibitor, Organizer, or Agency.",
            "Start participating in India-wide event staffing operations.",
          ]}
        />
      </div>
    </div>
  );
}
