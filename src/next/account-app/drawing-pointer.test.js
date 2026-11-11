import { test } from 'node:test';
import assert from 'node:assert/strict';

test('drawing safely handles unavailable capture, invalid coordinates and clear during a stroke', async () => {
  class Element {
    constructor(){this.listeners={};this.disabled=false;this.value='';}
    addEventListener(n,fn){this.listeners[n]=fn} setAttribute(){} append(){} focus(){}
  }
  const ids=['board','game-status','game-reset','drawing','draw-status','drawing-undo','drawing-clear','drawing-save','colour','width'];
  const e=Object.fromEntries(ids.map(id=>[id,new Element()]));
  e.colour.value='#123456'; e.width.value='4';
  const c=e.drawing; c.width=900;c.height=600;
  let captureFails=true, releases=[], strokes=0, clears=0, rectWidth=300;
  c.getBoundingClientRect=()=>({left:0,top:0,width:rectWidth,height:200});
  c.setPointerCapture=()=>{if(captureFails)throw Error('private detail')};
  c.releasePointerCapture=id=>releases.push(id);
  c.getContext=()=>({getImageData:()=>({}),beginPath(){},moveTo(){},lineTo(){},stroke(){strokes++},closePath(){},clearRect(){clears++}});
  const oldWindow=globalThis.window,oldDocument=globalThis.document;
  const handlers=new Set();
  globalThis.window={addEventListener(n,f){handlers.add(f)},removeEventListener(n,f){handlers.delete(f)},confirm(){return true}};
  globalThis.document={getElementById:id=>e[id],createElement:()=>new Element()};
  try {
    await import('./tools-prototype.js?pointer-test');
    const event={button:0,pointerId:7,clientX:10,clientY:10,preventDefault(){}};
    c.listeners.pointerdown(event);
    assert.equal(strokes,0);assert.equal(handlers.size,0);assert.match(e['draw-status'].textContent,/Kon nie begin/);
    captureFails=false;rectWidth=0;c.listeners.pointerdown(event);assert.equal(strokes,0);
    rectWidth=300;c.listeners.pointerdown(event);assert.equal(strokes,1);assert.equal(handlers.size,1);
    c.listeners.pointermove({...event,clientX:NaN});assert.equal(strokes,1);
    e['drawing-clear'].listeners.click();assert.deepEqual(releases,[7]);assert.equal(clears,1);assert.equal(handlers.size,0);
    c.listeners.lostpointercapture({pointerId:7});assert.equal(e['drawing-undo'].disabled,true);
    c.listeners.pointerdown(event); c.listeners.pointerup({pointerId:7}); assert.equal(e['drawing-undo'].disabled,false);
  } finally {globalThis.window=oldWindow;globalThis.document=oldDocument;}
});
