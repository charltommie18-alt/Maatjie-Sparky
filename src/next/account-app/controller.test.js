import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bindAccountScreen } from './controller.js';
class El {
  constructor(){this.listeners={};this.value='';this.hidden=false;this.disabled=false;this.validity={valid:true};this.attrs={};}
  addEventListener(n,f){this.listeners[n]=f} setAttribute(k,v){this.attrs[k]=v} focus(){this.focused=true}
  async fire(n){let prevented=false;await this.listeners[n]({preventDefault(){prevented=true}});return prevented}
}
async function screen(account){
  const ids=['account-form','account-email','account-password','account-confirm','account-status','account-submit','signout','show-signin','show-signup','account-heading','account-intro','confirm-wrap'];
  const e=Object.fromEntries(ids.map(i=>[i,new El()]));e.signout.hidden=true;
  e['account-form'].reset=()=>{for(const n of ['account-email','account-password','account-confirm'])e[n].value=''};
  await bindAccountScreen({getElementById:id=>e[id]},account);return e;
}
function fake(restored=false){let signedIn=restored;return {signUp:async()=>({ok:true}),signIn:async()=>{signedIn=true;return {ok:true}},verifiedUser:async()=>signedIn?{id:'1'}:null,signOut:async()=>{signedIn=false;return {ok:true}}};}
test('missing config fails closed',async()=>{const e=await screen(null);assert.equal(e['account-submit'].disabled,true);await e['account-form'].fire('submit');assert.match(e['account-status'].textContent,/nie ingestel/)});
test('registration mismatch blocks, matching submits and gives neutral result',async()=>{const a=fake();let calls=0;a.signUp=async()=>{calls++;return {ok:true}};const e=await screen(a);await e['show-signup'].fire('click');e['account-email'].value='a@example.test';e['account-password'].value='abcdefgh';e['account-confirm'].value='bad';await e['account-form'].fire('submit');assert.equal(calls,0);assert.match(e['account-status'].textContent,/stem nie ooreen/);e['account-confirm'].value='abcdefgh';await e['account-form'].fire('submit');assert.equal(calls,1);assert.match(e['account-status'].textContent,/As registrasie aanvaar/);assert.equal(e['account-password'].value,'');assert.equal(e.signout.hidden,true)});
test('verified sign in and local sign out',async()=>{const e=await screen(fake());e['account-email'].value='a@example.test';e['account-password'].value='abcdefgh';assert.equal(await e['account-form'].fire('submit'),true);assert.equal(e.signout.hidden,false);assert.match(e['account-status'].textContent,/aangemeld/);await e.signout.fire('click');assert.equal(e.signout.hidden,true);assert.match(e['account-status'].textContent,/afgemeld/)});
test('verified restored session displays signed-in state',async()=>{const e=await screen(fake(true));assert.equal(e.signout.hidden,false);assert.match(e['account-status'].textContent,/aangemeld/)});
test('failed restored verification does not display signed-in state',async()=>{const a=fake();a.verifiedUser=async()=>{throw Error('sensitive')};const e=await screen(a);assert.equal(e.signout.hidden,true);assert.doesNotMatch(e['account-status'].textContent,/sensitive/);assert.equal(e['account-submit'].disabled,false)});
test('service failures do not leak errors and credentials clear',async()=>{const a=fake();a.signIn=async()=>{throw Error('secret')};const e=await screen(a);e['account-password'].value='abcdefgh';await e['account-form'].fire('submit');assert.doesNotMatch(e['account-status'].textContent,/secret/);assert.equal(e['account-password'].value,'');assert.equal(e['account-submit'].disabled,false)});
test('unverified user does not become signed in',async()=>{const a=fake();a.verifiedUser=async()=>null;const e=await screen(a);await e['account-form'].fire('submit');assert.equal(e.signout.hidden,true);assert.match(e['account-status'].textContent,/nie geverifieer/)});
