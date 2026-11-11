(() => {
  const PALETA = [
    { id: 'lima', nombre: 'Lima', hex: '#E4FE44', rgb: '228 · 254 · 68', cmyk: '10 · 0 · 73 · 0', grupo: 'Identidad', rol: 'Orienta y llama a la acción: direccionales, botones y la entrada general.' },
    { id: 'violeta', nombre: 'Violeta', hex: '#6940AE', rgb: '105 · 64 · 174', cmyk: '40 · 63 · 0 · 32', rol: 'Identidad y ambiente: tramas, fondos, la cueva y la entrada especial.' },
    { id: 'naranja', nombre: 'Naranja', hex: '#F66227', rgb: '246 · 98 · 39', cmyk: '0 · 60 · 84 · 4', rol: 'Énfasis y energía: destacados, avisos y el pase de 4 días.' },
    { id: 'placa', nombre: 'Placa', hex: '#232323', rgb: '35 · 35 · 35', cmyk: '0 · 0 · 0 · 86', grupo: 'Base', rol: 'La base de todo: fondos, carteles y pantallas.' },
    { id: 'blanco', nombre: 'Blanco', hex: '#FFFFFF', rgb: '255 · 255 · 255', cmyk: '0 · 0 · 0 · 0', rol: 'Lectura: textos, pictogramas y números sobre la placa.' },
    { id: 'lila', nombre: 'Lila', hex: '#C8ACFF', rgb: '200 · 172 · 255', cmyk: '22 · 33 · 0 · 0', grupo: 'Apoyo', rol: 'El violeta para leer sobre oscuro y el código de los pisos 6 y 7.' }
  ];
  const PROPORCION = [['placa', 55], ['blanco', 20], ['lima', 12], ['violeta', 8], ['naranja', 5]];
  const ESCALA = [
    { n: 'Display', m: 'Musuq Pacha', f: 'sg', w: 700, px: 96, lh: 1, ls: -0.02, fam: 'Space Grotesk Bold', med: '96 px · 100 % · −2 %', pt: '60 pt' },
    { n: 'Título 1', m: 'Un mundo nuevo', f: 'sg', w: 700, px: 64, lh: 1.05, ls: -0.015, fam: 'Space Grotesk Bold', med: '64 px · 105 % · −1,5 %', pt: '40 pt' },
    { n: 'Título 2', m: 'La experiencia', f: 'sg', w: 500, px: 44, lh: 1.1, ls: -0.01, fam: 'Space Grotesk Medium', med: '44 px · 110 % · −1 %', pt: '28 pt' },
    { n: 'Título 3', m: 'Cómo llegar', f: 'sg', w: 500, px: 30, lh: 1.2, ls: 0, fam: 'Space Grotesk Medium', med: '30 px · 120 %', pt: '20 pt' },
    { n: 'Rótulo', m: 'Expo creadores', f: 'sg', w: 500, px: 14, lh: 1.2, ls: 0.08, may: true, fam: 'Space Grotesk Medium en mayúsculas', med: '14 px · 120 % · +8 %', pt: '9 pt' },
    { n: 'Copete', m: 'Cuatro días para jugar, aprender y crear.', f: 'ar', w: 400, px: 22, lh: 1.45, ls: 0, fam: 'Archivo Regular', med: '22 px · 145 %', pt: '13 pt' },
    { n: 'Cuerpo', m: 'Yachay reúne el juego, la expo y el museo en un mismo recorrido.', f: 'ar', w: 400, px: 17, lh: 1.55, ls: 0, fam: 'Archivo Regular', med: '17 px · 155 %', pt: '10 pt' },
    { n: 'Pequeño', m: 'Entradas en musuqpacha.com.ar/eventos', f: 'ar', w: 400, px: 14, lh: 1.5, ls: 0, fam: 'Archivo Regular', med: '14 px · 150 %', pt: '8 pt' },
    { n: 'Mínimo', m: 'Notas legales y créditos de las fotos', f: 'ar', w: 400, px: 12, lh: 1.4, ls: 0, fam: 'Archivo Regular', med: '12 px · 140 %', pt: '7 pt' }
  ];

  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const color = id => PALETA.find(c => c.id === id).hex;
  const crear = (tag, clase, html) => { const e = document.createElement(tag); if (clase) e.className = clase; if (html != null) e.innerHTML = html; return e; };
  const coma = n => n.toFixed(1).replace('.', ',');
  const semilla = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  const luz = hex => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(parseInt(hex.slice(1, 3), 16)) + 0.7152 * f(parseInt(hex.slice(3, 5), 16)) + 0.0722 * f(parseInt(hex.slice(5, 7), 16));
  };
  const relacion = (a, b) => { const [x, y] = [luz(a), luz(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const nivel = r => r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA grande' : 'No';
  const neutro = hex => relacion(hex, '#FFFFFF') >= relacion(hex, '#1B1B1B') ? '#FFFFFF' : '#1B1B1B';

  const aviso = $('[data-aviso]');
  let avisoTiempo;
  const avisar = texto => {
    aviso.textContent = texto;
    aviso.classList.add('ver');
    clearTimeout(avisoTiempo);
    avisoTiempo = setTimeout(() => aviso.classList.remove('ver'), 1800);
  };
  const copiar = async texto => {
    try { await navigator.clipboard.writeText(texto); return true; }
    catch (e) {
      const t = crear('textarea'); t.value = texto; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.append(t); t.select();
      const ok = document.execCommand('copy'); t.remove(); return ok;
    }
  };
  const abrirCarrusel = opciones => { if (window.Carrusel) window.Carrusel.abrir(opciones); };
  const diapoImagen = ({ src, alt, rotulo, titulo, texto, medida, foto }) => {
    const d = crear('article', 'carrusel-diapo');
    d.innerHTML = `<div class="diapo-visual${foto ? ' foto' : ''}"><img alt=""></div>
      <div class="diapo-datos"><p class="diapo-rotulo"></p><h3></h3>${texto ? '<p class="diapo-texto"></p>' : ''}${medida ? '<p class="diapo-medida"></p>' : ''}</div>`;
    const img = $('img', d); img.src = src; img.alt = alt;
    $('.diapo-rotulo', d).textContent = rotulo;
    $('h3', d).textContent = titulo;
    if (texto) $('.diapo-texto', d).textContent = texto;
    if (medida) $('.diapo-medida', d).textContent = medida;
    return d;
  };
  const ampliable = (el, etiqueta, abrir) => {
    el.dataset.ampliar = '';
    el.dataset.cursor = 'Ver';
    if (!/^(BUTTON|A)$/.test(el.tagName)) {
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } });
    }
    if (etiqueta) el.setAttribute('aria-label', etiqueta);
    el.addEventListener('click', abrir);
  };

  const mejorTexto = c => PALETA.filter(t => t.id !== c.id).map(t => ({ t, r: relacion(c.hex, t.hex) })).sort((a, b) => b.r - a.r)[0];
  const diapoColor = (c, k) => {
    const d = crear('article', 'carrusel-diapo');
    const mejor = mejorTexto(c);
    const codigos = [['HEX', c.hex], ['RGB', c.rgb.replace(/ · /g, ', ')], ['CMYK', c.cmyk.replace(/ · /g, ', ')]];
    d.innerHTML = `<div class="diapo-visual diapo-color" style="--c:${c.hex};--n:${neutro(c.hex)}"><span class="diapo-color-hex">${c.grupo || PALETA.slice(0, k).reverse().find(x => x.grupo).grupo} · ${c.hex}</span><span class="diapo-color-nombre">${c.nombre}</span></div>
      <div class="diapo-datos">
        <p class="diapo-rotulo">Color ${k + 1} de ${PALETA.length}</p>
        <h3>${c.nombre}</h3>
        <p>${c.rol}</p>
        <div class="diapo-codigos">${codigos.map(([n, v]) => `<div class="diapo-codigo"><b>${n}</b><span data-descifrar>${v}</span><button type="button" data-copiar="${v}" aria-label="Copiar ${n} ${v}">Copiar</button></div>`).join('')}</div>
        <p class="nota">Texto con más contraste encima: ${mejor.t.nombre.toLowerCase()}, ${coma(mejor.r)} a 1.</p>
      </div>`;
    $$('[data-copiar]', d).forEach(b => b.addEventListener('click', async () => { if (await copiar(b.dataset.copiar)) avisar(`Copiado: ${c.nombre} ${b.dataset.copiar}`); }));
    return d;
  };

  const paleta = $('[data-paleta]');
  PALETA.forEach((c, k) => {
    const b = crear('button', 'muestra');
    b.type = 'button';
    b.dataset.aparece = '';
    b.dataset.enfasis = '';
    b.innerHTML = `<span class="muestra-grupo">${c.grupo || ''}</span>
      <span class="muestra-color${c.id === 'placa' ? ' borde' : ''}" style="--c:${c.hex}"><span class="muestra-pix">${'<i></i>'.repeat(9)}</span></span>
      <span class="muestra-nombre">${c.nombre}</span>
      <span class="muestra-rol">${c.rol}</span>
      <span class="muestra-codigos"><b>HEX</b> <span data-descifrar>${c.hex}</span><br><b>RGB</b> <span data-contar>${c.rgb}</span><br><b>CMYK</b> <span data-contar>${c.cmyk}</span></span>`;
    ampliable(b, `${c.nombre}, ${c.hex}. Ver en grande y copiar sus códigos`, () => abrirCarrusel({ titulo: 'Paleta principal', inicio: k, origen: b, diapos: PALETA.map(diapoColor) }));
    paleta.append(b);
  });
  $$('.muestra-pix', paleta).forEach(p => {
    const pix = $$('i', p);
    [1, 3, 5, 7].forEach(k => pix[k].style.visibility = 'hidden');
  });

  const barra = $('[data-proporcion]');
  const leyenda = crear('ul', 'proporcion-leyenda');
  PROPORCION.forEach(([id, p]) => {
    const d = crear('div', id === 'placa' ? 'borde' : '');
    d.style.setProperty('--c', color(id));
    d.style.setProperty('--p', p + '%');
    d.title = `${PALETA.find(c => c.id === id).nombre} · ${p} %`;
    barra.append(d);
    leyenda.append(crear('li', '', `<i style="--c:${color(id)}"${id === 'placa' ? ' class="borde"' : ''}></i><b data-contar>${p} %</b>${PALETA.find(c => c.id === id).nombre}`));
  });
  barra.after(leyenda);
  leyenda.dataset.aparece = '';

  const probador = $('[data-probador]');
  const elegido = { texto: 'blanco', fondo: 'placa' };
  const muestra = $('[data-muestra]', probador);
  const resultado = $('[data-resultado]', probador);
  const actualizar = () => {
    const t = color(elegido.texto), f = color(elegido.fondo);
    muestra.style.setProperty('--texto-p', t);
    muestra.style.setProperty('--fondo-p', f);
    const r = relacion(t, f);
    const pasa = (min, txt) => `<em class="${r >= min ? 'si' : 'no'}">${txt}</em>`;
    resultado.innerHTML = elegido.texto === elegido.fondo
      ? '<b>—</b> Elegí dos colores distintos.'
      : `<b>${coma(r)} : 1</b>${pasa(4.5, 'Texto común AA')}${pasa(3, 'Texto grande AA')}${pasa(7, 'AAA')}`;
  };
  $$('[data-elige]', probador).forEach(grupo => {
    const tipo = grupo.dataset.elige;
    PALETA.forEach(c => {
      const b = crear('button', '', `<i style="--c:${c.hex}"></i>${c.nombre}`);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(elegido[tipo] === c.id));
      b.addEventListener('click', () => {
        elegido[tipo] = c.id;
        $$('button', grupo).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        actualizar();
      });
      grupo.append(b);
    });
  });
  actualizar();

  const matriz = $('[data-matriz]');
  const cabeza = crear('thead');
  const filaCabeza = crear('tr', '', '<td></td>');
  PALETA.forEach(c => filaCabeza.append(crear('th', '', `Texto ${c.nombre.toLowerCase()}`)));
  filaCabeza.querySelectorAll('th').forEach(th => th.scope = 'col');
  cabeza.append(filaCabeza);
  const cuerpo = crear('tbody');
  PALETA.forEach((f, i) => {
    const tr = crear('tr');
    const th = crear('th', '', `Fondo ${f.nombre.toLowerCase()}`); th.scope = 'row'; tr.append(th);
    PALETA.forEach((t, j) => {
      const td = crear('td', f.id === 'placa' ? 'borde' : '');
      td.style.setProperty('--f', f.hex);
      td.style.setProperty('--t', t.hex);
      td.style.setProperty('--n', neutro(f.hex));
      td.style.transitionDelay = `${i * 50 + j * 35}ms`;
      if (f.id === t.id) { td.classList.add('igual'); td.innerHTML = '<span>—</span>'; td.setAttribute('aria-label', 'Mismo color'); }
      else {
        const r = relacion(f.hex, t.hex), n = nivel(r);
        td.innerHTML = `<span class="aa">Aa</span><span class="relacion">${coma(r)} : 1</span><span class="nivel${n === 'No' ? ' no' : ''}">${n.toUpperCase()}</span>`;
        td.setAttribute('aria-label', `Texto ${t.nombre.toLowerCase()} sobre fondo ${f.nombre.toLowerCase()}: ${coma(r)} a 1, ${n}`);
      }
      tr.append(td);
    });
    cuerpo.append(tr);
  });
  matriz.append(cabeza, cuerpo);

  const escalas = $('[data-escalas]');
  ['lima', 'violeta', 'naranja', 'blanco'].forEach(id => {
    const fila = crear('div', 'escala-fila');
    fila.append(crear('h4', '', PALETA.find(c => c.id === id).nombre));
    [100, 80, 60, 40].forEach(o => {
      const fig = crear('figure', '', `<i style="--c:${color(id)};--o:${o / 100}"></i><figcaption>${o} %</figcaption>`);
      fila.append(fig);
    });
    escalas.append(fila);
  });

  const trama = $('[data-trama]');
  if (trama) {
    const azar = semilla(11);
    const pasos = [0.4, 0.6, 0.8, 1];
    const pix = Array.from({ length: 11 }, () => Array(15).fill(null));
    for (let r = 0; r < 11; r++) for (let c = 0; c <= 7; c++) {
      const base = Math.pow(r / 10, 1.3);
      if (azar() > base + 0.08) continue;
      const q = azar();
      const id = q < 0.72 ? 'violeta' : q < 0.9 ? 'lima' : 'naranja';
      const o = pasos[Math.min(3, Math.floor(base * 3 + azar() * 1.5))];
      pix[r][c] = pix[r][14 - c] = { id, o };
    }
    const vivas = [];
    pix.forEach((fila, r) => fila.forEach((d, c) => {
      const i = crear('i', d ? '' : 'vacio');
      if (d) { i.style.setProperty('--c', color(d.id)); i.style.setProperty('--o', d.o); if (c <= 7) vivas.push({ r, c }); }
      trama.append(i);
    }));
    const celda = (r, c) => trama.children[r * 15 + c];
    if (!quieto) setInterval(() => {
      const { r, c } = vivas[Math.floor(Math.random() * vivas.length)];
      const o = pasos[Math.floor(Math.random() * pasos.length)];
      [c, 14 - c].forEach(cc => celda(r, cc).style.setProperty('--o', o));
    }, 700);
  }

  $$('[data-familia]').forEach(fam => {
    const botones = $$('[data-peso]', fam);
    const aplicar = b => {
      botones.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      ['.familia-aa', '.familia-alfabeto'].forEach(s => { $(s, fam).style.fontWeight = b.dataset.peso; });
    };
    botones.forEach(b => b.addEventListener('click', () => aplicar(b)));
    aplicar(botones.find(b => b.getAttribute('aria-pressed') === 'true'));
  });

  const escala = $('[data-escala]');
  const filas = ESCALA.map(e => {
    const fila = crear('div', 'estilo');
    fila.dataset.aparece = '';
    fila.dataset.enfasis = '';
    const tam = e.px > 30 ? `min(${e.px}px, calc(100vw * ${(e.px / 96 * 0.085).toFixed(4)}))` : `${e.px}px`;
    fila.innerHTML = `<span class="estilo-nombre">${e.n}</span>
      <span class="estilo-muestra" style="font-family:var(--${e.f});font-weight:${e.w};font-size:${tam};line-height:${e.lh};letter-spacing:${e.ls}em;${e.may ? 'text-transform:uppercase;' : ''}">${e.m}</span>
      <span class="estilo-familia">${e.fam}</span>
      <span class="estilo-medida">${e.med}</span>`;
    escala.append(fila);
    return { e, fila };
  });
  const prueba = $('[data-prueba]');
  prueba.addEventListener('input', () => {
    const txt = prueba.value.trim();
    filas.forEach(({ e, fila }) => { $('.estilo-muestra', fila).textContent = txt || e.m; });
  });
  $$('[data-medida]').forEach(b => b.addEventListener('click', () => {
    $$('[data-medida]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    filas.forEach(({ e, fila }) => {
      const m = $('.estilo-medida', fila);
      m.textContent = b.dataset.medida === 'pt' ? e.pt : e.med;
      m.classList.add('cambia');
      setTimeout(() => m.classList.remove('cambia'), 500);
    });
  }));

  const modulo = $('[data-modulo]');
  if (modulo) {
    const cols = 12, alto = 7;
    const celdas = [];
    for (let r = 0; r < alto; r++) for (let c = 0; c < cols; c++) { const i = crear('i'); modulo.append(i); celdas.push({ i, r, c }); }
    const borde = celdas.filter(({ r, c }) => c < cols / 2 && Math.min(r, c, alto - 1 - r) <= 1);
    if (!quieto) {
      let armado = true;
      setInterval(() => {
        armado = !armado;
        borde.forEach(x => {
          const par = celdas[x.r * cols + (cols - 1 - x.c)];
          const afuera = !armado && Math.random() < (Math.min(x.r, x.c, alto - 1 - x.r) === 0 ? 0.7 : 0.35);
          setTimeout(() => [x, par].forEach(y => y.i.classList.toggle('fuera', afuera)), Math.random() * 500);
        });
      }, 2600);
    }
  }

  const racimo = $('[data-racimo]');
  if (racimo) {
    const lado = 9, medio = 4;
    const celdas = Array.from({ length: lado * lado }, () => racimo.appendChild(crear('i')));
    let colorRacimo = 'lima';
    const armar = () => {
      const azar = semilla(Math.floor(Math.random() * 1e9));
      celdas.forEach(i => i.classList.remove('lleno'));
      setTimeout(() => {
        for (let r = 0; r < lado; r++) for (let c = 0; c <= medio; c++) {
          const cerca = 1 - Math.abs(c - medio) / (medio + 1);
          const p = 0.12 + 0.75 * Math.pow(r / (lado - 1), 1.2) * (0.45 + 0.55 * cerca);
          if (azar() > p) continue;
          const pasos = colorRacimo === 'violeta' ? [0.4, 0.6, 0.8, 1] : [0.6, 0.75, 0.9, 1];
          const o = pasos[Math.min(3, Math.floor(p * 4 + azar() * 0.8))];
          [c, lado - 1 - c].forEach(cc => {
            const i = celdas[r * lado + cc];
            i.style.setProperty('--c', color(colorRacimo));
            i.style.setProperty('--o', o);
            i.style.transitionDelay = `${(lado - 1 - r) * 40 + Math.abs(cc - medio) * 25}ms`;
            i.classList.add('lleno');
          });
        }
      }, quieto ? 0 : 300);
    };
    const chips = $('[data-racimo-color]');
    ['lima', 'violeta', 'naranja'].forEach(id => {
      const b = crear('button', '', `<i style="--c:${color(id)}"></i>${PALETA.find(c => c.id === id).nombre}`);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(id === colorRacimo));
      b.addEventListener('click', () => { colorRacimo = id; $$('button', chips).forEach(x => x.setAttribute('aria-pressed', String(x === b))); armar(); });
      chips.append(b);
    });
    $('[data-racimo-otro]').addEventListener('click', armar);
    armar();
  }

  const chakana = $('[data-chakana]');
  if (chakana) {
    ['...xxx...', '...xxx...', '.xxxxxxx.', 'xxx...xxx', 'xxx...xxx', 'xxx...xxx', '.xxxxxxx.', '...xxx...', '...xxx...'].forEach((fila, r) => [...fila].forEach((ch, c) => {
      const i = crear('i', ch === 'x' ? '' : 'vacio');
      i.style.transitionDelay = `${(Math.abs(r - 4) + Math.abs(c - 4)) * 70}ms`;
      chakana.append(i);
    }));
  }

  const PICTOS = window.PICTOGRAMAS || {};
  const NOMBRES = { ascensor: 'Ascensor', banos: 'Baños', chakana: 'Chakana', escaleras: 'Escaleras', 'patio-de-comidas': 'Patio de comidas', 'zona-vr': 'Zona VR', auditorio: 'Auditorio', explorar: 'Explorar', 'expo-creadores': 'Expo creadores', 'mapa-interactivo': 'Mapa interactivo', merch: 'Merch', 'museo-inmersivo': 'Museo inmersivo', 'zona-samay': 'Zona Samay' };
  const limpiarSvg = svg => svg.replace(/\swidth="[^"]*"/, '').replace(/\sheight="[^"]*"/, '').replace('<svg', '<svg aria-hidden="true" focusable="false"');
  const pictos = $('[data-pictos]');
  if (pictos) {
    const FONDOS = { placa: ['placa', 'blanco'], lima: ['lima', 'placa'], blanco: ['blanco', 'placa'] };
    const SOBRE = { placa: 'la placa', lima: 'lima', blanco: 'blanco' };
    let fondo = 'placa';
    const lista = Object.entries(NOMBRES).filter(([slug]) => PICTOS[slug]);
    const bajar = (slug, nombre) => {
      const svg = PICTOS[slug].replace(/currentColor/g, color(FONDOS[fondo][1]));
      const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      const enlace = crear('a'); enlace.href = url; enlace.download = `musuq-pacha-${slug}.svg`;
      document.body.append(enlace); enlace.click(); enlace.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      avisar(`Bajando: ${nombre}`);
    };
    const diapoPicto = ([slug, nombre], k) => {
      const d = crear('article', 'carrusel-diapo');
      d.innerHTML = `<div class="diapo-visual diapo-picto" style="--pf:${color(FONDOS[fondo][0])};--pc:${color(FONDOS[fondo][1])}">${limpiarSvg(PICTOS[slug])}</div>
        <div class="diapo-datos">
          <p class="diapo-rotulo">Pictograma ${k + 1} de ${lista.length}</p>
          <h3>${nombre}</h3>
          <p>Sobre ${SOBRE[fondo]}. Trazo de un quinceavo del ancho, esquinas en bisel y extremos rectos.</p>
          <button class="boton" type="button">Bajar en SVG</button>
        </div>`;
      $('.boton', d).addEventListener('click', () => bajar(slug, nombre));
      return d;
    };
    lista.forEach(([slug, nombre], k) => {
      const b = crear('button', 'picto', `${limpiarSvg(PICTOS[slug])}<span>${nombre}</span>`);
      b.type = 'button';
      b.dataset.enfasis = '';
      ampliable(b, `${nombre}: ver en grande y bajar en SVG`, () => abrirCarrusel({ titulo: 'Pictogramas', inicio: k, origen: b, diapos: lista.map(diapoPicto) }));
      pictos.append(b);
    });
    $$('[data-fondo]').forEach(b => b.addEventListener('click', () => {
      fondo = b.dataset.fondo;
      $$('[data-fondo]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      pictos.style.setProperty('--pf', color(FONDOS[fondo][0]));
      pictos.style.setProperty('--pc', color(FONDOS[fondo][1]));
    }));
    const tam = $('[data-tam]'), tamValor = $('[data-tam-valor]'), tamAviso = $('[data-tam-aviso]');
    const medir = () => {
      pictos.style.setProperty('--tam', tam.value + 'px');
      tamValor.textContent = tam.value + ' px';
      tamAviso.textContent = +tam.value <= 24 ? '24 px es el mínimo en pantalla: más chico, el trazo se empasta.' : '';
    };
    tam.addEventListener('input', medir);
    medir();
  }
  $$('[data-picto-mini]').forEach(i => { const s = PICTOS[i.dataset.pictoMini]; if (s) i.innerHTML = limpiarSvg(s); });

  const CARTELES = [
    { nombre: 'Direccional', img: 'senaletica/direccional.png', texto: 'Cuadro lima, pictograma, píxeles, rótulo y flecha. Ascensores, escaleras y patio de comidas, hacia cada lado.', medida: 'Placa de 1,50 × 0,25 m.' },
    { nombre: 'Puntual del directorio', img: 'senaletica/puntual-directorio.png', texto: 'Cuadro violeta, número, píxeles, pictograma, zona y bajada. Una placa por piso o zona.', medida: 'Placas de 1,50 × 0,25 m, entre 0,70 y 2,80 m de altura.' },
    { nombre: 'Puntual de lugar', img: 'senaletica/puntual-lugar.png', texto: 'Placa cuadrada, pictograma y esquinas lima. Sobre cada ascensor, en los tótems del mapa y en la entrada del auditorio.', medida: '0,40 × 0,40 m.' },
    { nombre: 'Indicativa de piso', img: 'senaletica/indicativa-pb.png', texto: 'El número de piso, el racimo de píxeles y el directorio, en la cara del núcleo que da al hall. Va en planta baja y en los pisos 2, 4, 6 y 9.', medida: 'Ocupa toda la cara del núcleo, con el número a escala del edificio.' },
    { nombre: 'Cubo del mapa interactivo', img: 'senaletica/cubo-mapa.png', texto: 'Cubos retroiluminados junto a la mesa del mapa, con el ícono y «mapa interactivo» en sus caras.', medida: '1,08 m de lado; tres cubos apilados llegan a 3,28 m.' },
    { nombre: 'Pendón de recepción', img: 'senaletica/pendon.png', texto: 'Detrás de los mostradores, a los dos lados del hall: chakana, Yachay y «Recepción · entradas · informes».', medida: '0,85 × 2 m.' },
    { nombre: 'Lona del hall', img: 'senaletica/lona.jpg', texto: 'La gráfica de Yachay sobre las tres puertas giratorias, mirando a la entrada por Sarmiento.', medida: '19 × 3,36 m.' }
  ];
  const pestanas = $('[data-pestanas]');
  if (pestanas) {
    const panel = $('[data-cartel]');
    const img = $('[data-cartel-img]'), nom = $('[data-cartel-nombre]'), txt = $('[data-cartel-texto]'), med = $('[data-cartel-medida]');
    let actual = 0;
    panel.id = 'panel-cartel';
    const mostrar = (k, foco) => {
      const c = CARTELES[k];
      actual = k;
      $$('button', pestanas).forEach((b, j) => {
        b.setAttribute('aria-selected', String(j === k));
        b.tabIndex = j === k ? 0 : -1;
        if (j === k && foco) b.focus();
      });
      img.classList.add('cambiando');
      setTimeout(() => {
        img.onload = () => img.classList.remove('cambiando');
        img.src = c.img;
        img.alt = c.nombre;
        nom.textContent = c.nombre;
        txt.textContent = c.texto;
        med.textContent = c.medida;
        if (img.complete) img.classList.remove('cambiando');
      }, quieto ? 0 : 200);
    };
    CARTELES.forEach((c, k) => {
      const b = crear('button', '', c.nombre);
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', 'panel-cartel');
      b.addEventListener('click', () => mostrar(k));
      b.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        mostrar((k + (e.key === 'ArrowRight' ? 1 : CARTELES.length - 1)) % CARTELES.length, true);
      });
      pestanas.append(b);
    });
    const pieza = $('[data-cartel-abrir]');
    ampliable(pieza, null, () => abrirCarrusel({
      titulo: 'Señalética · moléculas',
      inicio: actual,
      origen: pieza,
      diapos: CARTELES.map((c, k) => diapoImagen({ src: c.img, alt: c.nombre, rotulo: `Cartel ${k + 1} de ${CARTELES.length}`, titulo: c.nombre, texto: c.texto, medida: c.medida }))
    }));
    mostrar(0);
  }

  $$('[data-galeria]').forEach(galeria => {
    const figuras = $$('figure', galeria);
    const foto = galeria.classList.contains('fotos');
    const datos = figuras.map((f, k) => ({ src: $('img', f).getAttribute('src'), alt: $('img', f).alt, rotulo: `${galeria.dataset.galeria} · ${k + 1} de ${figuras.length}`, titulo: foto ? $('figcaption', f).textContent : $('img', f).alt, texto: foto ? '' : (f.dataset.texto || galeria.dataset.texto || ''), foto }));
    figuras.forEach((f, k) => ampliable(f, `Ver en grande: ${$('img', f).alt}`, () => abrirCarrusel({ titulo: galeria.dataset.galeria, inicio: k, origen: f, diapos: datos.map(diapoImagen) })));
  });

  window.MARCA = { PALETA, color, avisar, copiar, quieto };
})();
