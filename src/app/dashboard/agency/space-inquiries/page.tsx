import Link from "next/link";
import { Store, PlusCircle } from "lucide-react";

import { AgencyClientSelector } from "@/components/agency-client-selector";
import { agencyClients, selectedAgencyClient } from "@/lib/agency-workspace";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";

export default async function AgencyInquiries({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const clients = await agencyClients();
  const selected = selectedAgencyClient(clients, (await searchParams).client);
  const db = await createClient();
  if (!db) throw new Error("Inquiries unavailable.");

  const { data: rows, error } = selected
    ? await db
        .from("event_space_inquiries")
        .select("id,event_id,offer_id,status,message,created_at,organizer_events(title),event_space_offers(name)")
        .eq("exhibitor_id", selected.exhibitorId)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (error) throw new Error("Unable to load inquiries.");

  const hasInquiries = Boolean(rows && rows.length > 0);

  return (
    <>
      <h1 className="text-4xl font-black">Client space inquiries</h1>
      <AgencyClientSelector clients={clients} selected={selected} path="/dashboard/agency/space-inquiries" />

      {selected && hasInquiries ? (
        <Link className="button button-primary mb-6 gap-2" href={`/dashboard/agency/space-inquiries/new?client=${selected.exhibitorId}`}>
          <PlusCircle size={18} aria-hidden />
          <span>Browse spaces for this client</span>
        </Link>
      ) : null}

      <div className="grid gap-4">
        {rows?.map((r) => {
          const e = Array.isArray(r.organizer_events) ? r.organizer_events[0] : r.organizer_events;
          const o = Array.isArray(r.event_space_offers) ? r.event_space_offers[0] : r.event_space_offers;
          return (
            <article className="panel p-5" key={r.id}>
              <span className="badge capitalize">{r.status}</span>
              <h2 className="mt-3 text-xl font-black">
                {e?.title ?? "Event"} · {o?.name ?? "Space"}
              </h2>
              <p className="mt-2 whitespace-pre-wrap">{r.message}</p>
            </article>
          );
        })}

        {selected && !hasInquiries ? (
          <EmptyState
            icon={Store}
            title="No space inquiries for this client"
            description="Explore available event space offers to submit inquiries on behalf of this client."
            action={
              <Link className="button button-primary gap-2" href={`/dashboard/agency/space-inquiries/new?client=${selected.exhibitorId}`}>
                <PlusCircle size={18} aria-hidden />
                <span>Browse spaces for client</span>
              </Link>
            }
          />
        ) : null}
      </div>
    </>
  );
}
