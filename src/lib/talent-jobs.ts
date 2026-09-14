export function workDaysOverlap(first:{work_starts_on:string;work_ends_on:string},second:{work_starts_on:string;work_ends_on:string}) {
  return first.work_starts_on <= second.work_ends_on && first.work_ends_on >= second.work_starts_on;
}

export function talentMatchesJob(talent:{city:string;skills:string[];verified:boolean;online:boolean},role:{city:string;requiredSkills:string[]}) {
  if (!talent.verified || !talent.online || talent.city.trim().toLowerCase() !== role.city.trim().toLowerCase()) return false;
  const owned=new Set(talent.skills.map(skill=>skill.trim().toLowerCase()));
  return !role.requiredSkills.length || role.requiredSkills.some(skill=>owned.has(skill.trim().toLowerCase()));
}
