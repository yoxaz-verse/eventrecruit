export function hasExhibitorAccess(input:{actorId:string;ownerId:string|null;agencyId:string|null;relationshipAgencyId?:string|null;relationshipStatus?:string|null}) {
  return input.ownerId===input.actorId || Boolean(input.agencyId && input.relationshipAgencyId===input.agencyId && input.relationshipStatus==="active");
}
