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
test('registration remains disabled even when the click handler is invoked',async()=>{const a=fake();let calls=0;a.signUp=async()=>{calls++;return {ok:true}};const e=await screen(a);assert.equal(e['show-signup'].disabled,true);await e['show-signup'].fire('click');assert.equal(e['account-heading'].textContent,'Welkom terug');e['account-email'].value='a@example.test';e['account-password'].value='abcdefgh';await e['account-form'].fire('submit');assert.equal(calls,0);assert.equal(e.signout.hidden,false)});
test('verified sign in and local sign out',async()=>{const e=await screen(fake());e['account-email'].value='a@example.test';e['account-password'].value='abcdefgh';assert.equal(await e['account-form'].fire('submit'),true);assert.equal(e.signout.hidden,false);assert.match(e['account-status'].textContent,/aangemeld/);await e.signout.fire('click');assert.equal(e.signout.hidden,true);assert.match(e['account-status'].textContent,/afgemeld/)});
test('verified restored session displays signed-in state',async()=>{const e=await screen(fake(true));assert.equal(e.signout.hidden,false);assert.match(e['account-status'].textContent,/aangemeld/)});
test('restoring a session clears autofilled credentials before hiding the form',async()=>{
 let resolve; const a=fake(); a.verifiedUser=()=>new Promise(r=>resolve=r);
 const ids=['account-form','account-email','account-password','account-confirm','account-status','account-submit','signout','show-signin','show-signup','account-heading','account-intro','confirm-wrap'];
 const e=Object.fromEntries(ids.map(i=>[i,new El()])); e['account-form'].reset=()=>{};
 const ready=bindAccountScreen({getElementById:id=>e[id]},a);
 e['account-email'].value='person@example.test'; e['account-password'].value='autofilled-password'; e['account-confirm'].value='autofilled-password';
 resolve({id:'1'}); await ready;
 assert.equal(e['account-form'].hidden,true);
 for (const id of ['account-email','account-password','account-confirm']) assert.equal(e[id].value,'');
});
test('failed restored verification does not display signed-in state',async()=>{const a=fake();a.verifiedUser=async()=>{throw Error('sensitive')};const e=await screen(a);assert.equal(e.signout.hidden,true);assert.doesNotMatch(e['account-status'].textContent,/sensitive/);assert.equal(e['account-submit'].disabled,false)});
test('service failures do not leak errors and credentials clear',async()=>{const a=fake();a.signIn=async()=>{throw Error('secret')};const e=await screen(a);e['account-password'].value='abcdefgh';await e['account-form'].fire('submit');assert.doesNotMatch(e['account-status'].textContent,/secret/);assert.equal(e['account-password'].value,'');assert.equal(e['account-submit'].disabled,false)});
test('unverified user does not become signed in',async()=>{const a=fake();a.verifiedUser=async()=>null;const e=await screen(a);await e['account-form'].fire('submit');assert.equal(e.signout.hidden,true);assert.match(e['account-status'].textContent,/nie geverifieer/)});
test('verified session hides credentials, blocks repeat submissions and restores form on sign out',async()=>{
 const a=fake(true); let calls=0; a.signIn=async()=>{calls++;return {ok:true}};
 const e=await screen(a);
 assert.equal(e['account-form'].hidden,true); assert.equal(e['account-submit'].disabled,true);
 assert.equal(e['show-signup'].disabled,true); assert.equal(e.signout.hidden,false);
 await e['show-signup'].fire('click'); await e['account-form'].fire('submit');
 assert.equal(calls,0); assert.equal(e['account-heading'].textContent,'Jy is aangemeld');
 await e.signout.fire('click');
 assert.equal(e['account-form'].hidden,false); assert.equal(e['account-submit'].disabled,false);
 assert.equal(e['show-signup'].disabled,true); assert.equal(e.signout.hidden,true);
 assert.equal(e['account-heading'].textContent,'Welkom terug');
});
test('failed signout keeps the verified session state and allows retry',async()=>{
 const a=fake(true); a.signOut=async()=>({ok:false}); const e=await screen(a);
 await e.signout.fire('click'); assert.equal(e['account-form'].hidden,true);
 assert.equal(e.signout.hidden,false); assert.equal(e.signout.disabled,false);
 assert.match(e['account-status'].textContent,/nie bevestig/);
});
test('controls stay disabled while restoring and duplicate submits are blocked while pending',async()=>{
 let resolve; const a=fake(); a.verifiedUser=()=>new Promise(r=>resolve=r);
 const ids=['account-form','account-email','account-password','account-confirm','account-status','account-submit','signout','show-signin','show-signup','account-heading','account-intro','confirm-wrap'];
 const e=Object.fromEntries(ids.map(i=>[i,new El()])); e['account-form'].reset=()=>{};
 const ready=bindAccountScreen({getElementById:id=>e[id]},a);
 assert.equal(e['account-submit'].disabled,true); assert.equal(e['show-signup'].disabled,true);
 await e['show-signup'].fire('click'); assert.equal(e['confirm-wrap'].hidden,false);
 resolve(null); await ready; assert.equal(e['show-signup'].disabled,true);
 let finish; let calls=0; a.signIn=()=>{calls++;return new Promise(r=>finish=r)};
 const first=e['account-form'].fire('submit'); await e['account-form'].fire('submit');
 assert.equal(calls,1); assert.equal(e['account-submit'].disabled,true);
 finish({ok:false}); await first; assert.equal(e['account-submit'].disabled,false);
});
