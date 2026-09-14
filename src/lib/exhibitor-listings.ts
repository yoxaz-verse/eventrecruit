import type { EventRole } from "@/lib/types";

export type ExhibitorListingEvent = {
  id: string;
  title: string;
  venue: string;
  city: string;
  starts_at: string;
  ends_at: string;
  created_at: string;
  exhibitors: { company_name: string } | { company_name: string }[] | null;
  staffing_roles: Array<{
    id: string;
    title: string;
    headcount: number;
    hourly_rate: number;
    shift_start: string;
    shift_end: string;
    required_skills: string[] | null;
    status: string;
  }>;
};

export function todayInIndia(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function currentExhibitorRoles(events: ExhibitorListingEvent[], today: string): EventRole[] {
  return [...events]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .flatMap((event) => {
      const exhibitor = Array.isArray(event.exhibitors) ? event.exhibitors[0] : event.exhibitors;
      if (!exhibitor || event.ends_at < today) return [];
      return event.staffing_roles
        .filter((role) => role.status === "open")
        .map((role) => ({
          id: role.id,
          eventTitle: event.title,
          company: exhibitor.company_name,
          location: `${event.venue}, ${event.city}`,
          date: event.starts_at,
          shift: `${role.shift_start} – ${role.shift_end}`,
          role: role.title,
          headcount: role.headcount,
          rate: Number(role.hourly_rate),
          skills: role.required_skills ?? [],
          status: "open" as const,
        }));
    });
}
