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
    archivo:enHome ? '#archivo' : local('index.html#archivo'),
    juego:local('juego.html')
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
    const actual = ['#archivo','#eventos'].includes(location.hash) ? 'archivo' : 'territorio';
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
  perfil.innerHTML = '<strong class="perfil-nombre"></strong><span class="perfil-demo__estado">@tu.recorrido</span><p class="perfil-notificacion">Tenés desbloqueados <strong>Qom, Querandí y Omaguaca</strong>.</p><nav aria-label="Tu cuenta"><button type="button" data-cuenta="perfil">Mi perfil '+icono('login')+'</button><button type="button" data-cuenta="configuracion">Configuración '+icono('acceso')+'</button><button class="perfil-demo__salir" type="button">Cerrar sesión '+icono('login')+'</button></nav>';
  header.append(perfil);
  const cuentaKey='musuq-perfil-local-v1';
  let cuenta={nombre:'Tu recorrido',notificaciones:true};
  try{const saved=JSON.parse(localStorage.getItem(cuentaKey));if(typeof saved?.nombre==='string')cuenta.nombre=saved.nombre.slice(0,40)||cuenta.nombre;if(typeof saved?.notificaciones==='boolean')cuenta.notificaciones=saved.notificaciones;}catch{}
  perfil.querySelector('.perfil-nombre').textContent=cuenta.nombre;
  const cuentaDialog=document.createElement('dialog');cuentaDialog.className='cuenta-dialog';cuentaDialog.setAttribute('aria-labelledby','cuenta-titulo');document.body.append(cuentaDialog);
  const quiet=()=>matchMedia('(prefers-reduced-motion:reduce)').matches||document.documentElement.dataset.detener==='true';
  function abrirCuenta(vista){
    if(!activa)return;
    cerrarPerfil();
    cuentaDialog.innerHTML='<div class="cuenta-cabecera"><h2 id="cuenta-titulo"></h2><button type="button" data-cuenta-cerrar aria-label="Cerrar ventana de cuenta">×</button></div><div class="cuenta-contenido"></div>';
    cuentaDialog.querySelector('h2').textContent=vista==='perfil'?'Mi perfil':'Configuración';
    const contenido=cuentaDialog.querySelector('.cuenta-contenido');
    if(vista==='perfil'){
      const foto=avatar(),nombre=document.createElement('h3');foto.classList.add('cuenta-avatar');nombre.textContent=cuenta.nombre;contenido.append(foto,nombre);
      contenido.insertAdjacentHTML('beforeend','<p class="cuenta-handle">@tu.recorrido</p><h3>Tus territorios desbloqueados</h3><div class="cuenta-territorios"><a href="'+local('index.html?pueblo=11')+'">Qom</a><a href="'+local('index.html?pueblo=14')+'">Querandí</a><a href="'+local('index.html?pueblo=2')+'">Omaguaca</a></div><button class="cuenta-primario" type="button" data-editar-perfil>Editar perfil</button>');
      contenido.querySelector('[data-editar-perfil]').onclick=()=>abrirCuenta('configuracion');
    }else{
      contenido.innerHTML='<form class="cuenta-form"><label>Nombre de perfil<input name="nombre" maxlength="40" required autocomplete="nickname"></label><label class="cuenta-check"><span>Mostrar avisos de territorios desbloqueados</span><input name="notificaciones" type="checkbox"></label><button type="button" class="cuenta-accesibilidad">Ajustes de accesibilidad</button><button class="cuenta-primario" type="submit">Guardar cambios</button><p role="status" class="cuenta-estado"></p></form>';
      const form=contenido.querySelector('form');form.elements.nombre.value=cuenta.nombre;form.elements.notificaciones.checked=cuenta.notificaciones;
      form.onsubmit=e=>{e.preventDefault();cuenta.nombre=form.elements.nombre.value.trim()||'Tu recorrido';cuenta.notificaciones=form.elements.notificaciones.checked;perfil.querySelector('.perfil-nombre').textContent=cuenta.nombre;perfil.querySelector('.perfil-notificacion').hidden=!cuenta.notificaciones;try{localStorage.setItem(cuentaKey,JSON.stringify(cuenta));contenido.querySelector('[role=status]').textContent='Cambios guardados.';}catch{contenido.querySelector('[role=status]').textContent='Cambios aplicados en esta visita.';}};
      contenido.querySelector('.cuenta-accesibilidad').onclick=()=>{cuentaDialog.close();document.getElementById('abrir-accesibilidad').click();};
    }
    cuentaDialog.querySelector('[data-cuenta-cerrar]').onclick=()=>cuentaDialog.close();
    if(!cuentaDialog.open)cuentaDialog.showModal();
    if(!quiet())cuentaDialog.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:240,easing:'cubic-bezier(.16,1,.3,1)'});
    cuentaDialog.querySelector('[data-cuenta-cerrar]').focus();
  }
  cuentaDialog.addEventListener('close',()=>login.focus({preventScroll:true}));
  cuentaDialog.addEventListener('click',e=>{if(e.target!==cuentaDialog)return;const r=cuentaDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)cuentaDialog.close();});
  perfil.querySelectorAll('[data-cuenta]').forEach(b=>b.addEventListener('click',()=>abrirCuenta(b.dataset.cuenta)));
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
      login.setAttribute('aria-label','Abrir menú de cuenta');
      login.setAttribute('aria-controls',perfil.id);
      login.setAttribute('aria-expanded',String(!perfil.hidden));
      login.title = cuenta.nombre;
    } else {
      login.innerHTML = '<span class="nav__ingresar-texto">INICIAR</span>' + icono('login');
      login.setAttribute('aria-label','Iniciar sesión');
      login.removeAttribute('aria-controls'); login.removeAttribute('aria-expanded');
      login.title = 'Iniciar sesión';
    }
    document.body.classList.toggle('sesion-demo',activa);
    perfil.querySelector('.perfil-notificacion').hidden=!cuenta.notificaciones;
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
  perfil.querySelector('.perfil-demo__salir').addEventListener('click', () => { if(cuentaDialog.open)cuentaDialog.close();cambiarSesion(false); login.focus(); });
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
