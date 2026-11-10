import {test, beforeEach} from 'node:test';
import assert from 'node:assert/strict';
class Element {
  constructor() { this.listeners = {}; this.value = ''; this.textContent = ''; this.hidden = false; this.required = false; this.attrs = {}; this.validity = {valid:true}; }
  addEventListener(event, fn) { this.listeners[event] = fn; }
  fire(event) { let prevented = false; this.listeners[event]({preventDefault(){ prevented = true; }}); return prevented; }
  setAttribute(name, value) { this.attrs[name] = value; }
  focus() { this.focused = true; }
}
let e; let serial=0;
beforeEach(() => {
  const ids = ['account-form','account-email','account-password','account-confirm','account-status','show-signin','show-signup','account-heading','account-intro','confirm-wrap','account-submit'];
  e = Object.fromEntries(ids.map(x => [x, new Element()]));
  e['account-form'].reset = () => { for (const id of ['account-email','account-password','account-confirm']) e[id].value = ''; };
  globalThis.document = {getElementById:id=>e[id]};
});
async function start(){await import(`./account.js?test=${serial++}`);}
test('signup switches accessibly and clears existing fields',async()=>{
  await start(); e['account-password'].value='test'; e['show-signup'].fire('click');
  assert.equal(e['account-password'].value,''); assert.equal(e['confirm-wrap'].hidden,false);
  assert.equal(e['account-confirm'].required,true); assert.equal(e['show-signup'].attrs['aria-pressed'],'true');
  e['show-signin'].fire('click'); assert.equal(e['confirm-wrap'].hidden,true); assert.equal(e['account-confirm'].required,false);
});
test('signup mismatch blocks, clears confirmation and gives accessible feedback',async()=>{
  await start(); e['show-signup'].fire('click'); e['account-email'].value='test@example.test'; e['account-password'].value='abcdefgh'; e['account-confirm'].value='different';
  assert.equal(e['account-form'].fire('submit'),true); assert.match(e['account-status'].textContent,/stem nie ooreen/); assert.equal(e['account-confirm'].value,''); assert.equal(e['account-confirm'].focused,true);
});
test('signup and signin explicitly remain a preview and clear credentials',async()=>{
  await start(); e['show-signup'].fire('click'); e['account-email'].value='test@example.test'; e['account-password'].value=e['account-confirm'].value='abcdefgh'; e['account-form'].fire('submit');
  assert.match(e['account-status'].textContent,/Geen rekening is geskep/); assert.equal(e['account-password'].value,''); assert.equal(e['account-email'].value,'');
  e['show-signin'].fire('click'); e['account-email'].value='test@example.test'; e['account-password'].value='abcdefgh'; e['account-form'].fire('submit');
  assert.match(e['account-status'].textContent,/nie aangemeld nie/); assert.equal(e['account-password'].value,'');
});
test('invalid inputs rejected',async()=>{
  await start(); e['account-email'].validity.valid=false; e['account-form'].fire('submit'); assert.match(e['account-status'].textContent,/geldige toets-e-posadres/);
});
