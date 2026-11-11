(() => {
  const M = window.MARCA || {};
  const quieto = !!M.quieto;
  const avisar = M.avisar || (() => {});
  const copiar = M.copiar || (async () => false);
  const html = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const crear = (tag, clase, contenido) => { const e = document.createElement(tag); if (clase) e.className = clase; if (contenido != null) e.innerHTML = contenido; return e; };
  const NS = 'http://www.w3.org/2000/svg';
  const trazo = (tag, attrs, padre) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (padre) padre.append(e); return e; };
  const elegir = (grupo, boton) => $$('button', grupo).forEach(x => x.setAttribute('aria-pressed', String(x === boton)));
  const bajar = (nombre, texto, tipo) => {
    const url = URL.createObjectURL(new Blob([texto], { type: tipo }));
    const enlace = crear('a');
    enlace.href = url;
    enlace.download = nombre;
    document.body.append(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };
  const regla = w => w >= 1440 ? [120, 32, 8] : w >= 1101 ? [64, 32, 8] : w >= 701 ? [32, 32, 8] : w >= 371 ? [20, 24, 4] : [12, 16, 4];

  $$('details.desplegable').forEach(d => {
    const resumen = $('summary', d), cuerpo = $('.d-cuerpo', d);
    let abierto = d.open, anim = null;
    d.classList.toggle('abierto', abierto);
    const poner = v => {
      if (v === abierto) return;
      abierto = v;
      d.classList.toggle('abierto', v);
      if (anim) anim.cancel();
      if (v) d.open = true;
      d.dispatchEvent(new CustomEvent('desplegado', { detail: v }));
      const fin = () => {
        anim = null;
        if (!abierto) d.open = false;
        else dispatchEvent(new Event('resize'));
      };
      if (quieto || !cuerpo || !cuerpo.animate) { fin(); return; }
      const alto = cuerpo.scrollHeight;
      anim = cuerpo.animate([{ height: (v ? 0 : alto) + 'px' }, { height: (v ? alto : 0) + 'px' }], { duration: Math.min(720, 280 + alto * 0.45), easing: 'cubic-bezier(.2,.7,.2,1)' });
      anim.onfinish = fin;
    };
    d.ponerDesplegable = poner;
    resumen.addEventListener('click', e => {
      e.preventDefault();
      const grupo = d.parentElement;
      if (!abierto && grupo && grupo.hasAttribute('data-uno')) $$('details.desplegable', grupo).forEach(o => { if (o !== d && o.ponerDesplegable) o.ponerDesplegable(false); });
      poner(!abierto);
    });
  });

  const COLORES = {
    naranja: { nombre: 'Naranja', hex: '#F66227', tinta: '#222222' },
    violeta: { nombre: 'Violeta', hex: '#6940AE', tinta: '#222222' },
    lima: { nombre: 'Lima', hex: '#E4FE44', tinta: '#0A0A0A' }
  };
  const version = (color, fondo) => fondo === 'claro'
    ? { cuadro: '#222222', cruz: COLORES[color].hex, nombre: '#171512' }
    : { cuadro: COLORES[color].hex, cruz: COLORES[color].tinta, nombre: '#FFFFFF' };
  const marca = (color, fondo) => color + (fondo === 'claro' ? ' claro' : '');
  const chipsColor = (cont, alElegir) => {
    Object.entries(COLORES).forEach(([id, c]) => {
      const b = crear('button', '', `<i style="--c:${c.hex}"></i>${c.nombre}${id === 'naranja' ? ' · principal' : ''}`);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(id === 'naranja'));
      b.addEventListener('click', () => { elegir(cont, b); alElegir(id); });
      cont.append(b);
    });
  };
  const svgLogo = v => {
    const cruz = $('#lg-cruz').getAttribute('d');
    const letras = $$('#lg-letras path').map(p => `<path d="${p.getAttribute('d')}" fill="${v.nombre}"/>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1194" height="400" viewBox="0 0 1194 400"><rect width="400" height="400" fill="${v.cuadro}"/><path d="${cruz}" fill="${v.cruz}"/>${letras}</svg>`;
  };

  const taller = $('[data-logo-taller]');
  if (taller) {
    const escena = $('[data-logo-escena]', taller), logo = $('[data-logo-principal]', taller), ficha = $('[data-logo-ficha]', taller), fondos = $('[data-logo-fondo]', taller);
    const est = { color: 'naranja', fondo: 'oscuro' };
    const pintar = () => {
      const v = version(est.color, est.fondo);
      logo.dataset.lg = marca(est.color, est.fondo);
      escena.dataset.fondo = est.fondo;
      ficha.innerHTML = `<b>${COLORES[est.color].nombre} · ${est.color === 'naranja' ? 'principal' : 'variable'}</b>Para fondos ${est.fondo === 'claro' ? 'claros' : 'oscuros'}<span>Cuadrado <i>${v.cuadro}</i></span><span>Chakana <i>${v.cruz}</i></span><span>Nombre <i>${v.nombre}</i></span>`;
    };
    chipsColor($('[data-logo-color]', taller), id => { est.color = id; pintar(); });
    $$('button', fondos).forEach(b => b.addEventListener('click', () => { est.fondo = b.dataset.valor; elegir(fondos, b); pintar(); }));
    $('[data-logo-bajar]', taller).addEventListener('click', () => {
      bajar(`musuq-pacha-logo-${est.color}-${est.fondo}.svg`, svgLogo(version(est.color, est.fondo)), 'image/svg+xml');
      avisar('Bajando el logo en SVG');
    });
    pintar();
  }

  const plano = $('[data-plano]');
  if (plano) {
    const m = 400 / 7, W = 21 * m, H = 400;
    const linea = (g, x1, y1, x2, y2, clase, i) => { const l = trazo('line', { x1, y1, x2, y2, class: clase }, g); if (i != null) l.style.setProperty('--i', i); return l; };
    const texto = (g, t, x, y, ancla, clase) => { const e = trazo('text', { x, y, 'text-anchor': ancla || 'middle' }, g); if (clase) e.setAttribute('class', clase); e.textContent = t; return e; };
    const cota = (g, x1, x2, y, t, abajo) => {
      linea(g, x1, y, x2, y, 'pl-cota');
      linea(g, x1, y - 9, x1, y + 9, 'pl-cota');
      linea(g, x2, y - 9, x2, y + 9, 'pl-cota');
      texto(g, t, (x1 + x2) / 2, abajo ? y + 34 : y - 16);
    };

    const s = trazo('svg', { viewBox: `-100 -80 ${W + 220} ${H + 190}`, role: 'img', 'aria-label': 'El logo sobre una grilla de 21 por 7 módulos' });
    s.dataset.lg = 'naranja';
    plano.append(s);
    trazo('use', { href: '#sim-logo', width: 1194, height: 400 }, s);
    const grilla = trazo('g', { class: 'capa-grilla' }, s), guias = trazo('g', { class: 'capa-guias' }, s), cotas = trazo('g', { class: 'capa-cotas' }, s);
    for (let i = 1; i < 21; i++) linea(grilla, i * m, 0, i * m, H, 'pl-linea', i);
    for (let j = 1; j < 7; j++) linea(grilla, 0, j * m, W, j * m, 'pl-linea', 21 + j);
    trazo('rect', { x: 0, y: 0, width: W, height: H, class: 'pl-borde' }, grilla);
    trazo('rect', { x: 7 * m, y: 0, width: m, height: m, class: 'pl-modulo' }, grilla);
    texto(grilla, 'x', 7.5 * m, m / 2 + 8, 'middle', 'equis');
    const activo = trazo('rect', { x: 0, y: 0, width: m, height: m, class: 'pl-activo' }, s);
    cota(cotas, 0, 7 * m, -26, '7x');
    cota(cotas, 7 * m, 8 * m, -26, '1x');
    cota(cotas, 8 * m, W, -26, '13x');
    cota(cotas, 0, W, H + 34, '21x · PROPORCIÓN 3 : 1', true);
    linea(cotas, -34, 0, -34, H, 'pl-cota');
    linea(cotas, -43, 0, -25, 0, 'pl-cota');
    linea(cotas, -43, H, -25, H, 'pl-cota');
    texto(cotas, '7x', -50, H / 2 + 8, 'end');
    [15, 385].forEach(y => { linea(guias, 7 * m, y, W + 26, y, 'pl-guia'); texto(guias, '¼x', W + 36, y + 8, 'start', 'guia'); });

    const si = trazo('svg', { viewBox: '-70 -70 560 560', class: 'plano-iso', role: 'img', 'aria-label': 'Detalle del isotipo: la cruz ocupa 6 por 6 módulos' });
    si.dataset.lg = 'naranja';
    plano.append(si);
    trazo('use', { href: '#sim-iso', width: 400, height: 400 }, si);
    const grillaIso = trazo('g', { class: 'capa-grilla' }, si), cotasIso = trazo('g', { class: 'capa-cotas' }, si);
    const p = 346 / 6, o = 27;
    for (let k = 0; k <= 6; k++) {
      linea(grillaIso, o + k * p, 0, o + k * p, 400, 'pl-linea', k);
      linea(grillaIso, 0, o + k * p, 400, o + k * p, 'pl-linea', 7 + k);
    }
    trazo('rect', { x: 0, y: 0, width: 400, height: 400, class: 'pl-borde' }, grillaIso);
    cota(cotasIso, o, 400 - o, -26, '6x');
    cota(cotasIso, 0, 400, 434, '7x', true);
    linea(cotasIso, 428, 0, 428, o, 'pl-cota');
    linea(cotasIso, 419, 0, 437, 0, 'pl-cota');
    linea(cotasIso, 419, o, 437, o, 'pl-cota');
    texto(cotasIso, '½x', 446, o / 2 + 8, 'start');

    const lectura = $('[data-capas-lectura]');
    const base = lectura ? lectura.textContent : '';
    const zona = col => col < 7 ? 'isotipo' : col === 7 ? 'aire de 1x' : 'logotipo';
    s.addEventListener('pointermove', e => {
      const punto = new DOMPoint(e.clientX, e.clientY).matrixTransform(s.getScreenCTM().inverse());
      const col = Math.floor(punto.x / m), fila = Math.floor(punto.y / m);
      const dentro = col >= 0 && col < 21 && fila >= 0 && fila < 7;
      s.classList.toggle('con-activo', dentro);
      if (dentro) { activo.setAttribute('x', col * m); activo.setAttribute('y', fila * m); }
      if (lectura) lectura.textContent = dentro ? `Columna ${col + 1} · fila ${fila + 1} · ${zona(col)}` : base;
    });
    s.addEventListener('pointerleave', () => { s.classList.remove('con-activo'); if (lectura) lectura.textContent = base; });
    $$('[data-capa]').forEach(b => b.addEventListener('click', () => {
      const ver = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(ver));
      $$('svg', plano).forEach(x => x.classList.toggle('sin-' + b.dataset.capa, !ver));
    }));
  }

  const res = $('[data-resguardo]');
  if (res) {
    const escena = $('[data-resguardo-escena]', res), zona = $('[data-resguardo-zona]', res), rango = $('[data-resguardo-rango]', res), valor = $('[data-resguardo-valor]', res), estado = $('[data-resguardo-estado]', res);
    const rotulos = $$('i', zona);
    const pintar = () => {
      const w = +rango.value, completo = w >= 100;
      const x = (completo ? w * 400 / 1194 : w) / 7, aire = completo ? 2 * x : x;
      zona.classList.toggle('solo-iso', !completo);
      zona.classList.toggle('chico', aire < 15);
      zona.style.setProperty('--w', w + 'px');
      zona.style.setProperty('--aire', aire.toFixed(1) + 'px');
      rotulos.forEach(r => { r.textContent = completo ? '2x' : '1x'; });
      valor.textContent = w + ' px';
      estado.innerHTML = completo
        ? `<b>Logo completo</b>Resguardo de 2x: ${Math.round(aire)} px libres por lado.`
        : `<b>Sólo el isotipo</b>Con menos de 100 px el nombre deja de leerse. Resguardo de 1x: ${Math.max(1, Math.round(aire))} px por lado.`;
    };
    const ajustar = () => {
      const libre = escena.clientWidth - 48;
      if (libre <= 0) return;
      const max = Math.max(120, Math.min(400, Math.floor(libre / (1 + 4 * 400 / 1194 / 7) / 4) * 4));
      rango.max = max;
      if (+rango.value > max) rango.value = max;
      pintar();
    };
    rango.addEventListener('input', pintar);
    addEventListener('resize', ajustar);
    ajustar();
    pintar();
  }

  const versiones = $('[data-versiones]');
  if (versiones) chipsColor($('[data-versiones-color]'), id => $$('svg.logo', versiones).forEach(l => { l.dataset.lg = marca(id, l.dataset.lg.includes('claro') ? 'claro' : 'oscuro'); }));

  $$('.uso').forEach(u => u.addEventListener('click', () => u.classList.toggle('marcado')));

  const conv = $('[data-conv]');
  if (conv) {
    const lockup = $('[data-conv-lockup]', conv), modo = $('[data-conv-modo]', conv);
    $$('button', modo).forEach(b => b.addEventListener('click', () => { elegir(modo, b); lockup.dataset.modo = b.dataset.valor; }));
  }
  const franja = $('[data-franja]'), franjaFondo = $('[data-franja-fondo]');
  if (franja && franjaFondo) $$('button', franjaFondo).forEach(b => b.addEventListener('click', () => {
    elegir(franjaFondo, b);
    franja.dataset.fondo = b.dataset.valor;
    $('svg.logo', franja).dataset.lg = marca('naranja', b.dataset.valor);
  }));

  const MUESTRAS = [
    { img: 'patrones/faja-kolla.png', nombre: 'Cruce de guarda, rombo y guarda de rombos', textil: 'Faja · textil kolla', lugar: 'Santa Ana, Valle Grande, Jujuy, 1971', fuente: 'La Argentina textil, FNA 59, pp. 58-59', colores: ['#9C2447', '#E3C89D', '#A52C47'] },
    { img: 'patrones/matron-ranquel.png', nombre: 'Rombo escalonado y cruce', textil: 'Matrón · textil ranquel', lugar: 'Santa Isabel, La Pampa, 1974', fuente: 'La Argentina textil, FNA 191, pp. 164-165', colores: ['#9B245C', '#D8A93F'] },
    { img: 'patrones/matra-ranquel.png', nombre: 'Trama alternada', textil: 'Matra · textil ranquel', lugar: 'Médanos Chicos, Chalileo, La Pampa, 1968', fuente: 'La Argentina textil, FNA 12, pp. 184-185', colores: ['#D8A93F', '#292827'] },
    { img: 'patrones/faja-qom.png', nombre: 'Bandas de faja y línea de faja', textil: 'Faja · textil qom-toba', lugar: 'Barrio Toba, Resistencia, Chaco, 1968', fuente: 'La Argentina textil, FNA 24, pp. 112-113', colores: ['#CE796F', '#D3AB65', '#485653'] }
  ];
  const muestras = $('[data-muestras]');
  if (muestras) {
    const puntos = colores => colores.map(c => `<i style="--c:${c}"></i>`).join('');
    const diapo = (d, k) => {
      const a = crear('article', 'carrusel-diapo');
      a.innerHTML = `<div class="diapo-visual diapo-patron"><img src="${d.img}" alt=""></div>
        <div class="diapo-datos">
          <p class="diapo-rotulo">Patrón ${k + 1} de ${MUESTRAS.length}</p>
          <h3>${d.nombre}</h3>
          <p>${d.textil}. ${d.lugar}.</p>
          <p class="mp-colores">${puntos(d.colores)}</p>
          <p class="nota">${d.colores.join(' · ')}</p>
          <p class="diapo-medida">${d.fuente}</p>
        </div>`;
      return a;
    };
    MUESTRAS.forEach((d, k) => {
      const b = crear('button', 'muestra-patron', `<span class="mp-imagen"><img src="${d.img}" alt="" width="480" height="480" loading="lazy"></span>
        <span class="mp-datos"><b>${d.nombre}</b><span>${d.textil}</span><span>${d.lugar}</span><span class="mp-colores">${puntos(d.colores)}</span></span>`);
      b.type = 'button';
      b.dataset.aparece = '';
      b.dataset.enfasis = '';
      b.dataset.ampliar = '';
      b.dataset.cursor = 'Ver';
      b.setAttribute('aria-label', `${d.nombre}. ${d.textil}. Ver la ficha`);
      b.addEventListener('click', () => { if (window.Carrusel) window.Carrusel.abrir({ titulo: 'Muestras de patrones', inicio: k, origen: b, diapos: MUESTRAS.map(diapo) }); });
      muestras.append(b);
    });
  }

  const textiles = $('[data-textiles]');
  if (textiles) ['#9C2447', '#E3C89D', '#A92D50', '#453244', '#9B245C', '#D8A93F', '#286C5A', '#CE796F', '#D3AB65', '#485653'].forEach(h => {
    const b = crear('button', 'textil', `<i style="--c:${h}"></i><span>${h}</span>`);
    b.type = 'button';
    b.setAttribute('aria-label', `Copiar ${h}`);
    b.addEventListener('click', async () => { if (await copiar(h)) avisar(`Copiado: ${h}`); });
    textiles.append(b);
  });

  const copiarPrompt = $('[data-prompt-copiar]');
  if (copiarPrompt) copiarPrompt.addEventListener('click', async () => { if (await copiar($('[data-prompt]').textContent.trim())) avisar('Prompt copiado'); });

  const ICONOS = window.ICONOS || {};
  const iconos = $('[data-iconos]');
  if (iconos) {
    Object.entries(ICONOS).forEach(([nombre, ic]) => {
      const b = crear('button', 'icono', `<i><svg viewBox="${ic.v}" aria-hidden="true" focusable="false">${ic.c}</svg></i><span>${nombre}</span>`);
      b.type = 'button';
      b.setAttribute('aria-label', `Copiar el nombre ${nombre}`);
      b.addEventListener('click', async () => { if (await copiar(nombre)) avisar(`Copiado: ${nombre}`); });
      iconos.append(b);
    });
    const tam = $('[data-iconos-tam]'), nota = $('[data-iconos-nota]');
    const NOTAS = { 20: 'Dentro de textos y botones.', 24: 'En barras y navegación.', tactil: 'El botón de ícono ocupa de 40 a 48 px, aunque el dibujo mida 24.' };
    const poner = v => {
      iconos.classList.toggle('tactil', v === 'tactil');
      iconos.style.setProperty('--tam', (v === 'tactil' ? 24 : v) + 'px');
      nota.textContent = NOTAS[v];
    };
    $$('button', tam).forEach(b => b.addEventListener('click', () => { elegir(tam, b); poner(b.dataset.valor); }));
    poner('24');
  }

  const rejilla = $('[data-rejilla]');
  if (rejilla) {
    const PANTALLAS = [
      { w: 1920, h: 1080, nombre: 'Monitor Full HD' },
      { w: 1366, h: 768, nombre: 'Notebook' },
      { w: 820, h: 1180, nombre: 'Tablet' },
      { w: 393, h: 852, nombre: 'Celular' },
      { w: 360, h: 800, nombre: 'Celular chico' },
      { tuya: true, nombre: 'Tu pantalla' }
    ];
    const escena = $('[data-rejilla-escena]', rejilla), pantalla = $('[data-rejilla-pantalla]', rejilla), columnas = $$('[data-rejilla-columnas] i', rejilla), lista = $('[data-rejilla-pantallas]', rejilla);
    const datos = Object.fromEntries($$('[data-dato]', rejilla).map(d => [d.dataset.dato, d]));
    let actual = 0, gira = null;
    const medida = d => d.tuya ? { w: innerWidth, h: innerHeight } : d;
    const decir = (k, v) => {
      const d = datos[k];
      if (d.textContent === v) return;
      d.textContent = v;
      d.classList.add('cambia');
      setTimeout(() => d.classList.remove('cambia'), 600);
    };
    const pintar = () => {
      const { w, h } = medida(PANTALLAS[actual]), [margen, canal, cols] = regla(w);
      const cs = getComputedStyle(escena);
      const maxW = escena.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 8;
      const maxH = escena.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 8;
      if (maxW <= 0 || maxH <= 0) return;
      const k = Math.min(maxW / w, maxH / h);
      pantalla.style.setProperty('--pw', (w * k).toFixed(1) + 'px');
      pantalla.style.setProperty('--ph', (h * k).toFixed(1) + 'px');
      pantalla.style.setProperty('--pm', (margen * k).toFixed(2) + 'px');
      pantalla.style.setProperty('--pc', (canal * k).toFixed(2) + 'px');
      pantalla.style.setProperty('--pb', Math.max(4, (w > 700 ? 78 : 58) * k).toFixed(1) + 'px');
      columnas.forEach((c, i) => c.classList.toggle('fuera', i >= cols));
      decir('pantalla', `${w} × ${h}`);
      decir('margen', `${margen} px`);
      decir('canal', `${canal} px`);
      decir('columnas', String(cols));
      decir('ancho', `${String(Math.round((w - 2 * margen - (cols - 1) * canal) / cols * 10) / 10).replace('.', ',')} px`);
      $$('button', lista).forEach((b, i) => {
        b.setAttribute('aria-pressed', String(i === actual));
        if (PANTALLAS[i].tuya) $('b', b).textContent = `${innerWidth} × ${innerHeight}`;
      });
    };
    const parar = () => { clearInterval(gira); gira = null; };
    PANTALLAS.forEach((d, i) => {
      const b = crear('button', '', `<b>${d.tuya ? `${innerWidth} × ${innerHeight}` : `${d.w} × ${d.h}`}</b><span>${d.nombre}</span>`);
      b.type = 'button';
      b.addEventListener('click', () => { parar(); actual = i; pintar(); });
      lista.append(b);
    });
    addEventListener('resize', pintar);
    const arrancar = () => {
      parar();
      rejilla.classList.remove('lista');
      actual = quieto ? PANTALLAS.length - 1 : 0;
      pintar();
      requestAnimationFrame(() => requestAnimationFrame(() => rejilla.classList.add('lista')));
      if (quieto) return;
      gira = setInterval(() => {
        if (actual >= PANTALLAS.length - 1) { parar(); return; }
        actual++;
        pintar();
      }, 1700);
    };
    const cajon = rejilla.closest('details');
    if (cajon) cajon.addEventListener('desplegado', e => { if (e.detail) arrancar(); else parar(); });
    else arrancar();
  }

  const botonReal = $('[data-grilla-real]');
  if (botonReal) {
    let capa = null, texto = null;
    const decir = () => {
      if (!texto) return;
      const [margen, canal, cols] = regla(innerWidth);
      texto.textContent = `${innerWidth} px · margen ${margen} · separación ${canal} · ${cols} columnas`;
    };
    const poner = ver => {
      if (!capa) {
        capa = crear('div', 'grilla-real', `<div class="grilla-real-columnas" aria-hidden="true">${'<i></i>'.repeat(8)}</div><p class="grilla-real-dato"><span></span><button type="button">Ocultar la grilla</button></p>`);
        document.body.append(capa);
        texto = $('span', capa);
        $('button', capa).addEventListener('click', () => poner(false));
        addEventListener('resize', decir);
        capa.getBoundingClientRect();
      }
      decir();
      html.classList.toggle('con-grilla', ver);
      botonReal.setAttribute('aria-pressed', String(ver));
      botonReal.firstChild.textContent = ver ? 'Ocultar la grilla de esta página' : 'Ver la grilla sobre esta página';
    };
    botonReal.addEventListener('click', () => poner(!html.classList.contains('con-grilla')));
    addEventListener('keydown', e => { if (e.key === 'Escape' && html.classList.contains('con-grilla')) poner(false); });
  }

  const mosaico = el => {
    const capa = crear('span', 'ui-mosaico');
    capa.setAttribute('aria-hidden', 'true');
    el.append(capa);
    let firma = '';
    const armar = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h || firma === `${w}/${h}`) return;
      firma = `${w}/${h}`;
      const paso = h / 3, cols = Math.ceil(w / paso), total = cols * 3;
      const orden = Array.from({ length: total }, (_, i) => i);
      let semilla = total * 37 + 11;
      for (let i = total - 1; i > 0; i--) {
        semilla = (semilla * 1664525 + 1013904223) >>> 0;
        const j = semilla % (i + 1);
        [orden[i], orden[j]] = [orden[j], orden[i]];
      }
      capa.replaceChildren(...orden.map((o, i) => {
        const c = crear('i');
        c.style.cssText = `left:${i % cols * paso}px;top:${Math.floor(i / cols) * paso}px;width:${paso + 1}px;height:${paso + 1}px;--o:${o / Math.max(total - 1, 1)}`;
        return c;
      }));
    };
    armar();
    new ResizeObserver(armar).observe(el);
    return v => { el.dataset.activo = String(!!v); };
  };
  $$('[data-mosaico]').forEach(b => {
    const activar = mosaico(b);
    let sobre = false;
    const ver = () => activar(!b.disabled && (sobre || b.matches(':focus-visible')));
    b.addEventListener('pointerenter', e => { sobre = e.pointerType !== 'touch'; ver(); });
    b.addEventListener('pointerleave', () => { sobre = false; ver(); });
    b.addEventListener('focus', ver);
    b.addEventListener('blur', ver);
  });
  $$('.ui-interruptor').forEach(b => b.addEventListener('click', () => b.setAttribute('aria-checked', String(b.getAttribute('aria-checked') !== 'true'))));
  $$('[data-ui-chip]').forEach(b => b.addEventListener('click', () => b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'))));
  $$('.ui-enlace').forEach(a => a.addEventListener('click', e => e.preventDefault()));

  const estados = $('[data-estados]');
  if (estados) {
    const ESTADOS = [
      ['normal', 'Normal', 'Los colores base de cada componente.'],
      ['hover', 'Hover', 'Mosaico de píxeles del borde al centro en la web; destellos en el juego.'],
      ['foco', 'Foco', 'Anillo lima de 3 px, separado 3 px. Siempre visible con teclado.'],
      ['elegido', 'Elegido', 'Violeta en chips, opciones y pestañas.'],
      ['deshabilitado', 'Deshabilitado', 'Gris #3A3A3A con texto #B8B8B8 y sin hover.'],
      ['exito', 'Éxito', 'Verde de confirmación #34C46A con el ícono de tilde.'],
      ['error', 'Error', 'Por definir: color, ícono y mensaje. Nunca solo el color.']
    ];
    const muestra = $('[data-estados-muestra]', estados), lista = $('[data-estados-lista]', estados), texto = $('[data-estados-texto]', estados);
    const activar = mosaico($('[data-estados-boton]', estados));
    const poner = k => {
      const [id, nombre, detalle] = ESTADOS[k];
      muestra.dataset.estado = id;
      activar(id === 'hover');
      texto.innerHTML = `<b>${nombre}</b>${detalle}`;
      $$('button', lista).forEach((b, i) => b.setAttribute('aria-pressed', String(i === k)));
    };
    ESTADOS.forEach(([, nombre], k) => {
      const b = crear('button', '', nombre);
      b.type = 'button';
      b.addEventListener('click', () => poner(k));
      lista.append(b);
    });
    poner(0);
  }
})();
