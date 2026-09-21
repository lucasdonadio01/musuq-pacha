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
    eventos:local('eventos.html'),
    juego:local('juego.html')
  };
  header.querySelector('.nav__marca').href = enHome ? '#territorio' : local('index.html');
  for (const enlace of header.querySelectorAll('[data-seccion-link]')) {
    const nombre = enlace.dataset.seccionLink;
    enlace.setAttribute('href', destinos[nombre]);
    enlace.toggleAttribute('aria-current', nombre === seccion);
    if (nombre === seccion) enlace.setAttribute('aria-current','page');
  }
  function seccionHome() {
    if (!enHome) return;
    const actual = ['#archivo','#eventos'].includes(location.hash) ? 'archivo' : document.body.classList.contains('en-mapa') ? 'territorio' : '';
    header.querySelectorAll('[data-seccion-link]').forEach(a => {
      if (a.dataset.seccionLink === actual) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
    });
  }
  addEventListener('hashchange', seccionHome); addEventListener('musuq:modo', seccionHome); seccionHome();
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
  try { activa = localStorage.getItem(key) === 'activa'; } catch {}
  const login = header.querySelector('#ingresar');
  const perfil = document.createElement('div');
  perfil.className = 'perfil-demo'; perfil.id = 'main-perfil-demo'; perfil.hidden = true;
  const usuario = '@tomi.rivas', nombrePorDefecto = 'Tomás Rivas';
  perfil.innerHTML = '<strong class="perfil-nombre"></strong><span class="perfil-demo__estado">'+usuario+'</span><button type="button" class="perfil-canje" data-cuenta="canjear">'+icono('qr')+'Canjear código</button><nav aria-label="Tu cuenta"><button type="button" data-cuenta="perfil">Mi perfil '+icono('login')+'</button><button type="button" class="perfil-demo__ajustes">Configuración '+icono('ajustes')+'</button><button class="perfil-demo__salir" type="button">Cerrar sesión '+icono('login')+'</button></nav>';
  header.append(perfil);
  const cuentaKey='musuq-perfil-local-v1';
  let cuenta={nombre:nombrePorDefecto,notificaciones:true};
  try{const saved=JSON.parse(localStorage.getItem(cuentaKey));if(typeof saved?.nombre==='string'&&saved.nombre!=='Tu recorrido')cuenta.nombre=saved.nombre.slice(0,40)||cuenta.nombre;if(typeof saved?.notificaciones==='boolean')cuenta.notificaciones=saved.notificaciones;}catch{}
  perfil.querySelector('.perfil-nombre').textContent=cuenta.nombre;
  const cuentaDialog=document.createElement('dialog');cuentaDialog.className='cuenta-dialog';cuentaDialog.setAttribute('aria-labelledby','cuenta-titulo');document.body.append(cuentaDialog);
  const quiet=()=>matchMedia('(prefers-reduced-motion:reduce)').matches||document.documentElement.dataset.detener==='true';
  function abrirCuenta(vista){
    if(!activa)return;
    cerrarPerfil();
    cuentaDialog.classList.remove('cuenta-dialog--logro');
    cuentaDialog.innerHTML='<div class="cuenta-cabecera"><h2 id="cuenta-titulo"></h2><button type="button" data-cuenta-cerrar aria-label="Cerrar ventana de cuenta">×</button></div><div class="cuenta-contenido"></div>';
    cuentaDialog.querySelector('h2').textContent={perfil:'Mi perfil',canjear:'Canjear código'}[vista]||'Configuración';
    const contenido=cuentaDialog.querySelector('.cuenta-contenido');
    if(vista==='perfil'){
      const foto=avatar(),nombre=document.createElement('h3');foto.classList.add('cuenta-avatar');nombre.textContent=cuenta.nombre;contenido.append(foto,nombre);
      contenido.insertAdjacentHTML('beforeend','<p class="cuenta-handle">'+usuario+'</p><h3>Tus territorios desbloqueados</h3><div class="cuenta-territorios"><a href="'+local('index.html?pueblo=11')+'">Qom</a><a href="'+local('index.html?pueblo=14')+'">Querandí</a><a href="'+local('index.html?pueblo=2')+'">Omaguaca</a></div><button class="cuenta-primario" type="button" data-editar-perfil>Editar perfil</button>');
      contenido.querySelector('[data-editar-perfil]').onclick=()=>abrirCuenta('configuracion');
    }else if(vista==='canjear'){
      armarCanje(contenido);
    }else{
      contenido.innerHTML='<form class="cuenta-form"><label>Nombre de perfil<input name="nombre" maxlength="40" required autocomplete="nickname"></label><label class="cuenta-check"><span>Mostrar avisos de territorios desbloqueados</span><input name="notificaciones" type="checkbox"></label><button type="button" class="cuenta-accesibilidad">Ajustes de accesibilidad</button><button class="cuenta-primario" type="submit">Guardar cambios</button><p role="status" class="cuenta-estado"></p></form>';
      const form=contenido.querySelector('form');form.elements.nombre.value=cuenta.nombre;form.elements.notificaciones.checked=cuenta.notificaciones;
      form.onsubmit=e=>{e.preventDefault();cuenta.nombre=form.elements.nombre.value.trim()||nombrePorDefecto;cuenta.notificaciones=form.elements.notificaciones.checked;perfil.querySelector('.perfil-nombre').textContent=cuenta.nombre;try{localStorage.setItem(cuentaKey,JSON.stringify(cuenta));contenido.querySelector('[role=status]').textContent='Cambios guardados.';}catch{contenido.querySelector('[role=status]').textContent='Cambios aplicados en esta visita.';}};
      contenido.querySelector('.cuenta-accesibilidad').onclick=()=>{cerrarCuenta(true);document.getElementById('abrir-accesibilidad').click();};
    }
    cuentaDialog.querySelector('[data-cuenta-cerrar]').onclick=()=>cerrarCuenta();
    if(!cuentaDialog.open)cuentaDialog.showModal();
    if(!quiet())cuentaDialog.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:240,easing:'cubic-bezier(.16,1,.3,1)'});
    cuentaDialog.querySelector('[data-cuenta-cerrar]').focus();
  }
  /* Prevención de errores del canje: el primer intento se completa con una letra cambiada, el
     aviso lo marca como inválido y "Escribir de nuevo" completa el código correcto. */
  const errorCodigo=document.createElement('dialog');errorCodigo.className='cuenta-error';
  errorCodigo.setAttribute('aria-labelledby','cuenta-error-titulo');errorCodigo.setAttribute('aria-describedby','cuenta-error-texto');
  errorCodigo.innerHTML='<span class="cuenta-error__icono" aria-hidden="true"><svg viewBox="0 -960 960 960" focusable="false"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg></span><h3 id="cuenta-error-titulo">Este código no es válido</h3><p id="cuenta-error-texto">Revisá que las letras estén bien escritas y en orden. Los códigos tienen seis letras.</p><button class="cuenta-primario" type="button">Escribir de nuevo</button>';
  document.body.append(errorCodigo);
  let alCerrarError=null;
  const cerrarError=()=>{if(!errorCodigo.open)return;errorCodigo.close();const seguir=alCerrarError;alCerrarError=null;seguir?.();};
  errorCodigo.querySelector('button').addEventListener('click',cerrarError);
  errorCodigo.addEventListener('cancel',e=>{e.preventDefault();cerrarError();});
  errorCodigo.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();cerrarError();}});
  function armarCanje(contenido){
    const codigo='PAMPAS',codigoErrado='PAMAPS';let intento=0;
    contenido.innerHTML='<form class="cuenta-form cuenta-canje"><p class="cuenta-canje__ayuda">Ingresá el código que recibiste en un evento o en el juego. Tocá el campo y lo completamos por vos.</p><label>Código<input name="codigo" maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" required></label><button class="cuenta-primario" type="submit" disabled>Canjear</button><p role="status" class="cuenta-estado"></p></form>';
    const form=contenido.querySelector('form'),campo=form.elements.codigo,boton=form.querySelector('[type=submit]'),estado=form.querySelector('[role=status]');
    let fase='vacio';
    const completar=async()=>{
      if(fase!=='vacio')return;fase='llenando';form.classList.add('cuenta-canje--escribiendo');
      const escrito=intento===0?codigoErrado:codigo;
      for(let i=1;i<=escrito.length;i++){campo.value=escrito.slice(0,i);if(!quiet())await new Promise(r=>setTimeout(r,110));}
      form.classList.remove('cuenta-canje--escribiendo');fase='listo';boton.disabled=false;estado.textContent='Código listo. Tocá Canjear.';
      if(intento>0)boton.focus();
    };
    const reescribir=()=>{
      form.inert=false;form.classList.remove('cuenta-canje--error');campo.removeAttribute('aria-invalid');
      campo.value='';boton.disabled=true;estado.textContent='';fase='vacio';intento=1;completar();
    };
    campo.addEventListener('pointerdown',completar);campo.addEventListener('focus',completar);
    form.onsubmit=e=>{
      e.preventDefault();if(fase!=='listo')return;
      if(campo.value.trim().toUpperCase()!==codigo){
        form.classList.add('cuenta-canje--error');campo.setAttribute('aria-invalid','true');estado.textContent='';
        if(!quiet())campo.animate([{transform:'translateX(0)'},{transform:'translateX(-8px)'},{transform:'translateX(7px)'},{transform:'translateX(-4px)'},{transform:'translateX(0)'}],{duration:320,easing:'ease-out'});
        form.inert=true;alCerrarError=reescribir;errorCodigo.showModal();errorCodigo.querySelector('button').focus();
        if(!quiet())errorCodigo.animate([{opacity:0,transform:'translateY(12px) scale(.97)'},{opacity:1,transform:'none'}],{duration:260,easing:'cubic-bezier(.16,1,.3,1)'});
        return;
      }
      contenido.innerHTML='<div class="cuenta-logro" role="status"><canvas width="260" height="260" aria-hidden="true"></canvas><p class="cuenta-canje__codigo">'+codigo+'</p><h3>¡Código canjeado!</h3><p>La recompensa ya está en tu partida. La vas a ver en tu inventario la próxima vez que abras Musuq Pacha.</p><button class="cuenta-primario" type="button" data-cuenta-listo>Listo</button></div>';
      cuentaDialog.classList.add('cuenta-dialog--logro');
      if(!quiet())cuentaDialog.animate([{opacity:0},{opacity:1}],{duration:380,easing:'ease-out'});
      animarLogro(contenido.querySelector('canvas'));
      const listo=contenido.querySelector('[data-cuenta-listo]');listo.onclick=()=>cerrarCuenta();listo.focus();
    };
  }
  const verdes=['#1F8A4C','#34C46A','#8BE3A8','#0F5A2B','#C6F5D3'];
  const RUTA_QR='M520-120v-80h80v80h-80Zm-80-80v-200h80v200h-80Zm320-120v-160h80v160h-80Zm-80-160v-80h80v80h-80Zm-480 80v-80h80v80h-80Zm-80-80v-80h80v80h-80Zm360-280v-80h80v80h-80ZM180-660h120v-120H180v120Zm-60 60v-240h240v240H120Zm60 420h120v-120H180v120Zm-60 60v-240h240v240H120Zm540-540h120v-120H660v120Zm-60 60v-240h240v240H600Zm80 480v-120h-80v-80h160v120h80v80H680ZM520-400v-80h160v80H520Zm-160 0v-80h-80v-80h240v80h-80v80h-80Zm40-200v-160h80v80h80v80H400Zm-190-90v-60h60v60h-60Zm0 480v-60h60v60h-60Zm480-480v-60h60v60h-60Z';
  const RUTA_CHECK='M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z';
  function grillaDe(ruta,lado,color,grosor=0){
    const px=8,c=document.createElement('canvas');c.width=c.height=lado*px;const x=c.getContext('2d');
    const escala=(lado-4)*px/720,forma=new Path2D(ruta);x.setTransform(escala,0,0,escala,2*px-120*escala,2*px+(960-120)*escala);x.fill(forma);
    if(grosor){x.lineWidth=grosor;x.stroke(forma);}
    const datos=x.getImageData(0,0,c.width,c.height).data,grilla=new Map();
    for(let gy=0;gy<lado;gy++)for(let gx=0;gx<lado;gx++){let suma=0;for(let yy=0;yy<px;yy++)for(let xx=0;xx<px;xx++)suma+=datos[((gy*px+yy)*c.width+gx*px+xx)*4+3];if(suma/(px*px*255)>.42)grilla.set(gx+','+gy,color);}
    return grilla;
  }
  const conMotor=()=>typeof Motor!=='undefined'?Promise.resolve(true):new Promise(listo=>{const s=document.createElement('script');s.src=local('simbolos/js/motor.js?v=ranking-morph-1');s.onload=()=>listo(typeof Motor!=='undefined');s.onerror=()=>listo(false);document.head.append(s);});
  async function animarLogro(lienzo){
    const lado=16,ctx=lienzo.getContext('2d'),check=grillaDe(RUTA_CHECK,lado,'#34C46A',60);
    const pintarFijo=grilla=>{const t=lienzo.clientWidth||260,dpr=Math.min(devicePixelRatio||1,2);lienzo.width=lienzo.height=Math.round(t*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);const celda=t/lado;grilla.forEach((color,k)=>{const[x,y]=k.split(',').map(Number);ctx.fillStyle=color;ctx.fillRect(x*celda,y*celda,Math.ceil(celda),Math.ceil(celda));});};
    if(quiet()||!await conMotor()){pintarFijo(check);return;}
    const motor=Motor.crear(lado),inicio=performance.now();let etapa=0,ultimo=inicio,semilla=(Math.random()*0xffffffff)>>>0;
    motor.cargar(grillaDe(RUTA_QR,lado,'#E4FE44'),inicio);
    const cuadro=ahora=>{
      if(!cuentaDialog.open||!lienzo.isConnected)return;
      if(etapa===0&&ahora-inicio>1700){etapa=1;motor.cargar(check,ahora);ultimo=ahora;}
      else if(etapa===1&&ahora-ultimo>1900){etapa=2;motor.generar(ahora,semilla,verdes);ultimo=ahora;}
      else if(etapa===2&&ahora-ultimo>2600){semilla=(semilla*2654435761+1)>>>0;motor.generar(ahora,semilla,verdes);ultimo=ahora;}
      const t=lienzo.clientWidth||260,dpr=Math.min(devicePixelRatio||1,2);if(lienzo.width!==Math.round(t*dpr))lienzo.width=lienzo.height=Math.round(t*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,t,t);motor.dibujar(ctx,0,0,t/lado,ahora);
      requestAnimationFrame(cuadro);
    };
    requestAnimationFrame(cuadro);
  }
  function cerrarCuenta(sinFoco=false){
    if(!cuentaDialog.open)return;
    cuentaDialog.dataset.sinFoco=sinFoco?'true':'';
    if(quiet()){cuentaDialog.close();return;}
    cuentaDialog.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translateY(10px)'}],{duration:180,easing:'ease-in'}).finished.then(()=>cuentaDialog.close());
  }
  cuentaDialog.addEventListener('cancel',e=>{e.preventDefault();cerrarCuenta();});
  cuentaDialog.addEventListener('close',()=>{cuentaDialog.classList.remove('cuenta-dialog--logro');if(!cuentaDialog.dataset.sinFoco)login.focus({preventScroll:true});cuentaDialog.dataset.sinFoco='';});
  cuentaDialog.addEventListener('click',e=>{if(e.target!==cuentaDialog)return;const r=cuentaDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)cerrarCuenta();});
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
  }
  function cambiarSesion(valor, persistir = true) {
    activa = valor; cerrarPerfil(); dibujarSesion();
    if (persistir) try { if(activa)localStorage.setItem(key,'activa');else localStorage.removeItem(key); } catch {}
    dispatchEvent(new CustomEvent('musuq:sesion',{detail:{activa}}));
  }
  login.addEventListener('click', () => {
    cerrarNavegacion();
    if (!activa) {
      if (window.MUSUQ_ACCESO) { window.MUSUQ_ACCESO.abrir({origen:login, nombre:cuenta.nombre, alEntrar:() => cambiarSesion(true)}); return; }
      cambiarSesion(true); perfil.hidden = false;
    }
    else perfil.hidden = !perfil.hidden;
    login.setAttribute('aria-expanded',String(!perfil.hidden));
  });
  perfil.querySelector('.perfil-demo__salir').addEventListener('click', () => { if(cuentaDialog.open)cuentaDialog.close();cambiarSesion(false); login.focus(); });
  addEventListener('storage',e => { if(e.key === key || e.key === null)cambiarSesion(e.key === null ? false : e.newValue === 'activa',false); });
  window.MUSUQ_SESION = {get activa(){return activa;}, avatar};
  dibujarSesion();
  document.querySelectorAll('[data-pie-registro]').forEach(b => {
    b.addEventListener('click', () => {
      if (window.MUSUQ_ACCESO) {
        window.MUSUQ_ACCESO.abrir({vista:'registro', origen:b, nombre:cuenta.nombre, alEntrar:() => cambiarSesion(true)});
      }
    });
  });
  document.querySelectorAll('[data-pie-accesibilidad]').forEach(b => {
    b.addEventListener('click', () => {
      document.getElementById('abrir-accesibilidad')?.click();
    });
  });
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
