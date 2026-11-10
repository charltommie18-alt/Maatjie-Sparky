import { createChatSession } from "../chatSession.js";
// Development-only stub: no message is sent over the network.
const mockReply = async () => ({ role: "assistant", text: "Hierdie is ’n toetsantwoord. Die regte AI-klets is nog nie gekoppel nie.", createdAt: new Date().toISOString() });
const el = id => document.getElementById(id);
const status = el("status");
let session;
try { session = createChatSession(window.localStorage, mockReply); }
catch { status.textContent = "Plaaslike berging is nie beskikbaar nie. Maak die voorskou in ’n gewone blaaiervenster oop."; el("form").querySelectorAll("textarea,button").forEach(x => x.disabled = true); document.querySelectorAll(".actions button").forEach(x => x.disabled = true); el("prepare-reply").disabled = true; }
function show() {
 const list=el("messages"); list.replaceChildren();
 for (const m of session.getMessages()) { const item=document.createElement("li"); item.className=m.role; const label=document.createElement("strong"); label.textContent=m.role==="user"?"Jy: ":"Toetsantwoord: "; item.append(label,document.createTextNode(m.text)); list.append(item); }
 const saving=session.isSaving(); el("toggle-save").textContent=saving?"Skakel plaaslike stoor af":"Skakel plaaslike stoor aan en herstel"; el("save-state").textContent=saving?"Plaaslike stoor is aan op hierdie toestel.":"Stoor is af. Enige geskiedenis wat reeds gestoor is, bly totdat jy dit uitvee.";
}
function message(text) { status.textContent=text; }
if (session) {
 show();
 el("toggle-save").addEventListener("click",()=>{try{if(session.isSaving()){session.disableSaving();message("Stoor is af. Geskiedenis wat reeds gestoor is, is nie uitgevee nie.");}else{session.enableSaving();message("Plaaslike stoor is aan. Vorige plaaslike geskiedenis is herstel indien beskikbaar.");}show();}catch{message("Kon nie stoor aanskakel nie. As daar reeds geskiedenis én ’n nuwe gesprek is, voer die huidige gesprek eers uit en vee dit uit voordat jy weer probeer.");}});
 el("clear").addEventListener("click",()=>{if(!window.confirm("Vee die huidige gesprek en gestoor­de plaaslike geskiedenis uit? Dit kan nie ongedaan gemaak word nie."))return;try{session.clear();show();message("Die huidige gesprek en plaaslike geskiedenis is uitgevee.");}catch{message("Kon nie die plaaslike geskiedenis uitvee nie. Niks is as uitgevee bevestig nie.");}});
 el("export").addEventListener("click",()=>{try{const url=URL.createObjectURL(new Blob([session.exportJson()],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="slim-maat-gesprek.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message("Uitvoer is begin. Die lêer is nie geïnkripteer nie.");}catch{message("Kon nie die gesprek uitvoer nie.");}});
 el("prepare-reply").addEventListener("click",()=>{const shared=el("shared-message").value.trim();if(!shared){message("Plak eers die boodskap waarmee jy hulp wil hê.");return;}const input=el("message");if(input.value.trim()&&!window.confirm("Vervang die teks wat reeds in die kletsblokkie staan?"))return;input.value=`Help my om ’n antwoord op hierdie boodskap op te stel:\n\n${shared}`;message("Die versoek is in die kletsblokkie. Niks is gestuur nie.");});
 el("form").addEventListener("submit",async event=>{event.preventDefault();const input=el("message");const text=input.value;if(!text.trim())return;el("send").disabled=true;try{await session.send(text);input.value="";show();message("Toetsantwoord ontvang.");}catch{show();message("Die boodskap of geskiedenis kon nie verwerk word nie. Gaan plaaslike berging na.");}finally{el("send").disabled=false;}});
}
