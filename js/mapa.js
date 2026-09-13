(function () {
  const D = window.DATOS_MAPA;
  if (!D || !window.THREE) {
    return;
  }

  const lienzo = document.getElementById('mapa-lienzo');
  const marco = document.getElementById('mapa-marco');
  const panel = document.getElementById('mapa-panel');
  const panelNombre = panel.querySelector('.panel__nombre');
  const panelCriterio = panel.querySelector('.panel__criterio');
  const botonRelieve = document.getElementById('boton-relieve');
  const listaPueblos = document.getElementById('lista-pueblos');
  const preferenciaMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
  const movimientoReducido = { get matches() { return preferenciaMovimiento.matches || !!window.MUSUQ_A11Y?.estado.detener; } };
  const colorDeZona = zona => window.MUSUQ_A11Y?.colorZona(zona) || zona.color;
  const patronDeZona = zona => Math.floor((zona.id - 1) / 8) + 1;

  const P = Object.assign({}, D.parametros, {
    junta: 0.008,
    paso: 0.30,
    zb: -0.34,
    elevacionHover: 0.48,
    colorFondo: '#365d70',
    colorNiebla: '#b9c8ce',
    tinteSombra: [0.72, 0.74, 0.83],
    anchoProvincial: 0.035,
    anchoPais: 0.06
  });
  const C = D.cuadrados;
  const N = C.x.length;

  const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.autoClear = false;
  renderer.setClearColor(new THREE.Color(P.colorFondo), 0);
  const conMuestreo = renderer.capabilities.isWebGL2 && !!THREE.WebGLMultisampleRenderTarget;
  const objetivoFoco = conMuestreo
    ? new THREE.WebGLMultisampleRenderTarget(1, 1, { format: THREE.RGBAFormat })
    : new THREE.WebGLRenderTarget(1, 1, { format: THREE.RGBAFormat });
  if (conMuestreo) {
    objetivoFoco.samples = 4;
  }

  const escena = new THREE.Scene();
  const escenaFronteras = new THREE.Scene();
  const escenaAgua = new THREE.Scene();
  const escenaNiebla = new THREE.Scene();
  const escenaFoco = new THREE.Scene();
  const camaraFoco = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const matFoco = new THREE.ShaderMaterial({
    uniforms: {
      imagen: { value: objetivoFoco.texture },
      pixel: { value: new THREE.Vector2(1, 1) },
      foco: { value: new THREE.Vector2(0.5, 0.47) },
      fuerza: { value: 0 },
      radio: { value: 6 },
      rafaga: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D imagen;
      uniform vec2 pixel;
      uniform vec2 foco;
      uniform float fuerza;
      uniform float radio;
      uniform float rafaga;
      varying vec2 vUv;
      void main() {
        vec2 desdeFoco = vUv - foco;
        float distanciaFoco = length(desdeFoco * vec2(1.15, 1.0));
        float borde = smoothstep(0.42, 0.78, distanciaFoco);
        float arriba = smoothstep(0.64, 1.0, vUv.y);
        float m = clamp(max(borde, arriba) * fuerza + smoothstep(0.18, 0.8, distanciaFoco) * rafaga * 0.8, 0.0, 1.0);
        vec4 c = texture2D(imagen, vUv);
        if (m > 0.01) {
          vec4 suma = c;
          for (int k = 0; k < 16; k++) {
            float f = float(k);
            float angulo = f * 2.39996;
            vec2 desvio = vec2(cos(angulo), sin(angulo)) * sqrt((f + 0.5) / 16.0) * radio * m * (1.0 + rafaga) * pixel;
            suma += texture2D(imagen, vUv + desvio);
          }
          c = suma / 17.0;
        }
        float estela = smoothstep(0.1, 0.75, distanciaFoco) * rafaga;
        if (estela > 0.01) {
          vec4 sumaEstela = c;
          for (int k = 1; k <= 10; k++) {
            sumaEstela += texture2D(imagen, vUv - desdeFoco * (float(k) / 10.0) * 0.07 * estela);
          }
          c = sumaEstela / 11.0;
        }
        gl_FragColor = c;
      }
    `,
    depthTest: false,
    depthWrite: false
  });
  const cuadroFoco = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), matFoco);
  cuadroFoco.frustumCulled = false;
  escenaFoco.add(cuadroFoco);

  function orientacion(gradosX, gradosZ) {
    const a = THREE.MathUtils.degToRad(gradosX);
    const c = THREE.MathUtils.degToRad(gradosZ);
    const girar = (v) => [v[0] * Math.cos(c) - v[1] * Math.sin(c), v[0] * Math.sin(c) + v[1] * Math.cos(c), v[2]];
    const f = girar([0, Math.sin(a), -Math.cos(a)]);
    const u = girar([0, Math.cos(a), Math.sin(a)]);
    const adelante = new THREE.Vector3(f[0], f[2], -f[1]).normalize();
    const arriba = new THREE.Vector3(u[0], u[2], -u[1]).normalize();
    const derecha = new THREE.Vector3().crossVectors(adelante, arriba).normalize();
    return { adelante, arriba, derecha };
  }

  const ejes = orientacion(P.anguloX, P.anguloZ);

  const ruidoGLSL = `
    float azar(vec3 p) {
      p = fract(p * 0.3183099 + 0.1);
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }
    float ruido(vec3 x) {
      vec3 i = floor(x);
      vec3 f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(mix(azar(i), azar(i + vec3(1.0, 0.0, 0.0)), f.x), mix(azar(i + vec3(0.0, 1.0, 0.0)), azar(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
        mix(mix(azar(i + vec3(0.0, 0.0, 1.0)), azar(i + vec3(1.0, 0.0, 1.0)), f.x), mix(azar(i + vec3(0.0, 1.0, 1.0)), azar(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
        f.z);
    }
  `;

  let relieve = 0;
  let relieveObjetivo = 1;
  const elevacion = new Float32Array(N);
  const elevacionObjetivo = new Float32Array(N);
  const onda = new Float32Array(N);

  function tope(i) {
    return P.z0 + C.nivel[i] * P.paso * relieve;
  }
  const bosques = window.MUSUQ_BOSQUES?.crear({escena,C,P,suelo:i=>tope(i)+elevacion[i]+onda[i]});

  const geoCuadro = new THREE.BoxGeometry(1, 1, 1);
  geoCuadro.translate(0, 0.5, 0);
  geoCuadro.setAttribute('fuera', new THREE.InstancedBufferAttribute(Float32Array.from(C.fuera), 1));
  const activacion = new Float32Array(N);
  const atributoActivo = new THREE.InstancedBufferAttribute(activacion, 1);
  atributoActivo.setUsage(THREE.DynamicDrawUsage);
  geoCuadro.setAttribute('activo', atributoActivo);
  const coloresActivos = new Float32Array(N * 3);
  const atributoColorActivo = new THREE.InstancedBufferAttribute(coloresActivos, 3);
  atributoColorActivo.setUsage(THREE.DynamicDrawUsage);
  geoCuadro.setAttribute('colorActivo', atributoColorActivo);
  const coloresPista = new Float32Array(N * 3);
  const invitaciones = new Float32Array(N);
  const atributoInvitacion = new THREE.InstancedBufferAttribute(invitaciones, 1);
  atributoInvitacion.setUsage(THREE.DynamicDrawUsage);
  const zonasPorArea = D.zonas.slice().sort((a, b) => a.km2 - b.km2);
  const colorPista = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const zona = zonasPorArea.find(z => C.zonas[i] & (1 << z.id));
    if (zona) colorPista.set(colorDeZona(zona)).toArray(coloresPista, i * 3);
  }
  geoCuadro.setAttribute('colorPista', new THREE.InstancedBufferAttribute(coloresPista, 3));
  geoCuadro.setAttribute('invitacion', atributoInvitacion);
  const patronesZona = Float32Array.from(C.zonas, mask => {
    const zona = zonasPorArea.find(z => mask & (1 << z.id));
    return zona ? patronDeZona(zona) : 0;
  });
  geoCuadro.setAttribute('patronZona', new THREE.InstancedBufferAttribute(patronesZona, 1));
  const ritmosZona = Float32Array.from(C.zonas, mask => {
    const zona = zonasPorArea.find(z => mask & (1 << z.id));
    return zona ? (zona.id * 0.61803398875) % 1 : 0;
  });
  geoCuadro.setAttribute('ritmoZona', new THREE.InstancedBufferAttribute(ritmosZona, 1));

  const matCuadro = new THREE.ShaderMaterial({
    uniforms: {
      luz: { value: new THREE.Vector3(P.luz[0], P.luz[1], P.luz[2]).normalize() },
      tinte: { value: new THREE.Vector3(P.tinteSombra[0], P.tinteSombra[1], P.tinteSombra[2]) },
      niebla: { value: new THREE.Color(P.colorNiebla) },
      fuerzaNiebla: { value: P.niebla },
      acento: { value: new THREE.Color('#edee43') },
      enfoque: { value: 0 },
      pulsoInvitacion: { value: 0.04 },
      tiempoInvitacion: { value: 0 },
      animarInvitacion: { value: 1 },
      modoAccesible: { value: window.MUSUQ_A11Y?.estado.color === 'daltonismo' ? 1 : 0 },
      patronActivo: { value: 1 }
    },
    vertexShader: `
      attribute float fuera;
      attribute float activo;
      attribute vec3 colorActivo;
      attribute vec3 colorPista;
      attribute float invitacion;
      attribute float patronZona;
      attribute float ritmoZona;
      varying float vRitmoZona;
      varying float vPatronZona;
      varying vec3 vColorPista;
      varying float vInvitacion;
      varying vec3 vColor;
      varying vec3 vNormal;
      varying vec3 vPos;
      varying float vFuera;
      varying float vActivo;
      varying vec3 vLocal;
      void main() {
        vec4 mundo = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        vColor = mix(instanceColor, colorActivo, activo);
        vColorPista = colorPista;
        vInvitacion = invitacion;
        vPatronZona = patronZona;
        vRitmoZona = ritmoZona;
        vLocal = position;
        vFuera = fuera;
        vActivo = clamp(activo, 0.0, 1.0);
        vPos = mundo.xyz;
        gl_Position = projectionMatrix * viewMatrix * mundo;
      }
    `,
    fragmentShader: `
      uniform vec3 luz;
      uniform vec3 tinte;
      uniform vec3 niebla;
      uniform float fuerzaNiebla;
      uniform float enfoque;
      uniform float pulsoInvitacion;
      uniform float tiempoInvitacion;
      uniform float animarInvitacion;
      varying float vRitmoZona;
      uniform float modoAccesible;
      uniform float patronActivo;
      varying float vPatronZona;
      varying vec3 vColorPista;
      varying float vInvitacion;
      varying vec3 vColor;
      varying vec3 vNormal;
      varying vec3 vPos;
      varying float vFuera;
      varying float vActivo;
      varying vec3 vLocal;
      void main() {
        float l = smoothstep(-0.25, 0.80, dot(normalize(vNormal), luz));
        vec3 c = mix(vColor * tinte, vColor, l);
        float arriba = step(0.8, vNormal.y);
        float canto = smoothstep(0.455, 0.495, max(abs(vLocal.x), abs(vLocal.z))) * arriba;
        c = mix(c, min(c * 1.065, vec3(1.0)), canto * 0.55);
        c *= mix(0.89, 1.0, smoothstep(0.0, 0.65, vLocal.y));
        c = mix(c, niebla, vFuera * fuerzaNiebla);
        float gris = dot(c, vec3(0.299, 0.587, 0.114));
        c = mix(c, vec3(gris), enfoque * (1.0 - vActivo));
        vec3 pista = mix(vColorPista * tinte, vColorPista, l);
        float latido = 0.5 - 0.5 * cos(6.2831853 * (tiempoInvitacion / (4.2 + vRitmoZona * 0.8) + vRitmoZona));
        float pulsoLocal = mix(pulsoInvitacion, 0.042 + 0.189 * latido, animarInvitacion);
        float invitacion = enfoque * vInvitacion * (1.0 - vActivo) * pulsoLocal;
        c = mix(c, pista, invitacion);
        c = min(c * (1.0 + 0.15 * enfoque * vActivo), vec3(1.0));
        float tipo = mix(vPatronZona, patronActivo, step(0.5, vActivo));
        vec2 uvPatron = vPos.xz * 3.5;
        float trama = tipo < 1.5 ? step(0.78, fract(uvPatron.x + uvPatron.y))
          : tipo < 2.5 ? step(0.78, fract(uvPatron.x))
          : tipo < 3.5 ? 1.0 - step(0.18, length(fract(uvPatron) - 0.5))
          : step(0.72, fract(uvPatron.y));
        c = mix(c, c * 0.60, trama * modoAccesible * arriba * max(vActivo, invitacion * 2.0));
        gl_FragColor = vec4(c, 1.0);
      }
    `
  });

  const cuadros = new THREE.InstancedMesh(geoCuadro, matCuadro, N);
  cuadros.frustumCulled = false;
  cuadros.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const colorTmp = new THREE.Color();
  for (let i = 0; i < N; i++) {
    colorTmp.set(D.coloresPaises[C.pais[i]] || D.coloresPaises.OTR);
    colorTmp.multiplyScalar(0.986 + ((i * 37) % 17) / 1200);
    cuadros.setColorAt(i, colorTmp);
  }
  escena.add(cuadros);

  const matrizTmp = new THREE.Matrix4();
  const ladoCuadro = P.q - 2 * P.junta;
  let relieveNiebla = -1;

  function actualizarCuadros() {
    for (let i = 0; i < N; i++) {
      matrizTmp.makeScale(ladoCuadro, tope(i) - P.zb, ladoCuadro);
      matrizTmp.setPosition(C.x[i], P.zb + elevacion[i] + onda[i], -C.y[i]);
      cuadros.setMatrixAt(i, matrizTmp);
      activacion[i] = elevacion[i] / P.elevacionHover;
    }
    cuadros.instanceMatrix.needsUpdate = true;
    atributoActivo.needsUpdate = true;
    if (relieveNiebla !== relieve) {
      relieveNiebla = relieve;
      actualizarNiebla();
    }
  }

  function cinta(lineas, ancho, conCuadro) {
    let total = 0;
    for (const l of lineas) {
      total += l.p.length / 2;
    }
    const posiciones = new Float32Array(total * 6);
    const largos = new Float32Array(total * 2);
    const lados = new Float32Array(total * 2);
    const cuadroDe = new Int32Array(total * 2);
    const indices = [];
    let v = 0;
    for (const l of lineas) {
      const n = l.p.length / 2;
      let acumulado = 0;
      for (let k = 0; k < n; k++) {
        const x = l.p[k * 2];
        const y = l.p[k * 2 + 1];
        if (k > 0) {
          acumulado += Math.hypot(x - l.p[(k - 1) * 2], y - l.p[(k - 1) * 2 + 1]);
        }
        const ka = Math.max(0, k - 1);
        const kb = Math.min(n - 1, k + 1);
        const dx = l.p[kb * 2] - l.p[ka * 2];
        const dy = l.p[kb * 2 + 1] - l.p[ka * 2 + 1];
        const largo = Math.hypot(dx, dy) || 1;
        const ox = -dy / largo * ancho / 2;
        const oy = dx / largo * ancho / 2;
        posiciones.set([x + ox, 0, -(y + oy), x - ox, 0, -(y - oy)], v * 3);
        largos[v] = largos[v + 1] = acumulado;
        lados[v] = 1;
        lados[v + 1] = -1;
        const c = conCuadro ? l.c[k] : -1;
        cuadroDe[v] = cuadroDe[v + 1] = c;
        if (k > 0) {
          indices.push(v - 2, v, v + 1, v - 2, v + 1, v - 1);
        }
        v += 2;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posiciones, 3));
    geo.setAttribute('largo', new THREE.BufferAttribute(largos, 1));
    geo.setAttribute('lado', new THREE.BufferAttribute(lados, 1));
    geo.setIndex(indices);
    return { geo, cuadroDe };
  }

  const rios = cinta(D.rios, 0.07, true);
  const activoRio = new Float32Array(rios.cuadroDe.length);
  rios.geo.setAttribute('activo', new THREE.BufferAttribute(activoRio, 1));
  const matRio = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      azul: { value: new THREE.Color('#75a8b1') },
      claro: { value: new THREE.Color('#dce9e4') },
      enfoque: { value: 0 }
    },
    vertexShader: `
      attribute float lado;
      attribute float activo;
      varying float vLado;
      varying float vActivo;
      void main() {
        vLado = lado;
        vActivo = clamp(activo, 0.0, 1.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 azul;
      uniform vec3 claro;
      uniform float enfoque;
      varying float vLado;
      varying float vActivo;
      void main() {
        vec3 c = mix(azul, claro, step(0.62, abs(vLado)));
        c = mix(c, vec3(dot(c, vec3(0.299, 0.587, 0.114))), enfoque * (1.0 - vActivo));
        gl_FragColor = vec4(min(c * (1.0 + 0.15 * enfoque * vActivo), vec3(1.0)), 1.0);
      }
    `
  });
  const mallaRios = new THREE.Mesh(rios.geo, matRio);
  mallaRios.frustumCulled = false;
  escena.add(mallaRios);

  function actualizarRios() {
    const pos = rios.geo.attributes.position.array;
    for (let v = 0; v < rios.cuadroDe.length; v++) {
      const i = rios.cuadroDe[v];
      pos[v * 3 + 1] = i >= 0 ? tope(i) + elevacion[i] + onda[i] + 0.012 : 0.012;
      activoRio[v] = i >= 0 ? activacion[i] : 0;
    }
    rios.geo.attributes.position.needsUpdate = true;
    rios.geo.attributes.activo.needsUpdate = true;
  }

  function materialFrontera(frecuencia, relleno, opacidad) {
    return new THREE.ShaderMaterial({
      uniforms: {
        frecuencia: { value: frecuencia },
        relleno: { value: relleno },
        opacidad: { value: opacidad }
      },
      vertexShader: `
        attribute float largo;
        varying float vLargo;
        void main() {
          vLargo = largo;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float frecuencia;
        uniform float relleno;
        uniform float opacidad;
        varying float vLargo;
        void main() {
          if (fract(vLargo * frecuencia) > relleno) discard;
          gl_FragColor = vec4(0.96, 0.98, 0.89, opacidad);
        }
      `,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide
    });
  }

  const provinciales = cinta(D.fronteras.provinciales.map((p) => ({ p })), P.anchoProvincial, false);
  const pais = cinta(D.fronteras.pais.map((p) => ({ p })), P.anchoPais, false);
  const mallaProvinciales = new THREE.Mesh(provinciales.geo, materialFrontera(2.6, 0.62, 0.78));
  const mallaPais = new THREE.Mesh(pais.geo, materialFrontera(1.5, 1.0, 1.0));
  let mostrarFronteras = true;
  for (const m of [mallaProvinciales, mallaPais]) {
    m.position.y = P.z0 + 0.02;
    m.frustumCulled = false;
    escenaFronteras.add(m);
  }
  mallaPais.renderOrder = 1;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < N; i++) {
    minX = Math.min(minX, C.x[i]);
    maxX = Math.max(maxX, C.x[i]);
    minY = Math.min(minY, C.y[i]);
    maxY = Math.max(maxY, C.y[i]);
  }
  const resolucion = 0.25;
  const x0 = minX - P.q / 2 - P.margenOceano;
  const y0 = minY - P.q / 2 - P.margenOceano;
  const anchoAgua = Math.ceil((maxX - minX + P.q + 2 * P.margenOceano) / resolucion) + 1;
  const altoAgua = Math.ceil((maxY - minY + P.q + 2 * P.margenOceano) / resolucion) + 1;
  const distancia = new Float32Array(anchoAgua * altoAgua).fill(1e9);
  const medio = P.q / 2;

  function marcarCuadro(campo, ancho, i, ox, oy) {
    const i0 = Math.round((C.x[i] - medio - ox) / resolucion);
    const i1 = Math.round((C.x[i] + medio - ox) / resolucion);
    const j0 = Math.round((C.y[i] - medio - oy) / resolucion);
    const j1 = Math.round((C.y[i] + medio - oy) / resolucion);
    for (let j = j0; j <= j1; j++) {
      for (let k = i0; k <= i1; k++) {
        campo[j * ancho + k] = 0;
      }
    }
  }

  function chaflan(campo, ancho, alto) {
    const diagonal = Math.SQRT2;
    for (let j = 0; j < alto; j++) {
      for (let k = 0; k < ancho; k++) {
        const idx = j * ancho + k;
        let d = campo[idx];
        if (k > 0) d = Math.min(d, campo[idx - 1] + 1);
        if (j > 0) {
          d = Math.min(d, campo[idx - ancho] + 1);
          if (k > 0) d = Math.min(d, campo[idx - ancho - 1] + diagonal);
          if (k < ancho - 1) d = Math.min(d, campo[idx - ancho + 1] + diagonal);
        }
        campo[idx] = d;
      }
    }
    for (let j = alto - 1; j >= 0; j--) {
      for (let k = ancho - 1; k >= 0; k--) {
        const idx = j * ancho + k;
        let d = campo[idx];
        if (k < ancho - 1) d = Math.min(d, campo[idx + 1] + 1);
        if (j < alto - 1) {
          d = Math.min(d, campo[idx + ancho] + 1);
          if (k < ancho - 1) d = Math.min(d, campo[idx + ancho + 1] + diagonal);
          if (k > 0) d = Math.min(d, campo[idx + ancho - 1] + diagonal);
        }
        campo[idx] = d;
      }
    }
  }

  for (let i = 0; i < N; i++) {
    marcarCuadro(distancia, anchoAgua, i, x0, y0);
  }
  chaflan(distancia, anchoAgua, altoAgua);
  const pixeles = new Uint8Array(anchoAgua * altoAgua * 4);
  for (let idx = 0; idx < distancia.length; idx++) {
    const valor = Math.min(1, distancia[idx] * resolucion / 3);
    pixeles[idx * 4] = Math.round(valor * 255);
    pixeles[idx * 4 + 3] = 255;
  }
  const texturaOrilla = new THREE.DataTexture(pixeles, anchoAgua, altoAgua, THREE.RGBAFormat);
  texturaOrilla.magFilter = THREE.LinearFilter;
  texturaOrilla.minFilter = THREE.LinearFilter;
  texturaOrilla.needsUpdate = true;

  let texturaOnda = new THREE.DataTexture(new Uint8Array([255, 0, 0, 255]), 1, 1, THREE.RGBAFormat);
  texturaOnda.needsUpdate = true;

  const matAgua = new THREE.ShaderMaterial({
    extensions: { derivatives: true },
    transparent: true,
    depthWrite: false,
    uniforms: {
      inmersion: { value: 0 },
      pantalla: { value: new THREE.Vector2(1, 1) },
      movil: { value: 0 },
      orilla: { value: texturaOrilla },
      tiempo: { value: 0 },
      escala: { value: 0.3 },
      cOrilla: { value: new THREE.Color('#a9d1ce') },
      cMedio: { value: new THREE.Color('#679eac') },
      cHondo: { value: new THREE.Color('#365d70') },
      enfoque: { value: 0 },
      ondaMapa: { value: texturaOnda },
      ondaCaja: { value: new THREE.Vector4(0, 0, 1, 1) },
      ondaRadio: { value: 0 },
      ondaFuerza: { value: 0 },
      gotas: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, -1, 1)) }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPos;
      void main() {
        vUv = uv;
        vec4 mundo = modelMatrix * vec4(position, 1.0);
        vPos = mundo.xyz;
        gl_Position = projectionMatrix * viewMatrix * mundo;
      }
    `,
    fragmentShader: ruidoGLSL + `
      uniform float inmersion;
      uniform vec2 pantalla;
      uniform float movil;
      uniform sampler2D orilla;
      uniform float tiempo;
      uniform float escala;
      uniform vec3 cOrilla;
      uniform vec3 cMedio;
      uniform vec3 cHondo;
      uniform float enfoque;
      uniform sampler2D ondaMapa;
      uniform vec4 ondaCaja;
      uniform float ondaRadio;
      uniform float ondaFuerza;
      uniform vec4 gotas[4];
      varying vec2 vUv;
      varying vec3 vPos;
      void main() {
        vec3 p = vec3(vPos.x, -vPos.z, 0.0) * escala;
        float d = texture2D(orilla, vUv).r + (ruido(p * 3.0) - 0.5) * 0.02;
        vec3 c = d < 0.35 ? mix(cOrilla, cMedio, d / 0.35) : mix(cMedio, cHondo, clamp((d - 0.35) / 0.65, 0.0, 1.0));
        float a = 0.44;
        vec2 r = mat2(cos(a), sin(a), -sin(a), cos(a)) * p.xy;
        r *= vec2(0.22, 1.35);
        r.x += tiempo * 0.0216;
        float corriente = ruido(vec3(r * 1.3, tiempo * 0.012));
        float veta = (1.0 - smoothstep(0.01, 0.045, abs(corriente - 0.5))) * step(0.45, d) * 0.143;
        c = mix(c, c * 1.12, veta);
        float costa = max(0.0, texture2D(orilla, vUv).r * 3.0);
        float aa = max(fwidth(costa) * 1.1, 0.012);
        vec2 celdaOla = floor(p.xy * 0.85);
        vec2 localOla = fract(p.xy * 0.85) - 0.5;
        float semillaOla = azar(vec3(celdaOla, 7.3));
        float ventana = 1.0 - smoothstep(0.24, 0.48, length(localOla * vec2(1.0, 1.2)));
        float detalle = ruido(vec3(p.xy * 2.0, 4.0));
        float fase = costa / 0.78 + tiempo * (0.15 + semillaOla * 0.045) + semillaOla + (detalle - 0.5) * 0.1;
        float ciclo = fract(fase);
        float segmentos = smoothstep(0.35, 0.6, ruido(vec3(p.xy * 2.3, 5.0)));
        float banda = abs(ciclo - 0.72) * 0.78;
        float cresta = 1.0 - smoothstep(0.043, 0.078 + aa, banda);
        float espuma = smoothstep(0.45, 0.69, ciclo) * (1.0 - smoothstep(0.69, 0.76, ciclo));
        float zonaSurf = smoothstep(0.04, 0.16, costa) * (1.0 - smoothstep(1.45, 2.35, costa));
        float rotura = ventana * smoothstep(0.18, 0.6, segmentos + ventana * 0.35);
        float labio = smoothstep(0.77, 0.80, ciclo) * (1.0 - smoothstep(0.81, 0.90, ciclo));
        c *= 1.0 - labio * zonaSurf * rotura * 0.10;
        c = mix(c, vec3(0.77, 0.91, 0.89), espuma * zonaSurf * rotura * 0.34);
        float orillaFina = (1.0 - smoothstep(0.02, 0.08 + aa, costa)) * segmentos * 0.45;
        c = mix(c, vec3(0.97, 0.99, 0.93), max(orillaFina, cresta * zonaSurf * rotura * 0.95));
        if (ondaFuerza > 0.001) {
          vec2 uo = (vec2(vPos.x, -vPos.z) - ondaCaja.xy) / ondaCaja.zw;
          if (uo.x > 0.0 && uo.y > 0.0 && uo.x < 1.0 && uo.y < 1.0) {
            float dz = texture2D(ondaMapa, uo).r * 8.0;
            float trozo = step(0.38, ruido(vec3(p.xy * 2.4, 3.0)));
            float anillo = (1.0 - smoothstep(0.04, 0.16, abs(dz - ondaRadio))) * mix(0.5, 1.0, trozo);
            anillo += (1.0 - smoothstep(0.02, 0.09, abs(dz - ondaRadio * 0.6))) * 0.5 * trozo;
            anillo *= ondaFuerza * (1.0 - smoothstep(3.5, 7.5, dz)) * smoothstep(0.1, 0.4, dz);
            c = mix(c, vec3(0.93, 0.97, 0.94), clamp(anillo, 0.0, 1.0) * 0.9);
          }
        }
        float circulo = 0.0;
        for (int g = 0; g < 4; g++) {
          vec4 gota = gotas[g];
          if (gota.z >= 0.0 && gota.z < 1.25) {
            float avance = min(1.0, gota.z / 1.2);
            float radioGota = (0.05 + 1.75 * (1.0 - (1.0 - avance) * (1.0 - avance))) * gota.w;
            float dg = distance(vec2(vPos.x, -vPos.z), gota.xy);
            if (dg < radioGota + 0.3) {
              float grosor = 0.035 + radioGota * 0.03;
              float trozoGota = step(0.3, ruido(vec3(p.xy * 6.0, 9.0 + float(g))));
              float anilloGota = (1.0 - smoothstep(grosor * 0.4, grosor, abs(dg - radioGota))) * mix(0.55, 1.0, trozoGota);
              anilloGota += (1.0 - smoothstep(grosor * 0.3, grosor * 0.75, abs(dg - radioGota * 0.55))) * 0.6 * trozoGota;
              anilloGota *= 1.0 - smoothstep(0.3, 1.2, gota.z);
              anilloGota += (1.0 - smoothstep(0.03, 0.16, dg)) * (1.0 - smoothstep(0.04, 0.3, gota.z));
              circulo = max(circulo, anilloGota);
            }
          }
        }
        c = mix(c, vec3(0.93, 0.97, 0.94), clamp(circulo, 0.0, 1.0) * 0.85);
        c = mix(c, vec3(dot(c, vec3(0.299, 0.587, 0.114))), enfoque * 0.5);
        vec2 screen = gl_FragCoord.xy / pantalla;
        float velo = mix(smoothstep(0.38, 0.83, screen.x), 1.0 - smoothstep(0.35, 0.64, screen.y), movil);
        gl_FragColor = vec4(c, mix(velo, 1.0, inmersion));
      }
    `
  });
  const geoAgua = new THREE.PlaneGeometry((anchoAgua - 1) * resolucion, (altoAgua - 1) * resolucion);
  geoAgua.rotateX(-Math.PI / 2);
  const agua = new THREE.Mesh(geoAgua, matAgua);
  agua.position.set(x0 + (anchoAgua - 1) * resolucion / 2, 0, -(y0 + (altoAgua - 1) * resolucion / 2));
  agua.frustumCulled = false;
  escenaAgua.add(agua);

  const azarNiebla = (n) => {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const ejeY = new THREE.Vector3(0, 1, 0);
  const indicePorCelda = new Map();
  for (let i = 0; i < N; i++) {
    indicePorCelda.set(Math.round(C.x[i] / P.q - 0.5) + ':' + Math.round(C.y[i] / P.q - 0.5), i);
  }
  const nivelEn = (x, y) => {
    const j = indicePorCelda.get(Math.floor(x / P.q) + ':' + Math.floor(y / P.q));
    return j === undefined ? 0 : C.nivel[j];
  };
  const formasNube = [
    [[-0.66, 0.02, 0.06, 0.44], [-0.1, 0.18, -0.02, 0.66], [0.52, 0.06, 0.04, 0.52], [0.12, 0.04, 0.42, 0.4], [-0.3, 0, -0.4, 0.36]],
    [[-0.46, 0, 0.04, 0.48], [0.08, 0.26, 0, 0.62], [0.56, 0.02, 0.08, 0.4], [0.02, 0.02, -0.42, 0.42]],
    [[-0.44, 0, 0, 0.4], [0.04, 0.14, 0.02, 0.54], [0.48, 0, -0.04, 0.36]]
  ];
  const nubes = [];
  const argentina = [];
  for (let i = 0; i < N; i++) {
    if (!C.fuera[i] && C.pais[i] === 'ARG') {
      argentina.push(i);
    }
  }
  const esArgentina = (x, y) => {
    const j = indicePorCelda.get(Math.floor(x / P.q) + ':' + Math.floor(y / P.q));
    return j !== undefined && !C.fuera[j] && C.pais[j] === 'ARG';
  };
  const nublado = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    if (C.fuera[i]) {
      nublado[i] = 1;
      continue;
    }
    const pais = C.pais[i];
    if (!['BOL', 'CHL', 'PRY', 'BRA'].includes(pais) || C.y[i] < (pais === 'CHL' ? -1.5 : -4.5)) {
      continue;
    }
    let cerca = Infinity;
    for (const j of argentina) {
      cerca = Math.min(cerca, (C.x[i] - C.x[j]) ** 2 + (C.y[i] - C.y[j]) ** 2);
    }
    nublado[i] = Math.sqrt(cerca) / P.q >= (pais === 'BOL' || pais === 'CHL' ? 1.5 : 2.5) ? 1 : 0;
  }
  const viento = new THREE.Vector2(-ejes.derecha.x - ejes.arriba.x * 0.35, ejes.derecha.z + ejes.arriba.z * 0.35).normalize();
  const velocidadViento = 0.04;

  function sumarNube(n) {
    const recorrido = 2.4 + azarNiebla(n.semilla + 21);
    n.x -= viento.x * recorrido * 0.5;
    n.y -= viento.y * recorrido * 0.5;
    if (esArgentina(n.x, n.y)) {
      return;
    }
    let llega = Infinity;
    for (let k = 1; k <= 40; k++) {
      const avance = recorrido * k / 40;
      if (esArgentina(n.x + viento.x * avance, n.y + viento.y * avance)) {
        llega = avance;
        break;
      }
    }
    if (llega < 0.8) {
      return;
    }
    n.derivaX = viento.x * recorrido;
    n.derivaY = viento.y * recorrido;
    n.ciclo = recorrido / velocidadViento;
    n.corte = llega === Infinity ? [2, 3] : [(llega - 0.7) / recorrido, (llega + 0.05) / recorrido];
    n.fase = azarNiebla(n.semilla + 11);
    n.opacidad = azarNiebla(n.semilla + 22) < 0.35 ? 0.5 + azarNiebla(n.semilla + 23) * 0.2 : 0.86 + azarNiebla(n.semilla + 23) * 0.1;
    const tramo = Math.min(recorrido, llega);
    for (let k = 0; k <= 6; k++) {
      n.nivel = Math.max(n.nivel, nivelEn(n.x + viento.x * tramo * k / 6, n.y + viento.y * tramo * k / 6));
    }
    n.forma = Math.floor(azarNiebla(n.semilla + 24) * formasNube.length) % formasNube.length;
    n.giro = new THREE.Quaternion().setFromAxisAngle(ejeY, azarNiebla(n.semilla + 13) * 6.2831);
    nubes.push(n);
  }

  const bloquesVistos = new Set();
  for (let i = 0; i < N; i++) {
    const gx = Math.round(C.x[i] / P.q - 0.5);
    const gy = Math.round(C.y[i] / P.q - 0.5);
    if (nublado[i]) {
      const bx = Math.floor(gx / 2);
      const by = Math.floor(gy / 2);
      const clave = bx + ':' + by;
      if (bloquesVistos.has(clave)) {
        continue;
      }
      bloquesVistos.add(clave);
      let nivel = 0;
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        const j = indicePorCelda.get((bx * 2 + dx) + ':' + (by * 2 + dy));
        if (j !== undefined) {
          nivel = Math.max(nivel, C.nivel[j]);
        }
      }
      const semilla = bx * 73.13 + by * 19.71;
      const cx = (bx * 2 + 1) * P.q;
      const cy = (by * 2 + 1) * P.q;
      sumarNube({ x: cx + (azarNiebla(semilla) - 0.5) * 0.4, y: cy + (azarNiebla(semilla + 1) - 0.5) * 0.4,
        escala: 0.95 + azarNiebla(semilla + 2) * 0.35, nivel, alza: 0.34 + azarNiebla(semilla + 3) * 0.18, semilla });
      if (azarNiebla(semilla + 4) < 0.3) {
        sumarNube({ x: cx + (azarNiebla(semilla + 5) - 0.5) * 0.9, y: cy + (azarNiebla(semilla + 6) - 0.5) * 0.9,
          escala: 0.6 + azarNiebla(semilla + 7) * 0.25, nivel, alza: 0.7 + azarNiebla(semilla + 8) * 0.2, semilla: semilla + 9 });
      }
    } else if (C.pais[i] !== 'ARG') {
      let vecino = null;
      for (let dy = -2; dy <= 2 && !vecino; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const j = indicePorCelda.get((gx + dx) + ':' + (gy + dy));
          if (j !== undefined && nublado[j]) {
            vecino = [dx, dy];
            break;
          }
        }
      }
      if (!vecino || azarNiebla(i * 3.7) > 0.45) {
        continue;
      }
      const largo = Math.hypot(vecino[0], vecino[1]) || 1;
      const semilla = i * 5.3;
      sumarNube({ x: C.x[i] + vecino[0] / largo * 0.25, y: C.y[i] + vecino[1] / largo * 0.25,
        escala: 0.45 + azarNiebla(semilla) * 0.2, nivel: C.nivel[i], alza: 0.55 + azarNiebla(semilla + 1) * 0.15, semilla });
    }
  }

  function esferaBaja(detalle) {
    const base = new THREE.IcosahedronGeometry(1, detalle);
    const pos = base.attributes.position.array;
    const unicos = [];
    const indices = [];
    const vistos = new Map();
    for (let v = 0; v < pos.length / 3; v++) {
      const clave = pos[v * 3].toFixed(4) + ',' + pos[v * 3 + 1].toFixed(4) + ',' + pos[v * 3 + 2].toFixed(4);
      let k = vistos.get(clave);
      if (k === undefined) {
        k = unicos.length / 3;
        vistos.set(clave, k);
        unicos.push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]);
      }
      indices.push(k);
    }
    base.dispose();
    return { unicos, indices };
  }

  const esferaNube = esferaBaja(1);

  function geometriaNube(bolas) {
    const posiciones = [];
    const indices = [];
    for (const [bx, by, bz, br] of bolas) {
      const desde = posiciones.length / 3;
      for (let k = 0; k < esferaNube.unicos.length; k += 3) {
        posiciones.push(bx + esferaNube.unicos[k] * br, Math.max(by + esferaNube.unicos[k + 1] * br * 0.92, -0.04), bz + esferaNube.unicos[k + 2] * br);
      }
      for (const i of esferaNube.indices) {
        indices.push(desde + i);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3));
    geo.setIndex(indices);
    return geo;
  }

  const matNiebla = new THREE.ShaderMaterial({
    uniforms: {
      tiempo: { value: 0 },
      movimiento: { value: 1 },
      presencia: { value: 1 },
      luz: { value: new THREE.Vector3(P.luz[0], P.luz[1], P.luz[2]).normalize() },
      claro: { value: new THREE.Color('#fdfefc') },
      sombra: { value: new THREE.Color('#cfdce1') },
      base: { value: new THREE.Color('#b4c6cf') }
    },
    vertexShader: `
      attribute float fase;
      attribute float ciclo;
      attribute vec2 deriva;
      attribute vec2 corte;
      attribute float opacidadBase;
      uniform float tiempo;
      uniform float movimiento;
      uniform float presencia;
      varying vec3 vMundo;
      varying float vAlto;
      varying float vAlfa;
      float rebote(float t) {
        float u = clamp(t, 0.0, 1.0) - 1.0;
        return 1.0 + 2.70158 * u * u * u + 1.70158 * u * u;
      }
      void main() {
        float s = mix(0.45, fract(tiempo / ciclo + fase), movimiento);
        float entra = smoothstep(corte.x, corte.y, s) * movimiento;
        float muere = (1.0 - smoothstep(0.88, 1.0, s)) * (1.0 - entra);
        float esta = clamp((presencia - fase * 0.35) / 0.65, 0.0, 1.0);
        float k = max(rebote(s / 0.08) * muere * rebote(esta), 0.0);
        vec3 p = position * k;
        p.y *= 1.0 + sin(tiempo * 0.26 + fase * 31.0) * 0.06 * movimiento;
        p.xz *= 1.0 + sin(tiempo * 0.19 + fase * 17.0) * 0.03 * movimiento;
        vec4 mundo = modelMatrix * instanceMatrix * vec4(p, 1.0);
        mundo.xz += deriva * s * movimiento;
        mundo.y += sin(tiempo * 0.22 + fase * 23.0) * 0.07 * movimiento + (1.0 - muere) * 0.25;
        vMundo = mundo.xyz;
        vAlto = position.y;
        vAlfa = opacidadBase * smoothstep(0.0, 0.04, s) * muere * smoothstep(0.0, 0.35, esta);
        gl_Position = projectionMatrix * viewMatrix * mundo;
      }
    `,
    fragmentShader: `
      uniform vec3 luz;
      uniform vec3 claro;
      uniform vec3 sombra;
      uniform vec3 base;
      varying vec3 vMundo;
      varying float vAlto;
      varying float vAlfa;
      void main() {
        vec3 n = normalize(cross(dFdx(vMundo), dFdy(vMundo)));
        if (dot(n, cameraPosition - vMundo) < 0.0) n = -n;
        float l = dot(n, luz) * 0.5 + 0.5;
        vec3 c = mix(sombra, claro, smoothstep(0.3, 0.78, l));
        c = mix(base, c, smoothstep(-0.04, 0.32, vAlto));
        gl_FragColor = vec4(c, vAlfa);
      }
    `,
    transparent: true,
    depthWrite: false,
    extensions: { derivatives: true }
  });

  const gruposNube = formasNube.map((forma, f) => {
    const lista = nubes.filter((n) => n.forma === f);
    const geo = geometriaNube(forma);
    geo.setAttribute('fase', new THREE.InstancedBufferAttribute(Float32Array.from(lista, (n) => n.fase), 1));
    geo.setAttribute('ciclo', new THREE.InstancedBufferAttribute(Float32Array.from(lista, (n) => n.ciclo), 1));
    geo.setAttribute('deriva', new THREE.InstancedBufferAttribute(Float32Array.from(lista.flatMap((n) => [n.derivaX, -n.derivaY])), 2));
    geo.setAttribute('corte', new THREE.InstancedBufferAttribute(Float32Array.from(lista.flatMap((n) => n.corte)), 2));
    geo.setAttribute('opacidadBase', new THREE.InstancedBufferAttribute(Float32Array.from(lista, (n) => n.opacidad), 1));
    const malla = new THREE.InstancedMesh(geo, matNiebla, Math.max(lista.length, 1));
    malla.count = lista.length;
    malla.frustumCulled = false;
    malla.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    escenaNiebla.add(malla);
    return { lista, malla };
  });
  const posicionNube = new THREE.Vector3();
  const escalaNube = new THREE.Vector3();
  const matrizNube = new THREE.Matrix4();

  function actualizarNiebla() {
    for (const grupo of gruposNube) {
      grupo.lista.forEach((n, k) => {
        posicionNube.set(n.x, P.z0 + n.nivel * P.paso * relieve + n.alza, -n.y);
        escalaNube.set(n.escala, n.escala * 0.82, n.escala);
        matrizNube.compose(posicionNube, n.giro, escalaNube);
        grupo.malla.setMatrixAt(k, matrizNube);
      });
      grupo.malla.instanceMatrix.needsUpdate = true;
    }
  }

  const velocidadOnda = 6;
  const duracionOnda = 1.6;
  const distanciaOnda = new Float32Array(N);
  let ondaInicio = -1;
  let ondaFin = 0;
  const maxParticulas = 180;
  const maxPolvo = 36;
  const matParticula = new THREE.ShaderMaterial({
    uniforms: {
      luz: { value: new THREE.Vector3(P.luz[0], P.luz[1], P.luz[2]).normalize() },
      tinte: { value: new THREE.Vector3(P.tinteSombra[0], P.tinteSombra[1], P.tinteSombra[2]) },
      pasto: { value: new THREE.Color('#80b85c') }
    },
    vertexShader: `
      attribute float tipo;
      varying vec3 vMundo;
      varying vec3 vColor;
      varying float vTipo;
      varying float vAlto;
      void main() {
        vec4 mundo = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vMundo = mundo.xyz;
        vColor = instanceColor;
        vTipo = tipo;
        vAlto = position.y;
        gl_Position = projectionMatrix * viewMatrix * mundo;
      }
    `,
    fragmentShader: `
      uniform vec3 luz;
      uniform vec3 tinte;
      uniform vec3 pasto;
      varying vec3 vMundo;
      varying vec3 vColor;
      varying float vTipo;
      varying float vAlto;
      void main() {
        vec3 n = normalize(cross(dFdx(vMundo), dFdy(vMundo)));
        if (dot(n, cameraPosition - vMundo) < 0.0) n = -n;
        vec3 base = vColor;
        if (vTipo > 0.5 && vTipo < 1.5 && vAlto > 0.18) base = pasto;
        float l = smoothstep(-0.25, 0.8, dot(n, luz));
        gl_FragColor = vec4(mix(base * tinte, base, l), 1.0);
      }
    `,
    extensions: { derivatives: true }
  });
  const geoParticula = new THREE.BoxGeometry(1, 1, 1);
  const tipoParticula = new THREE.InstancedBufferAttribute(new Float32Array(maxParticulas), 1);
  tipoParticula.setUsage(THREE.DynamicDrawUsage);
  geoParticula.setAttribute('tipo', tipoParticula);
  const mallaParticulas = new THREE.InstancedMesh(geoParticula, matParticula, maxParticulas);
  const geoPolvo = new THREE.IcosahedronGeometry(1, 0);
  geoPolvo.setAttribute('tipo', new THREE.InstancedBufferAttribute(new Float32Array(maxPolvo), 1));
  const mallaPolvo = new THREE.InstancedMesh(geoPolvo, matParticula, maxPolvo);
  for (const [malla, total] of [[mallaParticulas, maxParticulas], [mallaPolvo, maxPolvo]]) {
    malla.frustumCulled = false;
    malla.visible = false;
    malla.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let k = 0; k < total; k++) {
      malla.setColorAt(k, colorTmp.set('#e6d9bd'));
    }
    escena.add(malla);
  }
  const coloresParticula = [
    ['#8a5b3c', '#a3714a', '#7b4f33'],
    ['#9a6a43', '#8d603c'],
    ['#7fb35a', '#9cc66b', '#5f9a4a'],
    ['#eef8f4', '#c4e6e2']
  ];
  const particulas = [];
  const polvos = [];
  const posParticula = new THREE.Vector3();
  const giroParticula = new THREE.Quaternion();
  const escalaParticula = new THREE.Vector3();
  const matrizParticula = new THREE.Matrix4();
  const maxGotas = 60;
  const geoGota = new THREE.BoxGeometry(1, 1, 1);
  geoGota.setAttribute('tipo', new THREE.InstancedBufferAttribute(new Float32Array(maxGotas).fill(3), 1));
  const mallaGotas = new THREE.InstancedMesh(geoGota, matParticula, maxGotas);
  mallaGotas.frustumCulled = false;
  mallaGotas.visible = false;
  mallaGotas.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  for (let k = 0; k < maxGotas; k++) {
    mallaGotas.setColorAt(k, colorTmp.set(k % 2 ? '#eef8f4' : '#c4e6e2'));
  }
  escena.add(mallaGotas);
  const gotasMini = [];
  const anillosAgua = [];

  function lanzarGota(x, y, nivel) {
    if (movimientoReducido.matches) {
      return;
    }
    const inicio = performance.now();
    anillosAgua.push({ x, y, inicio, escala: 1 + nivel * 0.12 });
    if (anillosAgua.length > 4) {
      anillosAgua.shift();
    }
    const cantidad = 12 + nivel * 7;
    for (let k = 0; k < cantidad; k++) {
      const angulo = k / cantidad * 6.2831 + Math.random() * 0.4;
      const empuje = (0.3 + Math.random() * 0.5) * (1 + nivel * 0.12);
      const vy = (1.5 + Math.random() * 1.2) * (1 + nivel * 0.08);
      gotasMini.push({
        x: x + Math.cos(angulo) * 0.08, z: -(y + Math.sin(angulo) * 0.08),
        vx: Math.cos(angulo) * empuje, vz: -Math.sin(angulo) * empuje, vy, inicio,
        tam: 0.035 + Math.random() * 0.035, aterriza: vy / 7,
        eje: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
        giro: 6 + Math.random() * 6
      });
    }
    gotasMini.splice(0, Math.max(0, gotasMini.length - maxGotas));
  }

  function actualizarGotas(ahora) {
    while (anillosAgua.length && ahora - anillosAgua[0].inicio > 1250) {
      anillosAgua.shift();
    }
    for (let k = gotasMini.length - 1; k >= 0; k--) {
      if ((ahora - gotasMini[k].inicio) / 1000 > gotasMini[k].aterriza + 0.15) {
        gotasMini.splice(k, 1);
      }
    }
    matAgua.uniforms.gotas.value.forEach((v, g) => {
      const anillo = anillosAgua[g];
      if (anillo) {
        v.set(anillo.x, anillo.y, Math.max(0, (ahora - anillo.inicio) / 1000), anillo.escala);
      } else {
        v.set(0, 0, -1, 1);
      }
    });
    gotasMini.forEach((p, k) => {
      const s = Math.max(0, (ahora - p.inicio) / 1000);
      const vuelo = Math.min(s, p.aterriza);
      const resto = s < p.aterriza ? Math.min(1, s / 0.05) : Math.max(0, 1 - (s - p.aterriza) / 0.15);
      posParticula.set(p.x + p.vx * vuelo, p.tam * 0.5 + p.vy * vuelo - 7 * vuelo * vuelo, p.z + p.vz * vuelo);
      giroParticula.setFromAxisAngle(p.eje, p.giro * vuelo);
      escalaParticula.setScalar(p.tam * resto);
      matrizParticula.compose(posParticula, giroParticula, escalaParticula);
      mallaGotas.setMatrixAt(k, matrizParticula);
    });
    mallaGotas.count = gotasMini.length;
    mallaGotas.visible = gotasMini.length > 0;
    mallaGotas.instanceMatrix.needsUpdate = true;
  }

  function sumarParticula(x, y, suelo, vx, vy, vz, demora, tam, tipo, enAgua) {
    const k = particulas.length;
    particulas.push({
      x, y: suelo + tam * 0.5, z: -y, vx, vy, vz: -vz, demora, tam, enAgua, aterriza: vy / 7,
      eje: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
      giro: 5 + Math.random() * 7
    });
    const lista = coloresParticula[tipo];
    mallaParticulas.setColorAt(k, colorTmp.set(lista[Math.floor(Math.random() * lista.length)]));
    tipoParticula.array[k] = tipo;
  }

  function lanzarOnda(zona, demora) {
    if (movimientoReducido.matches) {
      return false;
    }
    const bit = 1 << zona.id;
    const propios = [];
    for (let i = 0; i < N; i++) {
      if (C.zonas[i] & bit) {
        propios.push(i);
      }
    }
    if (!propios.length) {
      return false;
    }
    const direccion = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) {
      if (C.zonas[i] & bit) {
        distanciaOnda[i] = 0;
        continue;
      }
      let mejor = Infinity;
      let cercano = propios[0];
      for (const j of propios) {
        const d = (C.x[i] - C.x[j]) ** 2 + (C.y[i] - C.y[j]) ** 2;
        if (d < mejor) {
          mejor = d;
          cercano = j;
        }
      }
      const d = Math.sqrt(mejor);
      distanciaOnda[i] = d;
      direccion[i * 2] = (C.x[i] - C.x[cercano]) / d;
      direccion[i * 2 + 1] = (C.y[i] - C.y[cercano]) / d;
    }

    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;
    for (const i of propios) {
      xMin = Math.min(xMin, C.x[i]);
      xMax = Math.max(xMax, C.x[i]);
      yMin = Math.min(yMin, C.y[i]);
      yMax = Math.max(yMax, C.y[i]);
    }
    const margen = 8;
    const ox = xMin - medio - margen;
    const oy = yMin - medio - margen;
    const ancho = Math.ceil((xMax - xMin + P.q + 2 * margen) / resolucion) + 1;
    const alto = Math.ceil((yMax - yMin + P.q + 2 * margen) / resolucion) + 1;
    const campo = new Float32Array(ancho * alto).fill(1e9);
    for (const i of propios) {
      marcarCuadro(campo, ancho, i, ox, oy);
    }
    chaflan(campo, ancho, alto);
    const pixelesOnda = new Uint8Array(ancho * alto * 4);
    for (let idx = 0; idx < campo.length; idx++) {
      pixelesOnda[idx * 4] = Math.round(Math.min(1, campo[idx] * resolucion / 8) * 255);
      pixelesOnda[idx * 4 + 3] = 255;
    }
    texturaOnda.dispose();
    texturaOnda = new THREE.DataTexture(pixelesOnda, ancho, alto, THREE.RGBAFormat);
    texturaOnda.magFilter = THREE.LinearFilter;
    texturaOnda.minFilter = THREE.LinearFilter;
    texturaOnda.needsUpdate = true;
    matAgua.uniforms.ondaMapa.value = texturaOnda;
    matAgua.uniforms.ondaCaja.value.set(ox - resolucion / 2, oy - resolucion / 2, ancho * resolucion, alto * resolucion);

    particulas.length = 0;
    polvos.length = 0;
    const candidatos = [];
    for (let i = 0; i < N; i++) {
      const d = distanciaOnda[i];
      if (d > 0 && d <= 3.4 && !C.fuera[i] && Math.random() < 0.62 * (1 - d / 4.2)) {
        candidatos.push(i);
      }
    }
    for (let k = candidatos.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [candidatos[k], candidatos[j]] = [candidatos[j], candidatos[k]];
    }
    for (const i of candidatos.slice(0, maxParticulas - 40)) {
      const d = distanciaOnda[i];
      const tipo = Math.random() < 0.42 ? 1 : Math.random() < 0.55 ? 0 : 2;
      const tam = tipo === 2 ? 0.07 + Math.random() * 0.05 : 0.11 + Math.random() * 0.09;
      const empuje = 1.1 + Math.random() * 1.5;
      const angulo = (Math.random() - 0.5) * 0.9;
      const dx = direccion[i * 2];
      const dy = direccion[i * 2 + 1];
      const rx = dx * Math.cos(angulo) - dy * Math.sin(angulo);
      const ry = dx * Math.sin(angulo) + dy * Math.cos(angulo);
      const x = C.x[i] + (Math.random() - 0.5) * 0.4;
      const y = C.y[i] + (Math.random() - 0.5) * 0.4;
      const suelo = tope(i) + elevacion[i];
      const demora = Math.max(0, d - medio) / velocidadOnda;
      sumarParticula(x, y, suelo, rx * empuje, 3.1 + Math.random() * 1.9, ry * empuje, demora, tam, tipo, false);
      if (d < 0.9 && polvos.length < maxPolvo && Math.random() < 0.55) {
        polvos.push({ x, y: suelo, z: -y, dx: rx, dz: -ry, demora, tam: 0.2 + Math.random() * 0.16 });
      }
    }
    for (let intento = 0, gotas = 0; intento < 900 && gotas < 40 && particulas.length < maxParticulas; intento++) {
      const k = 1 + Math.floor(Math.random() * (ancho - 2));
      const j = 1 + Math.floor(Math.random() * (alto - 2));
      const idx = j * ancho + k;
      const d = campo[idx] * resolucion;
      if (d < 0.3 || d > 2.8 || Math.random() > 1 - d / 3) {
        continue;
      }
      const x = ox + k * resolucion;
      const y = oy + j * resolucion;
      if (indicePorCelda.has(Math.floor(x / P.q) + ':' + Math.floor(y / P.q))) {
        continue;
      }
      const gx = campo[idx + 1] - campo[idx - 1];
      const gy = campo[idx + ancho] - campo[idx - ancho];
      const largo = Math.hypot(gx, gy) || 1;
      const empuje = 0.5 + Math.random() * 0.9;
      sumarParticula(x, y, 0, gx / largo * empuje, 2.2 + Math.random() * 1.4, gy / largo * empuje, d / velocidadOnda, 0.06 + Math.random() * 0.05, 3, true);
      gotas++;
    }

    ondaFin = duracionOnda;
    for (const p of particulas) {
      ondaFin = Math.max(ondaFin, p.demora + p.aterriza + 0.5);
    }
    if (mallaParticulas.instanceColor) {
      mallaParticulas.instanceColor.needsUpdate = true;
    }
    tipoParticula.needsUpdate = true;
    mallaParticulas.count = particulas.length;
    mallaPolvo.count = polvos.length;
    mallaParticulas.visible = false;
    mallaPolvo.visible = false;
    onda.fill(0);
    matAgua.uniforms.ondaFuerza.value = 0;
    actualizarCuadros();
    actualizarRios();
    ondaInicio = performance.now() + demora * 1000;
    animando = true;
    return true;
  }

  function calcularOnda(s) {
    const radio = velocidadOnda * s;
    const apagado = 1 - THREE.MathUtils.smoothstep(s, 0.9, duracionOnda);
    for (let i = 0; i < N; i++) {
      const d = distanciaOnda[i];
      if (d === 0) {
        onda[i] = s < 0.36 ? Math.sin(s / 0.36 * Math.PI) * 0.1 : 0;
        continue;
      }
      const x = (d - medio - radio) / 0.6;
      onda[i] = x > -3 && x < 2
        ? (Math.exp(-x * x * 2.2) * 0.32 - Math.exp(-(x + 1.3) * (x + 1.3) * 2.5) * 0.09) * apagado * Math.max(0, 1 - d / 7.5)
        : 0;
    }
    matAgua.uniforms.ondaRadio.value = radio;
    matAgua.uniforms.ondaFuerza.value = apagado;
  }

  function actualizarParticulas(s) {
    particulas.forEach((p, k) => {
      const t = s - p.demora;
      const vuelo = Math.min(Math.max(t, 0), p.aterriza);
      let escala = 0;
      let y = p.y;
      if (t > 0) {
        if (t < p.aterriza) {
          y = p.y + p.vy * t - 7 * t * t;
          escala = p.tam * Math.min(1, t / 0.06);
        } else {
          const vida = p.enAgua ? 0.2 : 0.45;
          const resto = Math.max(0, 1 - (t - p.aterriza) / vida);
          escala = p.tam * resto;
          y = p.y + (p.enAgua ? 0 : Math.abs(Math.sin((t - p.aterriza) * 12)) * 0.09 * resto);
        }
      }
      posParticula.set(p.x + p.vx * vuelo, y, p.z + p.vz * vuelo);
      giroParticula.setFromAxisAngle(p.eje, p.giro * vuelo);
      escalaParticula.setScalar(escala);
      matrizParticula.compose(posParticula, giroParticula, escalaParticula);
      mallaParticulas.setMatrixAt(k, matrizParticula);
    });
    polvos.forEach((p, k) => {
      const t = Math.max(0, s - p.demora);
      const crece = Math.min(1, t / 0.22);
      const escala = s < p.demora ? 0 : p.tam * (1 - (1 - crece) ** 3) * Math.max(0, 1 - Math.max(0, t - 0.22) / 0.6);
      posParticula.set(p.x + p.dx * t * 0.45, p.y + 0.08 + t * 0.3, p.z + p.dz * t * 0.45);
      giroParticula.setFromAxisAngle(ejeY, t * 1.5 + k);
      escalaParticula.set(escala, escala * 0.8, escala);
      matrizParticula.compose(posParticula, giroParticula, escalaParticula);
      mallaPolvo.setMatrixAt(k, matrizParticula);
    });
    mallaParticulas.instanceMatrix.needsUpdate = true;
    mallaPolvo.instanceMatrix.needsUpdate = true;
  }

  const camara = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 2000);
  camara.up.copy(ejes.arriba);
  let minR = Infinity;
  let maxR = -Infinity;
  let minU = Infinity;
  let maxU = -Infinity;
  const puntoTmp = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    if (C.fuera[i]) {
      continue;
    }
    const alto = P.z0 + C.nivel[i] * P.paso;
    for (const sx of [-medio, medio]) {
      for (const sy of [-medio, medio]) {
        puntoTmp.set(C.x[i] + sx, alto, -(C.y[i] + sy));
        const r = puntoTmp.dot(ejes.derecha);
        const u = puntoTmp.dot(ejes.arriba);
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minU = Math.min(minU, u);
        maxU = Math.max(maxU, u);
      }
    }
  }
  const balanceo = new THREE.Vector2();
  const balanceoObjetivo = new THREE.Vector2();
  let explorando = false;
  let inmersion = 0;
  let inmersionObjetivo = 0;
  let anchoVista = 1, altoVista = 1;
  let acercamiento = 0;
  let enfoque = 0;
  const limitesZona = { minR: 0, maxR: 0, minU: 0, maxU: 0 };
  const limitesZonaObjetivo = { minR: 0, maxR: 0, minU: 0, maxU: 0 };

  function ubicarCamara() {
    const movil = anchoVista <= 700;
    const aspecto = anchoVista / altoVista;
    const fraccionX = movil ? 0.9 : THREE.MathUtils.lerp(0.48, 0.60, inmersion);
    const fraccionY = movil ? THREE.MathUtils.lerp(0.42, 0.66, inmersion) : THREE.MathUtils.lerp(0.77, 0.89, inmersion);
    const medioAncho = Math.max((maxR-minR)/2/fraccionX,(maxU-minU)/2/fraccionY*aspecto);
    const centroX = movil ? 0.49 : THREE.MathUtils.lerp(0.755,0.50,inmersion);
    const centroY = movil ? THREE.MathUtils.lerp(0.73,0.54,inmersion) : THREE.MathUtils.lerp(0.54,0.51,inmersion);
    let ancho = medioAncho;
    let camR = (minR + maxR) / 2 + balanceo.x - (centroX * 2 - 1) * medioAncho;
    let camU = (minU + maxU) / 2 + balanceo.y + (centroY * 2 - 1) * medioAncho / aspecto;
    if (enfoque > 0) {
      const zonaX = movil ? 0.42 : 0.5;
      const zonaY = movil ? 0.42 : 0.53;
      const anchoZona = THREE.MathUtils.clamp(Math.max(
        (limitesZona.maxR - limitesZona.minR) / 2 / (movil ? 0.6 : 0.3),
        (limitesZona.maxU - limitesZona.minU) / 2 / (movil ? 0.34 : 0.5) * aspecto), medioAncho * 0.16, medioAncho * 0.75);
      ancho = Math.exp(THREE.MathUtils.lerp(Math.log(medioAncho), Math.log(anchoZona), enfoque));
      camR = THREE.MathUtils.lerp(camR, (limitesZona.minR + limitesZona.maxR) / 2 - (zonaX * 2 - 1) * anchoZona, enfoque);
      camU = THREE.MathUtils.lerp(camU, (limitesZona.minU + limitesZona.maxU) / 2 + (zonaY * 2 - 1) * anchoZona / aspecto, enfoque);
      matFoco.uniforms.foco.value.set(zonaX, 1 - zonaY);
    }
    const alto = ancho / aspecto;
    camara.left=-ancho;camara.right=ancho;camara.top=alto;camara.bottom=-alto;
    camara.updateProjectionMatrix();
    camara.position.copy(ejes.derecha).multiplyScalar(camR)
      .addScaledVector(ejes.arriba, camU)
      .addScaledVector(ejes.adelante, -300);
    camara.lookAt(puntoTmp.copy(camara.position).add(ejes.adelante));
  }

  function encuadrar() {
    const ancho = marco.clientWidth;
    const alto = marco.clientHeight;
    if (!ancho || !alto) {
      return;
    }
    renderer.setSize(ancho, alto, false);
    anchoVista=ancho;altoVista=alto;
    const bufferVista = matAgua.uniforms.pantalla.value;
    renderer.getDrawingBufferSize(bufferVista);
    objetivoFoco.setSize(bufferVista.x, bufferVista.y);
    matFoco.uniforms.pixel.value.set(1 / bufferVista.x, 1 / bufferVista.y);
    matFoco.uniforms.radio.value = 6 * renderer.getPixelRatio();
    matAgua.uniforms.movil.value=ancho<=700?1:0;
    ubicarCamara();
  }

  new ResizeObserver(encuadrar).observe(marco);
  encuadrar();
  ubicarCamara();

  function medirZona(zona) {
    const bit = 1 << zona.id;
    const L = limitesZonaObjetivo;
    L.minR = L.minU = Infinity;
    L.maxR = L.maxU = -Infinity;
    const sumar = (x, alto, y) => {
      puntoTmp.set(x, alto, -y);
      const r = puntoTmp.dot(ejes.derecha);
      const u = puntoTmp.dot(ejes.arriba);
      L.minR = Math.min(L.minR, r);
      L.maxR = Math.max(L.maxR, r);
      L.minU = Math.min(L.minU, u);
      L.maxU = Math.max(L.maxU, u);
    };
    let hay = false;
    for (let i = 0; i < N; i++) {
      if (!(C.zonas[i] & bit)) {
        continue;
      }
      hay = true;
      const alto = P.z0 + C.nivel[i] * P.paso * relieveObjetivo + P.elevacionHover;
      for (const sx of [-medio, medio]) {
        for (const sy of [-medio, medio]) {
          sumar(C.x[i] + sx, alto, C.y[i] + sy);
          sumar(C.x[i] + sx, P.z0, C.y[i] + sy);
        }
      }
    }
    if (!hay) {
      for (const poligono of zona.poligonos || []) {
        for (const [x, y] of poligono[0]) {
          sumar(x, P.z0, y);
        }
      }
    }
  }

  const zonas = D.zonas.slice().sort((a, b) => a.id - b.id);
  let zonaActiva = null;
  let zonaFijada = null;
  let animando = true;
  let zonaBajoCursor = null;
  let zonaAutomatica = null;
  let suavidadHover = 11;
  let pausaAutomatica = performance.now() + 1800;
  let proximoPaso = 0;
  let indiceAutomatico = 0;
  const ordenAutomatico = zonas
    .filter((z) => C.zonas.some((m) => m & (1 << z.id)))
    .sort((a, b) => ((a.id * 7) % 19) - ((b.id * 7) % 19));

  function zonasDe(mascara) {
    return zonas.filter((z) => mascara & (1 << z.id));
  }

  const ficha = document.getElementById('panel-ficha');
  const formatoKm = new Intl.NumberFormat('es-AR');

  function completarFicha(zona) {
    const datos = zona && window.MUSUQ_FICHAS?.[zona.id];
    if (!ficha) {
      return;
    }
    ficha.hidden = !datos;
    if (!datos) {
      return;
    }
    const km2 = zona.km2 < 20000 ? Math.round(zona.km2 / 100) * 100 : Math.round(zona.km2 / 1000) * 1000;
    ficha.querySelector('[data-ficha="descripcion"]').textContent = datos.descripcion;
    ficha.querySelector('[data-ficha="superficie"]').textContent = '≈ ' + formatoKm.format(km2) + ' km² en el mapa';
    ficha.querySelector('[data-ficha="bioma"]').textContent = datos.bioma;
    ficha.querySelector('[data-ficha="arboles"]').textContent = datos.arboles;
    ficha.querySelector('[data-ficha="flora"]').textContent = datos.flora;
  }

  function activarZona(zona) {
    if (zonaActiva === zona) {
      return;
    }
    zonaActiva = zona;
    const bit = zona ? 1 << zona.id : 0;
    if(zona){colorTmp.set(colorDeZona(zona));matCuadro.uniforms.patronActivo.value=patronDeZona(zona);}
    for (let i = 0; i < N; i++) {
      elevacionObjetivo[i] = bit && (C.zonas[i] & bit) ? P.elevacionHover : 0;
      if(elevacionObjetivo[i])colorTmp.toArray(coloresActivos,i*3);
    }
    atributoColorActivo.needsUpdate=true;
    if (zona) {
      panelNombre.textContent = zona.nombre;
      panelCriterio.textContent = zona.criterio;
      panel.style.setProperty('--zona-color',colorDeZona(zona));
      panel.dataset.trama=String(patronDeZona(zona));
      completarFicha(zona);
    } else {
      panelNombre.textContent='Explorá el mapa';
      panelCriterio.textContent='Pasá por una zona o elegí un pueblo de la lista.';
      panel.style.removeProperty('--zona-color');
      completarFicha(null);
    }
    for (const b of listaPueblos.querySelectorAll('button')) {
      b.setAttribute('aria-pressed', zona && Number(b.dataset.zona) === zona.id ? 'true' : 'false');
    }
    animando = true;
    lienzo.style.cursor = !explorando || zonaBajoCursor ? 'pointer' : 'default';
    if (zona && explorando && !document.querySelector('dialog[open]')) window.MUSUQ_A11Y?.narrar(zona.nombre + '. ' + zona.criterio + (window.MUSUQ_FICHAS?.[zona.id] ? '. ' + window.MUSUQ_FICHAS[zona.id].descripcion : ''));
  }

  const semitonos = (n) => Math.pow(2, n / 12);
  const tonosZoom = [0, 2, 4, 7].map(semitonos);
  const tonosAgua = [0, 2, 4, 7, 9].map(semitonos);

  function crearAudio(archivo, volumen) {
    const audio = new Audio(archivo);
    audio.preload = 'auto';
    audio.volume = volumen;
    audio.preservesPitch = false;
    audio.webkitPreservesPitch = false;
    audio.mozPreservesPitch = false;
    return audio;
  }

  const sonidos = {
    explosion: crearAudio('sonidos/explosion.mp3', 0.4),
    zoom1: crearAudio('sonidos/zoom-1.mp3', 1),
    zoom2: crearAudio('sonidos/zoom-2.mp3', 1),
    impacto: crearAudio('sonidos/impacto-1.mp3', 1)
  };
  const sonidosAgua = Array.from({ length: 5 }, () => crearAudio('sonidos/agua.mp3', 1));
  const sonidosAlejar = [crearAudio('sonidos/alejar-soplido.mp3', 0.8), crearAudio('sonidos/alejar-agua.mp3', 0.8)];
  const esperasSonido = [];
  let nivelZoom = 0;
  let siguienteAgua = 0;

  function reproducir(audio, desde, tono) {
    audio.pause();
    if (window.MUSUQ_SONIDO && !window.MUSUQ_SONIDO.efectos) {
      return;
    }
    audio.currentTime = desde;
    audio.playbackRate = tono;
    const promesa = audio.play();
    if (promesa) {
      promesa.catch(() => {});
    }
  }

  function sonar(audio, retraso, desde, tono) {
    esperasSonido.push(setTimeout(() => reproducir(audio, desde, tono), retraso * 1000));
  }

  function sonarEnMomento(audio, momento, golpe, tono) {
    const golpeReal = golpe / tono;
    sonar(audio, Math.max(0, momento - golpeReal), Math.max(0, golpeReal - momento) * tono, tono);
  }

  function sonarAcercamiento(demora, conOnda, tono) {
    esperasSonido.forEach(clearTimeout);
    esperasSonido.length = 0;
    Object.values(sonidos).forEach((audio) => audio.pause());
    sonar(sonidos.zoom1, 0, 0, tono);
    if (!conOnda) {
      return;
    }
    sonar(sonidos.explosion, 0, 0, tono);
    sonarEnMomento(sonidos.zoom2, demora - 0.05, 0.85, tono);
    sonarEnMomento(sonidos.impacto, demora - 0.02, 0.08, tono);
  }

  function sonarAlejamiento() {
    sonidosAlejar.forEach((audio) => reproducir(audio, 0, semitonos(-2)));
  }

  window.addEventListener('musuq:sonido', (e) => {
    if (!e.detail.efectos) {
      esperasSonido.forEach(clearTimeout);
      esperasSonido.length = 0;
      [...Object.values(sonidos), ...sonidosAgua, ...sonidosAlejar].forEach((audio) => audio.pause());
    }
  });

  function sonarAgua(nivel) {
    reproducir(sonidosAgua[siguienteAgua], 0, tonosAgua[nivel]);
    siguienteAgua = (siguienteAgua + 1) % sonidosAgua.length;
  }

  function fijarZona(zona) {
    const nueva = zona && zona !== zonaFijada;
    const cambioDeZona = nueva && !!zonaFijada;
    zonaFijada = zona;
    const bitSeleccionado = zona ? 1 << zona.id : 0;
    for (let i = 0; i < N; i++) {
      invitaciones[i] = bitSeleccionado && C.zonas[i] && !(C.zonas[i] & bitSeleccionado) ? 1 : 0;
    }
    atributoInvitacion.needsUpdate = true;
    suavidadHover = 11;
    activarZona(zona);
    document.getElementById('liberar-zona').hidden = !zona;
    if (zona) {
      medirZona(zona);
    }
    if (nueva) {
      const cerca = acercamiento >= 0.6;
      const demora = cerca ? 0.35 : 1.15;
      nivelZoom = cambioDeZona ? (nivelZoom + 1) % tonosZoom.length : 0;
      sonarAcercamiento(demora, lanzarOnda(zona, demora), tonosZoom[nivelZoom]);
      bosques?.seleccionar(zona, demora + 0.08);
    }
    if (!zona) bosques?.seleccionar(null);
  }

  for (const z of zonas) {
    const item = document.createElement('li');
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.dataset.zona = String(z.id);
    boton.style.setProperty('--zona-color',colorDeZona(z));
    boton.dataset.trama=String(patronDeZona(z));
    boton.setAttribute('aria-pressed', 'false');
    const numero = document.createElement('span');
    numero.textContent = String(z.id).padStart(2, '0');
    boton.append(numero, document.createTextNode(z.nombre));
    boton.addEventListener('mouseenter', () => { if (!zonaFijada) activarZona(z); });
    boton.addEventListener('focus', () => { if (!zonaFijada) activarZona(z); });
    boton.addEventListener('mouseleave', () => activarZona(zonaFijada));
    boton.addEventListener('blur', () => activarZona(zonaFijada));
    boton.addEventListener('click', () => fijarZona(zonaFijada === z ? null : z));
    item.append(boton);
    listaPueblos.append(item);
  }

  const raycaster = new THREE.Raycaster();
  const puntero = new THREE.Vector2();
  let punteroAdentro = false;
  let detectarPendiente = false;

  lienzo.addEventListener('pointermove', (e) => {
    const r = lienzo.getBoundingClientRect();
    puntero.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    punteroAdentro = true;
    detectarPendiente = true;
    if (!movimientoReducido.matches && !explorando) {
      balanceoObjetivo.set(puntero.x * 0.35, puntero.y * 0.2);
    }
  });

  lienzo.addEventListener('pointerleave', () => {
    punteroAdentro = false;
    detectarPendiente = false;
    balanceoObjetivo.set(0, 0);
    zonaBajoCursor = null;
    pausaAutomatica = performance.now() + 900;
    if (explorando || zonaActiva !== zonaAutomatica) {
      suavidadHover = 7;
      activarZona(zonaFijada);
    }
  });

  function detectarZona() {
    if(Math.abs(inmersion-inmersionObjetivo)>0.005)return;
    raycaster.setFromCamera(puntero, camara);
    if(!raycaster.ray.intersectPlane(planoDeteccion,puntoBase))return;
    let id=indiceCuadros.get(claveCuadro(puntoBase.x,-puntoBase.z));
    if(relieve>0.01){
      let distanciaMin=Infinity;
      for(let i=0;i<N;i++){
        cajaDeteccion.min.set(C.x[i]-medio,P.zb,-C.y[i]-medio);
        cajaDeteccion.max.set(C.x[i]+medio,tope(i),-C.y[i]+medio);
        if(raycaster.ray.intersectBox(cajaDeteccion,impactoTmp)){
          const d=impactoTmp.distanceToSquared(raycaster.ray.origin);
          if(d<distanciaMin){distanciaMin=d;id=i;}
        }
      }
    }
    let opciones=id===undefined?[]:zonasDe(C.zonas[id]);
    if(!opciones.length){
      const x=puntoBase.x,y=-puntoBase.z;
      opciones=zonas.filter(z=>z.poligonos?.some(p=>dentroAnillo(x,y,p[0])&&!p.slice(1).some(r=>dentroAnillo(x,y,r))));
    }
    opciones.sort((a, b) => a.km2 - b.km2);
    zonaBajoCursor = opciones[0] || null;
    if (!explorando) {
      if (zonaBajoCursor) {
        suavidadHover = 11;
        zonaAutomatica = null;
        pausaAutomatica = performance.now() + 1800;
        activarZona(zonaBajoCursor);
      } else if (zonaActiva && zonaActiva !== zonaAutomatica) {
        suavidadHover = 7;
        pausaAutomatica = performance.now() + 1200;
        activarZona(null);
      }
      lienzo.style.cursor = 'pointer';
      return;
    }
    if (zonaFijada) {
      lienzo.style.cursor = zonaBajoCursor ? 'pointer' : 'default';
      return;
    }
    suavidadHover = 11;
    activarZona(opciones[0] || null);
  }

  function dentroAnillo(x,y,anillo){
    let dentro=false;
    for(let i=0,j=anillo.length-1;i<anillo.length;j=i++){
      const [xi,yi]=anillo[i],[xj,yj]=anillo[j];
      if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)dentro=!dentro;
    }
    return dentro;
  }
  const planoDeteccion=new THREE.Plane(new THREE.Vector3(0,1,0),-P.z0);
  const puntoBase=new THREE.Vector3(), impactoTmp=new THREE.Vector3(), cajaDeteccion=new THREE.Box3();
  const planoAgua = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  let nivelAgua = 0;
  let ultimoToqueAgua = -Infinity;
  const puntoAgua = new THREE.Vector3();

  function tocarAgua(e) {
    const r = lienzo.getBoundingClientRect();
    puntero.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    raycaster.setFromCamera(puntero, camara);
    if (!raycaster.ray.intersectPlane(planoAgua, puntoAgua)) {
      return;
    }
    const x = puntoAgua.x;
    const y = -puntoAgua.z;
    if (indicePorCelda.has(Math.floor(x / P.q) + ':' + Math.floor(y / P.q))) {
      return;
    }
    for (let i = 0; i < N; i++) {
      cajaDeteccion.min.set(C.x[i] - medio, P.zb, -C.y[i] - medio);
      cajaDeteccion.max.set(C.x[i] + medio, tope(i) + elevacion[i], -C.y[i] + medio);
      if (raycaster.ray.intersectBox(cajaDeteccion, impactoTmp)) {
        return;
      }
    }
    const ahora = performance.now();
    nivelAgua = ahora - ultimoToqueAgua < 1400 ? Math.min(nivelAgua + 1, tonosAgua.length - 1) : 0;
    ultimoToqueAgua = ahora;
    sonarAgua(nivelAgua);
    lanzarGota(x, y, nivelAgua);
  }

  botonRelieve.addEventListener('click', () => {
    relieveObjetivo = relieveObjetivo ? 0 : 1;
    botonRelieve.setAttribute('aria-pressed', relieveObjetivo ? 'true' : 'false');
    botonRelieve.firstChild.textContent = 'Relieve ';
    if (zonaFijada) {
      medirZona(zonaFijada);
    }
    animando = true;
  });

  const claveCuadro=(x,y)=>Math.round((x-C.x[0])/P.q)+':'+Math.round((y-C.y[0])/P.q);
  const indiceCuadros = new Map(C.x.map((x, i) => [claveCuadro(x,C.y[i]), i]));
  lienzo.addEventListener('click', (e) => {
    if(!explorando){
      const elegida = zonaBajoCursor;
      if (!elegida) {
        tocarAgua(e);
      }
      cambiarModo(true);
      if (elegida) {
        fijarZona(elegida);
      }
      return;
    }
    const r=lienzo.getBoundingClientRect();
    puntero.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
    detectarZona();
    if (!zonaBajoCursor) {
      tocarAgua(e);
    }
    fijarZona(zonaBajoCursor && zonaBajoCursor !== zonaFijada ? zonaBajoCursor : null);
  });
  const entrar=document.getElementById('entrar-mapa'),salir=document.getElementById('salir-mapa');
  function cambiarModo(valor){
    if(explorando===valor)return;
    explorando=valor;inmersionObjetivo=valor?1:0;
    if(!valor)bosques?.seleccionar(null);
    document.body.classList.toggle('en-mapa',valor);
    window.dispatchEvent(new CustomEvent('musuq:modo',{detail:{explorando:valor}}));
    document.getElementById('header').inert=valor;
    document.getElementById('presentacion').inert=valor;
    document.querySelectorAll('.inmersivo').forEach(el=>el.inert=!valor);
    balanceoObjetivo.set(0,0);balanceo.set(0,0);
    punteroAdentro=false;detectarPendiente=false;
    if(valor){zonaAutomatica=null;suavidadHover=11;activarZona(null);window.scrollTo({top:0,behavior:'instant'});salir.focus({preventScroll:true});}
    else{zonaFijada=null;zonaBajoCursor=null;pausaAutomatica=performance.now()+1200;suavidadHover=7;activarZona(null);document.getElementById('liberar-zona').hidden=true;entrar.focus({preventScroll:true});}
  }
  entrar.addEventListener('click',()=>cambiarModo(true));
  salir.addEventListener('click',()=>cambiarModo(false));
  document.getElementById('liberar-zona').addEventListener('click',()=>fijarZona(null));
  document.getElementById('boton-fronteras').addEventListener('click',e=>{mostrarFronteras=!mostrarFronteras;e.currentTarget.setAttribute('aria-pressed',String(mostrarFronteras));});
  botonRelieve.setAttribute('aria-pressed', 'true');
  document.getElementById('boton-fronteras').setAttribute('aria-pressed', 'true');
  const normalizar=t=>t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  document.getElementById('buscar-pueblo').addEventListener('input',e=>{
    const q=normalizar(e.target.value);let visibles=0;
    for(const li of listaPueblos.children){li.hidden=!normalizar(li.textContent).includes(q);if(!li.hidden)visibles++;}
    document.getElementById('cantidad-pueblos').textContent=visibles;
    document.getElementById('sin-resultados').hidden=!!visibles;
  });
  let esperaRueda = 0;
  window.addEventListener('wheel',e=>{
    if(document.querySelector('dialog[open]'))return;
    if(!explorando||e.target.closest('#selector,#mapa-panel')||Math.abs(e.deltaY)<4)return;
    e.preventDefault();
    const ahora = performance.now();
    if (ahora < esperaRueda) {
      esperaRueda = ahora + 350;
      return;
    }
    if (zonaFijada) {
      fijarZona(null);
      esperaRueda = ahora + 900;
      return;
    }
    cambiarModo(false);
  },{passive:false});
  window.addEventListener('scroll',()=>{if(explorando&&window.scrollY>12)cambiarModo(false);},{passive:true});
  let inicioTacto=null;
  lienzo.addEventListener('touchstart',e=>{inicioTacto=e.touches[0].clientY;},{passive:true});
  lienzo.addEventListener('touchmove',e=>{if(explorando&&inicioTacto!==null&&Math.abs(e.touches[0].clientY-inicioTacto)>45){if(zonaFijada)fijarZona(null);else cambiarModo(false);inicioTacto=null;}},{passive:true});
  document.addEventListener('keydown', (e) => {
    if(document.querySelector('dialog[open]'))return;
    if (e.key === 'Escape') {
      if (explorando && zonaFijada) {
        fijarZona(null);
      } else {
        cambiarModo(false);
      }
    }else if(explorando && ['PageDown','PageUp'].includes(e.key) && !e.target.closest('#selector')){
      cambiarModo(false);
    }
  });

  actualizarCuadros();
  actualizarRios();

  window.addEventListener('musuq:seleccionar', e => {
    const zona=zonas.find(z=>z.id===e.detail.id);
    if(!zona)return;
    cambiarModo(true);fijarZona(zona);
  });
  window.addEventListener('musuq:accesibilidad', () => {
    matCuadro.uniforms.modoAccesible.value=window.MUSUQ_A11Y?.estado.color==='daltonismo'?1:0;
    for(let i=0;i<N;i++){
      const zona=zonasPorArea.find(z=>C.zonas[i]&(1<<z.id));
      if(zona)colorTmp.set(colorDeZona(zona)).toArray(coloresPista,i*3);
      if(zonaActiva&&(C.zonas[i]&(1<<zonaActiva.id)))colorTmp.set(colorDeZona(zonaActiva)).toArray(coloresActivos,i*3);
    }
    geoCuadro.attributes.colorPista.needsUpdate=true;atributoColorActivo.needsUpdate=true;
    for(const b of listaPueblos.querySelectorAll('button'))b.style.setProperty('--zona-color',colorDeZona(zonas.find(z=>z.id===Number(b.dataset.zona))));
    if(zonaActiva)panel.style.setProperty('--zona-color',colorDeZona(zonaActiva));
  });

  const inicio = performance.now();
  let anterior = inicio;
  let objetivoAnterior = 0;
  let rafaga = 0;

  function cuadroAnimacion(ahora) {
    const dt = Math.min(0.05, (ahora - anterior) / 1000);
    anterior = ahora;
    const instantaneo = movimientoReducido.matches;
    const kHover = instantaneo ? 1 : 1 - Math.exp(-dt * suavidadHover);
    const kRelieve = instantaneo ? 1 : 1 - Math.exp(-dt * 3.5);
    const diferenciaModo=inmersionObjetivo-inmersion;
    if(Math.abs(diferenciaModo)>0.0005){
      inmersion+=diferenciaModo*(instantaneo?1:1-Math.exp(-dt*7));
      if(punteroAdentro)detectarPendiente=true;
    }else inmersion=inmersionObjetivo;

    const acercamientoObjetivo = explorando && zonaFijada ? 1 : 0;
    if (acercamientoObjetivo < objetivoAnterior && acercamiento > 0.05) {
      sonarAlejamiento();
    }
    objetivoAnterior = acercamientoObjetivo;
    if (acercamiento !== acercamientoObjetivo) {
      const pasoAcercamiento = instantaneo ? 1 : dt / 1.05;
      acercamiento = acercamiento < acercamientoObjetivo
        ? Math.min(acercamientoObjetivo, acercamiento + pasoAcercamiento)
        : Math.max(acercamientoObjetivo, acercamiento - pasoAcercamiento);
      if (punteroAdentro) detectarPendiente = true;
    }
    enfoque = acercamiento * acercamiento * acercamiento * (acercamiento * (acercamiento * 6 - 15) + 10);
    const rafagaObjetivo = !instantaneo && acercamientoObjetivo === 1 && acercamiento < 1 ? Math.pow(Math.sin(Math.PI * acercamiento), 1.5) : 0;
    rafaga += (rafagaObjetivo - rafaga) * (instantaneo ? 1 : 1 - Math.exp(-dt * 14));
    if (rafaga < 0.001) rafaga = 0;
    const kZona = instantaneo || acercamiento < 0.02 ? 1 : 1 - Math.exp(-dt * 4.5);
    for (const clave in limitesZona) {
      limitesZona[clave] += (limitesZonaObjetivo[clave] - limitesZona[clave]) * kZona;
    }

    if (!explorando && !instantaneo && !zonaBajoCursor && ordenAutomatico.length && ahora > pausaAutomatica && ahora >= proximoPaso) {
      suavidadHover = 3.8;
      if (zonaAutomatica) {
        zonaAutomatica = null;
        activarZona(null);
        proximoPaso = ahora + 550;
      } else {
        zonaAutomatica = ordenAutomatico[indiceAutomatico % ordenAutomatico.length];
        indiceAutomatico++;
        activarZona(zonaAutomatica);
        proximoPaso = ahora + 2300;
      }
    }

    let cambia = false;
    if(instantaneo){
      if(zonaAutomatica){zonaAutomatica=null;activarZona(zonaFijada||zonaBajoCursor);}
      if(ondaInicio>=0||anillosAgua.length||gotasMini.length){
        ondaInicio=-1;anillosAgua.length=0;gotasMini.length=0;onda.fill(0);
        matAgua.uniforms.ondaFuerza.value=0;matAgua.uniforms.gotas.value.forEach(v=>v.set(0,0,-1,1));
        mallaParticulas.visible=false;mallaPolvo.visible=false;mallaGotas.visible=false;cambia=true;
      }
    }
    if (ondaInicio >= 0 && ahora >= ondaInicio) {
      const s = (ahora - ondaInicio) / 1000;
      if (s >= ondaFin) {
        ondaInicio = -1;
        onda.fill(0);
        matAgua.uniforms.ondaFuerza.value = 0;
        mallaParticulas.visible = false;
        mallaPolvo.visible = false;
      } else {
        calcularOnda(s);
        actualizarParticulas(s);
        mallaParticulas.visible = particulas.length > 0;
        mallaPolvo.visible = polvos.length > 0;
      }
      cambia = true;
    }

    if (anillosAgua.length || gotasMini.length) {
      actualizarGotas(ahora);
    }

    if (animando) {
      let mueve = false;
      const dr = relieveObjetivo - relieve;
      if (Math.abs(dr) > 0.0005) {
        relieve += dr * kRelieve;
        mueve = true;
      } else if (dr !== 0) {
        relieve = relieveObjetivo;
        mueve = true;
      }
      for (let i = 0; i < N; i++) {
        const de = elevacionObjetivo[i] - elevacion[i];
        if (Math.abs(de) > 0.0005) {
          elevacion[i] += de * kHover;
          mueve = true;
        } else if (de !== 0) {
          elevacion[i] = elevacionObjetivo[i];
          mueve = true;
        }
      }
      if (mueve) {
        cambia = true;
      } else {
        animando = false;
      }
    }
    if (cambia) {
      actualizarCuadros();
      actualizarRios();
    }

    if (detectarPendiente && punteroAdentro) {
      detectarPendiente = false;
      detectarZona();
    }

    balanceo.lerp(balanceoObjetivo, instantaneo ? 1 : 1 - Math.exp(-dt * 2.5));
    bosques?.actualizar(dt,instantaneo,camara);
    ubicarCamara();
    const tiempo = instantaneo ? 0 : (ahora - inicio) / 1000;
    matAgua.uniforms.tiempo.value = tiempo;
    matAgua.uniforms.inmersion.value = inmersion;
    matAgua.uniforms.enfoque.value = enfoque;
    matCuadro.uniforms.enfoque.value = enfoque;
    matCuadro.uniforms.pulsoInvitacion.value = instantaneo
      ? 0.105
      : 0.042 + 0.189 * (0.5 - 0.5 * Math.cos(tiempo * Math.PI * 2 / 4.2));
    matCuadro.uniforms.tiempoInvitacion.value = tiempo;
    matCuadro.uniforms.animarInvitacion.value = instantaneo ? 0 : 1;
    matRio.uniforms.enfoque.value = enfoque;
    matFoco.uniforms.fuerza.value = enfoque;
    matFoco.uniforms.rafaga.value = rafaga;
    matNiebla.uniforms.tiempo.value = tiempo;
    matNiebla.uniforms.movimiento.value = instantaneo ? 0 : 1;
    matNiebla.uniforms.presencia.value = 1 - enfoque;

    const conFoco = enfoque > 0.001 || rafaga > 0.001;
    renderer.setRenderTarget(conFoco ? objetivoFoco : null);
    renderer.clear();
    renderer.render(escenaAgua, camara);
    renderer.render(escena, camara);
    matNiebla.colorWrite = false;
    matNiebla.depthWrite = true;
    renderer.render(escenaNiebla, camara);
    matNiebla.colorWrite = true;
    matNiebla.depthWrite = false;
    renderer.render(escenaNiebla, camara);
    renderer.clearDepth();
    if(mostrarFronteras)renderer.render(escenaFronteras, camara);
    if (conFoco) {
      renderer.setRenderTarget(null);
      renderer.clear();
      renderer.render(escenaFoco, camaraFoco);
    }
    requestAnimationFrame(cuadroAnimacion);
  }

  requestAnimationFrame(cuadroAnimacion);
})();
