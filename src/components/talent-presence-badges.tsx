import type { TalentPresence } from "@/lib/talent-presence";

export function TalentPresenceBadges({ presence }: { presence: TalentPresence }) {
  return <>
    <span className={`badge ${presence.availableForWork ? "badge-accent" : "badge-surface"}`}>
      <span aria-hidden>{presence.availableForWork ? "●" : "○"}</span> {presence.availableForWork ? "Available for work" : "Not available"}
    </span>
    <span className={`badge ${presence.onlineNow ? "badge-accent" : "badge-surface"}`}>
      <span aria-hidden>{presence.onlineNow ? "●" : "○"}</span> {presence.onlineNow ? "Online now" : "Offline"}
    </span>
  </>;
}
