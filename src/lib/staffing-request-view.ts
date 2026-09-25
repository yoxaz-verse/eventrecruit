type DatedApplication = { created_at: string };

export function talentRequirementLabel(headcount: number) {
  return `Talent requirement: ${headcount}`;
}

export function applicantCountLabel(count: number) {
  return `${count} ${count === 1 ? "applicant" : "applicants"}`;
}

export function newestApplicationsFirst<T extends DatedApplication>(applications: T[]) {
  return [...applications].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}
