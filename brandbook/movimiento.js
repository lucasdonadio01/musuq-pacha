(() => {
  const html = document.documentElement;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tactil = matchMedia('(hover: none), (pointer: coarse)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const crear = (tag, clase, contenido) => { const e = document.createElement(tag); if (clase) e.className = clase; if (contenido != null) e.innerHTML = contenido; return e; };
  const limitar = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const mezclar = (a, b, t) => a + (b - a) * t;
  const salida = t => 1 - Math.pow(1 - t, 3);
  const suave = t => t * t * (3 - 2 * t);
  const vaiven = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const ahora = () => performance.now();
  const PATRON = ['...xxx...', '...xxx...', '.xxxxxxx.', 'xxx...xxx', 'xxx...xxx', 'xxx...xxx', '.xxxxxxx.', '...xxx...', '...xxx...'];

  const preparar = lienzo => {
    const r = lienzo.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (lienzo.width !== w) lienzo.width = w;
    if (lienzo.height !== h) lienzo.height = h;
    return { w: r.width, h: r.height, dpr };
  };
  const anchoTexto = el => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().width; };

  const est = { ry: quieto ? -0.45 : -0.62, w: 0, inclX: 0, inclY: 0, objX: 0, objY: 0, expl: 0, objExpl: 0, scroll: 0, arrastre: null, t: 0, desde: null };
  const VUELTA = Math.PI * 2;
  const avanzar = paso => {
    est.t += paso;
    const dt = Math.min(paso, 0.05);
    if (!est.arrastre) {
      est.w = mezclar(est.w, 0, 1 - Math.exp(-dt * 1.1));
      est.ry += est.w * dt;
      const calma = 1 - limitar(Math.abs(est.w) / 1.6);
      if (calma > 0) {
        const balanceo = Math.sin(est.t * 0.45) * 0.5;
        const objetivo = Math.round((est.ry - balanceo) / VUELTA) * VUELTA + balanceo;
        est.ry = mezclar(est.ry, objetivo, (1 - Math.exp(-dt * 1.6)) * calma);
      }
    }
    const k4 = 1 - Math.exp(-dt * 4);
    est.inclX = mezclar(est.inclX, est.objX, k4);
    est.inclY = mezclar(est.inclY, est.objY, k4);
    est.expl = mezclar(est.expl, est.objExpl, 1 - Math.exp(-dt * 7));
    return dt;
  };
  const armar = (demora, giro = 9) => { est.desde = est.t + demora; est.w = giro; };
  const completar = () => { est.desde = -100; };

  const chakana = (() => {
    const paso = 7 / 6, D = 30, L = [-0.36, 0.48, -0.8];
    const cubos = [];
    PATRON.forEach((fila, r) => [...fila].forEach((ch, c) => {
      if (ch !== 'x') return;
      [[-paso / 2, [228, 254, 68]], [paso / 2, [105, 64, 174]]].forEach(([z, base], capa) => {
        const a = Math.random() * Math.PI * 2, lejos = 9 + Math.random() * 20;
        cubos.push({
          x: (c - 4) * paso, y: (4 - r) * paso, z, base,
          ox: Math.cos(a) * lejos, oy: (Math.random() - 0.5) * lejos * 1.1, oz: Math.max(-14, Math.sin(a) * lejos * 0.7 - 4),
          retraso: (Math.abs(c - 4) + Math.abs(r - 4)) * 0.05 + capa * 0.1 + Math.random() * 0.2
        });
      });
    }));
    const ejes = [[2, 0, 1], [0, 2, 1], [1, 0, 2]];
    let lz = null;
    const asignar = (lienzo, libre) => {
      const m = preparar(lienzo);
      lz = { lienzo, ctx: lienzo.getContext('2d'), ...m, cx: libre ? libre.cx : m.w / 2, cy: libre ? libre.cy : m.h / 2, escala: libre ? libre.escala : m.w * 0.56 / 10.4 };
    };
    const mover = (cx, cy, escala) => { if (!lz) return; lz.cx = cx; lz.cy = cy; if (escala) lz.escala = escala; };
    const tono = (rgb, k) => `rgb(${Math.min(255, rgb[0] * k) | 0},${Math.min(255, rgb[1] * k) | 0},${Math.min(255, rgb[2] * k) | 0})`;
    const dibujar = paso => {
      if (!lz) return;
      avanzar(paso);
      const ry = est.ry + est.inclX * 0.55 + est.scroll, rx = -0.24 + est.inclY * 0.4;
      const cY = Math.cos(ry), sY = Math.sin(ry), cX = Math.cos(rx), sX = Math.sin(rx);
      const rot = (x, y, z) => { const x1 = x * cY + z * sY, z1 = -x * sY + z * cY; return [x1, y * cX - z1 * sX, y * sX + z1 * cX]; };
      const E = [rot(1, 0, 0), rot(0, 1, 0), rot(0, 0, 1)];
      const f = lz.escala * D, { ctx, dpr, cx, cy } = lz;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, lz.w, lz.h);
      ctx.lineWidth = 1;
      ctx.lineJoin = 'round';
      const abre = 1 + est.expl * 0.3, fondo = 1 + est.expl * 1.6;
      const lista = [];
      for (const q of cubos) {
        const p = est.desde == null ? 1 : limitar((est.t - est.desde - q.retraso) / 1.15);
        if (p <= 0) continue;
        const e = salida(p), falta = 1 - e;
        const x = q.x * abre + q.ox * falta, y = q.y * abre + q.oy * falta, z = q.z * fondo + q.oz * falta;
        const c = [x * E[0][0] + y * E[1][0] + z * E[2][0], x * E[0][1] + y * E[1][1] + z * E[2][1], x * E[0][2] + y * E[1][2] + z * E[2][2] + D];
        if (c[2] < 4) continue;
        lista.push({ q, c, s: 0.5 * mezclar(0.3, 1, e) });
      }
      lista.sort((m, n) => n.c[2] - m.c[2]);
      for (const { q, c, s } of lista) {
        for (const [ni, ui, vi] of ejes) for (const sg of [-1, 1]) {
          const n = E[ni], u = E[ui], v = E[vi];
          const nx = n[0] * sg, ny = n[1] * sg, nz = n[2] * sg;
          const fx = c[0] + nx * s, fy = c[1] + ny * s, fz = c[2] + nz * s;
          if (nx * fx + ny * fy + nz * fz >= 0) continue;
          const brillo = 0.5 + 0.62 * Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
          ctx.beginPath();
          [[1, 1], [-1, 1], [-1, -1], [1, -1]].forEach(([a, b], i) => {
            const X = fx + (u[0] * a + v[0] * b) * s, Y = fy + (u[1] * a + v[1] * b) * s, Z = fz + (u[2] * a + v[2] * b) * s;
            const px = cx + f * X / Z, py = cy - f * Y / Z;
            if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
          });
          ctx.closePath();
          ctx.fillStyle = tono(q.base, brillo);
          ctx.fill();
          ctx.strokeStyle = tono(q.base, brillo * 0.74);
          ctx.stroke();
        }
      }
    };
    return { asignar, mover, dibujar, lienzo: () => lz && lz.lienzo, escala: () => lz ? lz.escala : 0 };
  })();

  const caja = $('[data-chakana3d]'), lienzoHeroe = $('[data-chakana-lienzo]');
  const titular = $('[data-titular]');
  const carga = $('[data-carga]');
  let enCarga = html.classList.contains('cargando') && !!carga && !!caja && !quieto;
  let heroeVisible = true, corriendo = false, ultimo = 0;

  const glPosible = (() => { try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; } })();
  const usar3d = !!caja && glPosible && location.protocol !== 'file:';
  const datosModelo = usar3d ? fetch('modelos/chakana.glb?v=2').then(r => r.ok ? r.arrayBuffer() : Promise.reject(new Error('modelo ' + r.status))) : null;
  if (datosModelo) datosModelo.catch(() => {});
  const cargarScript = src => new Promise((ok, mal) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = mal; document.head.append(s); });
  const granoPiedra = (lado, celdas, octavas) => {
    const lienzo = document.createElement('canvas');
    lienzo.width = lienzo.height = lado;
    const ctx = lienzo.getContext('2d'), img = ctx.createImageData(lado, lado);
    let s = 7;
    const azar = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const capas = [];
    for (let o = 0; o < octavas; o++) { const n = celdas << o, g = new Float32Array(n * n); for (let i = 0; i < g.length; i++) g[i] = azar(); capas.push({ n, g }); }
    for (let y = 0; y < lado; y++) for (let x = 0; x < lado; x++) {
      let v = 0, amp = 0.5, total = 0;
      for (const { n, g } of capas) {
        const fx = x / lado * n, fy = y / lado * n, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = suave(fx - x0), ty = suave(fy - y0);
        const a = g[(y0 % n) * n + x0 % n], b = g[(y0 % n) * n + (x0 + 1) % n], c = g[((y0 + 1) % n) * n + x0 % n], d = g[((y0 + 1) % n) * n + (x0 + 1) % n];
        v += amp * ((a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty);
        total += amp;
        amp *= 0.5;
      }
      const k = Math.round(v / total * 255), i = (y * lado + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = k;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return lienzo;
  };
  let motorGL = null;
  const crearMotorGL = async () => {
    if (!window.THREE) await cargarScript('../js/three.min.js');
    if (!THREE.GLTFLoader) await cargarScript('../js/GLTFLoader.js');
    const datos = await datosModelo;
    const gltf = await new Promise((ok, mal) => new THREE.GLTFLoader().parse(datos, '', ok, mal));
    const lienzo = document.createElement('canvas');
    lienzo.className = 'chakana-gl';
    const r = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    r.outputEncoding = THREE.sRGBEncoding;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.15;
    const escena = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(26, 1, 0.01, 60);
    cam.position.set(0, 0, 3.2);
    const luz = (tipo, color, fuerza, x, y, z) => { const l = new THREE[tipo](color, fuerza); l.position.set(x, y, z); escena.add(l); return l; };
    escena.add(new THREE.HemisphereLight(0xdfe3ff, 0x1a1626, 0.4));
    luz('DirectionalLight', 0xfff4e6, 2.2, -3, 2.4, 0.9);
    luz('DirectionalLight', 0xbfc8ff, 0.35, 2.5, -1, 2.5);
    const contra = luz('DirectionalLight', 0x8a5cff, 1.6, 1.5, 1, -3);
    luz('PointLight', 0xe4fe44, 0.5, 1.8, -1.2, 1.4);
    const grano = new THREE.CanvasTexture(granoPiedra(256, 8, 5));
    grano.wrapS = grano.wrapT = THREE.RepeatWrapping;
    grano.repeat.set(8, 8);
    const lineal = hex => new THREE.Color(hex).convertSRGBToLinear();
    const pigmento = new THREE.MeshStandardMaterial({ color: lineal(0x8c84a6), roughness: 0.92, metalness: 0, emissive: lineal(0x6940ae), emissiveIntensity: 1 });
    const materiales = {
      'Chakana piedra': new THREE.MeshStandardMaterial({ color: lineal(0x35383a), roughness: 0.74, metalness: 0, bumpMap: grano, bumpScale: 0.006 }),
      'Chakana pulido': new THREE.MeshStandardMaterial({ color: lineal(0x26282a), roughness: 0.34, metalness: 0, bumpMap: grano, bumpScale: 0.002 }),
      'Chakana pigmento': pigmento
    };
    const modelo = gltf.scene;
    modelo.traverse(o => {
      if (!o.isMesh) return;
      const g = o.geometry;
      g.computeBoundingBox();
      const { min, max } = g.boundingBox, p = g.attributes.position, uv = new Float32Array(p.count * 2);
      for (let i = 0; i < p.count; i++) { uv[i * 2] = (p.getX(i) - min.x) / (max.x - min.x); uv[i * 2 + 1] = (p.getZ(i) - min.z) / (max.z - min.z); }
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      if (materiales[o.material.name]) o.material = materiales[o.material.name];
    });
    const limites = new THREE.Box3().setFromObject(modelo), centro = limites.getCenter(new THREE.Vector3()), tam = limites.getSize(new THREE.Vector3());
    modelo.position.sub(centro);
    const orientado = new THREE.Group();
    orientado.add(modelo);
    orientado.rotation.x = Math.PI / 2;
    orientado.scale.setScalar(2 * 3.2 * Math.tan(13 * Math.PI / 180) * 0.52 / Math.max(tam.x, tam.z));
    const pivote = new THREE.Group();
    pivote.add(orientado);
    escena.add(pivote);
    const medir = () => { const w = Math.max(1, caja.clientWidth), h = Math.max(1, caja.clientHeight); r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    const dibujar = paso => {
      avanzar(paso);
      const p = est.desde == null ? 1 : limitar((est.t - est.desde) / 1.7), e = salida(p);
      pivote.visible = p > 0;
      pivote.scale.setScalar(mezclar(0.06, 1, e) * (1 + est.expl * 0.05));
      pivote.position.z = mezclar(-7, 0, e);
      pivote.rotation.set(-0.16 + est.inclY * 0.35, est.ry + est.inclX * 0.5 + est.scroll, 0);
      const pulso = 0.5 + 0.5 * Math.sin(est.t * 1.7);
      pigmento.emissiveIntensity = mezclar(3.6, 0.9 + 0.6 * pulso, e) * (1 + est.expl * 1.5);
      contra.intensity = 1.6 + est.expl * 1.6;
      r.render(escena, cam);
    };
    caja.append(lienzo);
    caja.classList.add('gl');
    medir();
    new ResizeObserver(() => { medir(); if (quieto) dibujar(0); }).observe(caja);
    return { dibujar };
  };
  const promesaGL = usar3d ? crearMotorGL().then(m => (motorGL = m)) : null;

  const bucle = t => {
    const dt = Math.min(0.5, Math.max(0, (t - ultimo) / 1000));
    ultimo = t;
    const motor = motorGL || (chakana.lienzo() ? chakana : null);
    if (motor && (enCarga || heroeVisible) && !quieto) { motor.dibujar(dt); requestAnimationFrame(bucle); }
    else corriendo = false;
  };
  const pedirCuadro = () => { if (!corriendo && !quieto) { corriendo = true; ultimo = ahora(); requestAnimationFrame(bucle); } };
  const usarPixeles = () => {
    caja.classList.remove('gl', 'flotando');
    caja.style.left = caja.style.top = '';
    chakana.asignar(lienzoHeroe);
    if (quieto) chakana.dibujar(0); else { armar(0.2, 7.5); pedirCuadro(); }
  };

  if (caja) {
    caja.dataset.cursor = 'Girar';
    new IntersectionObserver(([en]) => { heroeVisible = en.isIntersecting; if (heroeVisible) pedirCuadro(); }).observe(caja);
    new ResizeObserver(() => { if (chakana.lienzo() === lienzoHeroe) { chakana.asignar(lienzoHeroe); if (quieto) chakana.dibujar(0); } }).observe(caja);
    if (!tactil) addEventListener('pointermove', e => { est.objX = (e.clientX / innerWidth - 0.5) * 2; est.objY = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });
    caja.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') est.objExpl = 1; });
    caja.addEventListener('pointerleave', () => { est.objExpl = 0; });
    let previo = null;
    caja.addEventListener('pointerdown', e => {
      if (e.button || html.classList.contains('cargando')) return;
      previo = { x: e.clientX, t: ahora(), w: 0 };
      est.arrastre = true;
      if (e.pointerType !== 'mouse') est.objExpl = 1;
      caja.setPointerCapture(e.pointerId);
    });
    caja.addEventListener('pointermove', e => {
      if (!previo) return;
      const t = ahora(), dx = e.clientX - previo.x;
      est.ry += dx * 0.012;
      previo.w = mezclar(previo.w, dx * 0.012 / Math.max(0.008, (t - previo.t) / 1000), 0.5);
      previo.x = e.clientX; previo.t = t;
      if (quieto) (motorGL || chakana).dibujar(0);
    });
    const soltar = e => {
      if (!previo) return;
      est.w = limitar(previo.w, -14, 14);
      est.arrastre = null;
      previo = null;
      if (e.pointerType !== 'mouse') setTimeout(() => { est.objExpl = 0; }, 900);
    };
    caja.addEventListener('pointerup', soltar);
    caja.addEventListener('pointercancel', soltar);
  }

  const ajustarTitulo = () => {
    if (!titular) return;
    const h1 = $('h1', titular), partes = $$('.t-parte', h1);
    titular.style.setProperty('--titulo', '100px');
    const movil = matchMedia('(max-width: 700px)').matches;
    const ancho = movil ? Math.max(...partes.map(anchoTexto)) : anchoTexto(h1);
    const tam = limitar(100 * titular.clientWidth / ancho * 0.995, 40, movil ? 260 : 440);
    titular.style.setProperty('--titulo', tam.toFixed(1) + 'px');
  };
  const pieMarca = $('.pie-marca');
  const ajustarPie = () => {
    if (!pieMarca) return;
    pieMarca.style.setProperty('--tam-ajuste', '100px');
    pieMarca.style.setProperty('--tam-ajuste', (100 * pieMarca.clientWidth / anchoTexto(pieMarca) * 0.99).toFixed(1) + 'px');
  };

  const HEX = '0123456789ABCDEF';
  const animarCodigo = el => {
    if (quieto) return;
    const final = el.dataset.final || (el.dataset.final = el.textContent);
    const cuenta = 'contar' in el.dataset;
    const hex = final.trim().startsWith('#');
    const inicio = ahora() + 180, dur = cuenta ? 1100 : 900;
    let cuadro = 0;
    const paso = t => {
      const u = limitar((t - inicio) / dur);
      if (cuenta) el.textContent = final.replace(/\d+/g, n => String(Math.round(+n * salida(u))));
      else if (cuadro++ % 2 === 0) el.textContent = [...final].map((ch, i) => ((hex ? /[0-9A-F]/i : /[0-9]/).test(ch) && u < 0.2 + 0.8 * (i + 1) / final.length) ? (hex ? HEX[Math.random() * 16 | 0] : String(Math.random() * 10 | 0)) : ch).join('');
      if (u < 1) requestAnimationFrame(paso); else el.textContent = final;
    };
    requestAnimationFrame(paso);
  };
  const contarBento = () => $$('[data-cuenta]').forEach((el, k) => setTimeout(() => { el.dataset.contar = ''; animarCodigo(el); }, 200 + k * 110));

  const Carrusel = (() => {
    let raiz, pista, cuenta, puntos, titulo, anterior, siguiente, cerrarB, cierre;
    let diapos = [], actual = -1, origen = null, abierto = false, bloqueo = 0;
    const construir = () => {
      raiz = crear('div', 'carrusel');
      raiz.setAttribute('role', 'dialog');
      raiz.setAttribute('aria-modal', 'true');
      raiz.innerHTML = '<div class="carrusel-cabeza"><p class="carrusel-titulo"></p><p class="carrusel-cuenta" aria-live="polite"></p><button class="boton-linea carrusel-cerrar" type="button">Cerrar</button></div><div class="carrusel-pista"></div><div class="carrusel-pie"><button class="carrusel-flecha" type="button" aria-label="Anterior">←</button><div class="carrusel-puntos"></div><button class="carrusel-flecha" type="button" aria-label="Siguiente">→</button></div>';
      titulo = $('.carrusel-titulo', raiz);
      cuenta = $('.carrusel-cuenta', raiz);
      cerrarB = $('.carrusel-cerrar', raiz);
      pista = $('.carrusel-pista', raiz);
      puntos = $('.carrusel-puntos', raiz);
      [anterior, siguiente] = $$('.carrusel-flecha', raiz);
      cerrarB.addEventListener('click', () => cerrar());
      anterior.addEventListener('click', () => ir(actual - 1));
      siguiente.addEventListener('click', () => ir(actual + 1));
      let espera;
      pista.addEventListener('scroll', () => { cancelAnimationFrame(espera); espera = requestAnimationFrame(sincronizar); }, { passive: true });
      pista.addEventListener('click', e => {
        const d = e.target.closest('.carrusel-diapo');
        if (d && !d.classList.contains('actual')) ir(diapos.indexOf(d));
        else if (e.target === pista) cerrar();
      });
      raiz.addEventListener('wheel', e => {
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
        e.preventDefault();
        const t = ahora();
        if (t < bloqueo || Math.abs(e.deltaY) < 4) return;
        bloqueo = t + 520;
        ir(actual + (e.deltaY > 0 ? 1 : -1));
      }, { passive: false });
      raiz.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') { e.preventDefault(); ir(actual + 1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); ir(actual - 1); }
        else if (e.key === 'Escape') { e.preventDefault(); cerrar(); }
        else if (e.key === 'Tab') {
          const focos = $$('button:not(:disabled), a[href]', raiz).filter(x => !x.closest('.carrusel-diapo') || x.closest('.carrusel-diapo.actual'));
          const i = focos.indexOf(document.activeElement);
          if (e.shiftKey && i <= 0) { e.preventDefault(); focos[focos.length - 1].focus(); }
          else if (!e.shiftKey && i === focos.length - 1) { e.preventDefault(); focos[0].focus(); }
        }
      });
    };
    const sincronizar = () => {
      const centro = pista.scrollLeft + pista.clientWidth / 2;
      let k = 0, mejor = Infinity;
      diapos.forEach((d, i) => { const dist = Math.abs(d.offsetLeft + d.offsetWidth / 2 - centro); if (dist < mejor) { mejor = dist; k = i; } });
      if (k === actual) return;
      actual = k;
      diapos.forEach((d, i) => { d.classList.toggle('actual', i === k); d.setAttribute('aria-hidden', String(i !== k)); });
      cuenta.innerHTML = `${String(k + 1).padStart(2, '0')} <span>/ ${String(diapos.length).padStart(2, '0')}</span>`;
      $$('button', puntos).forEach((b, i) => b.setAttribute('aria-current', String(i === k)));
      anterior.disabled = k === 0;
      siguiente.disabled = k === diapos.length - 1;
      $$('[data-descifrar],[data-contar]', diapos[k]).forEach(animarCodigo);
    };
    const ir = (k, inmediato) => {
      if (!diapos.length) return;
      const d = diapos[limitar(k, 0, diapos.length - 1)];
      pista.scrollTo({ left: d.offsetLeft - (pista.clientWidth - d.offsetWidth) / 2, behavior: inmediato || quieto ? 'instant' : 'smooth' });
      if (inmediato) sincronizar();
    };
    const abrir = ({ titulo: t = '', diapos: lista, inicio = 0, origen: o }) => {
      if (!lista || !lista.length) return;
      if (!raiz) construir();
      clearTimeout(cierre);
      origen = o || document.activeElement;
      diapos = lista;
      actual = -1;
      pista.replaceChildren(...lista);
      puntos.replaceChildren(...lista.map((_, i) => { const b = crear('button'); b.type = 'button'; b.setAttribute('aria-label', `Ver ${i + 1} de ${lista.length}`); b.addEventListener('click', () => ir(i)); return b; }));
      titulo.textContent = t;
      raiz.setAttribute('aria-label', t);
      if (!raiz.isConnected) document.body.append(raiz);
      html.classList.add('carrusel-abierto');
      html.style.overflow = 'hidden';
      abierto = true;
      requestAnimationFrame(() => {
        ir(inicio, true);
        requestAnimationFrame(() => raiz.classList.add('ver'));
        cerrarB.focus({ preventScroll: true });
      });
    };
    const cerrar = () => {
      if (!abierto) return;
      abierto = false;
      raiz.classList.remove('ver');
      html.classList.remove('carrusel-abierto');
      html.style.overflow = '';
      cierre = setTimeout(() => raiz.remove(), 380);
      if (origen && origen.focus) origen.focus({ preventScroll: true });
    };
    return { abrir, cerrar, abierto: () => abierto };
  })();
  window.Carrusel = Carrusel;

  const proximidad = (zona, letras, lejos, cerca, pintar) => {
    if (tactil || quieto || !zona) return;
    zona.addEventListener('pointerenter', () => zona.classList.add('mano'));
    zona.addEventListener('pointermove', e => {
      const radio = Math.max(110, zona.getBoundingClientRect().width * 0.15);
      const centros = letras.map(l => { const r = l.getBoundingClientRect(); return r.left + r.width / 2; });
      letras.forEach((l, i) => {
        const k = suave(1 - limitar(Math.abs(e.clientX - centros[i]) / radio));
        l.style.fontWeight = Math.round(mezclar(lejos, cerca, k));
        if (pintar) l.style.color = k > 0.5 ? 'var(--lima)' : '';
      });
    });
    zona.addEventListener('pointerleave', () => { zona.classList.remove('mano'); letras.forEach(l => { l.style.fontWeight = ''; l.style.color = ''; }); });
  };
  const partir = (el, clase) => {
    const texto = el.textContent.trim();
    el.textContent = '';
    return [...texto].map((ch, i) => { const s = crear('span', clase); s.textContent = ch === ' ' ? ' ' : ch; s.style.setProperty('--i', i); el.append(s); return s; });
  };
  const tipoVivo = $('[data-tipo-vivo]');
  if (tipoVivo) proximidad(tipoVivo, partir(tipoVivo, ''), 300, 700, true);

  const bandas = $$('[data-banda]').map(b => {
    const t = $('[data-banda-titulo]', b);
    const h2 = t.closest('h2');
    h2.setAttribute('aria-label', t.textContent.trim());
    t.setAttribute('aria-hidden', 'true');
    proximidad(b, partir(t, 'letra-b'), 700, 300, false);
    return { b, t, entrada: 0, desborde: 0 };
  });

  const cabecera = $('[data-cabecera]');
  const pastillas = $('[data-pastillas]');
  const luz = pastillas && $('.pastillas-luz', pastillas);
  const enlacesPastilla = pastillas ? $$('a', pastillas) : [];
  const secciones = $$('main > section[id]');
  let seccionActual = null, encima = null;
  const moverLuz = () => {
    if (!luz) return;
    const destino = encima || enlacesPastilla.find(a => seccionActual && a.hash === '#' + seccionActual.id);
    enlacesPastilla.forEach(a => a.classList.toggle('bajo-luz', a === destino));
    if (!destino) { luz.classList.remove('ver'); return; }
    if (!luz.classList.contains('ver')) { luz.style.transition = 'none'; luz.offsetWidth; }
    luz.style.width = destino.offsetWidth + 'px';
    luz.style.translate = destino.offsetLeft + 'px 0';
    if (luz.style.transition) { luz.offsetWidth; luz.style.transition = ''; }
    luz.classList.add('ver');
  };
  enlacesPastilla.forEach(a => {
    a.addEventListener('pointerenter', () => { encima = a; moverLuz(); });
    a.addEventListener('focus', () => { encima = a; moverLuz(); });
    a.addEventListener('blur', () => { encima = null; moverLuz(); });
  });
  if (pastillas) pastillas.addEventListener('pointerleave', () => { encima = null; moverLuz(); });

  const indice = $('[data-indice]'), abrirIndice = $('[data-indice-abrir]'), cerrarIndice = $('[data-indice-cerrar]');
  const enlacesIndice = $$('.indice-lista a');
  const destinosIndice = enlacesIndice.map(a => ({ a, d: $(a.hash) })).filter(x => x.d);
  const indiceAbierto = () => !!indice && indice.classList.contains('abierta');
  const ponerIndice = (abrir, devolverFoco) => {
    if (!indice) return;
    indice.classList.toggle('abierta', abrir);
    indice.inert = !abrir;
    abrirIndice.setAttribute('aria-expanded', String(abrir));
    html.style.overflow = abrir ? 'hidden' : '';
    $$('.indice-lista > li', indice).forEach((li, k) => { li.style.transitionDelay = abrir ? `${0.06 + k * 0.03}s` : '0s'; });
    if (abrir) cerrarIndice.focus({ preventScroll: true });
    else if (devolverFoco) abrirIndice.focus({ preventScroll: true });
  };
  if (indice) {
    abrirIndice.addEventListener('click', () => ponerIndice(!indiceAbierto(), true));
    cerrarIndice.addEventListener('click', () => ponerIndice(false, true));
    enlacesIndice.forEach(a => a.addEventListener('click', () => ponerIndice(false, false)));
  }

  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (Carrusel.abierto()) Carrusel.cerrar();
    else if (indiceAbierto()) ponerIndice(false, true);
  });

  const enfasis = new Set();
  const obsEnfasis = new IntersectionObserver(ents => ents.forEach(en => { if (en.isIntersecting) enfasis.add(en.target); else enfasis.delete(en.target); }), { rootMargin: '15% 0px' });
  if (!quieto) $$('[data-enfasis]').forEach(el => obsEnfasis.observe(el));
  const desfases = quieto ? [] : $$('[data-desfase]');
  const portada = $('.portada');

  const medir = () => {
    const vw = html.clientWidth;
    bandas.forEach(x => {
      const cs = getComputedStyle(x.b);
      const util = x.b.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const ancho = x.t.offsetWidth;
      x.desborde = ancho > util ? ancho - util + 24 : 0;
      x.entrada = Math.min(vw * 0.2, 320);
    });
    desfases.forEach(g => {
      const hijos = [...g.children];
      const izq = [...new Set(hijos.map(h => h.offsetLeft))].sort((a, b) => a - b);
      hijos.forEach(h => h.style.setProperty('--k', String(izq.indexOf(h.offsetLeft) * (vw < 700 ? 28 : 56))));
    });
  };

  let pendiente = false;
  const cuadro = () => {
    pendiente = false;
    const vh = innerHeight, y = scrollY;
    const total = html.scrollHeight - vh;
    let actual = null;
    for (const s of secciones) if (s.getBoundingClientRect().top <= vh * 0.42) actual = s;
    let enlaceActivo = null;
    for (const x of destinosIndice) if (x.d.getBoundingClientRect().top <= vh * 0.3) enlaceActivo = x.a;
    const lecturasBanda = bandas.map(x => x.b.getBoundingClientRect());
    const lecturasEnfasis = [...enfasis].map(el => [el, el.getBoundingClientRect()]);
    const lecturasDesfase = desfases.map(g => g.getBoundingClientRect());

    html.classList.toggle('bajado', y > 60);
    if (cabecera) cabecera.style.setProperty('--progreso', total > 0 ? (y / total).toFixed(4) : '0');
    if (actual !== seccionActual) { seccionActual = actual; moverLuz(); }
    enlacesIndice.forEach(a => a.classList.toggle('activo', a === enlaceActivo));
    if (portada && !quieto) { portada.style.setProperty('--h', limitar(y / vh, 0, 1.2).toFixed(3)); est.scroll = y * 0.0018; }
    if (quieto) return;
    bandas.forEach((x, i) => {
      const r = lecturasBanda[i];
      if (r.bottom < -80 || r.top > vh + 80) return;
      const p = limitar((vh - r.top) / (vh + r.height));
      x.b.style.setProperty('--r', salida(limitar((vh - r.top) / (vh * 0.5))).toFixed(3));
      x.t.style.transform = `translate3d(${mezclar(x.entrada, -x.desborde, p).toFixed(1)}px,0,0)`;
    });
    lecturasEnfasis.forEach(([el, r]) => {
      const d = Math.abs(r.top + r.height / 2 - vh / 2) / (vh * 0.62);
      el.style.setProperty('--e', suave(1 - limitar(d)).toFixed(3));
    });
    desfases.forEach((g, i) => {
      const r = lecturasDesfase[i];
      if (r.bottom < -40 || r.top > vh + 40) return;
      g.style.setProperty('--d', (1 - salida(limitar((vh - r.top) / (vh * 0.78)))).toFixed(3));
    });
  };
  const alDesplazar = () => { if (!pendiente) { pendiente = true; requestAnimationFrame(cuadro); } };

  const aparece = new IntersectionObserver(ents => ents.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('visible');
    aparece.unobserve(en.target);
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('[data-aparece]').forEach(el => aparece.observe(el));
  const codigos = new IntersectionObserver(ents => ents.forEach(en => {
    if (!en.isIntersecting) return;
    codigos.unobserve(en.target);
    animarCodigo(en.target);
  }), { threshold: 0.6 });
  $$('[data-descifrar],[data-contar]').forEach(el => codigos.observe(el));

  const puntero = $('[data-puntero]');
  if (puntero && !tactil && !quieto) {
    const texto = $('[data-puntero-texto]', puntero);
    let x = -100, y = -100, cx = -100, cy = -100, corre = false;
    const seguir = () => {
      cx += (x - cx) * 0.24;
      cy += (y - cy) * 0.24;
      puntero.style.translate = `${cx.toFixed(1)}px ${cy.toFixed(1)}px`;
      if (Math.abs(x - cx) + Math.abs(y - cy) > 0.3) requestAnimationFrame(seguir); else corre = false;
    };
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      if (!puntero.classList.contains('ver')) { cx = x; cy = y; puntero.classList.add('ver'); }
      if (!corre) { corre = true; requestAnimationFrame(seguir); }
    }, { passive: true });
    html.addEventListener('mouseleave', () => puntero.classList.remove('ver'));
    addEventListener('pointerover', e => {
      const etiqueta = e.target.closest('[data-cursor]');
      const interactivo = e.target.closest('a, button, input, label, [role=button], [role=tab]');
      puntero.classList.toggle('grande', !!etiqueta);
      puntero.classList.toggle('encima', !etiqueta && !!interactivo);
      texto.textContent = etiqueta ? etiqueta.dataset.cursor : '';
    });
  }

  const iniciarCarga = () => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    scrollTo({ top: 0, behavior: 'instant' });
    html.style.overflow = 'hidden';
    const grillaCarga = $('.grilla').cloneNode(true);
    carga.insertBefore(grillaCarga, $('.carga-paneles', carga));
    const lienzoChakana = usar3d ? null : crear('canvas', 'carga-chakana');
    if (lienzoChakana) {
      lienzoChakana.setAttribute('aria-hidden', 'true');
      carga.insertBefore(lienzoChakana, $('.carga-hud', carga));
    }
    const fondo = $('[data-carga-lienzo]', carga), fctx = fondo.getContext('2d');
    const paneles = $$('[data-panel]', carga), marca = $('[data-carga-marca]', carga);
    const codigo = $('[data-carga-codigo]', carga), cuenta = $('[data-carga-cuenta]', carga), saltar = $('[data-carga-saltar]', carga);
    const escalaHeroe = () => caja.getBoundingClientRect().width * 0.56 / 10.4;
    const origen = () => ({ cx: innerWidth / 2, cy: innerHeight * 0.46 });
    let m = preparar(fondo);
    if (usar3d) caja.classList.add('flotando');
    else {
      chakana.asignar(lienzoChakana, { ...origen(), escala: escalaHeroe() });
      armar(0.15, 7.5);
    }
    requestAnimationFrame(() => carga.classList.add('arranca'));
    const recalcular = () => { if (!enCarga) return; m = preparar(fondo); if (vuelo == null && lienzoChakana) chakana.asignar(lienzoChakana, { ...origen(), escala: escalaHeroe() }); };
    addEventListener('resize', recalcular);
    if (document.fonts) document.fonts.ready.then(() => { ajustarTitulo(); recalcular(); });

    const COLORES = ['#E4FE44', '#6940AE', '#F66227', '#FFFFFF'];
    const polvo = Array.from({ length: tactil ? 70 : 140 }, () => ({ a: Math.random() * Math.PI * 2, r: 0.35 + Math.random() * 0.45, tam: 2 + Math.random() * 5, col: COLORES[Math.random() * 4 | 0], ini: Math.random() * 0.6, dur: 0.8 + Math.random() * 0.6, giro: (Math.random() - 0.5) * 1.4 }));
    const T = { panel: [1.45, 1.75, 2.05], fuera: 2.35, salida: 3.0, vuelo: 0.95, fin: 4.05 };
    const TONOS = ['claro', 'oscuro', 'claro'];
    const CODIGOS = ['#E4FE44 · RGB 228 254 68', '#6940AE · RGB 105 64 174', '#F66227 · RGB 246 98 39'];
    let t0 = null, salto = false, vuelo = null, destino = null, escalaInicial = 0, escalaFinal = 0, tipeo;
    const hecho = {};
    const una = (clave, fn) => { if (!hecho[clave]) { hecho[clave] = true; fn(); } };
    const escribir = texto => {
      let i = 0;
      clearInterval(tipeo);
      tipeo = setInterval(() => { i++; codigo.textContent = texto.slice(0, i) + (i < texto.length ? '_' : ''); if (i >= texto.length) clearInterval(tipeo); }, 14);
    };
    const saltarIntro = () => {
      if (salto || vuelo != null) return;
      salto = true;
      completar();
      paneles.forEach(p => p.classList.add('fuera'));
      t0 = ahora() - T.salida * 1000;
    };
    const teclas = e => { if (['Escape', 'Enter', ' '].includes(e.key)) { e.preventDefault(); saltarIntro(); } };
    saltar.addEventListener('click', saltarIntro);
    addEventListener('keydown', teclas);

    const dibujarPolvo = t => {
      const cx = m.w / 2, cy = m.h * 0.46, R = Math.max(m.w, m.h);
      for (const q of polvo) {
        const u = limitar((t - q.ini) / q.dur);
        if (u <= 0 || u >= 1) continue;
        const k = u * u, rad = q.r * R * (1 - k), ang = q.a + q.giro * u;
        fctx.globalAlpha = Math.min(1, u * 5) * (1 - k);
        fctx.fillStyle = q.col;
        fctx.fillRect(cx + Math.cos(ang) * rad - q.tam / 2, cy + Math.sin(ang) * rad - q.tam / 2, q.tam, q.tam);
      }
      fctx.globalAlpha = 1;
    };
    const dibujarBarrido = tb => {
      const lado = Math.max(m.w, m.h) / (m.w < 700 ? 8 : 15);
      const cols = Math.ceil(m.w / lado) + 1, filas = Math.ceil(m.h / lado) + 1;
      const x0 = (m.w - cols * lado) / 2, y0 = (m.h - filas * lado) / 2;
      const maxD = Math.hypot(m.w / 2, m.h / 2);
      fctx.fillStyle = '#232323';
      for (let i = 0; i < cols; i++) for (let j = 0; j < filas; j++) {
        const px = x0 + (i + 0.5) * lado, py = y0 + (j + 0.5) * lado;
        const u = limitar((tb - 0.05 - Math.hypot(px - m.w / 2, py - m.h / 2) / maxD * 0.42) / 0.42);
        const s = lado * (1 - u * u) + 1;
        if (s > 1.5) fctx.fillRect(px - s / 2, py - s / 2, s, s);
      }
    };
    const terminar = () => {
      if (!enCarga) return;
      enCarga = false;
      removeEventListener('keydown', teclas);
      removeEventListener('resize', recalcular);
      clearInterval(tipeo);
      if (usar3d) {
        caja.classList.remove('flotando');
        caja.style.left = caja.style.top = '';
        if (falloGL) usarPixeles();
      } else {
        chakana.asignar(lienzoHeroe);
        chakana.dibujar(0);
      }
      html.classList.remove('cargando');
      html.classList.add('listo');
      html.style.overflow = '';
      if (!hecho.salida) contarBento();
      if (lienzoChakana) lienzoChakana.remove();
      grillaCarga.remove();
      pedirCuadro();
      alDesplazar();
    };
    const paso = () => {
      try {
        if (t0 == null) t0 = ahora();
        const t = (ahora() - t0) / 1000;
        cuenta.textContent = String(Math.round(suave(limitar(t / 2.6)) * 100)).padStart(3, '0');
        T.panel.forEach((tp, i) => { if (t >= tp && !salto) una('p' + i, () => { paneles[i].classList.add('ver'); carga.dataset.tono = TONOS[i]; escribir(CODIGOS[i]); }); });
        if (t >= T.fuera) una('fuera', () => { paneles.forEach(p => p.classList.add('fuera')); carga.dataset.tono = 'oscuro'; if (!salto) { marca.classList.add('ver'); escribir('Brandbook listo'); } });
        if (t >= T.salida) una('salida', () => {
          carga.classList.add('sale');
          ajustarTitulo();
          if (usar3d) caja.classList.remove('flotando');
          const r = caja.getBoundingClientRect();
          if (usar3d) caja.classList.add('flotando');
          destino = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          escalaInicial = chakana.escala();
          escalaFinal = escalaHeroe();
          vuelo = t;
          est.w = Math.max(est.w, 5);
          setTimeout(() => { html.classList.add('listo'); contarBento(); }, 120);
        });
        fctx.setTransform(m.dpr, 0, 0, m.dpr, 0, 0);
        fctx.clearRect(0, 0, m.w, m.h);
        if (vuelo == null) {
          fctx.fillStyle = '#232323';
          fctx.fillRect(0, 0, m.w, m.h);
          dibujarPolvo(t);
        } else {
          dibujarBarrido(t - vuelo);
          const u = vaiven(limitar((t - vuelo) / T.vuelo)), o = origen();
          if (usar3d) {
            caja.style.left = mezclar(o.cx, destino.x, u).toFixed(1) + 'px';
            caja.style.top = mezclar(o.cy, destino.y, u).toFixed(1) + 'px';
          } else chakana.mover(mezclar(o.cx, destino.x, u), mezclar(o.cy, destino.y, u), mezclar(escalaInicial, escalaFinal, u));
        }
        if (t < T.fin) requestAnimationFrame(paso); else terminar();
      } catch (err) { terminar(); }
    };
    requestAnimationFrame(paso);
    pedirCuadro();
  };

  let espera;
  addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(() => { ajustarTitulo(); ajustarPie(); medir(); alDesplazar(); }, 120); });
  addEventListener('scroll', alDesplazar, { passive: true });
  ajustarTitulo();
  ajustarPie();
  medir();
  cuadro();
  if (document.fonts) document.fonts.ready.then(() => { ajustarTitulo(); ajustarPie(); medir(); alDesplazar(); });

  let falloGL = false;
  if (promesaGL) promesaGL.then(() => {
    if (quieto) { motorGL.dibujar(0); return; }
    armar(enCarga ? 0.05 : 0.1, 10);
    pedirCuadro();
  }, () => { falloGL = true; if (!enCarga) usarPixeles(); });

  if (enCarga) iniciarCarga();
  else {
    html.classList.remove('cargando');
    html.classList.add('listo');
    if (caja && !usar3d) usarPixeles();
    contarBento();
  }
  window.marcaViva = true;
})();
