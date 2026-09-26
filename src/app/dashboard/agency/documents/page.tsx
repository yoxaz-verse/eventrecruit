import { agencyDataContext } from "@/lib/agency-data";
import { EmptyState } from "@/components/empty-state";
import { FileText } from "lucide-react";

export default async function Documents() {
  const ctx = await agencyDataContext();
  if (!ctx) throw new Error("Documents unavailable.");

  const { data } = await ctx.db
    .from("agency_documents")
    .select("id,owner_type,document_type,visibility,created_at")
    .eq("agency_id", ctx.agency.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <h1 className="text-4xl font-black">Documents</h1>
      <p className="mt-2 text-[var(--muted)]">
        Internal, staff-visible, and client-shareable files are separated by visibility.
      </p>
      <div className="mt-6 grid gap-3">
        {data?.map((doc) => (
          <article className="panel flex items-center justify-between gap-4 p-5" key={doc.id}>
            <div>
              <h2 className="font-black capitalize">{doc.document_type.replaceAll("_", " ")}</h2>
              <p className="text-sm capitalize text-[var(--muted)]">{doc.owner_type}</p>
            </div>
            <span className="badge capitalize">{doc.visibility.replaceAll("_", " ")}</span>
          </article>
        ))}
        {!data?.length ? (
          <EmptyState
            icon={FileText}
            title="No agency documents yet"
            description="Internal, staff-visible, and client-shareable documents uploaded for your agency will appear here."
          />
        ) : null}
      </div>
    </>
  );
}
