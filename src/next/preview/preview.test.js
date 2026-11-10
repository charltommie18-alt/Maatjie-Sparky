import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

class Element {
  constructor(id) { this.id=id; this.listeners={}; this.children=[]; this.textContent=''; this.value=''; this.disabled=false; }
  addEventListener(name, fn) { this.listeners[name]=fn; }
  async fire(name) { return this.listeners[name]({preventDefault(){}}); }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children=nodes; }
  querySelectorAll() { return []; }
  click() { this.clicked=true; }
}
let elements, data, confirmDelete;
beforeEach(() => {
  elements=Object.fromEntries(['status','form','messages','toggle-save','save-state','clear','export','message','send','shared-message','prepare-reply'].map(x=>[x,new Element(x)]));
  data=new Map(); confirmDelete=true;
  globalThis.window={ localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}, confirm:()=>confirmDelete };
  globalThis.document={getElementById:id=>elements[id],createElement:()=>new Element(),createTextNode:text=>({textContent:text}),querySelectorAll:()=>[]};
  globalThis.URL.createObjectURL=()=> 'blob:fake'; globalThis.URL.revokeObjectURL=()=>{};
});
let version=0;
async function start(){ await import(`./preview.js?test=${version++}`); }
test('preview sends a clearly labelled mock response without storing by default',async()=>{
 await start(); elements.message.value='<img src=x onerror=alert(1)>'; await elements.form.fire('submit');
 assert.equal(data.size,0); assert.equal(elements.messages.children.length,2);
 assert.equal(elements.messages.children[0].children[1].textContent,'<img src=x onerror=alert(1)>');
 assert.match(elements.messages.children[1].children[1].textContent,/toetsantwoord/i);
});
test('opt-in saves, opt-out keeps old history, cancel and confirm deletion',async()=>{
 await start(); await elements['toggle-save'].fire('click'); elements.message.value='Hallo'; await elements.form.fire('submit');
 assert.equal(data.size,1); assert.equal(JSON.parse([...data.values()][0]).messages.length,2);
 await elements['toggle-save'].fire('click'); assert.equal(data.size,1);
 confirmDelete=false; await elements.clear.fire('click'); assert.equal(data.size,1);
 confirmDelete=true; await elements.clear.fire('click'); assert.equal(data.size,0); assert.equal(elements.messages.children.length,0);
});
test('restore only occurs after consent',async()=>{
 await start(); await elements['toggle-save'].fire('click'); elements.message.value='Hallo'; await elements.form.fire('submit');
 await start(); assert.equal(elements.messages.children.length,0);
 await elements['toggle-save'].fire('click'); assert.equal(elements.messages.children.length,2);
});
test('reply preparation requires input and never sends automatically',async()=>{
 await start(); await elements['prepare-reply'].fire('click');
 assert.match(elements.status.textContent,/Plak eers/); assert.equal(elements.messages.children.length,0);
 elements['shared-message'].value='  Hello there  '; await elements['prepare-reply'].fire('click');
 assert.match(elements.message.value,/Hello there/); assert.equal(elements.messages.children.length,0);
 assert.equal(data.size,0); assert.match(elements.status.textContent,/Niks is gestuur nie/);
});
test('existing chat text is retained if replacement is not confirmed',async()=>{
 await start(); elements.message.value='Keep this'; elements['shared-message'].value='New message'; confirmDelete=false;
 await elements['prepare-reply'].fire('click'); assert.equal(elements.message.value,'Keep this');
 confirmDelete=true; await elements['prepare-reply'].fire('click'); assert.match(elements.message.value,/New message/);
 assert.equal(elements.messages.children.length,0);
});
