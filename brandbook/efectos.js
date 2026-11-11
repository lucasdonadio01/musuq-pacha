(() => {
  const html = document.documentElement;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const conHover = matchMedia('(hover: hover)');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const crear = (tag, clase) => { const e = document.createElement(tag); if (clase) e.className = clase; return e; };
  const unidad = v => Math.min(1, Math.max(0, Number(v) || 0));
  const escalon = (a, b, v) => { const t = unidad((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const acercar = (actual, destino, dt, seg) => actual + (destino - actual) * (1 - Math.exp(-dt / seg));
  const ruido = (...vs) => {
    let h = 2166136261;
    for (const v of vs) { h = Math.imul(h ^ (v | 0), 16777619); h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; }
    return (h >>> 0) / 4294967296;
  };
  const signo = v => v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '0';

  const mosaico = el => {
    const capa = crear('span', 'mosaico');
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
    return v => { el.dataset.pixel = String(!!v); };
  };

  const BOTONES = '.boton,.boton-linea,.carga-saltar,.carrusel-flecha,.diapo-codigo button,.grilla-real-dato button';
  const montados = new WeakMap();
  const boton = e => e.target && e.target.closest ? e.target.closest(BOTONES) : null;
  const pixelar = (b, v) => {
    let activar = montados.get(b);
    if (!activar) {
      if (!v) return;
      activar = mosaico(b);
      montados.set(b, activar);
      b.getBoundingClientRect();
    }
    activar(v && !b.disabled);
  };
  document.addEventListener('pointerover', e => {
    const b = boton(e);
    if (!b || e.pointerType === 'touch' || !conHover.matches || (e.relatedTarget && b.contains(e.relatedTarget))) return;
    pixelar(b, true);
  });
  document.addEventListener('pointerout', e => {
    const b = boton(e);
    if (!b || (e.relatedTarget && b.contains(e.relatedTarget))) return;
    pixelar(b, b.matches(':focus-visible'));
  });
  document.addEventListener('focusin', e => { const b = boton(e); if (b && b.matches(':focus-visible')) pixelar(b, true); });
  document.addEventListener('focusout', e => { const b = boton(e); if (b) pixelar(b, false); });
  const apagar = () => $$('[data-pixel=true]').forEach(b => { if (b.matches(BOTONES) && !b.matches(':focus-visible')) b.dataset.pixel = 'false'; });
  addEventListener('blur', apagar);
  document.addEventListener('visibilitychange', () => { if (document.hidden) apagar(); });

  const ROTULO = '500 12px "Space Grotesk", Arial, sans-serif';
  const RESORTE = 320, CAIDA = 0.62, ESPERA = 0.15, ESCALONES = 8, VIDA_ONDA = 1.3;
  const LINEAS = ['línea de base', 'altura de x', 'mayúsculas', 'ascendente', 'descendente'];

  const tecnico = (caja, inicial = {}) => {
    const s = Object.assign({ texto: '', peso: 700, tam: 150, espaciado: -0.05, color: '', acento: '', contorno: 'letra', alcance: 200, suavidad: 0.7, guion: 4, hueco: 2, trazo: 1.5, motas: 15, marco: true, rotulos: true, arrastrar: true, rebote: 0.4, barrido: '', velocidad: 1, patada: true, intro: '', duracion: 2, guias: false, presion: false, pesoMin: 300, letras: null, zona: null }, inicial);
    const zona = s.zona || caja, anclado = !!s.letras;
    const lienzo = crear('canvas', 'tec-lienzo'), ctx = lienzo.getContext('2d');
    const borrador = document.createElement('canvas'), bctx = borrador.getContext('2d');
    if (!ctx || !bctx) return null;
    lienzo.setAttribute('aria-hidden', 'true');
    const sonda = anclado ? crear('i', 'tec-sonda') : null;
    if (sonda) caja.append(sonda);
    caja.append(lienzo);

    let ancho = 1, alto = 1, dpr = 1, margen = 0, cuadro = 0, antes = performance.now(), visible = false, clave = '', sucio = true, pedida = '', palabra = null, glifos = [], tintaActual = '#FFFFFF';
    let presencia = 0, reloj = 0, pulso = 0, puesto = false, arrastre = -1, cursor = '', relojIntro = 0, tipoIntro = '', entrando = false, fuentes = !document.fonts, guia = 0, pase = null, barrido = false, pintado = false;
    let fuerza = 0, fam = 'sans-serif';
    const patadas = [], ondas = [];
    const prensa = { x: 0, y: 0 };
    const toque = { x: 0, y: 0, t: 0, i: -1 };
    const puntero = { x: 0, y: 0, cx: 0, cy: 0, dentro: false };
    const agarre = { x: 0, y: 0 }, lente = { x: 0, y: 0 };
    const marco = { x1: 0, y1: 0, x2: 0, y2: 0, a: 0, i: -1 };

    const despertar = () => { if (cuadro || !visible) return; antes = performance.now(); cuadro = requestAnimationFrame(paso); };
    const refrescar = () => { clave = ''; despertar(); };
    const familia = () => getComputedStyle(caja).fontFamily || 'sans-serif';
    const fuente = tam => `${s.peso} ${tam}px ${familia()}`;
    const preparar = (c, tam) => { c.font = fuente(tam); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; };
    const colores = () => { const actual = getComputedStyle(caja).color || '#FFFFFF'; return { tinta: s.color || actual, acento: s.acento || actual }; };

    const estampa = (g, trazado) => {
      const aire = Math.ceil(s.trazo * 2 + 4), izq = g.caja.x1 - aire, arriba = g.caja.y1 - aire;
      const img = document.createElement('canvas');
      img.width = Math.max(1, Math.ceil((g.caja.x2 - g.caja.x1 + aire * 2) * dpr));
      img.height = Math.max(1, Math.ceil((g.caja.y2 - g.caja.y1 + aire * 2) * dpr));
      const c = img.getContext('2d');
      if (!c) return { img, izq, arriba };
      c.setTransform(dpr, 0, 0, dpr, -izq * dpr, -arriba * dpr);
      preparar(c, palabra.tam);
      if (trazado) {
        c.lineJoin = 'round';
        c.lineWidth = s.trazo * 2;
        c.strokeStyle = tintaActual;
        c.setLineDash([Math.max(1, s.guion), Math.max(1, s.hueco)]);
        c.strokeText(g.ch, g.x, palabra.base);
        c.setLineDash([]);
        c.globalCompositeOperation = 'destination-out';
        c.fillStyle = '#000000';
        c.fillText(g.ch, g.x, palabra.base);
      } else {
        c.fillStyle = tintaActual;
        c.fillText(g.ch, g.x, palabra.base);
      }
      return { img, izq, arriba };
    };
    const arte = (g, trazado) => { const k = trazado ? 'guiones' : 'relleno'; return g[k] || (g[k] = estampa(g, trazado)); };

    const disponer = tinta => {
      if (anclado) s.peso = getComputedStyle(caja).fontWeight || 700;
      const k = [s.texto, familia(), s.peso, s.tam, s.espaciado, tinta, s.guion, s.hueco, s.trazo, s.guias ? 1 : 0, ancho, alto, dpr].join('|');
      if (k === clave && palabra) return palabra;
      clave = k;
      tintaActual = tinta;
      fam = familia();
      const pide = fuente(64);
      if (document.fonts && pide !== pedida) { pedida = pide; document.fonts.load(pide, anclado ? caja.textContent : s.texto).then(refrescar, refrescar); }
      const m = bctx;
      let tam, base, letras, xs;
      if (anclado) {
        tam = parseFloat(getComputedStyle(caja).fontSize) || 100;
        base = sonda.offsetTop + margen;
        letras = s.letras.map(l => l.textContent);
        xs = s.letras.map(l => l.offsetLeft + margen);
      } else {
        letras = Array.from(s.texto);
        const tender = t => {
          preparar(m, t);
          let x = 0, izq = Infinity, der = -Infinity, sube = 0, baja = 0;
          const pos = letras.map(ch => {
            const d = m.measureText(ch), p = x;
            x += d.width + s.espaciado * t;
            if (ch.trim()) { izq = Math.min(izq, p - d.actualBoundingBoxLeft); der = Math.max(der, p + d.actualBoundingBoxRight); sube = Math.max(sube, d.actualBoundingBoxAscent); baja = Math.max(baja, d.actualBoundingBoxDescent); }
            return p;
          });
          return { pos, izq: isFinite(izq) ? izq : 0, der: isFinite(der) ? der : 0, sube, baja };
        };
        let r = tender(s.tam);
        const util = ancho - (s.guias ? 104 : 0);
        tam = s.tam * Math.min(1, util * 0.9 / Math.max(r.der - r.izq, 1), alto * 0.6 / Math.max(r.sube + r.baja, 1));
        r = tender(tam);
        xs = r.pos.map(p => (util - (r.der - r.izq)) / 2 + p - r.izq);
        base = (alto - (r.sube + r.baja)) / 2 + r.sube;
      }
      preparar(m, tam);
      const alturaX = base - m.measureText('x').actualBoundingBoxAscent, mayus = base - m.measureText('H').actualBoundingBoxAscent;
      const sube = base - m.measureText('d').actualBoundingBoxAscent, baja = base + m.measureText('p').actualBoundingBoxDescent;
      const previos = glifos;
      glifos = [];
      let izq = Infinity, der = -Infinity, arriba = Infinity, abajo = -Infinity;
      letras.forEach((ch, i) => {
        if (!ch.trim()) return;
        const d = m.measureText(ch), x = xs[i];
        const cg = { x1: x - d.actualBoundingBoxLeft, y1: base - d.actualBoundingBoxAscent, x2: x + d.actualBoundingBoxRight, y2: base + d.actualBoundingBoxDescent };
        izq = Math.min(izq, cg.x1); der = Math.max(der, cg.x2); arriba = Math.min(arriba, cg.y1); abajo = Math.max(abajo, cg.y2);
        const p = previos[glifos.length], igual = !!p && p.ch === ch && p.indice === i;
        glifos.push({ ch, x, indice: i, caja: cg, centro: x + d.width / 2, peso: 700, mov: igual ? p.mov : { x: 0, y: 0 }, vel: igual ? p.vel : { x: 0, y: 0 }, contorno: igual ? p.contorno : 0, visto: igual ? p.visto : 1, celdas: null, armado: 0, relleno: null, guiones: null });
      });
      if (!glifos.length) { izq = der = ancho / 2; arriba = abajo = base; }
      const tope = Math.min(arriba, mayus) - 2, piso = Math.max(abajo, base) + 2;
      palabra = {
        tam, base, izq, der, arriba, abajo,
        lineas: [[base, 0], [alturaX, 1], [mayus, 2], ...(mayus - sube > Math.max(13, tam * 0.06) ? [[sube, 3]] : []), [baja, 4]].map(([y, n]) => ({ y, rotulo: LINEAS[n] })),
        franjas: [{ y0: alturaX, y1: base, sube: true, orden: 0 }, { y0: mayus, y1: alturaX, sube: true, orden: 1 }, { y0: tope, y1: mayus, sube: true, orden: 2 }, { y0: base, y1: piso, sube: false, orden: 1 }].filter(f => f.y1 - f.y0 > 0.5)
      };
      if (arrastre >= 0 && (!glifos[arrastre] || !previos[arrastre] || glifos[arrastre].indice !== previos[arrastre].indice)) arrastre = -1;
      if (marco.i >= 0 && (!glifos[marco.i] || !previos[marco.i] || glifos[marco.i].ch !== previos[marco.i].ch)) marco.i = -1;
      return palabra;
    };

    const glifoEn = (x, y) => {
      if (!palabra || y < palabra.arriba - 24 || y > palabra.abajo + 24) return -1;
      let mejor = -1, dist = Infinity;
      glifos.forEach((g, i) => {
        const x1 = g.caja.x1 + g.mov.x, x2 = g.caja.x2 + g.mov.x, d = x < x1 ? x1 - x : x > x2 ? x - x2 : 0;
        if (d < dist) { dist = d; mejor = i; }
      });
      return dist < 28 ? mejor : -1;
    };

    const degradado = (c, cx, cy, radio, fuerza) => {
      const dentro = Math.min(1, Math.max(0, 1 - s.suavidad)), g = c.createRadialGradient(cx, cy, 0, cx, cy, radio);
      g.addColorStop(0, `rgba(0,0,0,${fuerza})`);
      if (dentro > 0.995) { g.addColorStop(0.995, `rgba(0,0,0,${fuerza})`); g.addColorStop(1, 'rgba(0,0,0,0)'); return g; }
      for (let i = 0; i <= ESCALONES; i++) { const t = i / ESCALONES; g.addColorStop(dentro + (1 - dentro) * t, `rgba(0,0,0,${fuerza * (1 - t * t * (3 - 2 * t))})`); }
      return g;
    };
    const calcar = (c, a, dx, dy, ox, oy) => c.drawImage(a.img, Math.round((a.izq + dx) * dpr - ox), Math.round((a.arriba + dy) * dpr - oy));
    const escribir = (g, tinta, v) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${g.peso} ${v.tam}px ${fam}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = tinta;
      ctx.fillText(g.ch, g.centro + g.mov.x, v.base + g.mov.y);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };

    const dibujarZona = () => {
      const radio = s.alcance * dpr, cx = lente.x * dpr, cy = lente.y * dpr;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = degradado(ctx, cx, cy, radio, presencia);
      ctx.fillRect(cx - radio, cy - radio, radio * 2, radio * 2);
      ctx.globalCompositeOperation = 'source-over';
      const x0 = Math.max(0, Math.floor(cx - radio)), y0 = Math.max(0, Math.floor(cy - radio)), x1 = Math.min(lienzo.width, Math.ceil(cx + radio)), y1 = Math.min(lienzo.height, Math.ceil(cy + radio));
      if (x1 <= x0 || y1 <= y0) return;
      const w = x1 - x0, h = y1 - y0;
      if (borrador.width < w || borrador.height < h) { borrador.width = Math.max(borrador.width, w); borrador.height = Math.max(borrador.height, h); }
      bctx.setTransform(1, 0, 0, 1, 0, 0);
      bctx.globalCompositeOperation = 'source-over';
      bctx.clearRect(0, 0, w, h);
      for (const g of glifos) calcar(bctx, arte(g, true), g.mov.x, g.mov.y, x0, y0);
      bctx.globalCompositeOperation = 'destination-in';
      bctx.fillStyle = degradado(bctx, cx - x0, cy - y0, radio, 1);
      bctx.fillRect(0, 0, w, h);
      bctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = presencia;
      ctx.drawImage(borrador, 0, 0, w, h, x0, y0, w, h);
      ctx.globalAlpha = 1;
    };

    const nitido = v => (Math.round(v * dpr) + 0.5) / dpr;
    const puntoBorde = (distancia, w, h) => {
      const total = 2 * (w + h);
      let d = ((distancia % total) + total) % total;
      if (d < w) return [marco.x1 + d, marco.y1, 0, -1];
      d -= w;
      if (d < h) return [marco.x2, marco.y1 + d, 1, 0];
      d -= h;
      if (d < w) return [marco.x2 - d, marco.y2, 0, 1];
      d -= w;
      return [marco.x1, marco.y2 - d, -1, 0];
    };

    const dibujarMotas = (a, acento, libre) => {
      const w = marco.x2 - marco.x1, h = marco.y2 - marco.y1;
      if (w < 2 || h < 2) return;
      const borde = 2 * (w + h), semilla = marco.i + 1, red = 3;
      ctx.fillStyle = acento;
      ctx.strokeStyle = acento;
      for (let k = 0; k < s.motas; k++) {
        const periodo = 0.5 + ruido(semilla, k, 11) * 1.2, t = pulso / periodo + ruido(semilla, k, 17), ciclo = Math.floor(t), vida = t - ciclo;
        if (vida > 0.7) continue;
        const [px, py, nx, ny] = puntoBorde(ruido(semilla, k, ciclo) * borde, w, h);
        if (ny < 0 && px < marco.x1 + libre) continue;
        const azar = ruido(semilla, k, ciclo, 2), lado = azar < 0.46 ? 2 : azar < 0.7 ? 3 : azar < 0.84 ? 5 : azar < 0.94 ? 8 : 11, grande = lado >= 8;
        const fuera = (grande ? 9 : 4) + Math.floor(ruido(semilla, k, ciclo, 1) * 5) * red;
        const x = marco.x1 + Math.round((px + nx * fuera - marco.x1) / red) * red, y = marco.y1 + Math.round((py + ny * fuera - marco.y1) / red) * red;
        const tono = ruido(semilla, k, ciclo, 3), titila = vida < 0.06 || (vida > 0.32 && vida < 0.36) ? 0.35 : 1;
        const izq = Math.round(x - lado / 2), arriba = Math.round(y - lado / 2);
        ctx.globalAlpha = a * (grande ? 0.3 + 0.4 * tono : 0.3 + 0.6 * tono) * titila;
        if (tono < 0.26 || (grande && tono < 0.78)) {
          ctx.strokeRect(izq + 0.5, arriba + 0.5, lado, lado);
          if (grande && tono > 0.5) ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
        } else ctx.fillRect(izq, arriba, lado, lado);
      }
      for (let j = 0; j < 2; j++) {
        const cabeza = (pulso * 0.42 * s.velocidad + j * 0.5) * borde;
        for (let i = 0; i < 4; i++) {
          const [x, y] = puntoBorde(cabeza - i * 6, w, h), lado = i === 0 ? 3 : 2;
          ctx.globalAlpha = a * [0.95, 0.55, 0.32, 0.16][i];
          ctx.fillRect(Math.round(x - lado / 2), Math.round(y - lado / 2), lado, lado);
        }
      }
      ctx.globalAlpha = 1;
    };

    const dibujarMarco = acento => {
      const g = glifos[marco.i];
      if (!g || marco.a < 0.01) return;
      const a = marco.a, x1 = nitido(marco.x1), y1 = nitido(marco.y1), x2 = nitido(marco.x2), y2 = nitido(marco.y2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = acento;
      ctx.strokeStyle = acento;
      ctx.lineWidth = 1;
      const movido = Math.hypot(g.mov.x, g.mov.y);
      if (movido > 1) {
        const hx = (g.caja.x1 + g.caja.x2) / 2, hy = (g.caja.y1 + g.caja.y2) / 2;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx + g.mov.x, hy + g.mov.y);
        ctx.setLineDash([3, 4]);
        ctx.globalAlpha = 0.45 * a;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.7 * a;
        ctx.fillRect(Math.round(hx) - 2, Math.round(hy) - 2, 4, 4);
      }
      ctx.beginPath();
      ctx.rect(x1, y1, x2 - x1, y2 - y1);
      ctx.globalAlpha = 0.5 * a;
      ctx.stroke();
      ctx.globalAlpha = 0.95 * a;
      for (const [cx, cy] of [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]) ctx.fillRect(Math.round(cx) - 2, Math.round(cy) - 2, 5, 5);
      ctx.globalAlpha = 1;
      const rotulo = !s.rotulos ? '' : movido > 1 ? `${signo(Math.round(g.mov.x))}, ${signo(Math.round(-g.mov.y))}` : `${g.ch}  ${Math.round(g.caja.x2 - g.caja.x1)} × ${Math.round(g.caja.y2 - g.caja.y1)}`;
      ctx.font = ROTULO;
      if (s.motas > 0) dibujarMotas(a, acento, rotulo ? ctx.measureText(rotulo).width + 14 : 0);
      if (!rotulo) return;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = acento;
      ctx.globalAlpha = 0.8 * a;
      ctx.fillText(rotulo, Math.round(marco.x1), Math.round(marco.y1) - 7);
      ctx.globalAlpha = 1;
    };

    const dibujarLineas = (v, acento, alfa, crecer) => {
      const aire = Math.max(12, v.tam * 0.12), x1 = Math.round(v.izq - aire), x2 = Math.round(v.der + aire), lugar = ancho - x2 > x1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.strokeStyle = acento;
      ctx.fillStyle = acento;
      ctx.lineWidth = 1;
      ctx.font = ROTULO;
      ctx.textBaseline = 'middle';
      ctx.textAlign = lugar ? 'left' : 'right';
      v.lineas.forEach((l, k) => {
        const c = crecer(k);
        if (c <= 0.001) return;
        const y = nitido(l.y), fin = x1 + (x2 - x1) * c;
        ctx.globalAlpha = alfa * 0.4;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(fin, y);
        ctx.stroke();
        ctx.globalAlpha = alfa * 0.9;
        ctx.fillRect(x1 - 1, Math.round(l.y) - 1, 3, 3);
        ctx.fillRect(Math.round(fin) - 1, Math.round(l.y) - 1, 3, 3);
        if (s.rotulos) { ctx.globalAlpha = alfa * 0.85 * escalon(0.7, 1, c); ctx.fillText(l.rotulo, lugar ? x2 + 8 : x1 - 8, Math.round(l.y)); }
      });
      ctx.textAlign = 'left';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
    };

    const celdasDe = (g, v) => {
      if (g.celdas) return g.celdas;
      const lado = Math.max(3, Math.round(v.tam / 18)), fino = 3, celdas = [];
      g.celdas = celdas;
      g.armado = 0;
      const gx = Math.floor((g.caja.x1 - 2) / lado) * lado, gy = Math.floor((g.caja.y1 - 2) / lado) * lado;
      const cols = Math.ceil((g.caja.x2 + 2 - gx) / lado) + 1, filas = Math.ceil((g.caja.y2 + 2 - gy) / lado) + 1, toca = new Uint8Array(cols * filas);
      const mapa = document.createElement('canvas');
      mapa.width = cols * fino;
      mapa.height = filas * fino;
      const c = mapa.getContext('2d', { willReadFrequently: true });
      if (!c) return celdas;
      c.setTransform(fino / lado, 0, 0, fino / lado, -gx * fino / lado, -gy * fino / lado);
      preparar(c, v.tam);
      c.fillStyle = '#000000';
      c.fillText(g.ch, g.x, v.base);
      const datos = c.getImageData(0, 0, mapa.width, mapa.height).data;
      for (let py = 0; py < mapa.height; py++) for (let px = 0; px < mapa.width; px++) {
        if (datos[(py * mapa.width + px) * 4 + 3] < 20) continue;
        toca[Math.floor(py / fino) * cols + Math.floor(px / fino)] = 1;
      }
      const largo = unidad(((g.caja.x1 + g.caja.x2) / 2 - v.izq) / Math.max(1, v.der - v.izq));
      for (let k = 0; k < toca.length; k++) {
        if (!toca[k]) continue;
        const ang = ruido(g.indice, k, 1) * Math.PI * 2, lejos = v.tam * (0.25 + 0.6 * ruido(g.indice, k, 2));
        const sale = 0.03 + 0.36 * largo + 0.12 * ruido(g.indice, k, 3), llega = sale + 0.3 + 0.14 * ruido(g.indice, k, 4);
        celdas.push({ x: gx + (k % cols) * lado, y: gy + Math.floor(k / cols) * lado, lado, dx: Math.cos(ang) * lejos, dy: Math.sin(ang) * lejos * 0.7, sale, llega });
        g.armado = Math.max(g.armado, llega);
      }
      return celdas;
    };
    const rectCelda = (x, y, lado) => { const izq = Math.round(x * dpr), arriba = Math.round(y * dpr); return [izq, arriba, Math.round((x + lado) * dpr) - izq, Math.round((y + lado) * dpr) - arriba]; };

    const dibujarArmado = (g, avance, acento) => {
      const celdas = g.celdas || [];
      ctx.save();
      ctx.beginPath();
      let puestas = 0;
      for (const c of celdas) {
        if (avance < c.llega) continue;
        const [x, y, w, h] = rectCelda(c.x, c.y, c.lado);
        ctx.rect(x, y, w, h);
        puestas++;
      }
      if (puestas) { ctx.clip(); calcar(ctx, arte(g, false), 0, 0, 0, 0); }
      ctx.restore();
      ctx.fillStyle = acento;
      for (const c of celdas) {
        if (avance < c.sale || avance >= c.llega) continue;
        const u = (avance - c.sale) / (c.llega - c.sale), e = 1 - Math.pow(1 - u, 4), lado = c.lado * (0.4 + 0.6 * e);
        const [x, y, w, h] = rectCelda(c.x + (c.lado - lado) / 2 + c.dx * (1 - e), c.y + (c.lado - lado) / 2 + c.dy * (1 - e), lado);
        ctx.globalAlpha = Math.min(1, u * 4) * (0.55 + 0.45 * e);
        ctx.fillRect(x, y, Math.max(1, w), Math.max(1, h));
      }
      ctx.globalAlpha = 1;
    };

    const dibujarLlenado = (g, adelanto, avance, v) => {
      const a = arte(g, false), izq = Math.floor(a.izq * dpr), arriba = Math.floor(a.arriba * dpr), w = a.img.width + 2, h = a.img.height + 2;
      const lleno = unidad((avance - 0.24 - 0.28 * adelanto) / 0.48), rects = [];
      for (const f of v.franjas) {
        const cuanto = escalon(0.3 * f.orden, 0.3 * f.orden + 0.4, lleno);
        if (cuanto <= 0) continue;
        const tramo = (f.y1 - f.y0) * cuanto, y0 = Math.round((f.sube ? f.y1 - tramo : f.y0) * dpr), y1 = Math.round((f.sube ? f.y1 : f.y0 + tramo) * dpr);
        if (y1 > y0) rects.push([y0, y1 - y0]);
      }
      const borde = escalon(0.08 + 0.2 * adelanto, 0.22 + 0.2 * adelanto, avance);
      if (borde > 0.001) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(izq - 2, arriba - 2, w + 2, h + 2);
        for (const [y, tramo] of rects) ctx.rect(izq - 2, y, w + 2, tramo);
        ctx.clip('evenodd');
        ctx.globalAlpha = borde;
        calcar(ctx, arte(g, true), 0, 0, 0, 0);
        ctx.restore();
      }
      if (rects.length) {
        ctx.save();
        ctx.beginPath();
        for (const [y, tramo] of rects) ctx.rect(izq - 2, y, w + 2, tramo);
        ctx.clip();
        calcar(ctx, a, 0, 0, 0, 0);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    };

    const patear = i => {
      const fuerza = (palabra ? palabra.tam : 120) * 11;
      patadas.push({ i, en: pulso, v: fuerza });
      for (let d = 1; d < glifos.length; d++) {
        const v = fuerza * Math.pow(CAIDA, d);
        if (v < 30) break;
        for (const j of [i - d, i + d]) if (j >= 0 && j < glifos.length) patadas.push({ i: j, en: pulso + d * 0.055, v });
      }
      despertar();
    };

    const ubicar = () => { const r = lienzo.getBoundingClientRect(); puntero.x = puntero.cx - r.left; puntero.y = puntero.cy - r.top; };

    const paso = ahora => {
      cuadro = 0;
      if (!visible) return;
      if (sucio) {
        sucio = false;
        if (anclado) {
          margen = Math.round(Math.max(48, (parseFloat(getComputedStyle(caja).fontSize) || 100) * 0.42));
          lienzo.style.cssText = `left:${-margen}px;top:${-margen}px;width:calc(100% + ${2 * margen}px);height:calc(100% + ${2 * margen}px)`;
        }
        ancho = Math.max(1, caja.clientWidth + 2 * margen);
        alto = Math.max(1, caja.clientHeight + 2 * margen);
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        const pw = Math.round(ancho * dpr), ph = Math.round(alto * dpr);
        if (lienzo.width !== pw) lienzo.width = pw;
        if (lienzo.height !== ph) lienzo.height = ph;
      }
      const dt = Math.min(0.05, Math.max(0.001, (ahora - antes) / 1000));
      antes = ahora;
      const { tinta, acento } = colores();
      const v = disponer(tinta);
      const freno = 2 * Math.sqrt(RESORTE) * (1 - unidad(s.rebote) * 0.96);
      if (puntero.dentro || arrastre >= 0) ubicar();

      if (s.intro !== tipoIntro) { tipoIntro = s.intro; relojIntro = 0; }
      const conIntro = !!tipoIntro && !quieto && glifos.length > 0;
      if (conIntro && fuentes) relojIntro += dt;
      const avance = conIntro ? unidad((relojIntro - ESPERA) / Math.max(0.3, s.duracion)) : 1;
      entrando = conIntro && avance < 1;

      pulso += dt;
      const libre = !entrando && !quieto && !puntero.dentro && arrastre < 0;
      let barriendo = false, objX = puntero.x, objY = puntero.y;
      if (libre && s.barrido === 'siempre') {
        reloj += dt * s.velocidad;
        barriendo = true;
        objX = v.izq + (v.der - v.izq) * (0.5 - 0.5 * Math.cos(reloj * 0.45));
        objY = v.arriba + (v.abajo - v.arriba) * (0.45 + 0.1 * Math.sin(reloj * 0.8));
      } else if (libre && pase != null) {
        pase += dt / Math.min(1.8, Math.max(0.9, glifos.length * 0.11));
        if (pase >= 1) pase = null;
        else {
          barriendo = true;
          objX = v.izq - 24 + (v.der - v.izq + 48) * (0.5 - 0.5 * Math.cos(Math.PI * pase));
          objY = (v.arriba + v.abajo) / 2;
        }
      } else if (!libre) pase = null;

      const activo = !entrando && (puntero.dentro || barriendo || arrastre >= 0);
      if (activo && !puesto) { lente.x = objX; lente.y = objY; }
      if (activo) {
        const demora = puntero.dentro ? 0.05 : pase != null ? 0.06 : 0.22;
        lente.x = acercar(lente.x, objX, dt, demora);
        lente.y = acercar(lente.y, objY, dt, demora);
      }
      puesto = activo;
      const metaPresencia = s.contorno === 'zona' && activo && arrastre < 0 ? 1 : 0;
      presencia = acercar(presencia, metaPresencia, dt, 0.16);

      for (let k = patadas.length - 1; k >= 0; k--) {
        if (patadas[k].en > pulso) continue;
        const g = glifos[patadas[k].i];
        if (g) g.vel.y -= patadas[k].v;
        patadas.splice(k, 1);
      }

      let mueve = false;
      glifos.forEach((g, i) => {
        if (i === arrastre) {
          g.mov.x = acercar(g.mov.x, puntero.x - agarre.x, dt, 0.03);
          g.mov.y = acercar(g.mov.y, puntero.y - agarre.y, dt, 0.03);
          g.vel.x = g.vel.y = 0;
          mueve = true;
          return;
        }
        const { mov, vel } = g;
        if (Math.abs(mov.x) < 0.05 && Math.abs(mov.y) < 0.05 && Math.hypot(vel.x, vel.y) < 0.5) { mov.x = mov.y = vel.x = vel.y = 0; return; }
        vel.x += (-RESORTE * mov.x - freno * vel.x) * dt;
        vel.y += (-RESORTE * mov.y - freno * vel.y) * dt;
        mov.x += vel.x * dt;
        mov.y += vel.y * dt;
        mueve = true;
      });

      let tecla = -1;
      if (entrando && tipoIntro === 'escribir') {
        const tramo = 0.86 / glifos.length, en = Math.min(glifos.length - 1, Math.floor(avance / tramo));
        tecla = avance < 0.93 ? en : -1;
        glifos.forEach((g, i) => { g.visto = i < en ? 1 : i === en ? escalon(0, tramo * 0.3, avance - i * tramo) : 0; });
      } else glifos.forEach(g => { g.visto = 1; });

      const foco = entrando ? tecla : arrastre >= 0 ? arrastre : activo ? glifoEn(lente.x, lente.y) : -1;
      if (foco >= 0 && s.marco) {
        const g = glifos[foco], bx1 = g.caja.x1 + g.mov.x - 6, by1 = g.caja.y1 + g.mov.y - 6, bx2 = g.caja.x2 + g.mov.x + 6, by2 = g.caja.y2 + g.mov.y + 6;
        if (marco.i < 0 || marco.a < 0.02) { marco.x1 = bx1; marco.y1 = by1; marco.x2 = bx2; marco.y2 = by2; }
        const desliz = foco === arrastre ? 0.02 : 0.08;
        marco.x1 = acercar(marco.x1, bx1, dt, desliz);
        marco.y1 = acercar(marco.y1, by1, dt, desliz);
        marco.x2 = acercar(marco.x2, bx2, dt, desliz);
        marco.y2 = acercar(marco.y2, by2, dt, desliz);
        marco.i = foco;
      }
      marco.a = acercar(marco.a, foco >= 0 && s.marco ? 1 : 0, dt, 0.1);

      while (ondas.length && pulso - ondas[0].en > VIDA_ONDA) ondas.shift();
      const apretando = puntero.dentro || arrastre >= 0;
      const metaFuerza = s.presion && !entrando && (apretando || ondas.length > 0) ? 1 : 0;
      if (metaFuerza && fuerza < 0.001) { prensa.x = puntero.x; prensa.y = puntero.y; }
      if (metaFuerza && apretando) { prensa.x = acercar(prensa.x, puntero.x, dt, 0.12); prensa.y = acercar(prensa.y, puntero.y, dt, 0.12); }
      fuerza = acercar(fuerza, metaFuerza, dt, 0.16);
      if (Math.abs(fuerza - metaFuerza) < 0.002) fuerza = metaFuerza;
      if (fuerza > 0) {
        const largo = v.der - v.izq, lejosMax = Math.max(1, Math.min(largo / 2, v.tam * 2.6)), tope = Number(s.peso) || 700, banda = Math.max(largo * 0.14, 32);
        glifos.forEach((g, i) => {
          const cx = g.centro + g.mov.x, cy = (g.caja.y1 + g.caja.y2) / 2 + g.mov.y;
          let p = i === foco ? 1 : unidad(1 - Math.hypot(cx - prensa.x, cy - prensa.y) / lejosMax);
          for (const o of ondas) {
            const edad = pulso - o.en, fuera = (Math.hypot(cx - o.x, cy - o.y) - edad * largo * 1.25) / banda;
            if (edad <= 0 || fuera <= -1 || fuera >= 1) continue;
            const resto = 1 - edad / VIDA_ONDA;
            p = 1 - (1 - p) * (1 - (1 - fuera * fuera) ** 2 * resto * resto * Math.min(1, edad / 0.06));
          }
          g.peso = Math.round((tope - (tope - s.pesoMin) * (1 - p) * fuerza) / 5) * 5;
        });
      }

      glifos.forEach((g, i) => {
        const meta = entrando ? (tipoIntro === 'escribir' && (i === tecla || (tecla >= 0 && i > tecla)) ? 1 : 0) : s.contorno === 'letra' && i === foco && i !== arrastre ? 1 : 0;
        if (entrando && g.visto === 0) g.contorno = meta;
        g.contorno = acercar(g.contorno, meta, dt, 0.09);
        if (Math.abs(g.contorno - meta) > 0.002) mueve = true; else g.contorno = meta;
      });

      const metaGuia = s.guias && !entrando ? 1 : 0;
      guia = acercar(guia, metaGuia, dt, 0.14);

      const encima = !entrando && foco >= 0 && puntero.dentro;
      const cursorNuevo = arrastre >= 0 ? 'grabbing' : encima && s.arrastrar ? 'grab' : encima && s.patada ? 'pointer' : '';
      if (cursorNuevo !== cursor) { cursor = cursorNuevo; zona.style.cursor = cursorNuevo; }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, lienzo.width, lienzo.height);
      for (const g of glifos) {
        const movido = Math.hypot(g.mov.x, g.mov.y);
        if (movido > 1) { ctx.globalAlpha = Math.min(1, movido / 24) * 0.55; calcar(ctx, arte(g, true), 0, 0, 0, 0); ctx.globalAlpha = 1; }
      }
      if (entrando && tipoIntro === 'medir') dibujarLineas(v, acento, 1 - escalon(0.84, 1, avance), k => escalon(0.02 + 0.04 * k, 0.2 + 0.04 * k, avance));
      else if (guia > 0.005) dibujarLineas(v, acento, guia * 0.6, () => 1);
      glifos.forEach((g, i) => {
        if (entrando && tipoIntro === 'armar') {
          celdasDe(g, v);
          if (avance < g.armado) { dibujarArmado(g, avance, acento); return; }
        }
        if (entrando && tipoIntro === 'medir') {
          const adelanto = glifos.length > 1 ? i / (glifos.length - 1) : 0;
          if (avance < 0.72 + 0.28 * adelanto) { dibujarLlenado(g, adelanto, avance, v); return; }
        }
        if (g.visto < 0.001) return;
        if (g.contorno < 0.999) {
          ctx.globalAlpha = (1 - g.contorno) * g.visto;
          if (fuerza > 0) escribir(g, tinta, v); else calcar(ctx, arte(g, false), g.mov.x, g.mov.y, 0, 0);
        }
        if (g.contorno > 0.001) { ctx.globalAlpha = g.contorno * g.visto; calcar(ctx, arte(g, true), g.mov.x, g.mov.y, 0, 0); }
        ctx.globalAlpha = 1;
      });
      if (presencia > 0.001) dibujarZona();
      dibujarMarco(acento);
      if (!pintado && glifos.length) { pintado = true; caja.classList.add('tec-vivo'); }

      const lejos = activo && Math.abs(lente.x - objX) + Math.abs(lente.y - objY) > 0.5;
      const prensando = fuerza !== metaFuerza || ondas.length > 0 || (metaFuerza > 0 && apretando && Math.abs(prensa.x - puntero.x) + Math.abs(prensa.y - puntero.y) > 0.5);
      const asienta = mueve || entrando || lejos || prensando || patadas.length > 0 || Math.abs(guia - metaGuia) > 0.005 || Math.abs(presencia - metaPresencia) > 0.002 || (marco.a > 0.01 && marco.a < 0.99);
      const sigue = barriendo || arrastre >= 0 || foco >= 0 || (s.contorno === 'zona' && puntero.dentro);
      if ((sigue || asienta) && visible) cuadro = requestAnimationFrame(paso);
    };

    const alMover = e => { puntero.cx = e.clientX; puntero.cy = e.clientY; ubicar(); puntero.dentro = true; despertar(); };
    const alSalir = () => { if (arrastre >= 0) return; puntero.dentro = false; despertar(); };
    const alBajar = e => {
      puntero.cx = e.clientX;
      puntero.cy = e.clientY;
      ubicar();
      puntero.dentro = true;
      const principal = e.pointerType !== 'mouse' || e.button === 0, i = entrando || !principal ? -1 : glifoEn(puntero.x, puntero.y);
      toque.x = puntero.x;
      toque.y = puntero.y;
      toque.t = performance.now();
      toque.i = i;
      if (s.presion && principal && !quieto && !entrando) {
        ondas.push({ x: puntero.x, y: puntero.y, en: pulso });
        if (ondas.length > 6) ondas.shift();
      }
      if (s.arrastrar && i >= 0) {
        arrastre = i;
        agarre.x = puntero.x - glifos[i].mov.x;
        agarre.y = puntero.y - glifos[i].mov.y;
        if (zona.setPointerCapture) zona.setPointerCapture(e.pointerId);
      }
      despertar();
    };
    const alSoltar = e => {
      if (arrastre >= 0) {
        arrastre = -1;
        if (zona.hasPointerCapture && zona.hasPointerCapture(e.pointerId)) zona.releasePointerCapture(e.pointerId);
        const r = zona.getBoundingClientRect();
        puntero.dentro = e.pointerType === 'mouse' && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      }
      if (e.type === 'pointerup' && toque.i >= 0 && s.patada && !quieto && performance.now() - toque.t < 450) {
        puntero.cx = e.clientX;
        puntero.cy = e.clientY;
        ubicar();
        if (Math.hypot(puntero.x - toque.x, puntero.y - toque.y) < 6) patear(toque.i);
      }
      toque.i = -1;
      despertar();
    };
    zona.addEventListener('pointermove', alMover, { passive: true });
    zona.addEventListener('pointerenter', alMover, { passive: true });
    zona.addEventListener('pointerdown', alBajar, { passive: true });
    zona.addEventListener('pointerup', alSoltar, { passive: true });
    zona.addEventListener('pointercancel', alSoltar, { passive: true });
    zona.addEventListener('pointerleave', alSalir, { passive: true });

    const soltar = () => {
      cancelAnimationFrame(cuadro);
      cuadro = 0;
      lienzo.width = lienzo.height = 0;
      glifos.forEach(g => { g.relleno = g.guiones = g.celdas = null; });
      sucio = true;
      clave = '';
      arrastre = -1;
      puntero.dentro = false;
      fuerza = 0;
      ondas.length = 0;
      if (pintado) { pintado = false; caja.classList.remove('tec-vivo'); }
    };
    new ResizeObserver(() => { sucio = true; clave = ''; despertar(); }).observe(caja);
    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible) despertar(); else soltar();
    }, { rootMargin: '30% 0px' }).observe(zona);
    if (s.barrido === 'una') new IntersectionObserver(([en]) => {
      if (en.intersectionRatio >= 0.5) { if (!barrido) { barrido = true; pase = 0; despertar(); } }
      else if (!en.isIntersecting) barrido = false;
    }, { threshold: [0, 0.5] }).observe(zona);
    const listas = () => { fuentes = true; refrescar(); };
    if (document.fonts) document.fonts.ready.then(listas, listas);

    return {
      poner: cambios => { Object.assign(s, cambios); clave = ''; despertar(); },
      intro: tipo => { s.intro = tipo; tipoIntro = null; despertar(); },
      barrer: () => { pase = 0; despertar(); }
    };
  };

  const escena = $('[data-tec]');
  if (escena) {
    const base = innerWidth >= 760 ? 'Musuq Pacha' : 'Yachay';
    const campo = $('[data-tec-texto]');
    const nombrar = t => escena.setAttribute('aria-label', `${t}, con el contorno y la medida de cada letra`);
    const t = tecnico(escena, { texto: base, tam: 340, espaciado: -0.04, color: '#FFFFFF', acento: '#E4FE44', barrido: 'siempre', velocidad: 2.4, guias: true, presion: true, intro: 'armar', duracion: 1.5 });
    nombrar(base);
    if (t) {
      if (campo) {
        campo.placeholder = base;
        campo.addEventListener('input', () => { const v = campo.value.trim() || base; nombrar(v); t.poner({ texto: v }); });
      }
      $$('[data-tec-intro] button').forEach(b => b.addEventListener('click', () => t.intro(b.dataset.valor)));
      $$('[data-tec-opcion]').forEach(b => b.addEventListener('click', () => {
        const si = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', String(si));
        t.poner(b.dataset.tecOpcion === 'guias' ? { guias: si } : b.dataset.tecOpcion === 'presion' ? { presion: si } : { contorno: si ? 'zona' : 'letra' });
      }));
    }
  }

  const grilla = $('.grilla');
  if (grilla && !quieto) {
    const lienzo = crear('canvas', 'grilla-pulso'), ctx = lienzo.getContext('2d');
    lienzo.setAttribute('aria-hidden', 'true');
    grilla.after(lienzo);
    let w = 0, h = 0, dpr = 1, cols = [], filas = 0, lado = 0, tramo = 0, y0 = 0, niveles = new Float32Array(0), metas = new Float32Array(0), ondas = new Float32Array(0), tocadas = new Float32Array(0), reloj = 0, cuadro = 0, antes = 0;
    const pulsos = [];
    const medir = () => {
      const marco = lienzo.getBoundingClientRect();
      w = Math.max(1, marco.width);
      h = Math.max(1, marco.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      lienzo.width = Math.round(w * dpr);
      lienzo.height = Math.round(h * dpr);
      cols = $$('i', grilla).map(i => i.getBoundingClientRect()).filter(r => r.width > 0).map(r => ({ x: r.left - marco.left, w: r.width }));
      if (!cols.length) { filas = 0; return; }
      lado = cols[0].w;
      const canal = cols.length > 1 ? cols[1].x - cols[0].x - lado : 24;
      tramo = lado + canal;
      filas = Math.ceil((h + canal) / tramo) + 1;
      y0 = (h - filas * tramo + canal) / 2;
      const n = cols.length * filas;
      niveles = new Float32Array(n);
      metas = new Float32Array(n);
      ondas = new Float32Array(n);
      tocadas = new Float32Array(n).fill(-1e9);
    };
    const encender = (x, y) => {
      const radio = tramo * 1.6;
      cols.forEach((c, ci) => {
        for (let f = 0; f < filas; f++) {
          const d = Math.hypot(c.x + c.w / 2 - x, y0 + f * tramo + lado / 2 - y);
          if (d > radio) continue;
          const k = f * cols.length + ci, v = escalon(0, 1, 1 - d / radio);
          if (v > metas[k]) metas[k] = v;
          tocadas[k] = reloj;
        }
      });
    };
    const barrer = () => {
      const delante = tramo * 0.6, detras = tramo * 1.4, lejos = Math.hypot(w, h);
      ondas.fill(0);
      for (let p = pulsos.length - 1; p >= 0; p--) {
        const o = pulsos[p], radio = (reloj - o.t) * 900;
        if (radio - detras * 2 > lejos) { pulsos.splice(p, 1); continue; }
        const fuerza = Math.pow(Math.max(0, 1 - radio / (lejos + detras)), 0.6);
        cols.forEach((c, ci) => {
          for (let f = 0; f < filas; f++) {
            const sale = Math.hypot(c.x + c.w / 2 - o.x, y0 + f * tramo + lado / 2 - o.y) - radio;
            if (sale > delante * 2 || sale < -detras * 2) continue;
            const t = sale > 0 ? sale / delante : sale / detras, v = fuerza * Math.exp(-t * t), k = f * cols.length + ci;
            if (v > ondas[k]) ondas[k] = v;
          }
        });
      }
    };
    const dibujar = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#E4FE44';
      ctx.strokeStyle = '#E4FE44';
      ctx.lineWidth = 1;
      cols.forEach((c, ci) => {
        for (let f = 0; f < filas; f++) {
          const k = f * cols.length + ci, bruto = Math.max(niveles[k], ondas[k]);
          if (bruto < 0.004) continue;
          const v = bruto * bruto * (3 - 2 * bruto), x = Math.round(c.x), y = Math.round(y0 + f * tramo), l = Math.round(c.w);
          ctx.globalAlpha = v * 0.13;
          ctx.fillRect(x, y, l, l);
          ctx.globalAlpha = v * 0.85;
          ctx.strokeRect(x + 0.5, y + 0.5, l - 1, l - 1);
        }
      });
      ctx.globalAlpha = 1;
    };
    const paso = ahora => {
      cuadro = 0;
      const dt = antes ? Math.min(0.05, Math.max(0, (ahora - antes) / 1000)) : 1 / 60;
      antes = ahora;
      reloj += dt;
      if (pulsos.length) barrer(); else ondas.fill(0);
      const baja = dt / 0.6, sube = 1 - Math.exp(-dt / 0.045);
      let activo = pulsos.length > 0;
      for (let k = 0; k < niveles.length; k++) {
        let meta = metas[k];
        if (meta <= 0 && niveles[k] <= 0) continue;
        if (reloj - tocadas[k] > 0.25) meta = Math.max(0, meta - baja);
        metas[k] = meta;
        const sig = meta > niveles[k] ? niveles[k] + (meta - niveles[k]) * sube : meta;
        niveles[k] = sig < 0.002 ? 0 : sig;
        if (niveles[k] > 0 || metas[k] > 0) activo = true;
      }
      dibujar();
      if (activo && !document.hidden) cuadro = requestAnimationFrame(paso);
    };
    const despertar = () => { if (!cuadro) { antes = 0; cuadro = requestAnimationFrame(paso); } };
    addEventListener('click', e => {
      if (e.button || (!e.clientX && !e.clientY) || html.classList.contains('indice-abierto') || html.classList.contains('carrusel-abierto') || html.classList.contains('cargando')) return;
      if (!filas) medir();
      if (!filas) return;
      const marco = lienzo.getBoundingClientRect(), x = e.clientX - marco.left, y = e.clientY - marco.top;
      encender(x, y);
      pulsos.push({ x, y, t: reloj });
      despertar();
    }, true);
    let espera = 0;
    addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(() => { medir(); dibujar(); }, 150); });
    medir();
  }

  window.EFECTOS = { mosaico, tecnico };
})();
