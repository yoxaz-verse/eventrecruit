export function ownsStaffingEvent(createdBy: string | null | undefined, actorId: string) {
  return Boolean(createdBy && createdBy === actorId);
}

export function canModerate(role: string) {
  return role === "admin";
}

export function canApply(role: string, verificationStatus: string, roleStatus: string) {
  return role === "talent" && verificationStatus === "verified" && roleStatus === "open";
}
