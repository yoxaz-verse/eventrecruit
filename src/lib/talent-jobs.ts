export function workDaysOverlap(first:{work_starts_on:string;work_ends_on:string},second:{work_starts_on:string;work_ends_on:string}) {
  return first.work_starts_on <= second.work_ends_on && first.work_ends_on >= second.work_starts_on;
}

export function talentMatchesJob(talent:{preferredLocationIds:string[];verified:boolean;online:boolean},role:{locationId:string|null}) {
  return Boolean(talent.verified && talent.online && role.locationId && talent.preferredLocationIds.includes(role.locationId));
}
