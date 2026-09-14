export type Company = { id: string; name: string; city: string; description: string; website: string };
export type StaffingNeed = { title: string; people_needed: number | null };
export type BookingSlot = { id?: string; slot_date: string; start_time: string; end_time: string; capacity: number; booked_count?: number };
export type OrganizerEvent = { id: string; company_id: string; title: string; description: string; venue: string; city: string; starts_at: string | null; ends_at: string | null; status: 'draft' | 'published' | 'cancelled'; published_at: string | null; staffing_needs: StaffingNeed[]; booking_url: string };
export function validStaffingNeeds(needs: StaffingNeed[]) {
 return needs.length > 0 && needs.length <= 30 && needs.every(need => need.title.trim().length > 0 && need.title.length <= 160 && Number.isInteger(need.people_needed) && (need.people_needed ?? 0) > 0 && (need.people_needed ?? 0) <= 100000);
}
export function indiaToday() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
export function eventPhase(event: OrganizerEvent, today = indiaToday()) {
 if (event.status !== 'published') return event.status;
 if (event.ends_at && event.ends_at < today) return 'past';
 if (event.starts_at && event.starts_at > today) return 'upcoming';
 return 'ongoing';
}
export function validDate(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value; }
export function validBookingSlot(slot: BookingSlot, start: string, end: string) {
 return validDate(slot.slot_date) && slot.slot_date >= start && slot.slot_date <= end && /^([01]\d|2[0-3]):[0-5]\d$/.test(slot.start_time) && /^([01]\d|2[0-3]):[0-5]\d$/.test(slot.end_time) && slot.end_time > slot.start_time && Number.isInteger(slot.capacity) && slot.capacity > 0 && slot.capacity <= 100000;
}
