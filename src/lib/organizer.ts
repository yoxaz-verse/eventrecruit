export type Company = { id: string; name: string; city: string; description: string; website: string };
export type OrganizerEvent = { id: string; company_id: string; title: string; description: string; venue: string; city: string; starts_at: string | null; ends_at: string | null; status: 'draft' | 'published' | 'cancelled'; published_at: string | null };
export function indiaToday() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
export function eventPhase(event: OrganizerEvent, today = indiaToday()) {
 if (event.status !== 'published') return event.status;
 if (event.ends_at && event.ends_at < today) return 'past';
 if (event.starts_at && event.starts_at > today) return 'upcoming';
 return 'ongoing';
}
export function validDate(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value; }
