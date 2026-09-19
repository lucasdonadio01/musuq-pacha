/* Profundidad automática entre papel y sujeto; el hover suma movimiento del
   puntero y dispara la caída del mosaico. Un solo reloj, solo tarjetas visibles. */
(() => {
  'use strict';
  const section = document.getElementById('archivo');
  if (!section) return;
  const track = section.querySelector('.eventos-catalogo');
  const cards = [...track.querySelectorAll('.evento')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  const visible = new Set(), layers = cards.map(card => card.querySelector('.evento__imagen'));
  let active = null, frame = 0, mx = 0, my = 0, x = 0, y = 0, revealTimer = 0;
  const quiet = () => reduced.matches || document.documentElement.dataset.detener === 'true';
  const canAnimate = () => visible.size && !document.hidden && !quiet() && !document.body.classList.contains('en-mapa');
  function stop() { cancelAnimationFrame(frame); frame = 0; }
  function motion(t) {
    if (!canAnimate()) { stop(); return; }
    x += (mx-x)*.08; y += (my-y)*.08;
    cards.forEach((card,index) => {
      if(!visible.has(card))return;
      const dx = Math.sin(t / 2100 + index * 1.7) * 4.5 + (card===active ? x*5 : 0);
      const dy = Math.cos(t / 2700 + index * 1.2) * 3.2 + (card===active ? y*4 : 0);
      layers[index].style.setProperty('--px', `${(-dx*.7).toFixed(2)}px`);
      layers[index].style.setProperty('--py', `${(-dy*.7).toFixed(2)}px`);
      layers[index].style.setProperty('--sx', `${(dx*1.1).toFixed(2)}px`);
      layers[index].style.setProperty('--sy', `${(dy*1.1).toFixed(2)}px`);
    });
    frame = requestAnimationFrame(motion);
  }
  function updateMotion() { stop(); if(canAnimate())frame=requestAnimationFrame(motion); }
  function activate(card) {
    if (card === active) return;
    active = card; mx = my = 0;
    cards.forEach(item => item.classList.toggle('activa',item===card));
    track.classList.toggle('tiene-activa', !!card);
    clearTimeout(revealTimer);
    revealTimer = setTimeout(() => {
      if (!card || active !== card) return;
      const c = card.getBoundingClientRect(), t = track.getBoundingClientRect();
      const distance = c.right > t.right ? c.right-t.right : c.left < t.left ? c.left-t.left : 0;
      if(distance)track.scrollBy({left:distance,behavior:quiet()?'instant':'smooth'});
    },quiet()?0:620);
  }
  const limits = [[6,6],[1,4],[0,5],[0,5],[0,4],[0,5],[0,5],[0,6],[0,5],[0,6],[0,7],[0,7]];
  cards.forEach((card, index) => {
    const pixels = card.querySelector('.evento__pixeles');
    const cells = [];
    limits.forEach(([start,end], row) => {
      for(let col=start;col<=end;col++) {
        const pixel = document.createElement('i');
        const seed = (row * 19 + col * 31 + index * 7) % 23;
        pixel.className = 'evento__pixel';
        pixel.style.cssText = `--demora:${seed*10}ms;--caida:${90+seed*9}px;--deriva:${seed-11}px;--giro:${seed-12}deg`;
        pixels.append(pixel);cells.push({pixel,col,row});
      }
    });
    // Bordes en píxeles enteros y solape opaco: no quedan costuras subpíxel.
    new ResizeObserver(([entry]) => {
      const {width,height}=entry.contentRect;
      cells.forEach(({pixel,col,row}) => {
        const left=Math.round(col*width/8),top=Math.round(row*height/12);
        pixel.style.left=left+'px';pixel.style.top=top+'px';
        pixel.style.width=(Math.round((col+1)*width/8)-left+1)+'px';
        pixel.style.height=(Math.round((row+1)*height/12)-top+1)+'px';
      });
    }).observe(layers[index]);
    card.addEventListener('pointerenter', () => { if(hover.matches)activate(card); });
    card.addEventListener('pointermove', e => {
      if(active!==card)return;
      const r=card.getBoundingClientRect();mx=(e.clientX-r.left)/r.width*2-1;my=(e.clientY-r.top)/r.height*2-1;
    });
    card.addEventListener('focusin', () => activate(card));
    card.addEventListener('focusout', e => {if(!track.contains(e.relatedTarget))activate(null);});
  });
  track.addEventListener('pointerleave', () => {mx=my=0;if(!track.contains(document.activeElement))activate(null);});
  section.addEventListener('keydown', e => {if(e.key==='Escape')activate(null);});
  const previous=section.querySelector('[data-eventos-prev]'),next=section.querySelector('[data-eventos-next]');
  function controls() {
    previous.disabled=track.scrollLeft<3;
    next.disabled=track.scrollWidth-track.clientWidth-track.scrollLeft<4;
    section.querySelector('.eventos-marco').classList.toggle('al-final',next.disabled);
  }
  function move(direction) {
    activate(null);
    track.scrollBy({left:direction*cards[0].querySelector('.evento__texto').offsetWidth,behavior:quiet()?'instant':'smooth'});
  }
  previous.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
  track.addEventListener('scroll',controls,{passive:true});
  const dimensions=new ResizeObserver(controls);dimensions.observe(track);cards.forEach(card=>dimensions.observe(card));
  const visibility=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{if(entry.isIntersecting)visible.add(entry.target);else visible.delete(entry.target);});updateMotion();
  });
  cards.forEach(card=>visibility.observe(card));
  document.addEventListener('visibilitychange',updateMotion);
  reduced.addEventListener('change',updateMotion);
  addEventListener('musuq:accesibilidad',updateMotion);
  addEventListener('musuq:modo',updateMotion);
  document.querySelector('#header [data-seccion-link="archivo"]')?.addEventListener('click',()=>{
    if(document.body.classList.contains('en-mapa'))document.getElementById('salir-mapa')?.click();
    requestAnimationFrame(()=>section.scrollIntoView({behavior:quiet()?'instant':'smooth'}));
  });
  // Conserva los enlaces del prototipo anterior sin confundir Archivo con Eventos.
  if(location.hash==='#eventos') {
    history.replaceState(null,'',location.pathname+location.search+'#archivo');
    requestAnimationFrame(()=>section.scrollIntoView({behavior:'instant'}));
  }
  controls();
})();
