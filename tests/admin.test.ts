import test from "node:test";
import assert from "node:assert/strict";
import {allowedAdminTransition,maskEmail,maskPhone,parseAdminListParams} from "../src/lib/admin";

test("admin list parameters are bounded and normalized",()=>{
 assert.deepEqual(parseAdminListParams({q:"  expo  ",status:"pending_verification",sort:"oldest",page:"3"}),{q:"expo",status:"pending_verification",sort:"oldest",page:3});
 assert.deepEqual(parseAdminListParams({status:"not valid!",sort:"sideways",page:"-4"}),{q:"",status:"",sort:"newest",page:1});
 assert.equal(parseAdminListParams({page:"999999"}).page,10000);
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
