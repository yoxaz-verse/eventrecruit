import Link from 'next/link';
import { Store, Compass } from 'lucide-react';

import { requireExhibitorWorkspace } from '@/lib/dashboard-workspace';
import { dashboardPagination } from '@/lib/pagination';
import { DashboardPagination } from '@/components/dashboard-pagination';
import { firstRelated } from '@/lib/dashboard-read-models';
import { EmptyState } from '@/components/empty-state';

export default async function SpaceInquiriesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const [{ db, entity }, params] = await Promise.all([requireExhibitorWorkspace(), searchParams]);
  const pagination = dashboardPagination(params.page);
  const { data: inquiries, error } = await db
    .from('event_space_inquiries')
    .select('id,event_id,offer_id,requested_area_sqft,requested_units,message,status,created_at,organizer_events(title),event_space_offers(name)')
    .eq('exhibitor_id', entity.id)
    .order('created_at', { ascending: false })
    .range(pagination.from, pagination.to);

  if (error) throw new Error('Unable to load space inquiries.');

  const hasInquiries = Boolean(inquiries && inquiries.length > 0);

  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl font-black">Space inquiries</h1>
      <p className="mt-3 text-[var(--muted)]">
        Track your inquiries. Accepted means the organizer has responded positively; it is not a reservation or payment.
      </p>

      {hasInquiries && (
        <Link className="button button-primary my-6 gap-2" href="/events">
          <Compass size={18} aria-hidden />
          <span>Browse events</span>
        </Link>
      )}

      <div className="mt-6 grid gap-4">
        {inquiries?.map((inquiry) => {
          const event = firstRelated(inquiry.organizer_events);
          const offer = firstRelated(inquiry.event_space_offers);
          return (
            <article className="panel p-5" key={inquiry.id}>
              <span className="badge capitalize">{inquiry.status}</span>
              <h2 className="mt-3 text-xl font-bold">
                {event?.title ?? 'Event'} · {offer?.name ?? 'Space offer'}
              </h2>
              <p className="mt-2 text-sm">
                {inquiry.requested_area_sqft ? `${inquiry.requested_area_sqft} sq ft · ` : ''}
                {inquiry.requested_units ? `${inquiry.requested_units} units` : ''}
              </p>
              <p className="mt-3 whitespace-pre-wrap">{inquiry.message}</p>
              <p className="mt-3 text-xs text-[var(--muted)]">
                Sent {new Date(inquiry.created_at).toLocaleString('en-IN')}
              </p>
            </article>
          );
        })}

        {!hasInquiries && (
          <EmptyState
            icon={Store}
            title="No space inquiries yet"
            description="Explore upcoming events and submit space inquiries directly to event organizers."
            action={
              <Link className="button button-primary gap-2" href="/events">
                <Compass size={18} aria-hidden />
                <span>Browse upcoming events</span>
              </Link>
            }
          />
        )}
      </div>

      <DashboardPagination
        path="/dashboard/exhibitor/space-inquiries"
        page={pagination.page}
        hasNext={(inquiries?.length ?? 0) === pagination.pageSize}
        params={params}
      />
    </div>
  );
}
