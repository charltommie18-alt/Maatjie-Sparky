import { createMemoryHistoryDemo } from './history-memory-demo.js';
const demo = createMemoryHistoryDemo();
const $ = id => document.getElementById(id);
const list = $('list'), messages = $('messages'), status = $('status'), selectedTitle = $('selected-title');
const sample = $('sample'), remove = $('remove');
let selected = null, busy = false;
function setBusy(value) { busy = value; sample.disabled = value; remove.disabled = value || !selected; }
async function render() {
  const conversations = await demo.list();
  list.replaceChildren();
  for (const conversation of conversations) {
    const li = document.createElement('li'), button = document.createElement('button');
    button.type = 'button'; button.textContent = conversation.title;
    button.setAttribute('aria-pressed', String(conversation.id === selected));
    button.disabled = busy;
    button.addEventListener('click', () => run(async () => { selected = conversation.id; }));
    li.append(button); list.append(li);
  }
  const chosen = conversations.find(item => item.id === selected);
  if (!chosen) selected = null;
  selectedTitle.textContent = chosen ? chosen.title : 'Kies ’n voorbeeldgesprek';
  messages.replaceChildren();
  if (chosen) for (const message of await demo.messages(chosen.id)) {
    const li = document.createElement('li'); li.textContent = message.body; messages.append(li);
  }
  remove.disabled = busy || !chosen;
}
async function run(action) {
  if (busy) return;
  setBusy(true);
  try { await action(); await render(); }
  catch { status.textContent = 'Die voorbeeld kon nie voltooi word nie. Herlaai die bladsy om oor te begin.'; }
  finally { setBusy(false); await render(); }
}
sample.addEventListener('click', () => run(async () => {
  const conversation = await demo.create('Voorbeeldgesprek');
  await demo.addUserMessage(conversation.id, 'Hierdie is ’n voorafbepaalde toetsboodskap.');
  selected = conversation.id;
  status.textContent = 'Voorbeeld bygevoeg. Geen werklike gesprek is gestoor nie.';
}));
remove.addEventListener('click', () => {
  if (!selected || busy || !window.confirm('Vee hierdie voorbeeldgesprek uit?')) return;
  run(async () => { await demo.remove(selected); selected = null; status.textContent = 'Voorbeeld uitgevee.'; });
});
