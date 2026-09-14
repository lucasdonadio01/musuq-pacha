(function () {
  'use strict';
  const T = window.THREE;
  const TAMANOS = [0.05, 0.1, 0.17, 0.28];
  const PESOS = [0.45, 0.3, 0.17, 0.08];

  function crear({ escena, escenaHeroe, C, P, suelo, celdaEn, rios, bosques, rumbo }) {
    const F = window.MUSUQ_FORMAS;
    const azar = F.azar;
    const tiempo = { value: 0 };
    const aparicion = { value: 0 };
    const rumboUniforme = { value: rumbo };
    const grupo = new T.Group();
    grupo.name = 'Ambiente · rocas, troncos y pasto';
    escena.add(grupo);
    const matSolido = F.material({ tiempo, rumbo: rumboUniforme, fuerza: 0, aparicion });
    const matPasto = F.material({ tiempo, rumbo: rumboUniforme, fuerza: 0.16, aparicion });
    const matHoja = F.material({ tiempo, rumbo: rumboUniforme, fuerza: 0 });

    function instancias(geo, material, maximo, nombre, destino = grupo) {
      const m = new T.InstancedMesh(geo, material, maximo);
      m.instanceColor = new T.InstancedBufferAttribute(new Float32Array(maximo * 3), 3);
      geo.setAttribute('retraso', new T.InstancedBufferAttribute(new Float32Array(maximo), 1));
      m.instanceMatrix.setUsage(T.DynamicDrawUsage);
      m.count = 0;
      m.frustumCulled = false;
      m.name = nombre;
      destino.add(m);
      return m;
    }

    const rocas = TAMANOS.map((_, k) => instancias(F.roca(11 + k * 7, k < 2 ? 0 : 1), matSolido, 700, 'Rocas low poly · ' + (k + 1)));
    const troncos = instancias(F.tronco(5), matSolido, 40, 'Troncos caídos');
    const pastos = F.tiposPasto.map((tipo, k) => instancias(F.pasto(tipo, 3 + k), matPasto, 1400, 'Pasto low poly · ' + tipo));
    const piezas = [];
    const obj = new T.Object3D();
    const color = new T.Color();
    let zonaActual = null;

    function tramosRio(minX, maxX, minZ, maxZ) {
      const lista = [];
      for (const linea of rios || []) {
        for (let k = 2; k < linea.p.length; k += 2) {
          const ax = linea.p[k - 2];
          const az = -linea.p[k - 1];
          const bx = linea.p[k];
          const bz = -linea.p[k + 1];
          if (Math.max(ax, bx) > minX && Math.min(ax, bx) < maxX && Math.max(az, bz) > minZ && Math.min(az, bz) < maxZ) {
            lista.push([ax, az, bx, bz]);
          }
        }
      }
      return lista;
    }

    function distanciaTramos(tramos, x, z) {
      let menor = Infinity;
      for (const [ax, az, bx, bz] of tramos) {
        const dx = bx - ax;
        const dz = bz - az;
        const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
        menor = Math.min(menor, Math.hypot(x - ax - dx * t, z - az - dz * t));
      }
      return menor;
    }

    function poner(malla, datos) {
      const indice = malla.count;
      if (indice >= malla.instanceMatrix.count) {
        return;
      }
      obj.position.set(datos.x, 0, datos.z);
      obj.rotation.set(datos.inclinacion || 0, datos.giro, 0, 'YXZ');
      obj.scale.set(datos.sx, datos.sy, datos.sz);
      obj.updateMatrix();
      malla.setMatrixAt(indice, obj.matrix);
      color.set(datos.color || '#ffffff').multiplyScalar(datos.brillo || 1);
      malla.setColorAt(indice, color);
      malla.geometry.getAttribute('retraso').setX(indice, datos.retraso);
      malla.count++;
      piezas.push({ malla, indice, i: datos.i, x: datos.x, z: datos.z, hundir: datos.hundir || 0, radio: datos.radio });
    }

    function planificar(zona) {
      piezas.length = 0;
      for (const m of [...rocas, troncos, ...pastos]) {
        m.count = 0;
      }
      const bit = 1 << zona.id;
      const celdas = [];
      let minX = Infinity;
      let maxX = -Infinity;
      let minZ = Infinity;
      let maxZ = -Infinity;
      for (let i = 0; i < C.x.length; i++) {
        if (C.zonas[i] & bit) {
          celdas.push(i);
          minX = Math.min(minX, C.x[i] - P.q);
          maxX = Math.max(maxX, C.x[i] + P.q);
          minZ = Math.min(minZ, -C.y[i] - P.q);
          maxZ = Math.max(maxZ, -C.y[i] + P.q);
        }
      }
      const tramos = tramosRio(minX, maxX, minZ, maxZ);
      const arboles = bosques?.plan ? bosques.plan(zona) : [];
      const libre = (x, z, radio) => {
        const i = celdaEn(x, -z);
        return i !== undefined && (C.zonas[i] & bit) && distanciaTramos(tramos, x, z) > radio + 0.05 && !arboles.some((b) => Math.hypot(b.x - x, b.z - z) < radio + P.q * 0.08) ? i : undefined;
      };
      const roca = (x, z, clase, semilla, retraso) => {
        const radio = TAMANOS[clase] * P.q * (0.8 + azar(semilla) * 0.4);
        const i = libre(x, z, radio);
        if (i === undefined) {
          return;
        }
        poner(rocas[clase], { i, x, z, giro: azar(semilla + 1) * 6.28, sx: radio, sy: radio, sz: radio * (0.8 + azar(semilla + 2) * 0.4), hundir: -radio * 0.18, radio, retraso, brillo: 0.92 + azar(semilla + 3) * 0.14 });
      };
      const mata = (x, z, semilla, retraso) => {
        const alto = P.q * (0.09 + azar(semilla) * 0.07);
        const i = libre(x, z, alto * 0.3);
        if (i === undefined) {
          return;
        }
        const tipo = Math.floor(azar(semilla + 1) * pastos.length);
        const bioma = window.MUSUQ_HABITAT?.bioma(C.x[i], C.y[i]);
        color.set(bioma?.color || '#8fb04a');
        poner(pastos[tipo], { i, x, z, giro: azar(semilla + 2) * 6.28, sx: alto, sy: alto, sz: alto, radio: alto * 0.4, retraso, color: '#' + color.getHexString(), brillo: 1.15 + azar(semilla + 3) * 0.25 });
      };
      const claseAzar = (s) => {
        let r = azar(s);
        for (let k = 0; k < PESOS.length; k++) {
          r -= PESOS[k];
          if (r <= 0) {
            return k;
          }
        }
        return 0;
      };
      const tronco = (x, z, giro, s) => {
        const largo = P.q * (0.42 + azar(s) * 0.18);
        const radio = P.q * (0.05 + azar(s + 1) * 0.02);
        const cosG = Math.cos(giro);
        const sinG = Math.sin(giro);
        const i2 = libre(x, z, largo * 0.5);
        if (i2 === undefined || libre(x + cosG * largo * 0.5, z - sinG * largo * 0.5, radio) === undefined || libre(x - cosG * largo * 0.5, z + sinG * largo * 0.5, radio) === undefined) {
          return;
        }
        poner(troncos, { i: i2, x, z, giro, sx: largo, sy: radio, sz: radio, hundir: radio * 0.75, radio: largo * 0.5, retraso: 1.4 + azar(s + 5) * 0.6, brillo: 0.95 + azar(s + 6) * 0.2 });
        for (const extremo of [-1, 1]) {
          const ex = x + cosG * largo * 0.55 * extremo;
          const ez = z - sinG * largo * 0.55 * extremo;
          roca(ex + (azar(s + 9 + extremo) - 0.5) * radio * 2, ez + (azar(s + 11 + extremo) - 0.5) * radio * 2, extremo > 0 ? 1 : 0, s + 13 + extremo, 1.5);
          mata(ex - sinG * radio * 1.6, ez - cosG * radio * 1.6, s + 16 + extremo, 1.5);
          mata(ex + sinG * radio * 1.8, ez + cosG * radio * 1.8, s + 19 + extremo, 1.55);
        }
      };
      for (const i of celdas) {
        const cx = C.x[i];
        const cz = -C.y[i];
        const s = i * 13 + zona.id * 7;
        if (azar(s) < 0.55) {
          const n = 1 + (azar(s + 1) < 0.3 ? 1 : 0);
          for (let k = 0; k < n; k++) {
            roca(cx + (azar(s + 2 + k) - 0.5) * P.q * 0.8, cz + (azar(s + 5 + k) - 0.5) * P.q * 0.8, claseAzar(s + 8 + k), s + 11 + k, 1.2 + azar(s + 14 + k));
          }
        }
        const matas = 2 + Math.floor(azar(s + 20) * 4);
        for (let k = 0; k < matas; k++) {
          mata(cx + (azar(s + 21 + k * 3) - 0.5) * P.q * 0.9, cz + (azar(s + 22 + k * 3) - 0.5) * P.q * 0.9, s + 23 + k * 3, 1 + azar(s + 24 + k) * 1.2);
        }
        if (azar(s + 40) < 0.05) {
          tronco(cx + (azar(s + 44) - 0.5) * P.q * 0.3, cz + (azar(s + 45) - 0.5) * P.q * 0.3, azar(s + 43) * 6.28, s + 41);
        }
      }
      const porGrupo = new Map();
      for (const b of arboles) {
        const g = porGrupo.get(b.grupo) || { x: 0, z: 0, n: 0, lista: [] };
        g.x += b.x;
        g.z += b.z;
        g.n++;
        g.lista.push(b);
        porGrupo.set(b.grupo, g);
      }
      let semilla = zona.id * 1000;
      for (const g of porGrupo.values()) {
        g.x /= g.n;
        g.z /= g.n;
        const radio = Math.max(...g.lista.map((b) => Math.hypot(b.x - g.x, b.z - g.z) + b.escala * 0.35));
        const cantidad = 3 + Math.floor(azar(semilla) * 3);
        for (let k = 0; k < cantidad; k++) {
          const a = (k / cantidad) * 6.28 + azar(semilla + k) * 0.9;
          const d = radio + P.q * (0.04 + azar(semilla + k + 3) * 0.14);
          roca(g.x + Math.cos(a) * d, g.z + Math.sin(a) * d, 1 + Math.floor(azar(semilla + k + 6) * 3), semilla + k + 9, 1.3 + azar(semilla + k) * 0.5);
          mata(g.x + Math.cos(a + 0.4) * d * 0.95, g.z + Math.sin(a + 0.4) * d * 0.95, semilla + k + 12, 1.2);
        }
        if (azar(semilla + 30) < 0.65) {
          const a = azar(semilla + 31) * 6.28;
          tronco(g.x + Math.cos(a) * (radio + P.q * 0.22), g.z + Math.sin(a) * (radio + P.q * 0.22), a + 1.57 + (azar(semilla + 32) - 0.5), semilla + 33);
        }
        semilla += 37;
      }
      for (const m of [...rocas, troncos, ...pastos]) {
        m.instanceMatrix.needsUpdate = true;
        m.instanceColor.needsUpdate = true;
        m.geometry.getAttribute('retraso').needsUpdate = true;
      }
    }

    const maxHojas = 36;
    const hojas = instancias(F.hoja(), matHoja, maxHojas, 'Hojas cayendo', escenaHeroe);
    hojas.count = maxHojas;
    const estadoHojas = Array.from({ length: maxHojas }, () => ({ espera: Math.random() * 3, edad: 0, x: 0, y: -100, z: 0 }));
    const lateral = new T.Vector3();
    const camPlano = new T.Vector2();
    let heroeClave = '';

    function soltarHoja(h, heroe, espera, camara) {
      const lado = (Math.random() - 0.5) * heroe.ancho * 0.75;
      h.x = heroe.base.x + lateral.x * lado + heroe.dir.x * (Math.random() - 0.5) * heroe.ancho * 0.3;
      h.z = heroe.base.z + lateral.z * lado + heroe.dir.z * (Math.random() - 0.5) * heroe.ancho * 0.3;
      h.y = heroe.base.y + heroe.alto * (0.5 + Math.random() * 0.42);
      h.caida = heroe.alto * (0.05 + Math.random() * 0.045);
      h.deriva = heroe.alto * (0.04 + Math.random() * 0.08) * (Math.random() < 0.75 ? 1 : -0.6);
      h.fase = Math.random() * 6.28;
      h.giro = Math.random() * 6.28;
      h.escala = heroe.alto * (Math.random() < 0.4 ? 0.02 + Math.random() * 0.016 : 0.042 + Math.random() * 0.032);
      h.espera = espera;
      h.edad = 0;
      h.viajera = !!camara && Math.random() < 0.22;
      h.pasada = false;
      h.ox = (Math.random() - 0.5) * heroe.alto * 0.4;
      h.oy = (Math.random() - 0.3) * heroe.alto * 0.18;
      h.rapidez = heroe.alto * (0.38 + Math.random() * 0.22);
      h.vx = 0;
      h.vy = 0;
      h.vz = 0;
    }

    function actualizar({ dt, instantaneo, tiempo: t, zona, heroe, camaraCerca, cercania }) {
      tiempo.value = instantaneo ? 0 : t;
      if (zona !== zonaActual) {
        if (zona) {
          planificar(zona);
          aparicion.value = instantaneo ? 9 : 0;
        }
        zonaActual = zona;
      }
      if (zonaActual) {
        aparicion.value = instantaneo ? 9 : Math.min(9, aparicion.value + dt);
      }
      grupo.visible = !!zonaActual && piezas.length > 0;
      if (grupo.visible) {
        const ocultar = heroe && cercania > 0.2 && camaraCerca;
        if (ocultar) {
          camPlano.set(camaraCerca.position.x, camaraCerca.position.z);
        }
        for (const p of piezas) {
          let y = suelo(p.i) + p.hundir;
          if (ocultar) {
            const dx = heroe.base.x - camPlano.x;
            const dz = heroe.base.z - camPlano.y;
            const largo = dx * dx + dz * dz || 1;
            const k = Math.max(0, Math.min(1, ((p.x - camPlano.x) * dx + (p.z - camPlano.y) * dz) / largo));
            const cercaCamino = Math.hypot(p.x - camPlano.x - dx * k, p.z - camPlano.y - dz * k) < p.radio + heroe.alto * 0.12 && k < 0.92;
            if (cercaCamino || Math.hypot(p.x - camPlano.x, p.z - camPlano.y) < heroe.alto * 0.6) {
              y = -100;
            }
          }
          p.malla.instanceMatrix.array[p.indice * 16 + 13] = y;
        }
        for (const m of [...rocas, troncos, ...pastos]) {
          m.instanceMatrix.needsUpdate = true;
        }
      }
      const visibilidad = heroe ? heroe.visibilidad : 0;
      hojas.visible = visibilidad > 0.01 && !instantaneo;
      if (!hojas.visible) {
        heroeClave = '';
        return;
      }
      lateral.set(-heroe.dir.z, 0, heroe.dir.x);
      const especie = window.MUSUQ_BOSQUES?.especies?.[heroe.grupo.id];
      if (heroeClave !== heroe.grupo.clave) {
        heroeClave = heroe.grupo.clave;
        estadoHojas.forEach((h, k) => {
          soltarHoja(h, heroe, Math.random() * 2.5, camaraCerca);
          color.set(especie?.hoja || '#8fb04a').multiplyScalar(1.05 + Math.random() * 0.35);
          hojas.setColorAt(k, color);
        });
        hojas.instanceColor.needsUpdate = true;
      }
      estadoHojas.forEach((h, k) => {
        let escala = 0;
        if (h.espera > 0) {
          h.espera -= dt;
        } else {
          h.edad += dt;
          const vaiven = Math.sin(h.edad * 1.4 + h.fase);
          if (h.viajera && cercania > 0.95 && camaraCerca) {
            const cam = camaraCerca.position;
            const dx = cam.x + lateral.x * h.ox - h.x;
            const dy = cam.y + h.oy - h.y;
            const dz = cam.z + lateral.z * h.ox - h.z;
            const d = Math.hypot(dx, dy, dz) || 1;
            if (d < heroe.alto * 0.1) {
              h.pasada = true;
            }
            if (!h.pasada) {
              h.vx = (dx / d) * h.rapidez;
              h.vy = (dy / d) * h.rapidez;
              h.vz = (dz / d) * h.rapidez;
            }
            h.x += (h.vx + lateral.x * vaiven * heroe.alto * 0.05) * dt;
            h.y += (h.vy + Math.cos(h.edad * 1.1 + h.fase) * heroe.alto * 0.03) * dt;
            h.z += (h.vz + lateral.z * vaiven * heroe.alto * 0.05) * dt;
          } else {
            h.y -= h.caida * dt;
            h.x += (rumbo.x * h.deriva + lateral.x * vaiven * heroe.alto * 0.07) * dt;
            h.z += (rumbo.z * h.deriva + lateral.z * vaiven * heroe.alto * 0.07) * dt;
          }
          const i = celdaEn(h.x, -h.z);
          const piso = i === undefined ? heroe.base.y : suelo(i);
          escala = h.escala * Math.min(1, h.edad / 0.6) * Math.min(1, (h.y - piso) / (heroe.alto * 0.04)) * visibilidad;
          if (h.y <= piso) {
            soltarHoja(h, heroe, Math.random() * 1.5, camaraCerca);
            escala = 0;
          } else if (h.viajera && camaraCerca && (h.edad > 14 || (h.x - camaraCerca.position.x) * (heroe.base.x - camaraCerca.position.x) + (h.z - camaraCerca.position.z) * (heroe.base.z - camaraCerca.position.z) < -heroe.alto * heroe.alto * 0.1)) {
            soltarHoja(h, heroe, Math.random() * 2, camaraCerca);
            escala = 0;
          }
        }
        obj.position.set(h.x, h.y, h.z);
        obj.rotation.set(Math.sin(h.edad * 2.1 + h.fase) * 0.9, h.giro + h.edad * 0.7, Math.cos(h.edad * 1.7 + h.fase) * 0.8, 'YXZ');
        obj.scale.setScalar(Math.max(0.0001, escala));
        obj.updateMatrix();
        hojas.setMatrixAt(k, obj.matrix);
      });
      hojas.instanceMatrix.needsUpdate = true;
    }

    return {
      actualizar,
      estado: () => ({
        zona: zonaActual?.id || null,
        rocas: rocas.map((m) => m.count),
        troncos: troncos.count,
        pastos: pastos.map((m) => m.count),
        hojas: hojas.visible ? estadoHojas.filter((h) => h.espera <= 0).length : 0,
        aparicion: aparicion.value
      })
    };
  }

  window.MUSUQ_AMBIENTE = { crear };
})();
