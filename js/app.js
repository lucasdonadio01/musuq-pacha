/* MUSUQ PACHA · Símbolos — cableado de la interfaz. */

(() => {
  const $ = s => document.querySelector(s);
  const esperar = ms => new Promise(r => setTimeout(r, ms));

  const portada = $('#portada'), taller = $('#taller'), lienzo = $('#lienzo');
  const ctx = lienzo.getContext('2d');
  const estado = $('#estado');

  let pueblo = PUEBLOS[0];
  let modo = 'pincel';
  let color = pueblo.colores[0].h;
  let fondo = pueblo.fondo;
  let tinta = '#1B1A19';
  let pintando = false;

  const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
  const mezcla = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

  /* ---------- paleta de la pagina ---------- */
  function aplicarFondo(hex) {
    fondo = hex;
    Simbolo.fondo = hex;
    const rgb = Simbolo.aRgb(hex);
    const luz = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
    const claro = luz > 0.52;
    tinta = claro ? '#1B1A19' : '#F5F2EB';
    const t = Simbolo.aRgb(tinta);
    const raiz = document.documentElement.style;
    raiz.setProperty('--fondo', hex);
    raiz.setProperty('--tinta', tinta);
    raiz.setProperty('--velo', `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.58)`);
    raiz.setProperty('--linea', `rgba(${t[0]},${t[1]},${t[2]},0.26)`);
    raiz.setProperty('--suave', `rgba(${t[0]},${t[1]},${t[2]},0.58)`);
    raiz.setProperty('--toque', `rgba(${t[0]},${t[1]},${t[2]},0.09)`);
    raiz.setProperty('--toque-fuerte', `rgba(${t[0]},${t[1]},${t[2]},0.16)`);
    // el rojo del boton de vaciar tambien se adapta: sobre oscuro un bordo no se ve
    raiz.setProperty('--peligro', claro ? '#C0392B' : '#FF7A68');
    // Los puntos del fondo se mezclan hacia el negro o el blanco, nunca con un
    // delta: sobre un rojo pleno sumar 24 no cambia nada y desaparecian.
    Fondo.paleta(hex, Simbolo.aHex(mezcla(rgb, claro ? [0, 0, 0] : [255, 255, 255], claro ? 0.16 : 0.22)));
    $('#colorFondo').value = hex;
    if (!taller.hidden) dibujarMapa();
  }

  /* ---------- mapa del territorio ---------- */
  function dibujarMapa() {
    const cv = $('#mapa'), paso = 5, d = dpr();
    const cols = MAPA.cols, filas = MAPA.filas.length;
    cv.style.width = (cols * paso) + 'px';
    cv.style.height = (filas * paso) + 'px';
    cv.width = Math.round(cols * paso * d);
    cv.height = Math.round(filas * paso * d);
    const c = cv.getContext('2d');
    c.setTransform(d, 0, 0, d, 0, 0);
    c.clearRect(0, 0, cols * paso, filas * paso);

    const marca = String(MAPA.orden.indexOf(pueblo.id) + 1);
    const t = Simbolo.aRgb(tinta);
    const apagado = `rgba(${t[0]},${t[1]},${t[2]},0.20)`;
    MAPA.filas.forEach((fila, y) => {
      for (let x = 0; x < fila.length; x++) {
        if (fila[x] === '.') continue;
        c.fillStyle = fila[x] === marca ? pueblo.colores[0].h : apagado;
        c.fillRect(x * paso, y * paso, paso - 1.3, paso - 1.3);
      }
    });
    $('#mapaPie').textContent = pueblo.bioma;
  }

  /* ---------- listas y paleta ---------- */
  function armarPueblos() {
    const ul = $('#listaPueblos');
    ul.innerHTML = '';
    PUEBLOS.forEach(p => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-pressed', String(p.id === pueblo.id));
      b.innerHTML = `<span class="muestra" style="background:${p.colores[0].h}"></span>
                     <span><b>${p.nombre}</b><i>${p.region}</i></span>`;
      b.addEventListener('click', () => elegirPueblo(p));
      li.appendChild(b);
      ul.appendChild(li);
    });
  }

  function armarPaleta() {
    const cont = $('#paleta'), mas = cont.querySelector('.mas');
    [...cont.querySelectorAll('button')].forEach(b => b.remove());
    pueblo.colores.forEach(c => {
      const b = document.createElement('button');
      b.type = 'button';
      b.style.background = c.h;
      b.dataset.hex = c.h;
      b.title = c.n;
      b.setAttribute('aria-pressed', String(c.h === color));
      b.addEventListener('click', () => {
        elegirColor(c.h, c.n);
        if (Simbolo.seleccion.size) Simbolo.recolorear(c.h);
      });
      cont.insertBefore(b, mas);
    });
    $('#notaColor').textContent = (pueblo.colores.find(c => c.h === color) || {}).n || 'color libre';
  }

  function elegirColor(hex, nombre) {
    color = hex;
    $('#colorLibre').value = hex;
    $('#notaColor').textContent = nombre || 'color libre';
    [...$('#paleta').querySelectorAll('button')]
      .forEach(b => b.setAttribute('aria-pressed', String(b.dataset.hex === hex)));
  }

  function elegirPueblo(p) {
    pueblo = p;
    Simbolo.pueblo = p;
    elegirColor(p.colores[0].h, p.colores[0].n);
    aplicarFondo(p.fondo);
    armarPueblos();
    armarPaleta();
    dibujarMapa();
    $('#puebloActual').textContent = p.nombre;
    menu(false);
    generar();
    avisar(p.nombre + ' · ' + p.bioma);
  }

  function avisar(txt) {
    estado.textContent = txt;
    clearTimeout(avisar.t);
    avisar.t = setTimeout(() => { if (estado.textContent === txt) estado.textContent = ''; }, 3600);
  }

  /* ---------- música de fondo ----------
     Ningún navegador deja arrancar audio solo, así que se engancha al primer
     gesto: tocar una baldosa del mosaico ya alcanza, y si no, el botón de
     empezar. Si el navegador igual la frena, se vuelve a intentar en el gesto
     siguiente en vez de quedar muda para siempre. */
  const musica = $('#musica');
  musica.volume = 0.4;
  let sonando = false;

  function arrancarMusica() {
    if (sonando) return;
    sonando = true;
    const intento = musica.play();
    if (intento && intento.catch) intento.catch(() => { sonando = false; });
  }
  addEventListener('pointerdown', arrancarMusica);

  $('#sonido').addEventListener('click', e => {
    const b = e.currentTarget;
    musica.muted = !musica.muted;
    b.querySelector('use').setAttribute('href', musica.muted ? '#ic-mudo' : '#ic-sonido');
    b.setAttribute('aria-pressed', String(musica.muted));
    b.setAttribute('title', musica.muted ? 'Activar música' : 'Silenciar música');
    b.setAttribute('aria-label', musica.muted ? 'Activar música' : 'Silenciar música');
  });

  /* ---------- menú de pueblos (en mobile tapa la pantalla) ---------- */
  const menu = abrir => $('#menu').classList.toggle('abierto', abrir);
  $('#volver').addEventListener('click', () => menu(true));
  $('#cerrarMenu').addEventListener('click', () => menu(false));

  /* ---------- bucle de dibujo ---------- */
  function cuadro(ahora) {
    const r = lienzo.getBoundingClientRect();
    // mientras el taller esta oculto el lienzo mide cero: si igual midieramos,
    // la geometria queda en cero y despues los clicks no encuentran ninguna celda
    if (!r.width || !r.height) { requestAnimationFrame(cuadro); return; }
    const d = dpr();
    const w = Math.round(r.width * d), h = Math.round(r.height * d);
    if (lienzo.width !== w || lienzo.height !== h) { lienzo.width = w; lienzo.height = h; }
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.clearRect(0, 0, r.width, r.height);
    Simbolo.componer(ctx, r.width, r.height, ahora, { interfaz: true, tinta });
    requestAnimationFrame(cuadro);
  }

  function ondaDesdeElSimbolo() {
    const r = lienzo.getBoundingClientRect();
    Fondo.onda(r.left + r.width / 2, r.top + r.height / 2);
  }

  function generar(semilla) {
    Simbolo.generar(performance.now(), semilla);
    ondaDesdeElSimbolo();
  }

  /* ---------- pintar sobre la grilla ---------- */
  function celdaDe(e) {
    const r = lienzo.getBoundingClientRect();
    return Simbolo.celdaEn(e.clientX - r.left, e.clientY - r.top);
  }

  function actuar(e, primero) {
    const c = celdaDe(e);
    if (!c) return;
    const espejo = $('#espejo').checked;
    if (modo === 'pincel') Simbolo.pintar(c[0], c[1], color, espejo);
    else if (modo === 'borrador') Simbolo.borrar(c[0], c[1], espejo);
    else if (modo === 'cuentagotas') {
      const hex = Simbolo.grilla.get(c[0] + ',' + c[1]);
      if (!hex || !primero) return;
      const nombre = (pueblo.colores.find(x => x.h.toLowerCase() === hex.toLowerCase()) || {}).n;
      elegirColor(hex, nombre);
      avisar('color copiado · ' + (nombre || hex));
    }
    else if (primero) Simbolo.alternarSeleccion(c[0], c[1], espejo);
    else Simbolo.seleccionar(c[0], c[1], espejo);
  }

  lienzo.addEventListener('pointerdown', e => {
    pintando = true;
    cursor.classList.add('apretado');
    actuar(e, true);
    // el capture va despues y protegido: si el puntero ya no esta activo tira
    try { lienzo.setPointerCapture(e.pointerId); } catch (_) { /* sin captura, igual pinta */ }
  });
  lienzo.addEventListener('pointermove', e => {
    moverCursor(e);
    Simbolo.hover = celdaDe(e);
    if (pintando) actuar(e, false);
  });
  ['pointerup', 'pointercancel'].forEach(ev => lienzo.addEventListener(ev, () => {
    pintando = false;
    cursor.classList.remove('apretado');
  }));
  lienzo.addEventListener('pointerleave', () => { Simbolo.hover = null; });

  /* La ruedita pasa al color siguiente de la paleta del pueblo */
  lienzo.addEventListener('wheel', e => {
    e.preventDefault();
    const cols = pueblo.colores;
    let i = cols.findIndex(c => c.h.toLowerCase() === color.toLowerCase());
    if (i < 0) i = 0;
    i = (i + (e.deltaY > 0 ? 1 : -1) + cols.length) % cols.length;
    elegirColor(cols[i].h, cols[i].n);
    if (Simbolo.seleccion.size) Simbolo.recolorear(cols[i].h);
    avisar(cols[i].n);
  }, { passive: false });

  /* ---------- cursor con la herramienta ----------
     Sobre el lienzo el puntero del sistema se apaga y se dibuja el icono de la
     herramienta, que crece al apretar. No se puede animar un cursor CSS, por
     eso va como elemento. Solo con mouse: con dedo no hay puntero que seguir. */
  const cursor = $('#cursor');
  const ICONO = { pincel: '#ic-pincel', borrador: '#ic-borrador', seleccion: '#ic-seleccion', cuentagotas: '#ic-cuentagotas' };

  function moverCursor(e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    document.body.classList.add('con-mouse');
    cursor.hidden = false;
    cursor.style.transform = 'translate3d(' + (e.clientX - 2) + 'px,' + (e.clientY - 20) + 'px,0)';
  }
  lienzo.addEventListener('pointerenter', moverCursor);
  lienzo.addEventListener('pointerleave', () => { cursor.hidden = true; });
  addEventListener('blur', () => { cursor.hidden = true; });

  /* ---------- controles ---------- */
  function elegirModo(m) {
    modo = m;
    [...$('#modos').children].forEach(b => b.setAttribute('aria-pressed', String(b.dataset.modo === m)));
    if (m !== 'seleccion') Simbolo.seleccion.clear();
    cursor.querySelector('use').setAttribute('href', ICONO[m] || ICONO.pincel);
  }

  $('#modos').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (b) elegirModo(b.dataset.modo);
  });

  $('#colorLibre').addEventListener('input', e => {
    elegirColor(e.target.value, null);
    if (Simbolo.seleccion.size) Simbolo.recolorear(color);
  });

  $('#colorFondo').addEventListener('input', e => aplicarFondo(e.target.value));

  $('#lado').addEventListener('change', e => { Simbolo.lado = +e.target.value; generar(); });
  $('#generar').addEventListener('click', () => generar());
  $('#limpiar').addEventListener('click', () => Simbolo.limpiar(performance.now()));

  const TECLAS = { q: 'pincel', w: 'borrador', e: 'seleccion', i: 'cuentagotas' };
  addEventListener('keydown', e => {
    if (taller.hidden || e.metaKey || e.ctrlKey || e.altKey || /input|select|textarea/i.test(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if (e.key === 'Escape') menu(false);
    if (TECLAS[k]) { elegirModo(TECLAS[k]); avisar(TECLAS[k]); }
    if (k === 'g') generar();
    if (e.key === 'Escape') Simbolo.seleccion.clear();
  });

  /* ---------- exportar ---------- */
  function componerCuadro(W, H, ahora) {
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    const r = lienzo.getBoundingClientRect();
    const d = dpr();
    c.fillStyle = fondo;
    c.fillRect(0, 0, W, H);
    try {
      // recorto del canvas WebGL justo la ventana que ocupa el lienzo
      c.drawImage(Fondo.lienzo, r.left * d, r.top * d, r.width * d, r.height * d, 0, 0, W, H);
    } catch (err) { /* sin WebGL queda el fondo plano */ }
    const escala = W / r.width;
    c.setTransform(escala, 0, 0, escala, 0, 0);
    Simbolo.componer(c, r.width, r.height, ahora, { interfaz: false, tinta });
    return cv;
  }

  $('#png').addEventListener('click', () => {
    const r = lienzo.getBoundingClientRect();
    const W = 2000, H = Math.round(W * r.height / r.width);
    componerCuadro(W, H, performance.now()).toBlob(b => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'musuq-pacha-' + pueblo.id + '-' + Simbolo.firmaSemilla + '.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      avisar('PNG guardado');
    }, 'image/png');
  });

  /* ---------- portada ---------- */
  async function entrar() {
    if (entrar.yendo) return;
    entrar.yendo = true;
    // El juego se arma detrás mientras el mosaico sigue arriba: cuando las
    // baldosas se caen, lo que queda abajo ya está dibujado y no aparece de
    // golpe. El cartel del centro no se cae, se va en opacidad.
    taller.hidden = false;
    dibujarMapa();
    generar();
    portada.classList.add('portada--sale');
    await Mosaico.caer();
    portada.hidden = true;
    Mosaico.detener();
    ondaDesdeElSimbolo();
    avisar('pintá con Q, borrá con W, seleccioná con E · G genera');
  }

  $('#entrar').addEventListener('click', entrar);

  /* ---------- arranque ---------- */
  Simbolo.pueblo = pueblo;
  Simbolo.quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  aplicarFondo(pueblo.fondo);
  armarPueblos();
  armarPaleta();
  $('#puebloActual').textContent = pueblo.nombre;
  if (!Fondo.iniciar($('#fondo'))) $('#fondo').style.display = 'none';
  requestAnimationFrame(cuadro);
  Mosaico.iniciar($('#mosaico'), $('#bloque'));

  // gancho para inspeccionar desde la consola
  window.__mp = { Simbolo, Fondo, Mosaico, componerCuadro, entrar, get pueblo() { return pueblo; } };
})();
