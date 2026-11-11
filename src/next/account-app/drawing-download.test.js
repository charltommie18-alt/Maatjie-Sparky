import { test } from 'node:test';
import assert from 'node:assert/strict';
import { downloadDrawing } from './drawing-download.js';

test('download starts a PNG and later releases its temporary URL', () => {
  let callback, link = { click(){ this.clicked = true; } }, scheduled, message;
  const revoked = [], blob = {};
  downloadDrawing({toBlob(cb, type){callback=cb; assert.equal(type,'image/png');}}, () => link,
    {createObjectURL(value){assert.equal(value,blob); return 'blob:local';}, revokeObjectURL(value){revoked.push(value);}},
    (fn, ms) => {assert.equal(ms,10000); scheduled=fn;}, value => {message=value;});
  callback(blob);
  assert.equal(link.download,'slim-maat-tekening.png'); assert.equal(link.href,'blob:local'); assert.equal(link.clicked,true);
  assert.match(message,/begin/); assert.deepEqual(revoked,[]); scheduled(); assert.deepEqual(revoked,['blob:local']);
});

test('download errors including asynchronous callback failures are reported without leaking detail', () => {
  for (const stage of ['blob-throw','null','url','link','click','schedule']) {
    let callback, message; const revoked=[];
    const canvas = {toBlob(cb){if(stage==='blob-throw') throw Error('secret'); callback=cb;}};
    const urls = {createObjectURL(){if(stage==='url') throw Error('secret'); return 'blob:local';}, revokeObjectURL(u){revoked.push(u);}};
    downloadDrawing(canvas, () => {if(stage==='link') throw Error('secret'); return {click(){if(stage==='click') throw Error('secret');}};}, urls,
      () => {if(stage==='schedule') throw Error('secret');}, value => {message=value;});
    if (callback) callback(stage==='null' ? null : {});
    assert.equal(message,'Kon nie die prent aflaai nie.');
    assert.equal(revoked.length, ['link','click','schedule'].includes(stage) ? 1 : 0);
  }
});
