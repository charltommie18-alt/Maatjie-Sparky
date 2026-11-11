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
function fake(restored=false){let signedIn=restored;return {signIn:async()=>{signedIn=true;return {ok:true}},verifiedUser:async()=>signedIn?{id:'1'}:null,signOut:async()=>{signedIn=false;return {ok:true}}};}
test('missing config fails closed and explains no real login is available',async()=>{const e=await screen(null);assert.equal(e['account-submit'].disabled,true);assert.equal(e['show-signup'].disabled,true);assert.match(e['account-status'].textContent,/Geen werklike aanmelding/)});
test('signup is disabled and never invokes a supplied signup capability',async()=>{const a=fake();let calls=0;a.signUp=async()=>{calls++;throw Error('must not be called')};const e=await screen(a);assert.equal(e['show-signup'].disabled,true);await e['show-signup'].fire('click');assert.match(e['account-status'].textContent,/registrasie is gedeaktiveer/i);e['account-email'].value='a@example.test';e['account-password'].value='abcdefgh';await e['account-form'].fire('submit');assert.equal(calls,0);assert.equal(e.signout.hidden,false)});
test('existing verified user can sign in and locally sign out',async()=>{const e=await screen(fake());e['account-email'].value='a@example.test';e['account-password'].value='abcdefgh';assert.equal(await e['account-form'].fire('submit'),true);assert.equal(e.signout.hidden,false);assert.match(e['account-status'].textContent,/aangemeld/);await e.signout.fire('click');assert.equal(e.signout.hidden,true);assert.match(e['account-status'].textContent,/afgemeld/)});
test('unverified user does not become signed in',async()=>{const a=fake();a.verifiedUser=async()=>null;const e=await screen(a);await e['account-form'].fire('submit');assert.equal(e.signout.hidden,true);assert.match(e['account-status'].textContent,/nie geverifieer/)});
test('controls stay disabled while restoring and duplicate signins are blocked while pending',async()=>{let resolve; const a=fake(); a.verifiedUser=()=>new Promise(r=>resolve=r);const ids=['account-form','account-email','account-password','account-confirm','account-status','account-submit','signout','show-signin','show-signup','account-heading','account-intro','confirm-wrap'];const e=Object.fromEntries(ids.map(i=>[i,new El()]));e['account-form'].reset=()=>{};const ready=bindAccountScreen({getElementById:id=>e[id]},a);assert.equal(e['account-submit'].disabled,true);assert.equal(e['show-signup'].disabled,true);resolve(null);await ready;assert.equal(e['show-signup'].disabled,true);let finish,calls=0;a.signIn=()=>{calls++;return new Promise(r=>finish=r)};const first=e['account-form'].fire('submit');await e['account-form'].fire('submit');assert.equal(calls,1);finish({ok:false});await first;});
