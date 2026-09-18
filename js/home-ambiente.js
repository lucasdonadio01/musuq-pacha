/* Capas decorativas: pausadas fuera del viewport y con movimiento reducido. */
(() => {
  const reduced=matchMedia('(prefers-reduced-motion:reduce)'),quieto=()=>reduced.matches||document.documentElement.dataset.detener==='true';
  const seccion=document.querySelector('.comunidad');
  if(seccion&&typeof Motor!=='undefined'){
    const canvas=document.createElement('canvas');canvas.className='comunidad-patrones';canvas.setAttribute('aria-hidden','true');seccion.prepend(canvas);
    const ctx=canvas.getContext('2d');let tiles=[],ancho=0,alto=0,frame=0,visible=false;
    const paleta=()=>Motor.paletaContra(['#ac8bdd','#F66227','#E1FF35'].map((h,i)=>({h,n:'Musuq '+i})),'#202020',3);
    function dibujar(now){
      ctx.clearRect(0,0,ancho,alto);
      for(const t of tiles){if(!quieto()&&now>t.proximo){t.motor.generar(now,null,paleta(),['flor','mandala','trama']);t.proximo=now+6000+Math.random()*4000;}t.motor.dibujar(ctx,t.x,t.y,16,now,{});}
    }
    function tick(now){dibujar(now);if(visible&&!quieto()&&!document.hidden)frame=requestAnimationFrame(tick);}
    function sync(){cancelAnimationFrame(frame);tiles.forEach(t=>t.motor.quieto=quieto());if(visible)tick(performance.now());}
    new ResizeObserver(()=>{
      ancho=seccion.clientWidth;alto=seccion.clientHeight;const dpr=Math.min(devicePixelRatio,1.5);canvas.width=ancho*dpr;canvas.height=alto*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);tiles=[];
      for(let y=16;y<alto;y+=170)for(let x=10;x<ancho;x+=170){const motor=Motor.crear(7);motor.quieto=quieto();motor.generar(performance.now()-2200,null,paleta(),['flor','mandala','trama']);tiles.push({motor,x,y,proximo:performance.now()+2000+Math.random()*8000});}dibujar(performance.now());sync();
    }).observe(seccion);
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(seccion);
    document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);addEventListener('musuq:accesibilidad',sync);
  }
  const fondo=document.getElementById('home-pixel-blast');
  if(fondo&&typeof Fondo!=='undefined'){
    Fondo.paleta('#111111','#F66227');Fondo.cfg.pixel=7;Fondo.iniciar(fondo);let visible=false;
    const sync=()=>{Fondo.cfg.quieto=quieto()||document.hidden||!visible;};
    new IntersectionObserver(e=>{visible=e[0].isIntersecting;sync();}).observe(fondo);
    document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);addEventListener('musuq:accesibilidad',sync);
  }
})();
