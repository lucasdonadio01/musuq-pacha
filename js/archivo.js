(function () {
  const D = window.MUSUQ_ARCHIVO_DATOS;
  const IMAGENES = window.MUSUQ_ARCHIVO_IMAGENES || [];
  const cats = D.categorias;
  const total = cats.length;
  const $ = (id) => document.getElementById(id);
  const cuerpo = document.body;
  const escena = $('archivo-escena');
  const lienzo = $('archivo-lienzo');
  const capaNodos = $('archivo-nodos');
  const lectura = $('archivo-lectura');
  const estado = $('archivo-estado');
  const actual = $('categoria-actual');
  const fondo = $('fondo-archivo');
  const centro = $('centro-rueda');
  const consultaMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
  let sinMovimiento = consultaMovimiento.matches;
  consultaMovimiento.addEventListener?.('change', (e) => {
    sinMovimiento = e.matches;
  });

  const id = Number(new URLSearchParams(location.search).get('pueblo'));
  const nombre = Number.isInteger(id) && id > 0 ? D.nombres[id] : '';
  if (!nombre) {
    $('pueblo-nombre').textContent = 'Pueblo no encontrado';
    $('archivo-error').hidden = false;
    document.querySelector('.archivo-controles').hidden = true;
    escena.hidden = true;
    centro.hidden = true;
    return;
  }
  const alias = { 'lule-vilela': 'lule' };
  const slugImagenes = alias[D.slugs[id]] || D.slugs[id];
  document.title = 'Archivo ' + nombre + ' · Musuq Pacha';
  $('volver-mapa').href = 'index.html?pueblo=' + id;
  $('categoria-pueblo').textContent = 'ARCHIVO · ' + nombre.toUpperCase();

  const claveSonido = 'musuq-pacha.sonido.v1';
  const leerSonido = () => {
    try {
      return JSON.parse(localStorage.getItem(claveSonido)) || {};
    } catch (e) {
      return {};
    }
  };
  let efectos = leerSonido().efectos !== false;
  const crearAudio = (src, volumen) => {
    const a = new Audio(src);
    a.preload = 'auto';
    a.volume = volumen;
    return a;
  };
  const sonidos = {
    abrir: crearAudio('sonidos/zoom-1.mp3', 1),
    impacto: crearAudio('sonidos/impacto-1.mp3', 0.55),
    cerrar: crearAudio('sonidos/zoom-3-reversa.mp3', 0.8)
  };
  function sonar(clave, retraso = 0) {
    if (!efectos) {
      return;
    }
    setTimeout(() => {
      if (!efectos) {
        return;
      }
      const a = sonidos[clave];
      a.currentTime = 0;
      const promesa = a.play();
      if (promesa) {
        promesa.catch(() => {});
      }
    }, retraso);
  }
  const botonSonido = $('archivo-sonido');
  function pintarSonido() {
    botonSonido.setAttribute('aria-pressed', String(!efectos));
    botonSonido.textContent = efectos ? 'Sonido activado' : 'Sonido silenciado';
  }
  botonSonido.addEventListener('click', () => {
    efectos = !efectos;
    const guardado = leerSonido();
    guardado.efectos = efectos;
    if (guardado.musica === undefined) {
      guardado.musica = true;
    }
    try {
      localStorage.setItem(claveSonido, JSON.stringify(guardado));
    } catch (e) {}
    if (!efectos) {
      Object.values(sonidos).forEach((a) => a.pause());
    }
    pintarSonido();
  });
  pintarSonido();

  const glifos = '▚▞▙▟▛▜◧◨◩◪▤▥▦▧▨▩';
  const glitches = new WeakMap();
  function glitch(el, texto, duracion = 700) {
    cancelAnimationFrame(glitches.get(el));
    if (sinMovimiento) {
      el.textContent = texto;
      return;
    }
    const inicio = performance.now();
    const paso = (ahora) => {
      const p = Math.min(1, (ahora - inicio) / duracion);
      let s = '';
      for (let i = 0; i < texto.length; i++) {
        const ch = texto[i];
        s += ch === ' ' || p >= 1 || i / texto.length < p * 1.15 - 0.15 ? ch : glifos[(Math.random() * glifos.length) | 0];
      }
      el.textContent = s;
      if (p < 1) {
        glitches.set(el, requestAnimationFrame(paso));
      }
    };
    glitches.set(el, requestAnimationFrame(paso));
  }
  glitch($('pueblo-nombre'), nombre, 900);

  const botones = cats.map((cat, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'nodo-archivo';
    b.setAttribute('aria-label', cat.nombre);
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + cat.icono + '</svg><span aria-hidden="true"></span>';
    capaNodos.appendChild(b);
    setTimeout(() => glitch(b.querySelector('span'), cat.nombre, 650), 200 + i * 90);
    return b;
  });

  let celdas = [];
  let centros = [];
  let afectadas = new Set();
  let punteroFondo = null;
  let fondoPendiente = false;
  let columnasFondo = 0;
  function licenciaCorta(l) {
    if (!l) {
      return 'Licencia a revisar';
    }
    if (l === 'CC0' || l.includes('publicdomain/zero')) {
      return 'Dominio público (CC0)';
    }
    if (l.includes('by-nc-sa')) {
      return 'CC BY-NC-SA';
    }
    if (l.includes('InC')) {
      return 'Derechos reservados';
    }
    return 'Licencia a revisar';
  }
  function armarFondo() {
    const propias = IMAGENES.filter((m) => m.pueblo === slugImagenes);
    let semilla = id * 7919 + 17;
    const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
    const otras = IMAGENES.filter((m) => m.pueblo && m.pueblo !== slugImagenes && m.pueblo !== 'revisar_procedencia')
      .map((m) => [azar(), m]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
    const lista = propias.concat(otras);
    const lado = 64 + 26;
    const columnas = Math.ceil(innerWidth * 1.35 / lado);
    const filas = Math.ceil(innerHeight * 1.45 / lado);
    if (!lista.length || columnas === columnasFondo) {
      return;
    }
    columnasFondo = columnas;
    fondo.style.setProperty('--columnas', columnas);
    const frag = document.createDocumentFragment();
    for (let i = 0; i < columnas * filas; i++) {
      const m = lista[(i * 7 + ((i / columnas) | 0) * 3) % lista.length];
      const celda = document.createElement('div');
      celda.className = 'fondo-celda';
      celda.style.setProperty('--n', i % 17);
      const img = document.createElement('img');
      img.src = m.src;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      celda.appendChild(img);
      frag.appendChild(celda);
    }
    fondo.replaceChildren(frag);
    afectadas = new Set();
    medirFondo();
  }
  function medirFondo() {
    celdas = Array.from(fondo.children);
    centros = celdas.map((c) => {
      const r = c.getBoundingClientRect();
      return [r.left + r.width / 2, r.top + r.height / 2];
    });
  }
  function actualizarFondo() {
    fondoPendiente = false;
    const nuevas = new Set();
    if (punteroFondo && !sinMovimiento) {
      const [px, py] = punteroFondo;
      for (let i = 0; i < celdas.length; i++) {
        const dx = centros[i][0] - px;
        const dy = centros[i][1] - py;
        const d2 = dx * dx + dy * dy;
        if (d2 < 52900) {
          const f = 1 - Math.sqrt(d2) / 230;
          celdas[i].style.setProperty('--cerca', (f * f * (3 - 2 * f)).toFixed(3));
          nuevas.add(i);
        }
      }
    }
    for (const i of afectadas) {
      if (!nuevas.has(i) && celdas[i]) {
        celdas[i].style.setProperty('--cerca', '0');
      }
    }
    afectadas = nuevas;
  }
  const pedirFondo = () => {
    if (!fondoPendiente) {
      fondoPendiente = true;
      requestAnimationFrame(actualizarFondo);
    }
  };
  armarFondo();

  let parX = 0;
  let parY = 0;
  let parXObjetivo = 0;
  let parYObjetivo = 0;
  window.addEventListener('pointermove', (e) => {
    punteroFondo = [e.clientX, e.clientY];
    parXObjetivo = e.clientX / innerWidth * 2 - 1;
    parYObjetivo = e.clientY / innerHeight * 2 - 1;
    pedirFondo();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => {
    punteroFondo = null;
    parXObjetivo = 0;
    parYObjetivo = 0;
    pedirFondo();
  });

  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true });
  } catch (e) {
    renderer = null;
  }
  if (!renderer) {
    cuerpo.classList.add('sin-webgl');
  }

  const R = 3.3;
  const S = 1.15;
  const N = 6;
  const CAPAS = 2;
  const c = S / N;
  const porNodo = N * N * CAPAS;
  const cantidad = total * porNodo;
  const nodos = cats.map(() => ({ abierto: 0, tAbrir: -1e9, tCerrar: -1e9, temblor: 0, temblorObjetivo: 0, x: 0, y: 0 }));
  const indiceDe = (p) => ((p % total) + total) % total;
  let pasos = 0;
  let angulo = 0;
  let velocidad = 0;
  let activo = 0;
  let modo = 'rueda';
  let enfoque = 0;
  let reloj = 0;
  let ondaInicio = -1e9;
  let ondaX = 0;
  let ondaY = 0;

  function pasoMasCercano(i) {
    let delta = (((i - indiceDe(pasos)) % total) + total) % total;
    if (delta > total / 2) {
      delta -= total;
    }
    return pasos + delta;
  }

  function actualizarUI() {
    botones.forEach((b, n) => b.setAttribute('aria-current', String(n === activo)));
    glitch(actual, cats[activo].nombre, 420);
    estado.textContent = cats[activo].nombre + ', categoría ' + (activo + 1) + ' de ' + total + (modo === 'categoria' ? ', abierta' : '');
    $('archivo-ayuda').textContent = modo === 'categoria' ? 'Scrolleá hacia arriba o Escape para volver' : 'Scrolleá o arrastrá para girar · Clic para abrir';
  }

  function completarLectura(i) {
    const cat = cats[i];
    const titulo = $('categoria-titulo');
    titulo.setAttribute('aria-label', cat.nombre);
    glitch(titulo, cat.nombre, 650);
    $('categoria-intro').textContent = cat.intro;
    const galeria = $('categoria-galeria');
    galeria.replaceChildren();
    const propias = cat.id === 'patrones' ? IMAGENES.filter((m) => m.pueblo === slugImagenes) : [];
    $('materiales-nota').textContent = propias.length
      ? propias.length + ' piezas del relevamiento asociadas a la región de este pueblo. La asociación está pendiente de validación.'
      : 'Todavía no hay materiales revisados para esta categoría.';
    for (const m of propias) {
      const fig = document.createElement('figure');
      const img = document.createElement('img');
      img.src = m.src;
      img.alt = m.titulo;
      img.loading = 'lazy';
      const pie = document.createElement('figcaption');
      const tituloPieza = m.titulo ? m.titulo.charAt(0).toUpperCase() + m.titulo.slice(1) : 'Pieza sin título';
      pie.textContent = tituloPieza + ' · ' + (m.credito || 'Crédito a revisar') + ' · ' + licenciaCorta(m.licencia);
      if (m.fuente) {
        const enlace = document.createElement('a');
        enlace.href = m.fuente;
        enlace.target = '_blank';
        enlace.rel = 'noopener';
        enlace.textContent = 'Ver fuente';
        pie.appendChild(enlace);
      }
      fig.append(img, pie);
      galeria.appendChild(fig);
    }
  }

  function abrir(i, opciones = {}) {
    const previo = modo === 'categoria' ? activo : -1;
    pasos = pasoMasCercano(i);
    activo = i;
    if (previo !== -1 && previo !== i) {
      nodos[previo].abierto = 0;
      nodos[previo].tCerrar = reloj;
    }
    if (!nodos[i].abierto) {
      nodos[i].abierto = 1;
      nodos[i].tAbrir = reloj;
    }
    ondaInicio = reloj;
    ondaX = nodos[i].x;
    ondaY = nodos[i].y;
    const entrando = modo !== 'categoria';
    modo = 'categoria';
    cuerpo.classList.add('en-categoria');
    completarLectura(i);
    actualizarUI();
    if (!opciones.silencio) {
      if (entrando) {
        sonar('abrir');
        sonar('impacto', 120);
      } else {
        sonar('impacto');
      }
    }
    if (!opciones.historia) {
      const hash = '#' + cats[i].id;
      if (entrando) {
        history.pushState({ archivo: 1 }, '', hash);
      } else {
        history.replaceState({ archivo: 1 }, '', hash);
      }
    }
    lectura.hidden = false;
    lectura.scrollTop = 0;
    setTimeout(() => {
      if (modo === 'categoria') {
        lectura.focus({ preventScroll: true });
      }
    }, sinMovimiento ? 0 : 700);
    setTimeout(medirFondo, 1200);
  }

  function cerrar(desdeInterfaz) {
    if (modo !== 'categoria') {
      return;
    }
    if (desdeInterfaz && history.state && history.state.archivo) {
      history.back();
      return;
    }
    modo = 'rueda';
    nodos[activo].abierto = 0;
    nodos[activo].tCerrar = reloj;
    cuerpo.classList.remove('en-categoria');
    lectura.hidden = true;
    sonar('cerrar');
    if (location.hash) {
      history.replaceState(null, '', location.pathname + location.search);
    }
    botones[activo].style.visibility = 'visible';
    botones[activo].focus({ preventScroll: true });
    actualizarUI();
    setTimeout(medirFondo, 1200);
  }

  function irA(p) {
    if (modo === 'categoria') {
      abrir(indiceDe(p));
      return;
    }
    pasos = p;
    activo = indiceDe(p);
    actualizarUI();
  }

  const indicePorHash = () => cats.findIndex((cat) => '#' + cat.id === location.hash);
  window.addEventListener('popstate', () => {
    const i = indicePorHash();
    if (i >= 0) {
      abrir(i, { historia: true });
    } else {
      cerrar(false);
    }
  });

  let arrastrando = false;
  let inicioY = 0;
  let inicioAngulo = 0;
  let ultimoY = 0;
  let ultimoT = 0;
  let velArrastre = 0;
  let suprimirClick = false;
  const radPorPixel = Math.PI / 4 / 150;
  escena.addEventListener('pointerdown', (e) => {
    suprimirClick = false;
    if (modo !== 'rueda' || e.button !== 0) {
      return;
    }
    arrastrando = true;
    inicioY = ultimoY = e.clientY;
    inicioAngulo = angulo;
    ultimoT = performance.now();
    velArrastre = 0;
  });
  escena.addEventListener('pointermove', (e) => {
    if (!arrastrando) {
      return;
    }
    const dy = e.clientY - inicioY;
    if (!suprimirClick && Math.abs(dy) > 6) {
      suprimirClick = true;
      escena.setPointerCapture?.(e.pointerId);
      cuerpo.classList.add('arrastrando');
    }
    if (suprimirClick) {
      angulo = inicioAngulo + dy * radPorPixel;
      const t = performance.now();
      velArrastre = (e.clientY - ultimoY) / Math.max(1, t - ultimoT) * 1000 * radPorPixel;
      ultimoY = e.clientY;
      ultimoT = t;
    }
  });
  const soltar = () => {
    if (!arrastrando) {
      return;
    }
    arrastrando = false;
    cuerpo.classList.remove('arrastrando');
    if (suprimirClick) {
      const destino = Math.round((angulo + velArrastre * 0.18) / (Math.PI / 4));
      velocidad = velArrastre;
      irA(destino);
    }
  };
  escena.addEventListener('pointerup', soltar);
  escena.addEventListener('pointercancel', soltar);

  botones.forEach((b, i) => {
    b.addEventListener('click', () => {
      if (suprimirClick) {
        suprimirClick = false;
        return;
      }
      if (modo === 'categoria' && i === activo) {
        return;
      }
      abrir(i);
    });
    b.addEventListener('pointerenter', () => {
      nodos[i].temblorObjetivo = 1;
    });
    b.addEventListener('pointerleave', () => {
      nodos[i].temblorObjetivo = 0;
    });
  });

  let bloqueoRueda = 0;
  let finBloqueo = 0;
  let acumulado = 0;
  let limpiarAcumulado = 0;
  window.addEventListener('wheel', (e) => {
    if (e.target instanceof Node && lectura.contains(e.target)) {
      return;
    }
    e.preventDefault();
    const ahora = performance.now();
    if (modo === 'categoria') {
      if (e.deltaY < -10 && ahora > bloqueoRueda) {
        bloqueoRueda = ahora + 700;
        cerrar(true);
      }
      return;
    }
    if (ahora < bloqueoRueda) {
      bloqueoRueda = Math.min(finBloqueo, ahora + 140);
      acumulado = 0;
      return;
    }
    acumulado += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    clearTimeout(limpiarAcumulado);
    limpiarAcumulado = setTimeout(() => {
      acumulado = 0;
    }, 180);
    if (Math.abs(acumulado) > 50) {
      irA(pasos + Math.sign(acumulado));
      acumulado = 0;
      bloqueoRueda = ahora + 260;
      finBloqueo = ahora + 850;
    }
  }, { passive: false });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modo === 'categoria') {
      e.preventDefault();
      cerrar(true);
      return;
    }
    if (modo !== 'rueda') {
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      irA(pasos + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      irA(pasos - 1);
    } else if ((e.key === 'Enter' || e.key === ' ') && document.activeElement === document.body) {
      e.preventDefault();
      abrir(activo);
    }
  });
  $('categoria-anterior').addEventListener('click', () => irA(pasos - 1));
  $('categoria-siguiente').addEventListener('click', () => irA(pasos + 1));
  $('cerrar-categoria').addEventListener('click', () => cerrar(true));

  actualizarUI();
  const inicial = indicePorHash();

  if (!renderer) {
    if (inicial >= 0) {
      abrir(inicial, { historia: true, silencio: true });
    }
    return;
  }

  const escena3d = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  const tanMedio = Math.tan(THREE.MathUtils.degToRad(15));
  escena3d.add(new THREE.HemisphereLight(0xffffff, 0x5b5e55, 0.95));
  const sol = new THREE.DirectionalLight(0xffffff, 0.8);
  sol.position.set(-4, 6, 9);
  escena3d.add(sol);
  const raiz = new THREE.Group();
  escena3d.add(raiz);
  const brazos = new THREE.Group();
  raiz.add(brazos);

  const GROSOR = 0.26;
  const matBrazo = new THREE.MeshLambertMaterial({ color: 0x101110 });
  const diagonal = R * Math.SQRT1_2;
  const rotar = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  function segmento(a, b) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const largo = Math.hypot(dx, dy);
    const m = new THREE.Mesh(new THREE.BoxGeometry(largo + GROSOR, GROSOR, 0.32), matBrazo);
    m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, -c * 0.9);
    m.rotation.z = Math.atan2(dy, dx);
    brazos.add(m);
  }
  for (let m = 0; m < 4; m++) {
    const giro = -m * Math.PI / 2;
    const eje = rotar(0, R, giro);
    for (const lado of [1, -1]) {
      const codo = rotar(lado * (R - diagonal), diagonal, giro);
      segmento(eje, codo);
      segmento(codo, rotar(lado * diagonal, diagonal, giro));
    }
  }

  const malla = new THREE.InstancedMesh(new THREE.BoxGeometry(c * 0.94, c * 0.94, c * 0.94), new THREE.MeshLambertMaterial(), cantidad);
  malla.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  malla.frustumCulled = false;
  raiz.add(malla);
  const casa = new Float32Array(cantidad * 3);
  const direccion = new Float32Array(cantidad * 3);
  const meta = new Float32Array(cantidad * 3);
  const fase = new Float32Array(cantidad * 3);
  const libre = new Uint8Array(cantidad);
  const claro = new THREE.Color('#e2e4db');
  const borde = new THREE.Color('#111311');
  const atras = new THREE.Color('#c9cbc2');
  let semillaCubos = 7;
  const azarCubos = () => (semillaCubos = (semillaCubos * 16807) % 2147483647) / 2147483647;
  for (let n = 0, k = 0; n < total; n++) {
    for (let z = 0; z < CAPAS; z++) {
      for (let fy = 0; fy < N; fy++) {
        for (let fx = 0; fx < N; fx++, k++) {
          const hx = (fx - (N - 1) / 2) * c;
          const hy = (fy - (N - 1) / 2) * c;
          const k3 = k * 3;
          const esBorde = fx === 0 || fy === 0 || fx === N - 1 || fy === N - 1;
          casa[k3] = hx;
          casa[k3 + 1] = hy;
          casa[k3 + 2] = -z * c;
          malla.setColorAt(k, z ? atras : esBorde ? borde : claro);
          const largo = Math.hypot(hx, hy) || 1;
          direccion[k3] = hx / largo;
          direccion[k3 + 1] = hy / largo;
          direccion[k3 + 2] = 0.2 + azarCubos() * 0.8;
          const lejos = S * (1.3 + azarCubos() * 1.9);
          meta[k3] = hx + hx / largo * lejos + (azarCubos() - 0.5) * 0.6;
          meta[k3 + 1] = hy + hy / largo * lejos + (azarCubos() - 0.5) * 0.6;
          meta[k3 + 2] = 0.4 + azarCubos() * 1.4;
          fase[k3] = azarCubos() * 6.28;
          fase[k3 + 1] = azarCubos() * 6.28;
          fase[k3 + 2] = 0.6 + azarCubos() * 2;
          libre[k] = z === 0 && esBorde && azarCubos() < 0.42 ? 1 : 0;
        }
      }
    }
  }

  let ancho = 1;
  let alto = 1;
  function dimensionar() {
    const r = escena.getBoundingClientRect();
    ancho = Math.max(1, r.width);
    alto = Math.max(1, r.height);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(ancho, alto, false);
    camara.aspect = ancho / alto;
    camara.updateProjectionMatrix();
  }
  let esperaFondo = 0;
  new ResizeObserver(() => {
    dimensionar();
    clearTimeout(esperaFondo);
    esperaFondo = setTimeout(() => {
      armarFondo();
      medirFondo();
    }, 250);
  }).observe(escena);
  dimensionar();

  const suave = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const salida = (t) => 1 - Math.pow(1 - t, 3);
  const limitar = (v) => Math.min(1, Math.max(0, v));
  const vNodo = new THREE.Vector3();
  const vMirar = new THREE.Vector3();
  const vTmp = new THREE.Vector3();
  const obj = new THREE.Object3D();

  function colocarCamara(e) {
    const general = (R + S * 0.9) / (tanMedio * Math.min(0.8, 0.86 * camara.aspect));
    const movil = camara.aspect < 0.9;
    vNodo.set(nodos[activo].x, nodos[activo].y, 0);
    raiz.localToWorld(vNodo);
    const cercana = S / (movil ? 0.62 : 0.84) / tanMedio;
    const hh = cercana * tanMedio;
    const hw = hh * camara.aspect;
    const lx = movil ? vNodo.x : vNodo.x - hw * 0.42;
    const ly = movil ? vNodo.y - hh * 0.36 : vNodo.y;
    vMirar.set(lx * e, ly * e, vNodo.z * e);
    camara.position.set(vMirar.x - (movil ? 0 : 0.5) * e, vMirar.y - 0.35 * e, vMirar.z + general + (cercana - general) * e);
    camara.lookAt(vMirar);
  }

  function colocarEtiquetas() {
    const escala = alto / 2 / tanMedio;
    const general = Math.max(0, 1 - enfoque * 3);
    for (let n = 0; n < total; n++) {
      const nodo = nodos[n];
      const b = botones[n];
      vTmp.set(nodo.x, nodo.y, c * 0.5);
      raiz.localToWorld(vTmp);
      const dist = vTmp.distanceTo(camara.position);
      vTmp.project(camara);
      const x = (vTmp.x + 1) / 2 * ancho;
      const y = (1 - vTmp.y) / 2 * alto;
      const tam = S * 0.86 * escala / dist;
      let opacidad = n === activo ? Math.max(general, limitar((enfoque - 0.2) / 0.35)) : general;
      const desdeApertura = reloj - nodo.tAbrir;
      if (nodo.abierto && !sinMovimiento && desdeApertura < 1.3) {
        opacidad *= limitar((desdeApertura - 0.75) / 0.5);
      }
      b.style.transform = 'translate3d(' + (x - tam / 2).toFixed(1) + 'px,' + (y - tam / 2).toFixed(1) + 'px,0)';
      b.style.width = tam.toFixed(1) + 'px';
      b.style.height = tam.toFixed(1) + 'px';
      b.style.setProperty('--tam', tam.toFixed(1));
      b.style.opacity = opacidad.toFixed(3);
      b.style.visibility = opacidad < 0.02 && n !== activo ? 'hidden' : 'visible';
    }
    vTmp.set(0, 0, 0);
    raiz.localToWorld(vTmp);
    vTmp.project(camara);
    centro.style.left = ((vTmp.x + 1) / 2 * ancho).toFixed(1) + 'px';
    centro.style.top = ((1 - vTmp.y) / 2 * alto).toFixed(1) + 'px';
  }

  function colocarCubos() {
    const tOnda = reloj - ondaInicio;
    const conOnda = tOnda < 2.2 && !sinMovimiento;
    for (let n = 0, k = 0; n < total; n++) {
      const nodo = nodos[n];
      const ea = reloj - nodo.tAbrir;
      const ec = reloj - nodo.tCerrar;
      let estallido = 0;
      let suelto;
      if (nodo.abierto) {
        estallido = sinMovimiento ? 0 : ea < 0.16 ? salida(ea / 0.16) : Math.max(0, 1 - suave(limitar((ea - 0.16) / 1.2)));
        suelto = sinMovimiento ? 1 : salida(limitar(ea / 1.5));
      } else {
        suelto = sinMovimiento ? 0 : Math.max(0, 1 - suave(limitar(ec / 0.9)));
      }
      const tiembla = sinMovimiento ? 0 : nodo.temblor;
      for (let j = 0; j < porNodo; j++, k++) {
        const k3 = k * 3;
        let px = casa[k3];
        let py = casa[k3 + 1];
        let pz = casa[k3 + 2];
        let rx = 0;
        let ry = 0;
        if (libre[k] && suelto > 0) {
          const flota = sinMovimiento ? 0 : suelto;
          px += (meta[k3] - casa[k3]) * suelto + Math.sin(reloj * 0.45 + fase[k3]) * 0.06 * flota;
          py += (meta[k3 + 1] - casa[k3 + 1]) * suelto + Math.cos(reloj * 0.37 + fase[k3 + 1]) * 0.07 * flota;
          pz += (meta[k3 + 2] - casa[k3 + 2]) * suelto + Math.sin(reloj * 0.3 + fase[k3]) * 0.1 * flota;
          rx = (fase[k3] + reloj * 0.22 * fase[k3 + 2]) * suelto;
          ry = (fase[k3 + 1] + reloj * 0.17) * suelto;
        } else if (estallido > 0) {
          const alcance = S * 0.75 * estallido * (0.6 + fase[k3 + 2] * 0.25);
          px += direccion[k3] * alcance;
          py += direccion[k3 + 1] * alcance;
          pz += direccion[k3 + 2] * alcance * 1.2;
          rx = estallido * fase[k3] * 0.4;
          ry = estallido * fase[k3 + 1] * 0.4;
        }
        if (tiembla > 0.001) {
          px += Math.sin(reloj * 47 + k) * 0.012 * tiembla;
          py += Math.cos(reloj * 53 + k * 1.7) * 0.012 * tiembla;
        }
        let wx = nodo.x + px;
        let wy = nodo.y + py;
        if (conOnda) {
          const dx = wx - ondaX;
          const dy = wy - ondaY;
          const dist = Math.hypot(dx, dy) || 1;
          const frente = dist - tOnda * 7;
          const golpe = Math.exp(-(frente * frente) / 0.5) * 0.45 * Math.exp(-tOnda * 1.4);
          pz += golpe;
          wx += dx / dist * golpe * 0.25;
          wy += dy / dist * golpe * 0.25;
        }
        obj.position.set(wx, wy, pz);
        obj.rotation.set(rx, ry, 0);
        obj.updateMatrix();
        malla.setMatrixAt(k, obj.matrix);
      }
    }
    malla.instanceMatrix.needsUpdate = true;
  }

  if (inicial >= 0) {
    pasos = inicial;
    angulo = inicial * Math.PI / 4;
    activo = inicial;
    for (let n = 0; n < total; n++) {
      const th = Math.PI / 2 - n * Math.PI / 4 + angulo;
      nodos[n].x = R * Math.cos(th);
      nodos[n].y = R * Math.sin(th);
    }
    abrir(inicial, { historia: true, silencio: true });
  }

  let anterior = performance.now();
  function cuadro(ahora) {
    requestAnimationFrame(cuadro);
    if (document.hidden) {
      anterior = ahora;
      return;
    }
    const dt = Math.min(0.05, Math.max(0, (ahora - anterior) / 1000));
    anterior = ahora;
    reloj += dt;
    const objetivo = pasos * Math.PI / 4;
    if (arrastrando && suprimirClick) {
      velocidad = velArrastre;
    } else if (sinMovimiento) {
      angulo = objetivo;
      velocidad = 0;
    } else {
      let resto = dt;
      while (resto > 0) {
        const h = Math.min(resto, 1 / 120);
        velocidad += (-70 * (angulo - objetivo) - 9 * velocidad) * h;
        angulo += velocidad * h;
        resto -= h;
      }
    }
    brazos.rotation.z = angulo;
    const enfoqueObjetivo = modo === 'categoria' ? 1 : 0;
    if (sinMovimiento) {
      enfoque = enfoqueObjetivo;
    } else {
      const pasoEnfoque = dt / 1.15;
      enfoque = enfoque < enfoqueObjetivo ? Math.min(enfoqueObjetivo, enfoque + pasoEnfoque) : Math.max(enfoqueObjetivo, enfoque - pasoEnfoque);
    }
    const e = suave(enfoque);
    const mover = sinMovimiento ? 0 : 1;
    parX += (parXObjetivo - parX) * Math.min(1, dt * 3);
    parY += (parYObjetivo - parY) * Math.min(1, dt * 3);
    raiz.rotation.x = -0.3 + 0.2 * e + parY * 0.05 * (1 - e) * mover;
    raiz.rotation.y = 0.24 - 0.1 * e + parX * 0.07 * (1 - e) * mover;
    for (let n = 0; n < total; n++) {
      const nodo = nodos[n];
      const th = Math.PI / 2 - n * Math.PI / 4 + angulo;
      nodo.x = R * Math.cos(th);
      nodo.y = R * Math.sin(th);
      nodo.temblor += (nodo.temblorObjetivo - nodo.temblor) * Math.min(1, dt * 10);
    }
    raiz.updateMatrixWorld();
    colocarCamara(e);
    colocarCubos();
    renderer.render(escena3d, camara);
    colocarEtiquetas();
  }
  requestAnimationFrame(cuadro);
})();
