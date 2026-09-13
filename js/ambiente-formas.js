(function () {
  'use strict';
  const T = window.THREE;
  const azar = (n) => {
    const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  const colorTmp = new T.Color();
  const v0 = new T.Vector3();
  const v1 = new T.Vector3();
  const v2 = new T.Vector3();

  function cerrar(pos, col, alturas) {
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    geo.setAttribute('altura', new T.Float32BufferAttribute(alturas || new Array(pos.length / 3).fill(0), 1));
    geo.computeVertexNormals();
    return geo;
  }

  function triangulo(pos, col, alturas, a, b, c, color, ha = 0, hb = 0, hc = 0) {
    pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    for (let k = 0; k < 3; k++) {
      col.push(color.r, color.g, color.b);
    }
    alturas.push(ha, hb, hc);
  }

  function normalCara(a, b, c) {
    v0.fromArray(a);
    v1.fromArray(b).sub(v0);
    v2.fromArray(c).sub(v0);
    return v1.cross(v2).normalize();
  }

  function roca(semilla, detalle) {
    const base = new T.IcosahedronGeometry(1, detalle);
    const origen = base.getAttribute('position');
    const desvio = new Map();
    const tonos = ['#bdb6bf', '#aeb0ad', '#c7c0bb', '#a3a7aa'];
    const tono = new T.Color(tonos[Math.floor(azar(semilla) * tonos.length)]);
    const pos = [];
    const col = [];
    const alturas = [];
    const punto = (i) => {
      const x = origen.getX(i);
      const y = origen.getY(i);
      const z = origen.getZ(i);
      const clave = x.toFixed(3) + ':' + y.toFixed(3) + ':' + z.toFixed(3);
      if (!desvio.has(clave)) {
        desvio.set(clave, 0.78 + azar(semilla * 13 + desvio.size * 7.3) * 0.38);
      }
      const r = desvio.get(clave);
      return [x * r * 1.15, Math.max(-0.35, y * r * 0.66), z * r];
    };
    for (let i = 0; i < origen.count; i += 3) {
      const a = punto(i);
      const b = punto(i + 1);
      const c = punto(i + 2);
      const n = normalCara(a, b, c);
      colorTmp.copy(tono).multiplyScalar(0.9 + azar(semilla + i * 0.37) * 0.16);
      if (n.y > 0.72 && azar(semilla * 3 + i) < 0.35) {
        colorTmp.set('#79a64a').multiplyScalar(0.9 + azar(i) * 0.15);
      }
      triangulo(pos, col, alturas, a, b, c, colorTmp);
    }
    base.dispose();
    return cerrar(pos, col, alturas);
  }

  function tronco(semilla) {
    const lados = 7;
    const tramos = 3;
    const aros = [];
    for (let j = 0; j <= tramos; j++) {
      const giro = (azar(semilla + j) - 0.5) * 0.3;
      const aro = [];
      for (let k = 0; k < lados; k++) {
        const a = (k / lados) * Math.PI * 2 + giro;
        const r = 1 + (azar(semilla * 7 + j * 11 + k) - 0.5) * 0.18;
        const x = -0.5 + j / tramos;
        aro.push({ fuera: [x, Math.sin(a) * r, Math.cos(a) * r], dentro: [x, Math.sin(a) * r * 0.68, Math.cos(a) * r * 0.68] });
      }
      aros.push(aro);
    }
    const pos = [];
    const col = [];
    const alturas = [];
    const corteza = new T.Color('#9a6440');
    const interior = new T.Color('#6e4329');
    const madera = new T.Color('#d8996a');
    for (let j = 0; j < tramos; j++) {
      for (let k = 0; k < lados; k++) {
        const s = (k + 1) % lados;
        const a = aros[j][k];
        const b = aros[j][s];
        const c = aros[j + 1][s];
        const d = aros[j + 1][k];
        const n = normalCara(a.fuera, b.fuera, c.fuera);
        colorTmp.copy(corteza).multiplyScalar(0.88 + azar(semilla + j * 5 + k) * 0.2);
        if (Math.abs(n.y) > 0.4 && azar(semilla * 5 + j * 3 + k * 2) < 0.45) {
          colorTmp.set('#72b04a').multiplyScalar(0.9 + azar(k + j) * 0.18);
        }
        triangulo(pos, col, alturas, a.fuera, b.fuera, c.fuera, colorTmp);
        triangulo(pos, col, alturas, a.fuera, c.fuera, d.fuera, colorTmp);
        colorTmp.copy(interior).multiplyScalar(0.9 + azar(k) * 0.15);
        triangulo(pos, col, alturas, a.dentro, c.dentro, b.dentro, colorTmp);
        triangulo(pos, col, alturas, a.dentro, d.dentro, c.dentro, colorTmp);
      }
    }
    for (const j of [0, tramos]) {
      for (let k = 0; k < lados; k++) {
        const s = (k + 1) % lados;
        const a = aros[j][k];
        const b = aros[j][s];
        colorTmp.copy(madera).multiplyScalar(0.92 + azar(semilla + k * 3 + j) * 0.12);
        triangulo(pos, col, alturas, a.fuera, a.dentro, b.dentro, colorTmp);
        triangulo(pos, col, alturas, a.fuera, b.dentro, b.fuera, colorTmp);
      }
    }
    return cerrar(pos, col, alturas);
  }

  const TIPOS_PASTO = {
    alto: { hojas: 5, inclinacion: [0.08, 0.3], alto: [0.65, 1], ancho: 0.14, curva: 0.12 },
    abierto: { hojas: 7, inclinacion: [0.9, 1.35], alto: [0.32, 0.52], ancho: 0.16, curva: 0.28 },
    fino: { hojas: 9, inclinacion: [0.02, 0.16], alto: [0.45, 1], ancho: 0.06, curva: 0.04 }
  };

  function pasto(tipo, semilla) {
    const cfg = TIPOS_PASTO[tipo] || TIPOS_PASTO.alto;
    const verdes = ['#86b344', '#a3c85a', '#71a03b'];
    const pos = [];
    const col = [];
    const alturas = [];
    for (let h = 0; h < cfg.hojas; h++) {
      const s = semilla * 31 + h * 17;
      const angulo = (h / cfg.hojas) * Math.PI * 2 + (azar(s) - 0.5) * 0.9;
      const fuera = [Math.cos(angulo), 0, Math.sin(angulo)];
      const lado = [-Math.sin(angulo), 0, Math.cos(angulo)];
      const inclinacion = cfg.inclinacion[0] + azar(s + 1) * (cfg.inclinacion[1] - cfg.inclinacion[0]);
      const alto = cfg.alto[0] + azar(s + 2) * (cfg.alto[1] - cfg.alto[0]);
      const ancho = cfg.ancho * (0.8 + azar(s + 3) * 0.4);
      const radio = 0.06 + azar(s + 4) * 0.1;
      colorTmp.set(verdes[Math.floor(azar(s + 5) * verdes.length)]);
      const tramo = (t) => {
        const avance = radio + inclinacion * alto * t + cfg.curva * alto * t * t;
        const w = ancho * (1 - t) * 0.5;
        const c = [fuera[0] * avance, alto * t * (1 - cfg.curva * 0.35 * t), fuera[2] * avance];
        return {
          izq: [c[0] - lado[0] * w, c[1], c[2] - lado[2] * w],
          der: [c[0] + lado[0] * w, c[1], c[2] + lado[2] * w],
          lomo: [c[0] + fuera[0] * w * 0.5, c[1] + w * 0.2, c[2] + fuera[2] * w * 0.5]
        };
      };
      const pasos = [0, 0.34, 0.68, 1];
      for (let k = 0; k < pasos.length - 1; k++) {
        const a = tramo(pasos[k]);
        const b = tramo(pasos[k + 1]);
        const ta = pasos[k];
        const tb = pasos[k + 1];
        const claro = colorTmp.clone().multiplyScalar(1.08);
        triangulo(pos, col, alturas, a.izq, a.lomo, b.izq, colorTmp, ta, ta, tb);
        triangulo(pos, col, alturas, a.lomo, b.lomo, b.izq, colorTmp, ta, tb, tb);
        triangulo(pos, col, alturas, a.lomo, a.der, b.lomo, claro, ta, ta, tb);
        triangulo(pos, col, alturas, a.der, b.der, b.lomo, claro, ta, tb, tb);
      }
    }
    return cerrar(pos, col, alturas);
  }

  function hoja() {
    const pos = [];
    const col = [];
    const alturas = [];
    const blanco = new T.Color('#ffffff');
    const tono = new T.Color('#e6e6e6');
    const lomo = [[0, 0, 0.05], [0, 0.38, 0.07], [0, 0.72, 0.05], [0, 1, 0]];
    const borde = [[0.2, 0.1, -0.03], [0.38, 0.42, -0.05], [0.28, 0.74, -0.03]];
    for (const s of [1, -1]) {
      const b = borde.map((p) => [p[0] * s, p[1], p[2]]);
      const color = s > 0 ? blanco : tono;
      const tri = (a, c, d) => (s > 0 ? triangulo(pos, col, alturas, a, c, d, color) : triangulo(pos, col, alturas, a, d, c, color));
      tri(lomo[0], b[0], lomo[1]);
      tri(b[0], b[1], lomo[1]);
      tri(lomo[1], b[1], lomo[2]);
      tri(b[1], b[2], lomo[2]);
      tri(lomo[2], b[2], lomo[3]);
    }
    const tallo = new T.Color('#cfcfcf');
    triangulo(pos, col, alturas, [-0.025, -0.22, 0.02], [0.025, -0.22, 0.02], [0.025, 0.02, 0.04], tallo);
    triangulo(pos, col, alturas, [-0.025, -0.22, 0.02], [0.025, 0.02, 0.04], [-0.025, 0.02, 0.04], tallo);
    return cerrar(pos, col, alturas);
  }

  function material({ tiempo, rumbo, fuerza = 0, aparicion = { value: 1 } }) {
    return new T.ShaderMaterial({
      vertexColors: true,
      side: T.DoubleSide,
      uniforms: { tiempo, rumbo, fuerza: { value: fuerza }, aparicion, luz: { value: new T.Vector3(-0.43, 0.743, 0.513).normalize() } },
      vertexShader: `
        uniform float tiempo;
        uniform vec3 rumbo;
        uniform float fuerza;
        uniform float aparicion;
        attribute float altura;
        attribute float retraso;
        varying vec3 vColor;
        varying vec3 vNormal;
        varying float vAltura;
        void main() {
          float crece = clamp((aparicion - retraso) / 0.45, 0.0, 1.0);
          crece = 1.0 - pow(1.0 - crece, 3.0);
          vec4 w = modelMatrix * instanceMatrix * vec4(position * crece, 1.0);
          float escala = length(instanceMatrix[1].xyz);
          float fase = dot(instanceMatrix[3].xz, vec2(3.1, 2.3));
          float vaiven = sin(tiempo * 1.3 + fase) * 0.6 + sin(tiempo * 2.2 + fase * 1.7) * 0.4;
          float empuje = altura * altura * escala * fuerza;
          w.xz += (rumbo.xz * (0.45 + 0.55 * vaiven) + vec2(-rumbo.z, rumbo.x) * vaiven * 0.35) * empuje;
          vColor = color;
          #ifdef USE_INSTANCING_COLOR
            vColor *= instanceColor;
          #endif
          vNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
          vAltura = altura;
          gl_Position = projectionMatrix * viewMatrix * w;
        }
      `,
      fragmentShader: `
        uniform vec3 luz;
        varying vec3 vColor;
        varying vec3 vNormal;
        varying float vAltura;
        void main() {
          vec3 n = normalize(vNormal) * (gl_FrontFacing ? 1.0 : -1.0);
          float l = 0.66 + 0.34 * max(0.0, dot(n, luz));
          gl_FragColor = vec4(vColor * l * mix(0.84, 1.1, vAltura), 1.0);
        }
      `
    });
  }

  window.MUSUQ_FORMAS = { azar, roca, tronco, pasto, hoja, material, tiposPasto: Object.keys(TIPOS_PASTO) };
})();
