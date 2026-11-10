import test from "node:test";
import assert from "node:assert/strict";
import { createAdultAuthorizer } from "./adultAccess.js";
const time = 1000;
const goodSession = () => ({ subject: "user-a", authenticated: true, active: true, revoked: false, expiresAt: 2000 });
const goodEligibility = () => ({ subject: "user-a", adultVerified: true, revoked: false, expiresAt: 2000 });
function make(session = goodSession(), eligibility = goodEligibility(), now = () => time) {
  return createAdultAuthorizer({ authenticate: async () => session, getEligibility: async () => eligibility, now });
}
test("only verified active adult sessions pass", async () => { assert.equal(await make()({}), true); });
test("requires verifiers", () => { assert.throws(() => createAdultAuthorizer(), TypeError); });
test("denies missing, unauthenticated, inactive, revoked, expired, malformed and subjectless sessions", async () => {
  for (const s of [null, {...goodSession(), authenticated:false}, {...goodSession(), active:false}, {...goodSession(), revoked:true}, {...goodSession(), revoked:undefined}, {...goodSession(), expiresAt:1000}, {...goodSession(), expiresAt:"2000"}, {...goodSession(), subject:""}]) assert.equal(await make(s)({}), false);
});
test("denies missing, mismatched, unverified, revoked, expired or malformed eligibility", async () => {
  for (const e of [null, {...goodEligibility(), subject:"user-b"}, {...goodEligibility(), adultVerified:false}, {...goodEligibility(), revoked:true}, {...goodEligibility(), revoked:undefined}, {...goodEligibility(), expiresAt:1000}, {...goodEligibility(), expiresAt:"2000"}]) assert.equal(await make(goodSession(),e)({}), false);
});
test("does not accept client claims and denies failures", async () => {
  const req = { body: { adultVerified:true, subject:"user-a" } };
  assert.equal(await make(null)(req),false);
  assert.equal(await createAdultAuthorizer({authenticate:async()=>{throw Error()},getEligibility:async()=>goodEligibility()})(req),false);
  assert.equal(await createAdultAuthorizer({authenticate:async()=>goodSession(),getEligibility:async()=>{throw Error()},now:()=>time})(req),false);
});
test("denies if session expires while eligibility is checked or clock fails", async () => {
  let times=[1000,2000]; assert.equal(await make(goodSession(),goodEligibility(),()=>times.shift())({}),false);
  assert.equal(await make(goodSession(),goodEligibility(),()=>NaN)({}),false);
});
