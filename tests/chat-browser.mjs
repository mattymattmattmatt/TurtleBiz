import assert from 'node:assert/strict';
import AxeBuilder from '@axe-core/playwright';

// Intercept only the adapter. The real UI runs, but tests never post to the pond.
export async function installChatMock(context) {
  await context.route('**/scripts/firebase.js',route=>route.fulfill({contentType:'application/javascript',body:`
    const state=window.__chatMock={
      messages:[{id:'undated',text:'A message from the original pond.'},
        {id:'markup',text:'<img src=x onerror="window.chatInjected=true">',timestamp:1},
        ...Array.from({length:44},(_,i)=>({id:'history-'+i,text:'History message '+i,timestamp:1700000000000+i*60000}))],
      posts:[],listeners:new Set(),reject:false,hold:false
    };
    state.emit=(fromCache=false)=>{for(const listener of state.listeners)listener.next({messages:state.messages.map(m=>({...m})),fromCache});};
    state.fail=()=>{for(const listener of [...state.listeners])listener.error(new Error('Test connection error'));};
    export function subscribeToChats(next,error){
      const listener={next,error};state.listeners.add(listener);
      queueMicrotask(()=>{if(state.listeners.has(listener))state.emit();});
      return ()=>state.listeners.delete(listener);
    }
    export async function postChat(text){
      state.posts.push(text);
      if(state.reject)throw new Error('Test rejected write');
      if(state.hold)await new Promise(resolve=>state.resolve=resolve);
      const message={id:'new-'+state.posts.length,text,timestamp:Date.now()};
      state.messages.push(message);state.emit();return {id:message.id};
    }
  `}));
}

export async function testChat(page,base) {
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(base+'index.html');
  await page.waitForSelector('html.js');
  assert.equal(await page.evaluate(()=>!!window.__chatMock),false,'SDK should load near the chat, not in the hero.');
  await page.locator('.chat-panel').scrollIntoViewIfNeeded();
  await page.waitForSelector('#chat-connection[data-state="live"]');
  assert.equal(await page.locator('.chat-message').count(),40);
  await page.locator('#chat-older').click();
  assert.equal(await page.locator('.chat-message').count(),46);
  assert.equal(await page.locator('[data-message-id="undated"] time').textContent(),'Earlier chat');
  assert.equal(await page.locator('[data-message-id="markup"] p').textContent(),'<img src=x onerror="window.chatInjected=true">');
  assert.equal(await page.locator('#chat-container img').count(),0);
  assert.equal(await page.evaluate(()=>!!window.chatInjected),false);
  const baseline=await page.evaluate(()=>JSON.stringify(window.__chatMock.messages));
  await page.locator('#chat-input').fill('My unsent thought');
  await page.reload();await page.locator('.chat-panel').scrollIntoViewIfNeeded();
  await page.waitForSelector('#chat-connection[data-state="live"]');
  assert.equal(await page.locator('#chat-input').inputValue(),'My unsent thought');
  await page.evaluate(()=>window.__chatMock.reject=true);
  await page.locator('#chat-send').click();
  await page.waitForFunction(()=>document.querySelector('#chat-feedback').textContent.includes('wasn’t sent'));
  assert.equal(await page.locator('#chat-input').inputValue(),'My unsent thought');
  assert.equal(await page.locator('#chat-send').isEnabled(),true);
  await page.evaluate(()=>{window.__chatMock.reject=false;window.__chatMock.hold=true;});
  await page.locator('#chat-input').fill('  Shell-o from the test pond!  ');
  await page.evaluate(()=>{document.querySelector('#chat-form').requestSubmit();document.querySelector('#chat-form').requestSubmit();});
  assert.equal(await page.evaluate(()=>window.__chatMock.posts.length),2,'Only one pending submission, plus the earlier rejected attempt.');
  assert.equal(await page.locator('#chat-send').isDisabled(),true);
  assert.equal(await page.locator('#chat-input').getAttribute('readonly'),'');
  await page.evaluate(()=>window.__chatMock.resolve());
  await page.waitForFunction(()=>document.querySelector('#chat-input').value==='');
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__chatMock.messages.slice(0,46))),baseline,'Sending does not rewrite history.');
  assert.equal(await page.evaluate(()=>window.__chatMock.posts.at(-1)),'Shell-o from the test pond!');

  await page.locator('#chat-older').click();
  await page.locator('#chat-scroll').evaluate(el=>el.scrollTop=90);
  const position=await page.locator('#chat-scroll').evaluate(el=>el.scrollTop);
  await page.evaluate(()=>{window.__chatMock.messages.push({id:'incoming',text:'A new arrival',timestamp:Date.now()+1000});window.__chatMock.emit();});
  assert.ok(Math.abs(await page.locator('#chat-scroll').evaluate(el=>el.scrollTop)-position)<2,'New messages preserve the reader’s position.');
  assert.equal(await page.locator('#chat-latest').isVisible(),true);
  await page.locator('#chat-latest').click();
  assert.equal(await page.locator('#chat-latest').isVisible(),false);
  await page.locator('#chat-input').fill('Keep this draft');
  await page.evaluate(()=>window.__chatMock.emit(true));
  assert.equal(await page.locator('#chat-send').isDisabled(),true);
  await page.evaluate(()=>window.__chatMock.fail());
  assert.equal(await page.locator('#chat-input').inputValue(),'Keep this draft');
  assert.equal(await page.locator('#chat-retry').isVisible(),true);
  await page.locator('#chat-retry').click();
  await page.waitForSelector('#chat-connection[data-state="live"]');
  assert.equal(await page.evaluate(()=>window.__chatMock.listeners.size),1);
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.waitForFunction(()=>window.__chatMock.listeners.size===0);
  await page.locator('.chat-panel').scrollIntoViewIfNeeded();
  await page.waitForSelector('#chat-connection[data-state="live"]');
  assert.equal(await page.evaluate(()=>window.__chatMock.listeners.size),1);

  await page.locator('#chat-input').fill('');
  for(const width of [1440,768,641,390,320]) {
    await page.setViewportSize({width,height:1000});
    await page.locator('.chat-panel').scrollIntoViewIfNeeded();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1?[]:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.right>innerWidth+1;}).map(el=>({tag:el.tagName,cls:el.getAttribute('class'),right:Math.round(el.getBoundingClientRect().right),width:Math.round(el.getBoundingClientRect().width)})).slice(0,25));
    await page.locator('#turtle-chats').screenshot({path:'artifacts/chat-'+width+'.png'});
    assert.deepEqual(overflow,[],'Chat fits '+width+': '+JSON.stringify(overflow));
    const result=await new AxeBuilder({page}).include('#turtle-chats').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    assert.deepEqual(result.violations.filter(v=>v.impact==='critical'||v.impact==='serious').map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],'Chat accessibility at '+width);
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('#turtle-chats').screenshot({path:'artifacts/chat-desktop.png'});
  await page.setViewportSize({width:390,height:1000});
  await page.locator('#turtle-chats').screenshot({path:'artifacts/chat-mobile.png'});
}

export async function testLiveChat(browser,base) {
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  try {
    // Public read, then compare every existing record against the rendered UI.
    const response=await context.request.get('https://firestore.googleapis.com/v1/projects/turtle-biz/databases/(default)/documents/chats?pageSize=1000');
    assert.equal(response.status(),200);
    const history=await response.json();
    assert.ok(!history.nextPageToken,'Expand the live history check if the pond grows beyond one API page.');
    const docs=history.documents||[];
    assert.ok(docs.length>0,'Original conversation is still present.');
    await page.goto(base+'index.html#turtle-chats');
    await page.locator('.chat-panel').scrollIntoViewIfNeeded();
    await page.waitForSelector('#chat-connection[data-state="live"]',{timeout:45000});
    while(await page.locator('#chat-older').isVisible())await page.locator('#chat-older').click();
    for(const doc of docs) {
      const id=doc.name.split('/').at(-1);
      assert.equal(await page.locator('[data-message-id="'+id+'"] p').textContent(),doc.fields.text.stringValue,'Original message '+id+' is rendered unchanged.');
    }
    assert.deepEqual(errors,[]);
    await page.locator('#turtle-chats').screenshot({path:'artifacts/chat-live-desktop.png'});
    await page.setViewportSize({width:390,height:1000});
    await page.locator('#turtle-chats').screenshot({path:'artifacts/chat-live-mobile.png'});
    console.log('PASS: Live Firebase SDK displays all '+docs.length+' existing messages unchanged; no live writes.');
  } finally {await context.close();}
}
