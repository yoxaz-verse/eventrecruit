export type ApplicationProfileInput={
  avatarUrl?:string|null; phone?:string|null; homeLocationId?:string|null;
  languages?:string[]|null; availability?:string|null; skills?:string[]|null;
  documentsNote?:string|null; profileUpdatedAt?:string|null;
};
export type RoleRequirements={requiredSkills?:string[]|null;preferredSkills?:string[]|null;requiredLanguages?:string[]|null};
const normalized=(values:readonly string[]|null|undefined)=>new Set((values??[]).map(value=>value.trim().toLocaleLowerCase("en")).filter(Boolean));
export function applicationProfileCheck(profile:ApplicationProfileInput,role:RoleRequirements,now=new Date(),freshnessDays=30){
  const skills=normalized(profile.skills),languages=normalized(profile.languages);
  const missingMandatory=(role.requiredSkills??[]).filter(skill=>!skills.has(skill.trim().toLocaleLowerCase("en")));
  const missingPreferred=(role.preferredSkills??[]).filter(skill=>!skills.has(skill.trim().toLocaleLowerCase("en")));
  const missingLanguages=(role.requiredLanguages??[]).filter(language=>!languages.has(language.trim().toLocaleLowerCase("en")));
  const required=[
    ...(!profile.avatarUrl?["Profile photo"]:[]),...(!profile.phone?["Phone"]:[]),
    ...(!profile.homeLocationId?["Home location"]:[]),...(!profile.availability?["Availability"]:[]),
    ...(missingLanguages.length?[`Languages: ${missingLanguages.join(", ")}`]:[]),
    ...(missingMandatory.length?[`Mandatory skills: ${missingMandatory.join(", ")}`]:[]),
  ];
  const updated=profile.profileUpdatedAt?new Date(profile.profileUpdatedAt):null;
  const stale=!updated||Number.isNaN(updated.getTime())||now.getTime()-updated.getTime()>freshnessDays*86400000;
  return {required,missingMandatory,missingPreferred,missingLanguages,stale,canApply:required.length===0};
}
