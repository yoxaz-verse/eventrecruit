import test from "node:test";
import assert from "node:assert/strict";
import {adminUserDeleteFailure,allowedAdminTransition,isAdminOrganizationType,isAdminUuid,maskEmail,maskPhone,parseAdminListParams,validateAdminUserDeletion} from "../src/lib/admin";

test("admin list parameters are bounded and normalized",()=>{
 assert.deepEqual(parseAdminListParams({q:"  expo  ",status:"pending_verification",sort:"oldest",page:"3",view:"applications"}),{q:"expo",status:"pending_verification",sort:"oldest",page:3,view:"applications"});
 assert.deepEqual(parseAdminListParams({status:"not valid!",sort:"sideways",page:"-4",view:"not valid!"}),{q:"",status:"",sort:"newest",page:1,view:""});
 assert.equal(parseAdminListParams({page:"999999"}).page,10000);
});

test("organization detail routes accept only supported types and UUIDs",()=>{
 assert.equal(isAdminOrganizationType("companies"),true);
 assert.equal(isAdminOrganizationType("agencies"),true);
 assert.equal(isAdminOrganizationType("exhibitors"),true);
 assert.equal(isAdminOrganizationType("users"),false);
 assert.equal(isAdminUuid("11111111-1111-4111-8111-111111111111"),true);
 assert.equal(isAdminUuid("11111111-1111-0111-8111-111111111111"),false);
 assert.equal(isAdminUuid("not-a-uuid"),false);
});

test("private contact previews do not expose full values",()=>{
 assert.equal(maskPhone("+91 98765 43210"),"••••••10");
 assert.equal(maskEmail("owner@example.com"),"o••••@example.com");
 assert.equal(maskPhone(null),"Not provided");
});

test("admin status transitions protect terminal workflow states",()=>{
 assert.equal(allowedAdminTransition("application","accepted","completed"),true);
 assert.equal(allowedAdminTransition("application","completed","accepted"),false);
 assert.equal(allowedAdminTransition("organizer_event","cancelled","draft"),false);
 assert.equal(allowedAdminTransition("review","published","hidden"),true);
 assert.equal(allowedAdminTransition("profile","verified","made_up"),false);
});

test("admin user deletion validates identity and reports dependency failures",()=>{
 const target="11111111-1111-4111-8111-111111111111";
 assert.equal(validateAdminUserDeletion("not-a-uuid",target),"Invalid user account.");
 assert.equal(validateAdminUserDeletion(target,target),"You cannot delete your own administrator account.");
 assert.equal(validateAdminUserDeletion("22222222-2222-4222-8222-222222222222",target),"");
 assert.match(adminUserDeleteFailure({code:"23503"}),/dependent platform records/);
 assert.match(adminUserDeleteFailure({message:"still referenced by a foreign key"}),/dependent platform records/);
 assert.match(adminUserDeleteFailure(null),/Unable to delete/);
});
