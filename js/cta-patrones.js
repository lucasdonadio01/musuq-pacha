/* Mosaico decorativo del CTA: comparte Motor, sin modificar el generador. */
(() => {
  'use strict';
  const cta = document.querySelector('.comunidad__cta');
  if (!cta || typeof Motor === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.className = 'cta-patrones'; canvas.setAttribute('aria-hidden','true');
  cta.prepend(canvas);
  const ctx = canvas.getContext('2d');
  const hover = matchMedia('(hover:hover) and (pointer:fine)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const menu = ['flor','flor','mandala','mandala','trama','abstracto'];
  let tiles = [], width = 0, height = 0, size = 78, raf = 0, active = false, over = false;
  const palette = () => PUEBLOS[Math.floor(Math.random()*PUEBLOS.length)].colores;
  function measure() {
    width=cta.clientWidth; height=cta.clientHeight;
    const dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const cols=Math.max(1,Math.ceil(width/88)); size=width/cols;
    tiles=[];
    for(let row=0;row<Math.ceil(height/size);row++)for(let col=0;col<cols;col++){
      const motor=Motor.crear(7);motor.quieto=reduced.matches;
      motor.generar(performance.now()-1800,null,palette(),menu);
      tiles.push({motor,x:col*size,y:row*size,next:performance.now()+300+Math.random()*1700});
    }
    draw(performance.now());
  }
  function draw(now) {
    ctx.clearRect(0,0,width,height);
    for(const tile of tiles){
      if(active&&!reduced.matches&&now>tile.next){
        tile.motor.generar(now,null,palette(),menu);tile.next=now+2100+Math.random()*2400;
      }
      tile.motor.dibujar(ctx,tile.x+size*.10,tile.y+size*.10,size*.80/7,now,{});
    }
  }
  function tick(now){draw(now);if(active&&!reduced.matches)raf=requestAnimationFrame(tick);}
  function sync(){
    const wanted=over&&hover.matches&&!document.hidden;
    cta.classList.toggle('cta-patrones--activo',wanted);
    if(wanted===active)return;
    active=wanted;cancelAnimationFrame(raf);
    if(active){tiles.forEach(t=>{t.next=performance.now()+250+Math.random()*1600;});tick(performance.now());}
  }
  cta.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch'){over=true;sync();}});
  cta.addEventListener('pointerleave',()=>{over=false;sync();});
  cta.addEventListener('pointercancel',()=>{over=false;sync();});
  addEventListener('blur',()=>{over=false;sync();});
  document.addEventListener('visibilitychange',sync);
  hover.addEventListener('change',sync);
  reduced.addEventListener('change',()=>{cancelAnimationFrame(raf);tiles.forEach(t=>t.motor.quieto=reduced.matches);draw(performance.now());if(active&&!reduced.matches)raf=requestAnimationFrame(tick);});
  new ResizeObserver(measure).observe(cta);
})();
