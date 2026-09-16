import { PageLoadingScreen } from "@/components/page-loading-screen";

export default function BrowseLoading() {
  return (
    <PageLoadingScreen
      title="Filtering open staffing roles"
      subtitle="Searching verified role opportunities for event hosts, promoters, lead capture & store teams..."
      quotes={[
        "Browse verified shifts with transparent daily rates in Rupees.",
        "Apply directly with your exporb talent profile.",
        "Find opportunities across Delhi NCR, Mumbai, Bengaluru, Hyderabad & more.",
      ]}
      showTopNav={true}
    />
  );
}
