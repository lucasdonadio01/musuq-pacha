/* Encabezado principal de Musuq Pacha. La plantilla y los íconos viven en header-plantilla.js.
   Montar antes de sonido, accesibilidad y las experiencias de cada página. Sin fetch/build. */
(() => {
  'use strict';
  const header = document.getElementById('header');
  if (!header || header.dataset.montado || !window.MUSUQ_HEADER_PLANTILLA) return;
  const seccion = header.dataset.seccion || 'territorio';
  const base = new URL('../', document.currentScript.src);
  const plantillas = window.MUSUQ_HEADER_PLANTILLA;
  const local = ruta => new URL(ruta, base).href;
  const enHome = header.dataset.home === 'true';
  const icono = nombre => `<svg aria-hidden="true" focusable="false"><use href="#main-${nombre}"/></svg>`;
  header.className = 'nav site-header';
  header.innerHTML = plantillas.header;
  header.dataset.montado = 'true';
  document.body.insertAdjacentHTML('beforeend', plantillas.iconos + plantillas.accesibilidad);
  const destinos = {
    territorio:enHome ? '#territorio' : local('index.html#territorio'),
    archivo:local('archivo.html')
  };
  header.querySelector('.nav__marca').href = enHome ? '#territorio' : local('index.html');
  for (const enlace of header.querySelectorAll('[data-seccion-link]')) {
    const nombre = enlace.dataset.seccionLink;
    enlace.setAttribute('href', destinos[nombre]);
    enlace.toggleAttribute('aria-current', nombre === seccion);
    if (nombre === seccion) enlace.setAttribute('aria-current','page');
  }
  // Comunidad está dentro del home; no se pierde el estado activo al saltar a ella.
  function seccionHome() {
    if (!enHome) return;
    const actual = 'territorio';
    header.querySelectorAll('[data-seccion-link]').forEach(a => {
      if (a.dataset.seccionLink === actual) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
    });
  }
  addEventListener('hashchange', seccionHome); seccionHome();
  const nav = header.querySelector('.nav__links'), menu = header.querySelector('.nav__menu');
  const movil = matchMedia('(max-width:1100px)');
  function cerrarNavegacion(foco = false) {
    header.classList.remove('site-header--menu');
    menu.setAttribute('aria-expanded','false');
    if (foco) menu.focus();
  }
  menu.addEventListener('click', () => {
    const abierta = header.classList.toggle('site-header--menu');
    menu.setAttribute('aria-expanded',String(abierta));
    cerrarPerfil();
  });
  nav.addEventListener('click', e => { if (e.target.closest('a')) cerrarNavegacion(); });
  movil.addEventListener('change', () => cerrarNavegacion());

  const key = 'musuq-sesion-demo-v1';
  let activa = false;
  try { activa = localStorage.getItem(key) === 'activa'; } catch { /* Sesión en memoria. */ }
  const login = header.querySelector('#ingresar');
  const perfil = document.createElement('div');
  perfil.className = 'perfil-demo'; perfil.id = 'main-perfil-demo'; perfil.hidden = true;
  perfil.innerHTML = '<strong>Tu recorrido</strong><span class="perfil-demo__estado">Sesión demo</span><p>Tenés desbloqueados Qom, Querandí y Omaguaca. Los demás pueblos siguen siendo explorables.</p><button class="perfil-demo__salir" type="button">Cerrar sesión demo</button>';
  header.append(perfil);
  function avatar(semilla = 1907, indice = 0) {
    const canvas = document.createElement('canvas');
    canvas.className = 'perfil-patron'; canvas.width = canvas.height = 81; canvas.setAttribute('aria-hidden','true');
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    if (typeof Motor !== 'undefined' && typeof PUEBLOS !== 'undefined' && PUEBLOS.length) {
      const pueblo = PUEBLOS[indice % PUEBLOS.length];
      const motor = Motor.crear(9); motor.quieto = true;
      motor.generar(0,semilla,Motor.paletaContra(pueblo.colores,pueblo.fondo,3));
      ctx.fillStyle = pueblo.fondo; ctx.fillRect(0,0,81,81);
      for (const [pos,color] of motor.grilla) {
        const [x,y] = pos.split(',').map(Number); ctx.fillStyle = color; ctx.fillRect(x*9,y*9,9,9);
      }
    } else {
      ctx.fillStyle = '#9E6FF8'; ctx.fillRect(0,0,81,81);
      ctx.fillStyle = '#202020'; ctx.fillRect(27,9,27,63); ctx.fillRect(9,27,63,27);
    }
    return canvas;
  }
  function cerrarPerfil(foco = false) {
    perfil.hidden = true;
    if (activa) login.setAttribute('aria-expanded','false');
    if (foco) login.focus();
  }
  function dibujarSesion() {
    login.classList.toggle('nav__perfil',activa);
    login.replaceChildren();
    if (activa) {
      login.append(avatar());
      login.setAttribute('aria-label','Abrir perfil · Sesión demo');
      login.setAttribute('aria-controls',perfil.id);
      login.setAttribute('aria-expanded',String(!perfil.hidden));
      login.title = 'Sesión demo';
    } else {
      login.innerHTML = '<span class="nav__ingresar-texto">INICIAR SESIÓN</span>' + icono('flecha-derecha');
      login.setAttribute('aria-label','Iniciar sesión de demostración');
      login.removeAttribute('aria-controls'); login.removeAttribute('aria-expanded');
      login.title = 'Simular una sesión, sin cuenta real';
    }
    document.body.classList.toggle('sesion-demo',activa);
  }
  function cambiarSesion(valor, persistir = true) {
    activa = valor; cerrarPerfil(); dibujarSesion();
    if (persistir) try { if(activa)localStorage.setItem(key,'activa');else localStorage.removeItem(key); } catch { /* Persistencia opcional. */ }
    dispatchEvent(new CustomEvent('musuq:sesion',{detail:{activa}}));
  }
  login.addEventListener('click', () => {
    cerrarNavegacion();
    if (!activa) { cambiarSesion(true); perfil.hidden = false; }
    else perfil.hidden = !perfil.hidden;
    login.setAttribute('aria-expanded',String(!perfil.hidden));
  });
  perfil.querySelector('button').addEventListener('click', () => { cambiarSesion(false); login.focus(); });
  addEventListener('storage',e => { if(e.key === key || e.key === null)cambiarSesion(e.key === null ? false : e.newValue === 'activa',false); });
  window.MUSUQ_SESION = {get activa(){return activa;}, avatar};
  dibujarSesion();
  document.addEventListener('click',e => {if(!e.composedPath().includes(header)){cerrarPerfil();cerrarNavegacion();}});
  document.addEventListener('keydown',e => {
    if (e.key !== 'Escape' || document.querySelector('dialog[open]')) return;
    if (!perfil.hidden) { e.preventDefault();e.stopImmediatePropagation();cerrarPerfil(true); }
    else if (header.classList.contains('site-header--menu')) { e.preventDefault();e.stopImmediatePropagation();cerrarNavegacion(true); }
  },true);
  header.addEventListener('wheel', e => e.stopPropagation(), {passive:true});
  header.addEventListener('touchmove', e => e.stopPropagation(), {passive:true});
  new ResizeObserver(() => {
    const alto = Math.ceil(header.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--site-header-height',alto+'px');
  }).observe(header);
})();
