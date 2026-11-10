import { test } from "node:test";
import assert from "node:assert/strict";
import { createChatService } from "./chatService.js";
import { createGeminiProvider } from "./geminiProvider.js";
const good=[{role:"user",text:" Hallo ",privateField:"not for provider"}];
test("configuration fails closed and provider never executes without authorization",async()=>{
 assert.throws(()=>createChatService({generate:()=>{}}));
 let calls=0; let service=createChatService({authorize:()=>false,generate:()=>{calls++}});
 assert.deepEqual(await service({messages:good}),{status:403,error:"Access denied"}); assert.equal(calls,0);
 service=createChatService({authorize:()=>{throw Error("private details")},generate:()=>{calls++}});
 assert.deepEqual(await service({messages:good}),{status:403,error:"Access denied"}); assert.equal(calls,0);
});
test("validates input and strips extra data",async()=>{
 let got; const service=createChatService({authorize:()=>true,generate:async input=>(got=input," Hello ")});
 assert.deepEqual(await service({messages:good}),{status:200,reply:"Hello"});
 assert.deepEqual(got.messages,[{role:"user",text:"Hallo"}]);
 for(const messages of [[],null,[{role:"assistant",text:"x"}],[{role:"system",text:"x"}],[{role:"user",text:"x".repeat(4001)}],Array(21).fill(good[0])]) assert.equal((await service({messages})).status,400);
});
test("provider failures return safe error",async()=>{
 for(const reply of ["",undefined,"a".repeat(4001)]) { let service=createChatService({authorize:()=>true,generate:async()=>reply}); assert.deepEqual(await service({messages:good}),{status:503,error:"Chat service unavailable"}); }
 const service=createChatService({authorize:()=>true,generate:async()=>{throw Error("private provider detail")}});
 assert.deepEqual(await service({messages:good}),{status:503,error:"Chat service unavailable"});
});
test("provider maps roles using server configured model",async()=>{
 let captured; const generate=createGeminiProvider({model:"configured-model",ai:{models:{generateContent:async x=>(captured=x,{text:"Welkom"})}}});
 const service=createChatService({authorize:()=>true,generate});
 const result=await service({messages:[{role:"user",text:"a"},{role:"assistant",text:"b"},{role:"user",text:"c"}]});
 assert.equal(result.reply,"Welkom"); assert.equal(captured.model,"configured-model"); assert.deepEqual(captured.contents.map(x=>x.role),["user","model","user"]);
});
