import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const root=resolve('.');
const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.mp3':'audio/mpeg','.ogg':'audio/ogg'};
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    const path=decodeURIComponent(url.pathname).replace(/^\/TurtleBiz/,'');
    const target=resolve(root,'.'+(path.endsWith('/')?path+'index.html':path));
    if(!target.startsWith(root+sep)){res.writeHead(403);res.end();return;}
    const content=await readFile(target);res.writeHead(200,{'Content-Type':mime[extname(target)]||'application/octet-stream'});res.end(content);
  }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port+'/TurtleBiz/';
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const report=[];
const passed=message=>{report.push(message);console.log('PASS: '+message);};
await mkdir('artifacts',{recursive:true});
try {
  // All storefront pages, both large and very narrow layouts, and accessible names/contrast.
  for(const width of [1440,390,320]){
    await page.setViewportSize({width,height:1000});
    for(const path of ['index.html','shop.html','about.html','cart.html','contact.html','help.html','arcade.html','privacy.html','terms.html','404.html']){
      await page.goto(base+path);await page.waitForSelector('html.js');
      assert.equal(await page.locator('h1').count(),1);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow at '+width+' '+path);
      const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
      const violations=result.violations.filter(v=>v.impact==='critical'||v.impact==='serious');
      assert.equal(violations.length,0,path+' '+width+' accessibility: '+JSON.stringify(violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))));
    }
  }
  passed('All 10 pages fit desktop, 390px and 320px with no serious/critical axe violations.');
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(base+'shop.html');
  await page.getByLabel('Search the collection').fill('plush');
  assert.equal(await page.locator('#shop-grid .product-card:visible').count(),1);
  await page.getByLabel('Search the collection').fill('zzzzmissing');assert.equal(await page.locator('#shop-empty').isVisible(),true);
  await page.getByRole('button',{name:'See everything'}).click();
  await page.locator('[data-filter="Wearables"]').click();assert.equal(await page.locator('#shop-grid .product-card:visible').count(),4);
  await page.locator('[data-filter="All"]').click();
  await page.locator('#product-sort').selectOption('price-low');assert.equal(await page.locator('#shop-grid .product-card:visible').first().getAttribute('data-id'),'print');
  await page.getByRole('button',{name:'Save Turtle Plush Toy',exact:true}).click();await page.locator('[data-filter="Saved"]').click();
  assert.equal(await page.locator('#shop-grid .product-card:visible').count(),1);
  await page.reload();await page.locator('[data-filter="Saved"]').click();assert.equal(await page.locator('#shop-grid .product-card:visible').count(),1);
  passed('Catalog search, filters, price sorting, empty state and persistent favourites.');
  await page.getByRole('button',{name:'View Turtle Plush Toy',exact:true}).click();assert.equal(await page.locator('#product-dialog').isVisible(),true);
  await page.getByRole('button',{name:'Add to your bag'}).click();await page.keyboard.press('Escape');
  assert.equal(await page.locator('#product-dialog').isVisible(),false);assert.equal(await page.locator('[data-cart-count]').first().textContent(),'1');
  await page.goto(base+'cart.html');assert.equal(await page.locator('#cart-total').textContent(),'$19.99');
  await page.getByRole('button',{name:'Increase quantity of Turtle Plush Toy'}).click();
  assert.equal(await page.locator('#cart-total').textContent(),'$39.98');
  const href=await page.locator('#order-enquiry').getAttribute('href');
  assert.ok(href.startsWith('mailto:guihlemturtlebiz@gmail.com'));assert.ok(decodeURIComponent(href).includes('2 × Turtle Plush Toy'));
  await page.reload();assert.equal(await page.locator('#cart-total').textContent(),'$39.98');
  await page.getByRole('button',{name:'Remove Turtle Plush Toy',exact:true}).click();assert.equal(await page.locator('.empty-state').isVisible(),true);assert.equal(await page.locator('#copy-order').isDisabled(),true);
  passed('Product dialog, cart quantity/removal/persistence, and encoded order enquiry.');
  await page.evaluate(()=>{localStorage.removeItem('turtlebiz:cart:v2');localStorage.setItem('cart',JSON.stringify([{name:'Turtle Biz Cap Merch',price:19.99,image:'bad.png',quantity:2}]));});
  await page.reload();assert.equal(await page.locator('#cart-total').textContent(),'$49.98');
  await page.evaluate(()=>localStorage.setItem('turtlebiz:cart:v2','broken'));await page.reload();assert.equal(await page.locator('.empty-state').isVisible(),true);
  passed('Legacy cart migration corrects the old cap price; corrupt data recovers safely.');
  await page.setViewportSize({width:390,height:844});await page.goto(base+'index.html');
  assert.equal(await page.locator('#main-nav').isVisible(),false);
  await page.getByRole('button',{name:'Open navigation'}).click();assert.equal(await page.locator('#main-nav').isVisible(),true);
  await page.keyboard.press('Escape');assert.equal(await page.locator('#main-nav').isVisible(),false);
  await page.emulateMedia({reducedMotion:'reduce'});await page.reload();
  assert.equal(await page.locator('html').evaluate(el=>el.classList.contains('motion-paused')),true);
  assert.equal(await page.locator('#radio-audio').evaluate(el=>el.paused),true);
  await page.locator('#pond-add').click();assert.ok((await page.locator('#pond-status').textContent()).includes('7 turtles'));
  await page.locator('#pond-nudge').click();assert.ok((await page.locator('#pond-status').textContent()).includes('Meeting adjourned'));
  passed('Mobile menu, keyboard escape, reduced motion, silent initial music, and pond controls.');
  await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:1440,height:1000});
  await page.goto(base+'arcade.html');
  await page.clock.install();await page.evaluate(()=>Math.random=()=>.5);
  await page.locator('#game-start').click();await page.clock.runFor(5500);
  assert.ok(Number(await page.locator('#game-score').textContent())>0,'Collecting a coin increases the score.');
  await page.locator('#game-pause').click();const time=await page.locator('#game-time').textContent();await page.clock.runFor(5000);
  assert.equal(await page.locator('#game-time').textContent(),time);
  await page.locator('#game-start').click();await page.clock.runFor(31000);
  assert.ok(Number(await page.locator('#game-best').textContent())>0);
  assert.equal(await page.locator('#game-overlay').isVisible(),true);
  await page.locator('#game-start').click();assert.equal(await page.locator('#game-score').textContent(),'0');await page.locator('#game-pause').click();
  passed('Arcade collects coins, pauses its timer, completes a round, saves the best, and restarts.');
  // Render previews with the same motion setting a visitor can select.
  const preview=await context.newPage();
  await preview.emulateMedia({reducedMotion:'reduce'});
  await preview.setViewportSize({width:1440,height:1000});await preview.goto(base+'index.html');await preview.evaluate(()=>document.fonts.ready);
  await preview.screenshot({path:'artifacts/home-desktop.png',fullPage:true});
  const inline=await preview.screenshot({type:'jpeg',quality:60});
  if(process.env.INLINE_PREVIEW==='1')console.log('TURTLE_PREVIEW_JPEG='+inline.toString('base64'));
  await preview.setViewportSize({width:390,height:844});await preview.goto(base+'index.html');
  await preview.screenshot({path:'artifacts/home-mobile.png',fullPage:true});
  await preview.setViewportSize({width:1440,height:1000});await preview.goto(base+'shop.html');
  await preview.screenshot({path:'artifacts/collection-desktop.png',fullPage:true});
  assert.deepEqual(errors,[],'No uncaught JavaScript errors.');
  passed('Desktop/mobile screenshots and zero uncaught page errors.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
console.log('COMPLETE: '+report.length+' browser test groups.');
