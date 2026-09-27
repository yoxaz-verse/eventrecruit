export const TALENT_ONLINE_WINDOW_MS = 2 * 60 * 1000;

export type TalentPresence = {
  availableForWork: boolean;
  onlineNow: boolean;
  activeNow: boolean;
};

export type TalentPresenceRow = {
  available_for_work?: boolean | null;
  presence_visible?: boolean | null;
  last_seen_at?: string | null;
};

export function deriveTalentPresence(row: TalentPresenceRow | null | undefined, now = new Date()): TalentPresence {
  const availableForWork = Boolean(row?.available_for_work);
  const lastSeen = row?.last_seen_at ? Date.parse(row.last_seen_at) : Number.NaN;
  const age = now.getTime() - lastSeen;
  const onlineNow = Boolean(row?.presence_visible) && Number.isFinite(age) && age >= 0 && age < TALENT_ONLINE_WINDOW_MS;
  return { availableForWork, onlineNow, activeNow: availableForWork && onlineNow };
}

export function activeApplicantsFirst<T>(items: T[], presenceFor: (item: T) => TalentPresence, fallbackCompare: (a: T, b: T) => number) {
  return [...items].sort((a, b) => Number(presenceFor(b).activeNow) - Number(presenceFor(a).activeNow) || fallbackCompare(a, b));
}

export function filterActiveApplicants<T>(items: T[], presenceFor: (item: T) => TalentPresence, activeOnly: boolean) {
  return activeOnly ? items.filter(item => presenceFor(item).activeNow) : items;
}
