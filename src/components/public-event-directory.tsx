"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SearchX } from "lucide-react";
import { EventAmenities } from "@/components/event-amenities";
import { EventStaffingNeeds } from "@/components/event-staffing-needs";
import { EmptyState } from "@/components/empty-state";
import { eventTypeLabels, venueSettingLabels } from "@/lib/organizer";
import type { PublicDirectoryItem } from "@/lib/public-data";

export function PublicEventDirectory({
  events,
  cities,
  available,
}: {
  events: PublicDirectoryItem[];
  cities: string[];
  available: boolean;
}) {
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();
  const city = (searchParams.get("city") ?? "").trim();
  const filtered = events.filter((item) => {
    const company = item.source === "organizer" ? item.companyName : "";
    return (!city || item.event.city === city)
      && (!query || `${item.event.title} ${company}`.toLowerCase().includes(query));
  });

  return (
    <>
      <form className="panel filter-panel mb-5 flex flex-wrap items-end gap-4 p-5">
        <label className="label flex-1">Search events or companies<input className="input" name="q" placeholder="Search by event or organizer" defaultValue={searchParams.get("q") ?? ""} maxLength={160}/></label>
        <label className="label">City<select className="input" name="city" defaultValue={city}><option value="">All cities</option>{cities.map((name) => <option key={name}>{name}</option>)}</select></label>
        <button className="button button-primary">Search</button>
        <Link className="button button-secondary" href="/events">Clear</Link>
      </form>
      {available ? <div className="catalog-summary"><p><strong>{filtered.length}</strong> event{filtered.length === 1 ? "" : "s"} found</p>{(query || city) ? <span>Filtered results</span> : <span>All upcoming events</span>}</div> : null}
      {!available ? <p role="alert" className="panel p-6">Events are temporarily unavailable. Please try again later.</p> : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            if (item.source === "exhibitor") {
              const event = item.event;
              return <article className="panel event-card gap-3 p-6" key={`exhibitor-${event.id}`}><div className="flex flex-wrap gap-2"><span className="badge">Expoline Approved</span><span className="badge">{event.city}</span></div><h2 className="text-2xl font-bold"><Link href={`/events/exhibitor/${event.id}`}>{event.title}</Link></h2><p className="text-sm">{event.starts_at} – {event.ends_at}</p><p className="line-clamp-3 text-[var(--muted)]">{event.description}</p><EventAmenities amenities={event.amenities} compact customAmenities={event.custom_amenities}/><Link className="button button-secondary" href={`/events/exhibitor/${event.id}`}>View event</Link></article>;
            }
            const event = item.event;
            const participants = item.participants.join(", ");
            return <article className="panel event-card gap-3 p-6" key={`organizer-${event.id}`}><div className="flex flex-wrap gap-2"><span className="badge">{eventTypeLabels[event.event_type]}</span><span className="badge">{event.city}</span></div><h2 className="text-2xl font-bold"><Link href={`/events/${event.id}`}>{event.title}</Link></h2><p>{item.companyName}</p><p className="text-sm">{venueSettingLabels[event.venue_setting]}</p>{participants ? <p className="text-sm">Exhibitors: {participants}</p> : null}<p className="text-sm">{event.starts_at} – {event.ends_at}</p><p className="line-clamp-3 text-[var(--muted)]">{event.description}</p><EventAmenities amenities={event.amenities} compact customAmenities={event.custom_amenities}/>{event.staffing_needs?.length > 0 && <EventStaffingNeeds needs={event.staffing_needs}/>}<Link className="button button-secondary" href={`/events/${event.id}`}>{event.booking_url ? "View event & booking" : "View event"}</Link></article>;
          })}
        </div>
      )}
      {available && !filtered.length ? <EmptyState icon={SearchX} title="No upcoming events match your search" description="Try clearing your search query or selecting a different city from the filter options above." action={<Link className="button button-secondary text-xs" href="/events">Clear search filters</Link>} className="mt-6" /> : null}
    </>
  );
}
