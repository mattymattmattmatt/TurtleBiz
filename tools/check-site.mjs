import { readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import vm from 'node:vm';
const pages=['index.html','shop.html','cart.html','about.html','contact.html','help.html','arcade.html','privacy.html','terms.html','404.html'];
let references=0;
for (const page of pages) {
  const html=await readFile(page,'utf8');
  if(!html.includes('name="viewport"'))throw new Error(page+' needs a viewport.');
  if((html.match(/<h1[\s>]/g)||[]).length!==1)throw new Error(page+' needs exactly one h1.');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  if(new Set(ids).size!==ids.length)throw new Error(page+' has duplicate IDs.');
  for(const match of html.replace(/<base\b[^>]*>/gi,'').matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const url=match[1];
    if(/^(?:https?:|mailto:|data:|tel:)/.test(url))continue;
    const [path,hash]=url.split('#');
    if(path)await access(resolve(dirname(page),decodeURI(path.split('?')[0])));
    else if(hash&&!ids.includes(hash))throw new Error(page+' has a broken anchor '+url);
    references++;
  }
}
for(const path of ['scripts/catalog.js','scripts/store.js','scripts/site.js','scripts/play.js'])new vm.Script(await readFile(path,'utf8'),{filename:path});
const context={window:{}};
vm.runInNewContext(await readFile('scripts/catalog.js','utf8'),context);
for(const product of context.window.TurtleCatalog) {
  await access(product.image);
  if(!Number.isInteger(product.cents)||product.cents<=0)throw new Error('Invalid price: '+product.id);
}
console.log('PASS: '+pages.length+' pages, '+references+' local links/assets, four scripts, and all catalog images/prices.');
