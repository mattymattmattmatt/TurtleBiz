import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('The chat adapter reads the original collection and only appends the original message schema', async () => {
  const calls=[];
  globalThis.__chatAdapterCalls=calls;
  const sdk=`
    export function initializeApp(config){globalThis.__chatAdapterCalls.push(['app',config]);return config;}
    export function getFirestore(app){return {projectId:app.projectId};}
    export function collection(db,path){globalThis.__chatAdapterCalls.push(['collection',db,path]);return {db,path};}
    export function serverTimestamp(){return {type:'server-timestamp'};}
    export function onSnapshot(ref,options,next,error){
      globalThis.__chatAdapterCalls.push(['listen',ref,options]);
      next({metadata:{fromCache:false},docs:[{id:'original',data:()=>({text:'Original chat'}),metadata:{hasPendingWrites:false}}]});
      return ()=>globalThis.__chatAdapterCalls.push(['unsubscribe']);
    }
    export async function addDoc(ref,data){globalThis.__chatAdapterCalls.push(['append',ref,data]);return {id:'new'};}
  `;
  const url='data:text/javascript;base64,'+Buffer.from(sdk).toString('base64');
  const source=(await readFile('scripts/firebase.js','utf8')).replace(/https:\/\/www\.gstatic\.com\/firebasejs\/[^']+/g,url);
  const adapter=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  let snapshot;
  const stop=adapter.subscribeToChats(value=>snapshot=value,()=>assert.fail('Unexpected listener error'));
  assert.equal(calls[0][1].projectId,'turtle-biz');
  assert.equal(calls.find(call=>call[0]==='collection')[2],'chats');
  assert.equal(snapshot.messages[0].id,'original');
  assert.equal(snapshot.messages[0].text,'Original chat');
  assert.equal(snapshot.messages[0].timestamp,undefined,'Undated legacy messages must not be excluded.');
  await assert.rejects(adapter.postChat('   '));
  await assert.rejects(adapter.postChat('a'.repeat(151)));
  assert.equal(calls.filter(call=>call[0]==='append').length,0);
  await adapter.postChat('  Shell-o!  ');
  assert.deepEqual(calls.find(call=>call[0]==='append')[2],{text:'Shell-o!',timestamp:{type:'server-timestamp'}});
  stop();
  assert.equal(calls.at(-1)[0],'unsubscribe');
  delete globalThis.__chatAdapterCalls;
});
