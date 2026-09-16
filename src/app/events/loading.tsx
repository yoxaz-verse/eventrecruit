import { PageLoadingScreen } from "@/components/page-loading-screen";

export default function EventsLoading() {
  return (
    <PageLoadingScreen
      title="Loading public events & venues"
      subtitle="Fetching active exhibitions, store launches, roadshows & pop-ups across 10+ Indian cities..."
      quotes={[
        "Exhibitions, retail stores, malls & product launches across India.",
        "Connecting top brands with verified local staffing crews.",
        "Live event demand updated in real-time.",
      ]}
      showTopNav={true}
    />
  );
}
