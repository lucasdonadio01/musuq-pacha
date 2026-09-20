(() => {
  'use strict';
  const quieto = () => matchMedia('(prefers-reduced-motion:reduce)').matches || document.documentElement.dataset.detener === 'true';
  const esperar = ms => new Promise(r => setTimeout(r, ms));
  const c01 = v => Math.max(0, Math.min(1, v));
  const salida3 = t => 1 - Math.pow(1 - t, 3);
  const suave = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const rebote = t => { const a = 1.70158, b = a + 1; return t <= 0 ? 0 : 1 + b * Math.pow(t - 1, 3) + a * Math.pow(t - 1, 2); };
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const LIMA = rgb('#E4FE44'), PANEL = rgb('#1A1A1A'), VERDE = rgb('#34C46A');
  const mezcla = (a, b, t) => 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',') + ')';
  const desvanecer = (elementos, ms) => Promise.race([Promise.all(elementos.map(el => el.animate([{opacity:1}, {opacity:0}], {duration:ms, fill:'forwards'}).finished.catch(() => {}))), esperar(ms + 120)]);
  const icono = (caja, cuerpo) => '<svg viewBox="' + caja + '" aria-hidden="true" focusable="false">' + cuerpo + '</svg>';
  const ICONOS = {
    cerrar: icono('0 -960 960 960', '<path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>'),
    flecha: icono('0 -960 960 960', '<path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/>'),
    google: icono('0 0 24 24', '<path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>'),
    steam: icono('0 0 24 24', '<path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"/>'),
    xbox: icono('0 0 24 24', '<path d="M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967 1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912C23.002 17.48 24 14.861 24 12.004c0-3.34-1.365-6.362-3.57-8.536 0 0-.027-.022-.082-.042-.063-.022-.152-.045-.281-.045-.592 0-1.985.434-4.805 3.246zM3.654 3.426c-.057.02-.082.041-.086.042C1.365 5.642 0 8.664 0 12.004c0 2.854.998 5.473 2.661 7.533-1.401-2.605 3.579-9.951 6.08-12.91-2.82-2.813-4.216-3.245-4.806-3.245-.131 0-.223.021-.281.046v-.002zM12 3.551S9.055 1.828 6.755 1.746c-.903-.033-1.454.295-1.521.339C7.379.646 9.659 0 11.984 0H12c2.334 0 4.605.646 6.766 2.085-.068-.046-.615-.372-1.52-.339C14.946 1.828 12 3.545 12 3.545v.006z"/>'),
    playstation: icono('0 0 24 24', '<path d="M8.984 2.596v17.547l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.18.76.814.76 1.505v5.875c2.441 1.193 4.362-.002 4.362-3.152 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.39-1.502zm4.656 16.241l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.5V14.98l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.785.03 5.437.661 1.848.601 2.04 1.472 1.576 2.072-.465.6-1.622 1.036-1.622 1.036l-8.544 3.107V18.86zM1.807 18.6c-1.9-.545-2.214-1.668-1.352-2.32.801-.586 2.16-1.052 2.16-1.052l5.615-2.013v2.313L4.205 17c-.705.271-.825.632-.239.826.586.195 1.637.15 2.343-.12L8.247 17v2.074c-.12.03-.256.044-.39.073-1.939.331-3.996.196-6.038-.479z"/>')
  };
  const PROVEEDORES = [{id:'google', nombre:'Google'}, {id:'steam', nombre:'Steam'}, {id:'xbox', nombre:'Xbox'}, {id:'playstation', nombre:'PlayStation'}];
  const RUTA_CHECK = 'M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z';
  let opciones = {};
  const nombreCompleto = () => opciones.nombre || 'Tomás Rivas';
  const saludo = () => '¡Hola, ' + nombreCompleto().split(' ')[0] + '!';
  const VISTAS = {
    ingreso: {
      titulo: 'Iniciá sesión',
      bajada: 'Guardá tus símbolos, votá en el ranking y colaborá con el archivo.',
      campos: [
        {nombre:'usuario', etiqueta:'Usuario o email', tipo:'text', auto:'username', valor:() => 'tomi.rivas'},
        {nombre:'clave', etiqueta:'Contraseña', tipo:'password', auto:'current-password', valor:() => 'pampa-viva-24'}
      ],
      check: 'Mantener sesión iniciada', marcado: true,
      boton: 'Iniciar sesión', cargando: 'Ingresando…',
      separador: 'o ingresá con',
      pie: ['¿Primera vez en Musuq Pacha?', 'Creá tu cuenta', 'registro'],
      logro: () => [saludo(), 'Sesión iniciada']
    },
    registro: {
      titulo: 'Creá tu cuenta',
      bajada: 'Es gratis. Tu recorrido por el territorio, el archivo y el juego queda guardado.',
      campos: [
        {nombre:'nombre', etiqueta:'Nombre', tipo:'text', auto:'name', valor:nombreCompleto, medio:true},
        {nombre:'usuario', etiqueta:'Usuario', tipo:'text', auto:'username', valor:() => 'tomi.rivas', medio:true},
        {nombre:'email', etiqueta:'Email', tipo:'email', auto:'email', valor:() => 'tomas.rivas@ejemplo.com'},
        {nombre:'clave', etiqueta:'Contraseña', tipo:'password', auto:'new-password', valor:() => 'pampa-viva-24'}
      ],
      check: 'Quiero recibir novedades de eventos', marcado: false,
      boton: 'Crear cuenta', cargando: 'Creando tu cuenta…',
      separador: 'o registrate con',
      pie: ['¿Ya tenés cuenta?', 'Iniciá sesión', 'ingreso'],
      logro: () => ['¡Listo, ' + nombreCompleto().split(' ')[0] + '!', 'Cuenta creada y sesión iniciada']
    }
  };
  let dialogo, lienzo, ctx, panel, logro, vista = 'ingreso', fase = 'vacio', serie = 0, ocupado = false, cerrando = false, confirmando = false, salirConfirmacion = null;

  function montar() {
    if (dialogo) return;
    dialogo = document.createElement('dialog');
    dialogo.className = 'acceso';
    dialogo.setAttribute('aria-labelledby', 'acceso-titulo');
    dialogo.innerHTML = '<canvas class="acceso-pixeles" aria-hidden="true"></canvas><div class="acceso-marco"><section class="acceso-panel"></section></div><div class="acceso-logro" hidden><div role="status"><h2></h2><p></p></div><a class="acceso-logro__accion" hidden></a></div>';
    document.body.append(dialogo);
    lienzo = dialogo.querySelector('canvas'); ctx = lienzo.getContext('2d');
    panel = dialogo.querySelector('.acceso-panel'); logro = dialogo.querySelector('.acceso-logro');
    dialogo.addEventListener('cancel', e => { e.preventDefault(); if (confirmando) salirConfirmacion?.(false); else if (!ocupado) cerrar(); });
    dialogo.addEventListener('click', e => { if ((e.target === dialogo || e.target.classList.contains('acceso-marco')) && !ocupado && dialogo.classList.contains('acceso--armado')) cerrar(); });
    dialogo.addEventListener('close', () => {
      serie++; ocupado = cerrando = confirmando = false; salirConfirmacion = null; logro.hidden = true; logro.querySelector('a').hidden = true;
      dialogo.classList.remove('acceso--armado', 'acceso--visible');
      preparar();
      opciones.origen?.focus({preventScroll:true});
    });
  }

  const campoHTML = c => '<label class="acceso-campo' + (c.medio ? ' acceso-campo--medio' : '') + (c.tipo === 'password' ? ' acceso-campo--clave' : '') + '"><span class="acceso-etiqueta">' + c.etiqueta + '</span><span class="acceso-entrada"><input name="' + c.nombre + '" type="' + c.tipo + '" autocomplete="' + c.auto + '" spellcheck="false" autocapitalize="off" required>' + (c.tipo === 'password' ? '<button type="button" class="acceso-mostrar" aria-pressed="false">Mostrar</button>' : '') + '</span></label>';

  function pintar() {
    const v = VISTAS[vista];
    serie++; fase = 'vacio';
    panel.innerHTML = '<button type="button" class="acceso-cerrar" aria-label="Cerrar">' + ICONOS.cerrar + '</button>'
      + '<p class="acceso-rotulo">Musuq Pacha</p>'
      + '<h2 id="acceso-titulo" tabindex="-1">' + v.titulo + '</h2>'
      + '<p class="acceso-bajada">' + v.bajada + '</p>'
      + '<form class="acceso-form" novalidate>' + v.campos.map(campoHTML).join('')
      + '<label class="acceso-check"><input type="checkbox" name="extra"' + (v.marcado ? ' checked' : '') + '><span>' + v.check + '</span></label>'
      + '<button type="submit" class="acceso-enviar"><span>' + v.boton + '</span>' + ICONOS.flecha + '</button>'
      + '<p class="acceso-estado" role="status"></p></form>'
      + '<p class="acceso-separador">' + v.separador + '</p>'
      + '<div class="acceso-proveedores">' + PROVEEDORES.map(p => '<button type="button" class="acceso-proveedor acceso-proveedor--' + p.id + '" data-proveedor="' + p.id + '">' + ICONOS[p.id] + '<span>' + p.nombre + '</span></button>').join('') + '</div>'
      + '<p class="acceso-pie">' + v.pie[0] + ' <button type="button" data-vista="' + v.pie[2] + '">' + v.pie[1] + '</button></p>';
    [...panel.children].forEach((el, i) => el.style.setProperty('--i', i));
    const form = panel.querySelector('form'), estado = form.querySelector('.acceso-estado');
    panel.querySelector('.acceso-cerrar').onclick = () => { if (!ocupado) cerrar(); };
    panel.querySelector('[data-vista]').onclick = e => cambiarVista(e.currentTarget.dataset.vista);
    const mostrar = form.querySelector('.acceso-mostrar');
    mostrar.onclick = () => {
      const entrada = mostrar.previousElementSibling, ver = entrada.type === 'password';
      entrada.type = ver ? 'text' : 'password'; mostrar.textContent = ver ? 'Ocultar' : 'Mostrar'; mostrar.setAttribute('aria-pressed', String(ver));
    };
    const disparar = e => { if (fase === 'vacio' && e.target.matches('input:not([type=checkbox])')) completar(form, estado); };
    form.addEventListener('pointerdown', disparar);
    form.addEventListener('focusin', disparar);
    form.onsubmit = async e => {
      e.preventDefault();
      if (ocupado || fase === 'llenando') return;
      if (fase === 'vacio') { await completar(form, estado); if (!form.isConnected) return; }
      const boton = form.querySelector('.acceso-enviar');
      boton.querySelector('span').textContent = VISTAS[vista].cargando;
      entrar(VISTAS[vista].logro(), boton);
    };
    panel.querySelectorAll('[data-proveedor]').forEach(b => b.onclick = () => {
      const p = PROVEEDORES.find(x => x.id === b.dataset.proveedor);
      form.querySelector('.acceso-estado').textContent = 'Conectando con ' + p.nombre + '…';
      entrar([saludo(), 'Sesión iniciada con ' + p.nombre], b);
    });
  }

  async function completar(form, estado) {
    const propia = serie, v = VISTAS[vista];
    fase = 'llenando'; estado.textContent = 'Completando tus datos…';
    for (const c of v.campos) {
      const entrada = form.elements[c.nombre], caja = entrada.closest('.acceso-campo'), valor = c.valor();
      caja.classList.add('acceso-campo--escribiendo');
      if (quieto()) entrada.value = valor;
      else for (let i = 1; i <= valor.length; i++) { if (propia !== serie) return; entrada.value = valor.slice(0, i); await esperar(24); }
      caja.classList.remove('acceso-campo--escribiendo');
      await esperar(quieto() ? 0 : 70);
      if (propia !== serie) return;
    }
    form.elements.extra.checked = true;
    fase = 'listo'; estado.textContent = 'Datos completos. Tocá ' + v.boton + '.';
  }

  async function cambiarVista(nueva) {
    if (ocupado || nueva === vista) return;
    const alto = panel.offsetHeight;
    if (!quieto()) await desvanecer([...panel.children], 140);
    vista = nueva; pintar();
    if (!quieto()) panel.animate([{height:alto + 'px'}, {height:panel.offsetHeight + 'px'}], {duration:380, easing:'cubic-bezier(.16,1,.3,1)'});
    panel.querySelector('h2').focus({preventScroll:true});
  }

  function preparar() {
    const dpr = Math.min(devicePixelRatio || 1, 2), w = innerWidth, h = innerHeight;
    if (lienzo.width !== Math.round(w * dpr) || lienzo.height !== Math.round(h * dpr)) { lienzo.width = Math.round(w * dpr); lienzo.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
  }
  function correr(duracion, cuadro, luego) {
    preparar(); cuadro(0); luego?.();
    return new Promise(listo => {
      const inicio = performance.now(); let fin = false;
      const terminar = () => { if (fin) return; fin = true; preparar(); cuadro(duracion); listo(); };
      const paso = ahora => { if (fin) return; const t = ahora - inicio; if (t >= duracion) { terminar(); return; } preparar(); cuadro(t); requestAnimationFrame(paso); };
      requestAnimationFrame(paso); setTimeout(terminar, duracion + 600);
    });
  }
  function celdas(r) {
    const base = innerWidth <= 700 ? 22 : 30, cols = Math.max(4, Math.round(r.width / base)), filas = Math.max(4, Math.round(r.height / base));
    const w = r.width / cols, h = r.height / filas, lista = [];
    for (let y = 0; y < filas; y++) for (let x = 0; x < cols; x++) lista.push({x:r.left + x * w, y:r.top + y * h, w, h, cx:r.left + (x + .5) * w, cy:r.top + (y + .5) * h, azar:Math.random()});
    return lista;
  }
  const centroVisible = r => ({x:r.left + r.width / 2, y:(Math.max(r.top, 0) + Math.min(r.bottom, innerHeight)) / 2});
  function grillaCheck(n) {
    const px = 8, c = document.createElement('canvas'); c.width = c.height = n * px;
    const x = c.getContext('2d'), escala = (n - 4) * px / 720, forma = new Path2D(RUTA_CHECK);
    x.setTransform(escala, 0, 0, escala, 2 * px - 120 * escala, 2 * px + 840 * escala);
    x.fill(forma); x.lineWidth = 60; x.stroke(forma);
    const datos = x.getImageData(0, 0, c.width, c.height).data, lista = [];
    for (let gy = 0; gy < n; gy++) for (let gx = 0; gx < n; gx++) {
      let suma = 0;
      for (let yy = 0; yy < px; yy++) for (let xx = 0; xx < px; xx++) suma += datos[((gy * px + yy) * c.width + gx * px + xx) * 4 + 3];
      if (suma / (px * px * 255) > .42) lista.push([gx, gy]);
    }
    return lista;
  }

  async function entrada() {
    if (quieto()) return;
    const r = panel.getBoundingClientRect(), lista = celdas(r), {x:cx, y:cy} = centroVisible(r);
    const S = Math.max(56, Math.min(96, r.width * .16)), q = S / 4;
    const grandes = [{x:cx - S, y:cy}, {x:cx, y:cy - S}], subs = [];
    grandes.forEach(g => { for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) subs.push({cx:g.x + (i + .5) * q, cy:g.y + (j + .5) * q, gx:g.x + S / 2, gy:g.y + S / 2}); });
    const radio = Math.hypot(r.width, r.height) / 2, PARTIR = 360, SALIR = 640, VIAJE = 400, TENIR = 160;
    lista.forEach(c => {
      c.o = subs[Math.floor(c.azar * subs.length)];
      c.inicio = SALIR + Math.hypot(c.cx - cx, c.cy - cy) / radio * 320 + Math.random() * 110;
      c.curva = (Math.random() - .5) * 70;
    });
    await correr(SALIR + 320 + 110 + VIAJE + TENIR, t => {
      if (t < PARTIR) {
        ctx.fillStyle = mezcla(LIMA, LIMA, 0);
        grandes.forEach((g, i) => { const s = S * rebote(c01((t - i * 80) / 280)); ctx.fillRect(g.x + (S - s) / 2, g.y + (S - s) / 2, s, s); });
        return;
      }
      const k = salida3(c01((t - PARTIR) / 260)), lado = q * (1 - .38 * k);
      subs.forEach(s => { s.x = s.cx + (s.cx - s.gx) * .22 * k; s.y = s.cy + (s.cy - s.gy) * .22 * k; s.espera = false; });
      lista.forEach(c => { if (t < c.inicio) c.o.espera = true; });
      ctx.fillStyle = mezcla(LIMA, LIMA, 0);
      subs.forEach(s => { if (s.espera) ctx.fillRect(s.x - lado / 2, s.y - lado / 2, lado, lado); });
      lista.forEach(c => {
        if (t < c.inicio) return;
        const p = c01((t - c.inicio) / VIAJE), e = suave(p), ox = c.o.x, oy = c.o.y;
        const dx = c.cx - ox, dy = c.cy - oy, largo = Math.hypot(dx, dy) || 1, curva = Math.sin(Math.PI * e) * c.curva;
        const x = ox + dx * e - dy / largo * curva, y = oy + dy * e + dx / largo * curva;
        const w = lado + (c.w + .6 - lado) * e, h = lado + (c.h + .6 - lado) * e;
        ctx.fillStyle = mezcla(LIMA, PANEL, c01((t - c.inicio - VIAJE) / TENIR));
        ctx.fillRect(x - w / 2, y - h / 2, w, h);
      });
    });
  }

  async function salida() {
    dialogo.classList.remove('acceso--visible');
    if (quieto()) return;
    const lista = celdas(panel.getBoundingClientRect());
    lista.forEach(c => { c.inicio = c.azar * 220; });
    await correr(460, t => lista.forEach(c => {
      const p = c01((t - c.inicio) / 220); if (p >= 1) return;
      const e = salida3(p), w = (c.w + .6) * (1 - e), h = (c.h + .6) * (1 - e);
      ctx.fillStyle = mezcla(PANEL, LIMA, Math.min(1, p * 2.2));
      ctx.fillRect(c.cx - w / 2, c.cy - h / 2, w, h);
    }), () => dialogo.classList.remove('acceso--armado'));
  }

  async function cerrar() {
    if (!dialogo?.open || cerrando) return;
    cerrando = true;
    await salida();
    if (dialogo.open) dialogo.close();
  }

  async function entrar(textos, boton) {
    if (ocupado) return;
    ocupado = true; boton.disabled = true; boton.setAttribute('aria-busy', 'true');
    await esperar(quieto() ? 0 : 560);
    if (!dialogo.open) return;
    await exito(textos);
  }

  const colorDe = el => { const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g); return m && (m.length < 4 || +m[3] > 0) ? m.slice(0, 3).map(Number) : PANEL; };
  function geometriaCheck(r) {
    const {x:cx, y:cy} = centroVisible(r), N = 16, K = Math.round(Math.max(8, Math.min(14, r.width / 30))), lado = N * K;
    const x0 = Math.round(cx - lado / 2), y0 = Math.round(cy - lado / 2 - 40);
    return {cx, cy, K, lado, x0, y0, destino:grillaCheck(N).map(([gx, gy]) => ({x:x0 + gx * K, y:y0 + gy * K}))};
  }
  const pintarCheck = g => { ctx.fillStyle = mezcla(VERDE, VERDE, 0); g.destino.forEach(d => ctx.fillRect(d.x + .5, d.y + .5, g.K - 1, g.K - 1)); };
  async function armarCheck(r, base, g, ocultar) {
    const {cx, cy, K, destino} = g, lista = celdas(r), orden = [...lista].sort((a, b) => a.azar - b.azar);
    const movidas = orden.slice(0, destino.length).sort((a, b) => (a.cx + a.cy) - (b.cx + b.cy)), resto = orden.slice(destino.length);
    const puntos = [...destino].sort((a, b) => (a.x + a.y) - (b.x + b.y)), VIAJE = 560;
    movidas.forEach((c, i) => { c.d = puntos[i]; c.inicio = 60 + Math.random() * 260; });
    resto.forEach(c => { c.inicio = Math.random() * 280; });
    await correr(980, t => {
      resto.forEach(c => {
        const p = c01((t - c.inicio) / 300); if (p >= 1) return;
        const e = salida3(p), w = (c.w + .6) * (1 - e), h = (c.h + .6) * (1 - e);
        const x = c.cx + (cx - c.cx) * e * .25, y = c.cy + (cy - c.cy) * e * .25;
        ctx.fillStyle = mezcla(base, LIMA, Math.min(1, p * 1.6)); ctx.fillRect(x - w / 2, y - h / 2, w, h);
      });
      movidas.forEach(c => {
        const p = c01((t - c.inicio) / VIAJE), e = suave(p), tx = c.d.x + K / 2, ty = c.d.y + K / 2;
        const x = c.cx + (tx - c.cx) * e, y = c.cy + (ty - c.cy) * e, w = c.w + .6 + (K - 1 - c.w - .6) * e, h = c.h + .6 + (K - 1 - c.h - .6) * e;
        ctx.fillStyle = p < .5 ? mezcla(base, LIMA, p * 2) : mezcla(LIMA, VERDE, (p - .5) * 2);
        ctx.fillRect(x - w / 2, y - h / 2, w, h);
      });
    }, ocultar);
  }
  function mostrarLogro(titulo, detalle, g, accion) {
    logro.querySelector('h2').textContent = titulo; logro.querySelector('p').textContent = detalle;
    const enlace = logro.querySelector('a');
    enlace.hidden = !accion;
    if (accion) { enlace.textContent = accion.texto; enlace.href = accion.href || '#'; enlace.insertAdjacentHTML('beforeend', ICONOS.flecha); }
    logro.style.top = (g.y0 + g.lado + 16) + 'px';
    logro.hidden = false;
    if (!quieto()) logro.animate([{opacity:0, transform:'translateY(12px)'}, {opacity:1, transform:'none'}], {duration:420, easing:'cubic-bezier(.16,1,.3,1)', fill:'both'});
  }
  async function dispersarCheck(g) {
    dialogo.classList.remove('acceso--visible');
    if (quieto()) return;
    const {K, x0, y0, lado} = g, ccx = x0 + lado / 2, ccy = y0 + lado / 2;
    const piezas = g.destino.map(d => ({...d, ang:Math.atan2(d.y + K / 2 - ccy, d.x + K / 2 - ccx) + (Math.random() - .5) * .6, dist:40 + Math.random() * 120, inicio:(d.x - x0) / lado * 260 + Math.random() * 60}));
    logro.animate([{opacity:1}, {opacity:0, transform:'translateY(-8px)'}], {duration:360, fill:'forwards'});
    await correr(720, t => piezas.forEach(pz => {
      const p = c01((t - pz.inicio) / 380); if (p >= 1) return;
      const e = salida3(p), s = (K - 1) * (1 - e);
      const x = pz.x + K / 2 + Math.cos(pz.ang) * pz.dist * e, y = pz.y + K / 2 + Math.sin(pz.ang) * pz.dist * e;
      ctx.fillStyle = mezcla(VERDE, LIMA, e); ctx.fillRect(x - s / 2, y - s / 2, s, s);
    }));
    logro.getAnimations().forEach(a => a.cancel());
  }

  async function exito([titulo, detalle]) {
    const r = panel.getBoundingClientRect(), g = geometriaCheck(r);
    if (quieto()) {
      dialogo.classList.remove('acceso--armado'); preparar(); pintarCheck(g);
      mostrarLogro(titulo, detalle, g); opciones.alEntrar?.();
      await esperar(1800);
      if (dialogo.open) dialogo.close();
      return;
    }
    await desvanecer([...panel.children], 200);
    await armarCheck(r, PANEL, g, () => dialogo.classList.remove('acceso--armado'));
    if (!dialogo.open) return;
    mostrarLogro(titulo, detalle, g); opciones.alEntrar?.();
    await esperar(1500);
    if (!dialogo.open) return;
    await dispersarCheck(g);
    if (dialogo.open) dialogo.close();
  }

  async function confirmar({origen, titulo, detalle, accion, foco, antes}) {
    montar();
    if (dialogo.open || !origen) return;
    opciones = {origen:foco}; ocupado = confirmando = true;
    const r = origen.getBoundingClientRect(), base = colorDe(origen), g = geometriaCheck(r);
    panel.replaceChildren(); logro.hidden = true;
    dialogo.classList.remove('acceso--armado');
    dialogo.classList.add('acceso--instante');
    dialogo.showModal(); getComputedStyle(dialogo, '::backdrop').opacity; dialogo.classList.add('acceso--visible');
    setTimeout(() => dialogo.classList.remove('acceso--instante'), 60);
    if (quieto()) { antes?.(); preparar(); pintarCheck(g); }
    else await armarCheck(r, base, g, antes);
    if (!dialogo.open) return;
    mostrarLogro(titulo, detalle, g, accion);
    const enlace = logro.querySelector('a');
    enlace.focus({preventScroll:true});
    const seguir = await new Promise(listo => { salirConfirmacion = listo; enlace.onclick = e => { e.preventDefault(); listo(true); }; });
    salirConfirmacion = null; enlace.onclick = null;
    await dispersarCheck(g);
    if (dialogo.open) dialogo.close();
    if (seguir && accion?.href) location.href = accion.href;
  }

  async function abrir(op = {}) {
    montar();
    if (dialogo.open) return;
    opciones = op; vista = op.vista || 'ingreso'; ocupado = cerrando = false; logro.hidden = true;
    pintar();
    dialogo.classList.remove('acceso--armado', 'acceso--visible');
    dialogo.showModal(); dialogo.scrollTop = 0;
    getComputedStyle(dialogo, '::backdrop').opacity; dialogo.classList.add('acceso--visible');
    await entrada();
    if (!dialogo.open) return;
    dialogo.classList.add('acceso--armado'); preparar();
    panel.querySelector('h2').focus({preventScroll:true});
  }

  window.MUSUQ_ACCESO = {abrir, confirmar};
})();
