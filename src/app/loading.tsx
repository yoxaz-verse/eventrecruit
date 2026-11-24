import { LoadingSkeleton } from "@/components/loading-skeleton";

export default function GlobalLoading() {
  return (
    <div className="page min-h-[45vh] py-12">
      <LoadingSkeleton label="Loading page" />
    </div>
  );
}
