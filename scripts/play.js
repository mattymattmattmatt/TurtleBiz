/* Lightweight Canvas 2D toys. No engine, no global perpetual animation loop. */
(() => {
  'use strict';
  const store = window.TurtleStore;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const random = (min, max) => min + Math.random() * (max - min);
  const pausedMotion = () => document.documentElement.classList.contains('motion-paused');
  function setup(canvas, width, height) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }
  const point = (canvas, event, width, height) => {
    const r = canvas.getBoundingClientRect();
    return { x: (event.clientX - r.left) / r.width * width, y: (event.clientY - r.top) / r.height * height };
  };
  function ellipse(ctx, x, y, rx, ry, color) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  }
  function turtle(ctx, x, y, radius, rotation, shell = '#315a3b', skin = '#abc67c') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rotation);
    ellipse(ctx, 0, 7, radius * 1.03, radius * .82, '#173e321b');
    [[-.6,-.56],[.55,-.56],[-.6,.56],[.55,.56]].forEach(([a,b]) => ellipse(ctx, a * radius, b * radius, radius * .37, radius * .22, skin));
    ellipse(ctx, radius * .9, 0, radius * .37, radius * .32, skin);
    ellipse(ctx, -radius * .88, 0, radius * .2, radius * .12, skin);
    ellipse(ctx, 0, 0, radius * .86, radius * .74, shell);
    ctx.strokeStyle = '#d6e8a96b'; ctx.lineWidth = Math.max(1, radius * .045);
    ctx.beginPath(); ctx.moveTo(-radius * .35, -radius * .38); ctx.lineTo(radius * .25, -radius * .38); ctx.lineTo(radius * .52, 0); ctx.lineTo(radius * .25, radius * .38); ctx.lineTo(-radius * .35, radius * .38); ctx.lineTo(-radius * .53, 0); ctx.closePath(); ctx.stroke();
    [[-.35,-.38,-.5,-.59],[.25,-.38,.47,-.58],[.52,0,.86,0],[.25,.38,.47,.58],[-.35,.38,-.5,.59],[-.53,0,-.86,0]].forEach(([a,b,c,d]) => {ctx.beginPath();ctx.moveTo(a*radius,b*radius);ctx.lineTo(c*radius,d*radius);ctx.stroke();});
    ellipse(ctx, radius * 1.02, -radius * .15, radius * .045, radius * .055, '#143c2f');
    ellipse(ctx, radius * 1.02, radius * .15, radius * .045, radius * .055, '#143c2f');
    ctx.restore();
  }
  const pond = document.getElementById('pond');
  if (pond) {
    const width = 760, height = 440, ctx = setup(pond, width, height);
    if (!ctx) return;
    pond.style.touchAction = 'none';
    let raf = 0, last = 0, visible = false, deadline = 0, held = null, pointerId = null;
    const colors = ['#315a3b','#557345','#244c41','#687f44','#3e7364','#728740'];
    const bodies = Array.from({ length: 6 }, (_, i) => ({ x: 110 + (i % 3) * 245, y: 110 + Math.floor(i / 3) * 205, r: random(35, 45), vx: random(-35, 35), vy: random(-25, 25), angle: random(-2, 2), color: colors[i] }));
    const status = document.getElementById('pond-status');
    const paint = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#74946732';
      for (let x = 20; x < width; x += 28) for (let y = 18; y < height; y += 28) { ctx.beginPath(); ctx.arc(x, y, .8, 0, Math.PI * 2); ctx.fill(); }
      bodies.forEach(body => turtle(ctx, body.x, body.y, body.r, body.angle, body.color));
    };
    function physics(dt) {
      bodies.forEach(body => {
        if (body === held) return;
        body.vy += 95 * dt;
        body.vx *= Math.pow(.987, dt * 60); body.vy *= Math.pow(.998, dt * 60);
        body.x += body.vx * dt; body.y += body.vy * dt;
        body.angle += body.vx * dt * .0015;
        const edge = body.r * 1.12;
        if (body.x < edge) { body.x = edge; body.vx = Math.abs(body.vx) * .7; }
        if (body.x > width - edge) { body.x = width - edge; body.vx = -Math.abs(body.vx) * .7; }
        if (body.y < edge) { body.y = edge; body.vy = Math.abs(body.vy) * .7; }
        if (body.y > height - edge) { body.y = height - edge; body.vy = -Math.abs(body.vy) * .58; if (Math.abs(body.vy) < 8) body.vy = 0; }
      });
      for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i], b = bodies[j], dx = b.x-a.x, dy=b.y-a.y, distance=Math.hypot(dx,dy), min=a.r+b.r;
        if (distance >= min) continue;
        const nx = distance > .01 ? dx/distance : 1, ny = distance > .01 ? dy/distance : 0;
        const shift = (min-distance)/2;
        if (a !== held) { a.x -= nx*shift; a.y -= ny*shift; }
        if (b !== held) { b.x += nx*shift; b.y += ny*shift; }
        const speed = (b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
        if (speed < 0) {
          if(a!==held){a.vx+=speed*nx*.8;a.vy+=speed*ny*.8;}
          if(b!==held){b.vx-=speed*nx*.8;b.vy-=speed*ny*.8;}
        }
      }
      bodies.forEach(body => { body.x=clamp(body.x,body.r*1.12,width-body.r*1.12);body.y=clamp(body.y,body.r*1.12,height-body.r*1.12); });
    }
    function frame(now) {
      raf=0;
      if (!visible || document.hidden || pausedMotion()) { paint(); return; }
      const dt=Math.min((now-last)/1000 || .016,.03); last=now;
      physics(dt); paint();
      if (now < deadline || held) raf=requestAnimationFrame(frame);
    }
    function wake() {
      deadline=performance.now()+5500;
      if (visible && !document.hidden && !pausedMotion() && !raf) { last=performance.now();raf=requestAnimationFrame(frame); }
      else paint();
    }
    function stop() { cancelAnimationFrame(raf); raf=0; }
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake();else stop();},{threshold:.08});
    observer.observe(pond);
    document.getElementById('pond-nudge').addEventListener('click',()=>{
      bodies.forEach(body=>{
        if(pausedMotion()){body.x=random(body.r*1.3,width-body.r*1.3);body.y=random(body.r*1.3,height-body.r*1.3);body.angle=random(-3,3);}
        else {body.vx=random(-330,330);body.vy=random(-330,-120);}
      });
      status.textContent=bodies.length+' turtles. Meeting adjourned.';wake();
    });
    document.getElementById('pond-add').addEventListener('click',()=>{
      if(bodies.length>=12){status.textContent='The desk is full. Try a nudge!';return;}
      bodies.push({x:random(80,width-80),y:80,r:random(32,42),vx:random(-100,100),vy:0,angle:random(-3,3),color:colors[bodies.length%colors.length]});
      status.textContent=bodies.length+' turtles. Zero meetings.';
      if(bodies.length===12)document.getElementById('pond-add').disabled=true;
      wake();
    });
    pond.addEventListener('pointerdown',event=>{
      const p=point(pond,event,width,height);
      held=[...bodies].reverse().find(body=>Math.hypot(p.x-body.x,p.y-body.y)<body.r*1.25)||null;
      if(!held)return;
      pointerId=event.pointerId;pond.setPointerCapture(event.pointerId);held.vx=0;held.vy=0;wake();
    });
    pond.addEventListener('pointermove',event=>{
      if(!held||pointerId!==event.pointerId)return;
      const p=point(pond,event,width,height);
      held.vx=clamp((p.x-held.x)*12,-600,600);held.vy=clamp((p.y-held.y)*12,-600,600);
      held.x=clamp(p.x,held.r*1.12,width-held.r*1.12);held.y=clamp(p.y,held.r*1.12,height-held.r*1.12);
      paint();wake();
    });
    const release=()=>{held=null;pointerId=null;wake();};
    pond.addEventListener('pointerup',release);pond.addEventListener('pointercancel',release);pond.addEventListener('lostpointercapture',release);
    window.addEventListener('turtlebiz:motion',()=>{stop();paint();if(!pausedMotion())wake();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){held=null;stop();}else wake();});
    paint();
  }
  const canvas=document.getElementById('sprint');
  if (!canvas) return;
  const mobile=matchMedia('(max-width:640px)');
  let width=mobile.matches?520:960;
  const height=440;
  let ctx=setup(canvas,width,height);
  if(!ctx)return;
  let raf=0,last=0,mode='ready',score=0,remaining=30,combo=0,spawn=0,hurt=0,objects=[],elapsed=0;
  const bestRaw=Number(store.read('turtlebiz:sprint:best:v1'));
  let best=Number.isFinite(bestRaw)&&bestRaw>0?Math.floor(bestRaw):0;
  const player={x:90,y:220,target:220};
  const keys=new Set();
  const $=id=>document.getElementById(id);
  const overlay=$('game-overlay'), start=$('game-start'), pause=$('game-pause');
  $('game-best').textContent=best;
  function hud(){
    $('game-score').textContent=score;$('game-time').textContent=Math.max(0,Math.ceil(remaining));$('game-best').textContent=best;
  }
  function draw(){
    ctx.clearRect(0,0,width,height);ctx.fillStyle='#cbdcbd';ctx.fillRect(0,0,width,height);
    ctx.strokeStyle='#9abb945c';ctx.lineWidth=1;
    for(let y=30;y<height;y+=45){ctx.beginPath();for(let x=0;x<=width;x+=15){const yy=y+Math.sin(x*.015+elapsed*.6)*5;if(!x)ctx.moveTo(x,yy);else ctx.lineTo(x,yy);}ctx.stroke();}
    ctx.fillStyle='#71987322';for(let i=0;i<14;i++){let x=((i*93-elapsed*35)%width+width)%width;ctx.beginPath();ctx.arc(x,(i*71)%height,3+(i%3),0,Math.PI*2);ctx.fill();}
    objects.forEach(object=>{
      if(object.kind==='coin'){
        ellipse(ctx,object.x,object.y,12,12,'#e9a536');ellipse(ctx,object.x,object.y,8,8,'#f8d77b');
        ctx.strokeStyle='#9b6b25';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(object.x,object.y-4);ctx.lineTo(object.x,object.y+4);ctx.stroke();
      }else{
        ctx.fillStyle='#a35b77';ctx.beginPath();ctx.arc(object.x,object.y,20,Math.PI,0);ctx.lineTo(object.x+20,object.y+4);ctx.lineTo(object.x-20,object.y+4);ctx.closePath();ctx.fill();
        ctx.strokeStyle='#a35b77';ctx.lineWidth=3;
        for(let t=-12;t<=12;t+=8){ctx.beginPath();ctx.moveTo(object.x+t,object.y+2);ctx.quadraticCurveTo(object.x+t+8,object.y+14,object.x+t,object.y+23);ctx.stroke();}
        ellipse(ctx,object.x-6,object.y-5,2,3,'#392e40');ellipse(ctx,object.x+6,object.y-5,2,3,'#392e40');
      }
    });
    turtle(ctx,player.x,player.y,27,0,hurt>0?'#967557':'#285b40','#a9c37a');
    if(combo>1){ctx.font='600 12px sans-serif';ctx.fillStyle='#173e32';ctx.textAlign='center';ctx.fillText('×'+Math.min(combo,5),player.x,player.y-38);}
  }
  function showOverlay(title,description,label){
    overlay.hidden=false;$('game-message').textContent=title;$('game-description').textContent=description;start.textContent=label;
  }
  function finish(){
    mode='over';cancelAnimationFrame(raf);raf=0;keys.clear();
    const record=score>best;if(record){best=score;store.write('turtlebiz:sprint:best:v1',best);}
    hud();pause.disabled=true;
    showOverlay(record?'A new personal best.':'Very nice shell work.',score+' points. '+(record?'You just raised the bar.':'Fancy another lap?'),'Play again →');
    $('game-announcement').textContent='Round complete. '+score+' points. Best '+best+'.';
    start.focus({preventScroll:true});
  }
  function step(now){
    raf=0;if(mode!=='playing')return;
    const dt=clamp((now-last)/1000,0,.035);last=now;remaining-=dt;elapsed+=dt;hurt=Math.max(0,hurt-dt);
    const direction=(keys.has('down')?1:0)-(keys.has('up')?1:0);
    if(direction)player.target=player.y+direction*340*dt;
    player.target=clamp(player.target,35,height-35);
    player.y+=(player.target-player.y)*Math.min(1,dt*15);
    spawn-=dt;
    if(spawn<=0){spawn=random(.52,.82);objects.push({kind:Math.random()<.27?'jelly':'coin',x:width+25,y:random(40,height-40)});}
    const speed=155+elapsed*2;
    objects.forEach(object=>{
      object.x-=speed*dt;
      const distance=Math.hypot(object.x-player.x,object.y-player.y);
      if(object.kind==='coin'&&distance<34){combo++;score+=10+Math.min(combo-1,4)*2;object.hit=true;}
      if(object.kind==='jelly'&&distance<40&&hurt<=0){score=Math.max(0,score-5);combo=0;hurt=1.2;object.hit=true;}
    });
    objects=objects.filter(object=>!object.hit&&object.x>-35);
    hud();draw();if(remaining<=0){remaining=0;finish();return;}raf=requestAnimationFrame(step);
  }
  function begin(){
    cancelAnimationFrame(raf);raf=0;mode='playing';score=0;remaining=30;combo=0;spawn=.5;hurt=0;elapsed=0;objects=[];keys.clear();player.y=220;player.target=220;
    overlay.hidden=true;pause.disabled=false;pause.textContent='Pause';last=performance.now();hud();draw();canvas.focus({preventScroll:true});
    $('game-announcement').textContent='Round started. Collect coins and avoid jellyfish.';
    raf=requestAnimationFrame(step);
  }
  function togglePause(force=false){
    if(mode==='playing'){
      mode='paused';cancelAnimationFrame(raf);raf=0;keys.clear();pause.textContent='Resume';
      showOverlay('Take your time.','Your round is right here when you are ready.','Keep swimming →');
      $('game-announcement').textContent='Game paused.';if(!force)start.focus({preventScroll:true});
    }else if(mode==='paused'&&!force){
      mode='playing';overlay.hidden=true;pause.textContent='Pause';last=performance.now();canvas.focus({preventScroll:true});raf=requestAnimationFrame(step);
    }
  }
  start.addEventListener('click',()=>mode==='paused'?togglePause():begin());
  pause.addEventListener('click',()=>togglePause());
  const gameKey=key=>({ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down'}[key]);
  canvas.addEventListener('keydown',event=>{
    if(mode!=='playing')return;
    if(event.code==='Space'){event.preventDefault();togglePause();return;}
    const key=gameKey(event.key);if(key){event.preventDefault();keys.add(key);}
  });
  window.addEventListener('keyup',event=>{const key=gameKey(event.key);if(key)keys.delete(key);});
  let dragging=false;
  canvas.addEventListener('pointerdown',event=>{if(mode!=='playing')return;dragging=true;canvas.setPointerCapture(event.pointerId);player.target=point(canvas,event,width,height).y;canvas.focus({preventScroll:true});});
  canvas.addEventListener('pointermove',event=>{if(dragging&&mode==='playing')player.target=point(canvas,event,width,height).y;});
  ['pointerup','pointercancel','lostpointercapture'].forEach(event=>canvas.addEventListener(event,()=>dragging=false));
  [['game-up','up'],['game-down','down']].forEach(([id,key])=>{
    const button=$(id);
    button.addEventListener('pointerdown',event=>{if(mode!=='playing')return;keys.add(key);button.setPointerCapture(event.pointerId);});
    ['pointerup','pointercancel','lostpointercapture'].forEach(event=>button.addEventListener(event,()=>keys.delete(key)));
    button.addEventListener('click',event=>{if(mode==='playing'&&event.detail===0)player.target=clamp(player.y+(key==='up'?-65:65),35,height-35);});
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)togglePause(true);});
  window.addEventListener('blur',()=>{keys.clear();togglePause(true);});
  new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)togglePause(true);},{threshold:.1}).observe(canvas);
  mobile.addEventListener('change',()=>{togglePause(true);width=mobile.matches?520:960;ctx=setup(canvas,width,height);objects=[];draw();});
  window.addEventListener('turtlebiz:motion',()=>togglePause(true));
  hud();draw();
})();
