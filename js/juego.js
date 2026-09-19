(() => {
  'use strict';
  const root = document.documentElement;
  const recorrido = document.querySelector('.juego-recorrido');
  const escenario = document.querySelector('.juego-escenario');
  const etapas = [...document.querySelectorAll('.juego-etapa')];
  const intro = document.querySelector('.juego-inicio__texto');
  const bajar = document.querySelector('.juego-bajar');
  const barras = document.querySelector('.juego-barras');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const alturasCortas = matchMedia('(max-height:560px)');
  const anchos = [884,824,767,704,631,572,502,431,431,502,572,631,704,767,824,884];
  const fragmento = document.createDocumentFragment();
  anchos.forEach((ancho,fila) => ['izq','der'].forEach(lado => {
    const barra = document.createElement('span');
    barra.className = `juego-barra juego-barra--${lado}${fila > 7 ? ' juego-barra--inferior' : ''}`;
    barra.style.cssText = `--fila:${fila};--ancho:${ancho / 1920 * 100}%;`;
    barra.dataset.fila = fila;
    fragmento.append(barra);
  }));
  barras.append(fragmento);
  const listaBarras = [...barras.children];
  const clamp = n => Math.max(0, Math.min(1,n));
  const tramo = (p,a,b) => clamp((p-a)/(b-a));
  const suave = n => n*n*(3-2*n);
  let conScroll = false, frame = 0, destruido = false;
  const quieto = () => reduced.matches || root.dataset.detener === 'true';
  const resortes = listaBarras.map((el,i) => ({el,x:0,v:0,meta:0,fase:i*1.37}));
  let movimiento = 0, anterior = 0, reloj = 0, barrasEnVista = true;
  function detenerBarras() {
    cancelAnimationFrame(movimiento);movimiento=0;anterior=0;
    barras.removeAttribute('data-animando');
  }
  function moverBarras(ahora) {
    movimiento = 0;
    if (destruido || quieto() || document.hidden || !barrasEnVista || root.dataset.color==='contraste') {detenerBarras();return;}
    const dt = anterior ? Math.min((ahora-anterior)/1000,.032) : 1/60;
    anterior=ahora; reloj+=dt;
    let seguir=false;
    resortes.forEach((r,i) => {
      r.v += ((r.meta-r.x)*(150+i%5*7)-r.v*13)*dt;
      r.x += r.v*dt;
      if (Math.abs(r.meta-r.x)<.0001 && Math.abs(r.v)<.0005) {r.x=r.meta;r.v=0;}
      const flotacion=(1+Math.sin(reloj*(.48+i%7*.035)+r.fase))*(7+i%5*1.2);
      r.el.style.setProperty('--salida',Math.max(0,r.x).toFixed(5));
      r.el.style.setProperty('--flotacion',`${flotacion.toFixed(2)}px`);
      if (r.meta<1 || r.x<.999 || Math.abs(r.v)>.0005) seguir=true;
    });
    if (seguir) movimiento=requestAnimationFrame(moverBarras); else detenerBarras();
  }
  function animarBarras() {
    if (!movimiento && !destruido && !quieto() && !document.hidden && barrasEnVista && root.dataset.color!=='contraste') {
      barras.dataset.animando='true';movimiento=requestAnimationFrame(moverBarras);
    }
  }
  const observadorBarras=new IntersectionObserver(([entrada]) => {
    barrasEnVista=entrada.isIntersecting;
    if (barrasEnVista) animarBarras();
    else detenerBarras();
  });
  observadorBarras.observe(etapas[0]);
  let fondoActivo = false;
  try {
    if (typeof Fondo !== 'undefined') {
      Fondo.paleta('#111111','#F66227');
      Fondo.cfg.pixel = 7;
      fondoActivo = Fondo.iniciar(document.getElementById('juego-pixel-blast')) !== false;
      Fondo.cfg.quieto = quieto();
      if (!fondoActivo) document.querySelector('.juego-fondo').classList.add('juego-fondo--estatico');
    }
  } catch (error) {
    document.querySelector('.juego-fondo').classList.add('juego-fondo--estatico');
  }
  function activar(etapa, visible) {
    etapa.inert = !visible;
    if (visible) etapa.removeAttribute('aria-hidden'); else etapa.setAttribute('aria-hidden','true');
    etapa.style.pointerEvents = visible ? 'auto' : 'none';
  }
  function pintar() {
    frame = 0;
    if (!conScroll || destruido) return;
    const altoHeader = parseFloat(getComputedStyle(root).getPropertyValue('--site-header-height')) || 78;
    const inicio = recorrido.getBoundingClientRect().top + scrollY - altoHeader;
    const distancia = recorrido.offsetHeight - escenario.offsetHeight;
    const p = clamp((scrollY-inicio)/Math.max(1,distancia));
    recorrido.dataset.etapa = p < .34 ? 'inicio' : p < .72 ? 'avance' : 'descarga';
    resortes.forEach((r,i) => {
      const retraso = Math.abs(Number(r.el.dataset.fila)-7.5)*.006 + (i%2)*.008;
      r.meta=suave(tramo(p,retraso,.32+retraso));
    });
    animarBarras();
    const texto = 1-suave(tramo(p,.08,.27));
    intro.style.opacity = texto;
    bajar.style.opacity = texto;
    const video = suave(tramo(p,.26,.40)) * (1-suave(tramo(p,.60,.76)));
    const descarga = suave(tramo(p,.70,.86));
    etapas[1].style.opacity = video;
    etapas[1].style.filter = `blur(${(suave(tramo(p,.60,.76))*16).toFixed(2)}px)`;
    etapas[2].style.opacity = descarga;
    etapas[2].style.transform = `translateY(${(160*(1-tramo(p,.68,1))).toFixed(2)}px)`;
    activar(etapas[0],p < .28);
    activar(etapas[1],p >= .34 && p < .72);
    activar(etapas[2],p >= .72);
  }
  function programar() { if (!frame && !destruido) frame = requestAnimationFrame(pintar); }
  function configurar() {
    conScroll = !quieto() && !alturasCortas.matches && root.dataset.textoGrande !== 'true' && root.dataset.espaciado !== 'true';
    root.classList.toggle('juego-con-scroll',conScroll);
    const altoHeader = parseFloat(getComputedStyle(root).getPropertyValue('--site-header-height')) || 78;
    const altoContenido = document.querySelector('.juego-descarga__contenido').offsetHeight;
    if (conScroll && altoContenido + 64 > innerHeight - altoHeader) {
      conScroll = false;
      root.classList.remove('juego-con-scroll');
    }
    if (fondoActivo) Fondo.cfg.quieto = quieto() || document.hidden;
    detenerBarras();
    if (!conScroll) {
      etapas.forEach(etapa => { activar(etapa,true); etapa.style.opacity='';etapa.style.filter='';etapa.style.transform=''; });
      intro.style.opacity=''; bajar.style.opacity='';
      resortes.forEach(r => {r.meta=0;r.x=0;r.v=0;r.el.style.removeProperty('--salida');r.el.style.removeProperty('--flotacion');});
    }
    animarBarras();
    programar();
  }
  function irA(id, foco = false) {
    const destino = document.getElementById(id);
    if (!destino) return;
    if (conScroll) {
      const p = id === 'descarga' ? 1 : id === 'avance' ? .48 : 0;
      const altoHeader = parseFloat(getComputedStyle(root).getPropertyValue('--site-header-height')) || 78;
      const inicio = recorrido.getBoundingClientRect().top + scrollY-altoHeader;
      scrollTo({top:inicio+p*(recorrido.offsetHeight-escenario.offsetHeight),behavior:foco?'instant':'smooth'});
      if (foco) pintar();
    } else destino.scrollIntoView({behavior:quieto()?'instant':'smooth'});
    if (foco) {
      const control = destino.querySelector('button');
      if (control) control.focus({preventScroll:true});
    }
  }
  document.querySelectorAll('a[href="#avance"],a[href="#descarga"]').forEach(enlace => {
    enlace.addEventListener('click',e => {
      e.preventDefault();
      const id = enlace.hash.slice(1);
      history.replaceState(null,'',`#${id}`);
      irA(id,e.detail===0);
    });
  });
  const play = document.querySelector('.juego-video__play');
  play.addEventListener('click',() => {
    const jugando = play.getAttribute('aria-pressed') !== 'true';
    play.setAttribute('aria-pressed',String(jugando));
    play.setAttribute('aria-label',jugando?'Pausar vista previa':'Reproducir vista previa');
    const zona = document.getElementById('juego-codigo'), plantilla = document.getElementById('juego-codigo-plantilla');
    if (jugando && zona && plantilla && !zona.childElementCount) zona.append(plantilla.content.cloneNode(true));
  });
  addEventListener('scroll',programar,{passive:true});
  addEventListener('resize',configurar,{passive:true});
  addEventListener('musuq:accesibilidad',configurar);
  reduced.addEventListener('change',configurar);
  alturasCortas.addEventListener('change',configurar);
  document.addEventListener('visibilitychange',() => {
    if (fondoActivo) Fondo.cfg.quieto = quieto() || document.hidden;
    if (document.hidden) detenerBarras();
    else {programar();animarBarras();}
  });
  addEventListener('pagehide',() => { destruido=true;cancelAnimationFrame(frame);frame=0;detenerBarras(); });
  addEventListener('pageshow',() => { destruido=false;configurar(); });
  configurar();
  document.fonts.ready.then(configurar);
  if (['#descarga','#avance'].includes(location.hash)) requestAnimationFrame(() => irA(location.hash.slice(1),true));
})();
