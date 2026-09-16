import { DualTextSpinner } from "@/components/dual-text-spinner";
import { TopNav } from "@/components/top-nav";

export interface PageLoadingScreenProps {
  title?: string;
  subtitle?: string;
  quotes?: string[];
  showTopNav?: boolean;
}

export function PageLoadingScreen({
  title = "Loading exporb workspace",
  subtitle = "Preparing India-wide event staffing operations and verified placements...",
  quotes,
  showTopNav = false,
}: PageLoadingScreenProps) {
  return (
    <div className="min-h-[70vh] flex flex-col justify-between">
      {showTopNav && <TopNav />}

      <main className="page flex-1 flex flex-col items-center justify-center py-12 md:py-16">
        <div className="w-full max-w-xl mx-auto flex flex-col items-center">
          <DualTextSpinner
            size="md"
            label={title}
            sublabel={subtitle}
            quotes={quotes}
            className="w-full"
          />

          {/* Skeleton UI preview background */}
          <div className="mt-8 w-full grid gap-4 sm:grid-cols-3 opacity-40 pointer-events-none">
            <div className="h-24 rounded-2xl bg-[var(--surface-2)] animate-pulse" />
            <div className="h-24 rounded-2xl bg-[var(--surface-2)] animate-pulse" />
            <div className="h-24 rounded-2xl bg-[var(--surface-2)] animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
}
