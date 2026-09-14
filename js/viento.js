(function () {
  'use strict';
  const T = window.THREE;
  const SEGMENTOS = 36;

  const vertexShader = `
    uniform float tiempo;
    uniform vec3 rumbo;
    uniform vec2 resolucion;
    uniform float ancho;
    uniform float alzada;
    attribute float u;
    attribute float lado;
    attribute vec3 origen;
    attribute vec4 forma;
    attribute vec3 vida;
    varying float vAlfa;
    vec3 camino(float t) {
      vec3 lateral = normalize(vec3(-rumbo.z, 0.0, rumbo.x));
      float largo = forma.x;
      float onda = sin(t * 3.2 + forma.z) * forma.y + forma.w * t * t * t * 2.4;
      return origen + rumbo * largo * t + lateral * onda * largo * 0.16 + vec3(0.0, sin(t * 3.14159) * alzada * largo, 0.0);
    }
    void main() {
      float p = clamp((tiempo - vida.x) / vida.y, 0.0, 1.0);
      float cabeza = p * 1.5;
      float cola = cabeza - 0.55;
      float a = smoothstep(cola, cola + 0.25, u) * (1.0 - smoothstep(cabeza - 0.14, cabeza, u));
      a *= smoothstep(0.0, 0.06, p) * (1.0 - smoothstep(0.88, 1.0, p));
      vec4 c0 = projectionMatrix * viewMatrix * vec4(camino(u), 1.0);
      vec4 c1 = projectionMatrix * viewMatrix * vec4(camino(u + 0.02), 1.0);
      if (c0.w <= 0.0001 || c1.w <= 0.0001) {
        a = 0.0;
      }
      vec2 s0 = c0.xy / max(c0.w, 0.0001) * resolucion;
      vec2 s1 = c1.xy / max(c1.w, 0.0001) * resolucion;
      vec2 d = s1 - s0;
      d = length(d) > 0.00001 ? normalize(d) : vec2(1.0, 0.0);
      float grosor = ancho * (0.3 + 0.7 * a) * (0.55 + 0.45 * vida.z);
      c0.xy += vec2(-d.y, d.x) * lado * grosor * c0.w / resolucion;
      vAlfa = a * vida.z;
      gl_Position = c0;
    }
  `;

  const fragmentShader = `
    uniform float opacidad;
    varying float vAlfa;
    void main() {
      if (vAlfa < 0.01) discard;
      gl_FragColor = vec4(1.0, 1.0, 1.0, vAlfa * opacidad);
    }
  `;

  function conjunto(cantidad, rumbo, nombre) {
    const geo = new T.InstancedBufferGeometry();
    const posiciones = [];
    const us = [];
    const lados = [];
    const indices = [];
    for (let k = 0; k <= SEGMENTOS; k++) {
      for (const s of [-1, 1]) {
        posiciones.push(0, 0, 0);
        us.push(k / SEGMENTOS);
        lados.push(s);
      }
    }
    for (let k = 0; k < SEGMENTOS; k++) {
      const a = k * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    geo.setIndex(indices);
    geo.setAttribute('position', new T.Float32BufferAttribute(posiciones, 3));
    geo.setAttribute('u', new T.Float32BufferAttribute(us, 1));
    geo.setAttribute('lado', new T.Float32BufferAttribute(lados, 1));
    const origen = new T.InstancedBufferAttribute(new Float32Array(cantidad * 3), 3);
    const forma = new T.InstancedBufferAttribute(new Float32Array(cantidad * 4), 4);
    const vida = new T.InstancedBufferAttribute(new Float32Array(cantidad * 3).fill(-100), 3);
    for (const atributo of [origen, forma, vida]) {
      atributo.setUsage(T.DynamicDrawUsage);
    }
    geo.setAttribute('origen', origen);
    geo.setAttribute('forma', forma);
    geo.setAttribute('vida', vida);
    geo.instanceCount = cantidad;
    const uniforms = {
      tiempo: { value: 0 },
      rumbo: { value: rumbo },
      resolucion: { value: new T.Vector2(1, 1) },
      ancho: { value: 2 },
      alzada: { value: 0 },
      opacidad: { value: 0 }
    };
    const material = new T.ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: false, depthTest: true, side: T.DoubleSide });
    const malla = new T.Mesh(geo, material);
    malla.frustumCulled = false;
    malla.name = nombre;
    const escena = new T.Scene();
    escena.add(malla);
    for (let i = 0; i < cantidad; i++) {
      vida.setXYZ(i, -100, 1, 0);
    }
    return { escena, origen, forma, vida, uniforms, cantidad, fin: new Float32Array(cantidad) };
  }

  function crear({ rumbo, alturaMapa }) {
    const mapa = conjunto(18, rumbo, 'Ráfagas de viento · mapa');
    const cerca = conjunto(12, rumbo, 'Ráfagas de viento · tercer zoom');
    mapa.uniforms.alzada.value = 0;
    cerca.uniforms.alzada.value = 0.08;
    const cerca0 = new T.Vector3();
    const lejos0 = new T.Vector3();
    const lateral = new T.Vector3();
    const tam = new T.Vector2();
    let reloj = 0;

    function sembrar(c, i, origen, largo, duracion, espera) {
      const signo = Math.random() < 0.5 ? -1 : 1;
      origen.addScaledVector(rumbo, -largo * 0.5);
      c.origen.setXYZ(i, origen.x, origen.y, origen.z);
      c.forma.setXYZW(i, largo, (0.25 + Math.random() * 0.5) * signo, Math.random() * 6.28, (Math.random() < 0.55 ? 1 : 0) * signo * (0.4 + Math.random() * 0.5));
      c.vida.setXYZ(i, reloj + espera, duracion, Math.random() < 0.45 ? 0.2 + Math.random() * 0.2 : 0.72 + Math.random() * 0.28);
      c.fin[i] = reloj + espera + duracion;
      c.origen.needsUpdate = true;
      c.forma.needsUpdate = true;
      c.vida.needsUpdate = true;
    }

    function actualizar({ dt, instantaneo, camaraMapa, cercania, heroe }) {
      if (!instantaneo) {
        reloj += dt;
      }
      mapa.uniforms.tiempo.value = reloj;
      cerca.uniforms.tiempo.value = reloj;
      mapa.uniforms.opacidad.value = instantaneo ? 0 : 0.62 * (1 - T.MathUtils.smoothstep(cercania, 0, 0.35));
      cerca.uniforms.opacidad.value = instantaneo || !heroe ? 0 : 0.92 * T.MathUtils.smoothstep(cercania, 0.6, 1);
      if (mapa.uniforms.opacidad.value > 0.001 && camaraMapa) {
        for (let i = 0; i < mapa.cantidad; i++) {
          if (reloj < mapa.fin[i]) {
            continue;
          }
          const sx = Math.random() * 2.2 - 1.1;
          const sy = Math.random() * 1.8 - 0.9;
          cerca0.set(sx, sy, -1).unproject(camaraMapa);
          lejos0.set(sx, sy, 1).unproject(camaraMapa);
          const t = (alturaMapa - cerca0.y) / ((lejos0.y - cerca0.y) || 1);
          cerca0.lerp(lejos0, t);
          sembrar(mapa, i, cerca0, camaraMapa.top * (0.45 + Math.random() * 0.45), 5.5 + Math.random() * 3, Math.random() * 2.5);
        }
      }
      if (cerca.uniforms.opacidad.value > 0.001) {
        lateral.set(-rumbo.z, 0, rumbo.x);
        for (let i = 0; i < cerca.cantidad; i++) {
          if (reloj < cerca.fin[i]) {
            continue;
          }
          cerca0.copy(heroe.base)
            .addScaledVector(heroe.dir, (Math.random() * 3.2 - 1.2) * heroe.alto)
            .addScaledVector(lateral, (Math.random() * 4 - 2) * heroe.alto);
          cerca0.y = heroe.base.y + heroe.alto * (0.12 + Math.random() * 1.05);
          sembrar(cerca, i, cerca0, heroe.alto * (0.9 + Math.random() * 0.8), 2.1 + Math.random() * 1.3, Math.random() * 1.6);
        }
      }
    }

    function dibujar(c, renderer, camara, grosor) {
      if (c.uniforms.opacidad.value <= 0.001) {
        return;
      }
      renderer.getDrawingBufferSize(tam);
      c.uniforms.resolucion.value.copy(tam);
      c.uniforms.ancho.value = grosor * renderer.getPixelRatio();
      renderer.render(c.escena, camara);
    }

    return {
      actualizar,
      renderMapa: (renderer, camara) => dibujar(mapa, renderer, camara, 2.2),
      renderCerca: (renderer, camara) => dibujar(cerca, renderer, camara, 3.4),
      estado: () => ({ mapa: mapa.uniforms.opacidad.value, cerca: cerca.uniforms.opacidad.value })
    };
  }

  window.MUSUQ_VIENTO = { crear };
})();
