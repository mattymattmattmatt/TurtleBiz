const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function boot(seed={},blocked=false){
  const memory=new Map(Object.entries(seed));const listeners={};
  const context={window:{addEventListener:(name,fn)=>listeners[name]=fn,dispatchEvent:()=>{}},Event:class{constructor(type){this.type=type;}},
    localStorage:{getItem:key=>{if(blocked)throw Error('blocked');return memory.get(key)??null;},setItem:(key,value)=>{if(blocked)throw Error('blocked');memory.set(key,value);}}};
  vm.createContext(context);vm.runInContext(fs.readFileSync('scripts/catalog.js','utf8'),context);vm.runInContext(fs.readFileSync('scripts/store.js','utf8'),context);
  return {store:context.window.TurtleStore,memory,listeners};
}
test('cart migrates by catalog name and rejects forged prices, URLs and unknown products',()=>{
  const {store}=boot({cart:JSON.stringify([{name:'Turtle Biz Cap Merch',price:.01,image:'javascript:alert(1)',quantity:2},{name:'Unknown <script>',quantity:3},{name:'Turtle Plush Toy',quantity:-2}])});
  assert.equal(store.count,2);assert.equal(store.subtotal,4998);assert.equal(store.cart[0].image,'images/BizHatMerch.png');
});
test('cart handles corrupt storage and blocked browser storage',()=>{
  let {store}=boot({'turtlebiz:cart:v2':'{bad json'});assert.equal(store.count,0);assert.equal(store.add('plush'),true);assert.equal(store.subtotal,1999);
  store=boot({},true).store;assert.equal(store.add('plush'),true);assert.equal(store.count,1);assert.equal(store.storageAvailable,false);
});
test('integer totals, bounds, merging and removals',()=>{
  const {store}=boot();store.add('mug');store.add('mug');store.add('plush');
  assert.equal(store.subtotal,5797);assert.equal(store.count,3);
  store.quantity('mug',1000);assert.equal(store.cart[0].quantity,99);assert.equal(store.add('mug'),false);
  store.quantity('plush',0);assert.equal(store.count,99);store.quantity('mug',NaN);assert.equal(store.count,99);
  store.quantity('mug',0);assert.equal(store.subtotal,0);assert.equal(store.add('unknown'),false);
});
test('saved favourites persist, toggle and ignore unknown IDs',()=>{
  const {store,memory}=boot({'turtlebiz:saved:v1':JSON.stringify(['plush','fake','plush'])});
  assert.equal(store.saved.length,1);store.toggleSaved('mug');assert.equal(store.saved.length,2);
  store.toggleSaved('plush');assert.equal(store.saved[0],'mug');assert.equal(JSON.parse(memory.get('turtlebiz:saved:v1'))[0],'mug');
});
test('storage events synchronize a second tab and clear the bag',()=>{
  const {store,memory,listeners}=boot();store.add('plush');
  memory.set('turtlebiz:cart:v2',JSON.stringify([{id:'mug',quantity:3}]));listeners.storage({key:'turtlebiz:cart:v2'});
  assert.equal(store.subtotal,5697);memory.clear();listeners.storage({key:null});assert.equal(store.count,0);
});
test('legacy duplicated quantities are bounded and getter edits do not alter state',()=>{
  const {store}=boot({cart:JSON.stringify([{id:'plush',quantity:80},{id:'plush',quantity:80}])});
  assert.equal(store.count,99);store.cart[0].quantity=1;assert.equal(store.count,99);assert.equal(store.money(1999),'$19.99');
});
