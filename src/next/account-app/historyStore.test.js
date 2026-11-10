import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createConversationStore } from './historyStore.js';
const id = 'a1e3b581-2bc7-4084-a902-b8a1e1839359';
function fake(data = [], error = null) {
  const calls=[];
  const client={from(table){calls.push(['from',table]); const b={};
    for(const method of ['select','order','limit','insert','delete','eq','single']) b[method]=(...args)=>{calls.push([method,...args]); return b};
    b.then=(resolve,reject)=>Promise.resolve({data,error}).then(resolve,reject);
    return b;
  }};
  return {client,calls};
}
test('requires a client and validates input before requests', async()=>{
  assert.throws(()=>createConversationStore(null));
  const f=fake(), store=createConversationStore(f.client);
  await assert.rejects(store.create('  '), TypeError);
  await assert.rejects(store.create('x'.repeat(121)), TypeError);
  await assert.rejects(store.addUserMessage(id, 'x'.repeat(4001)), TypeError);
  await assert.rejects(store.messages('invalid'), TypeError);
  await assert.rejects(store.remove('invalid'), TypeError);
  assert.equal(f.calls.length,0);
});
test('creation only accepts a title and message writes only the user role',async()=>{
  const f=fake({id}); const s=createConversationStore(f.client);
  await s.create('  Hallo  '); await s.addUserMessage(id, ' hi ');
  assert.deepEqual(f.calls.filter(x=>x[0]==='insert').map(x=>x[1]),[{title:'Hallo'},{conversation_id:id,role:'user',body:'hi'}]);
});
test('list and messages request bounded ordered fields',async()=>{
  const f=fake([]), s=createConversationStore(f.client); await s.list(); await s.messages(id);
  assert.ok(f.calls.some(x=>x[0]==='limit'&&x[1]===100));
  assert.ok(f.calls.some(x=>x[0]==='limit'&&x[1]===500));
  assert.ok(f.calls.some(x=>x[0]==='eq'&&x[1]==='conversation_id'&&x[2]===id));
});
test('deletion must return one visible row',async()=>{
  const good=fake([{id}]); await createConversationStore(good.client).remove(id);
  for(const rows of [[],null,[{id},{id}]]) await assert.rejects(createConversationStore(fake(rows).client).remove(id),/could not be deleted/);
});
test('database errors and thrown errors do not expose details',async()=>{
  await assert.rejects(createConversationStore(fake(null,{message:'sensitive'}).client).list(), e=>e.message==='Conversation storage unavailable');
  await assert.rejects(createConversationStore({from(){throw Error('sensitive')}}).list(), e=>e.message==='Conversation storage unavailable');
});
