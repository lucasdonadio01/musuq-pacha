/* MUSUQ PACHA · Símbolos — la figura del mini juego.
   Es una fachada delgada sobre una instancia de Motor: acá vive solo lo que es
   propio del juego (la geometría del lienzo, la grilla de puntos, la selección
   y las volantas). El patrón, la semilla y el morph están en motor.js, que es
   el mismo que usa cada baldosa de la portada. */

const Simbolo = (() => {
  const figura = Motor.crear(11);
  let pueblo = PUEBLOS[0];
  let generacion = 0;
  let seleccion = new Set(), hover = null;
  let fondo = pueblo.fondo;        // contra que color se decide el contraste
  let paletaGen = pueblo.colores;  // con que colores salio la ultima generacion
  let geo = { celda: 40, x0: 0, y0: 0, W: 0, H: 0 };

  const clave = (x, y) => x + ',' + y;

  /* Rareza inventada pero estable: sale de la semilla, así que un símbolo
     siempre vale lo mismo. La curva está sesgada hacia abajo —la mayoría anda
     por debajo de 30— para que un número alto se sienta un hallazgo. */
  const rareza = () => {
    const r = ((figura.semilla >>> 7) % 100000) / 100000;
    return Math.max(1, Math.round(Math.pow(r, 1.9) * 99));
  };
  const espejadas = (gx, gy, espejo) => {
    const N = figura.lado;
    return espejo && gx !== N - 1 - gx ? [[gx, gy], [N - 1 - gx, gy]] : [[gx, gy]];
  };

  /* En una pantalla angosta el símbolo se lleva mucho más ancho —no hay
     volantas a los costados que lo aprieten— y sube un poco para dejarle
     lugar al pie. */
  function medirGeo(W, H) {
    const N = figura.lado;
    // manda la proporcion: un lienzo cuadrado o vertical lleva las volantas al
    // pie, uno apaisado a los costados. Asi el PNG 9:16 y el 1:1 se componen
    // solos, sin un caso especial por formato.
    const angosto = W / H < 1.15;
    // en un formato muy vertical (la historia 9:16) el simbolo se lleva mas
    // ancho: con el 66 % quedaba nadando en el alto del cuadro
    const anchoUtil = W / H < 0.8 ? 0.80 : 0.66;
    const celda = Math.min(W * (angosto ? anchoUtil : 0.38), H * (angosto ? 0.56 : 0.66)) / N;
    const sube = angosto ? H * 0.07 : 0;
    geo = { celda, x0: W / 2 - N * celda / 2, y0: H / 2 - N * celda / 2 - sube, W, H, angosto };
    return geo;
  }

  function envolver(ctx, texto, ancho) {
    const lineas = [];
    let linea = '';
    for (const palabra of texto.split(' ')) {
      const prueba = linea ? linea + ' ' + palabra : palabra;
      if (ctx.measureText(prueba).width > ancho && linea) { lineas.push(linea); linea = palabra; }
      else linea = prueba;
    }
    if (linea) lineas.push(linea);
    return lineas;
  }

  /* Dibuja la composición entera: la misma función sirve para la pantalla y
     para el PNG, así lo que ves es exactamente lo que baja. */
  function componer(ctx, W, H, ahora, opc) {
    const o = opc || {};
    const g = medirGeo(W, H);
    const tinta = o.tinta || '#1B1A19';
    const t = Motor.aRgb(tinta);

    if (o.fondo) { ctx.fillStyle = o.fondo; ctx.fillRect(0, 0, W, H); }

    // 1. la grilla de puntos: el campo de pixeles posibles
    if (o.puntos !== false) {
      ctx.fillStyle = 'rgba(' + t.join(',') + ',0.17)';
      const r = Math.max(0.9, g.celda * 0.028);
      const dx = ((g.x0 + g.celda / 2) % g.celda + g.celda) % g.celda;
      const dy = ((g.y0 + g.celda / 2) % g.celda + g.celda) % g.celda;
      for (let x = dx; x < W; x += g.celda) {
        for (let y = dy; y < H; y += g.celda) {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, 6.2832);
          ctx.fill();
        }
      }
    }

    // 2. los pixeles del simbolo
    const animando = figura.dibujar(ctx, g.x0, g.y0, g.celda, ahora, { sombra: true });

    // 3. seleccion y cursor, solo en pantalla
    if (o.interfaz) {
      ctx.lineWidth = Math.max(1.5, g.celda * 0.05);
      ctx.strokeStyle = tinta;
      for (const k of seleccion) {
        const [x, y] = k.split(',').map(Number);
        ctx.strokeRect(g.x0 + x * g.celda + 2, g.y0 + y * g.celda + 2, g.celda - 4, g.celda - 4);
      }
      if (hover) {
        ctx.strokeStyle = 'rgba(' + t.join(',') + ',0.34)';
        ctx.lineWidth = 1;
        ctx.strokeRect(g.x0 + hover[0] * g.celda + 0.5, g.y0 + hover[1] * g.celda + 0.5, g.celda - 1, g.celda - 1);
      }
    }

    // 4. las volantas, como en las referencias. En pantalla angosta no entran
    //    a los costados sin comerse el símbolo, así que van al pie en una línea.
    if (o.textos !== false && g.angosto) {
      const cuerpo = Math.max(11, W * 0.033);
      const base = g.y0 + figura.lado * g.celda + cuerpo * 2.4;
      ctx.fillStyle = tinta;
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'center';
      ctx.font = '500 ' + cuerpo + 'px "Space Grotesk", system-ui, sans-serif';
      ctx.fillText(pueblo.nombre + ' · ' + pueblo.region, W / 2, base);
      ctx.globalAlpha = 0.6;
      ctx.font = '300 ' + cuerpo * 0.86 + 'px "Space Grotesk", system-ui, sans-serif';
      ctx.fillText('rareza ' + rareza() + ' % · semilla ' + figura.firmaSemilla,
                   W / 2, base + cuerpo * 1.5);
      ctx.globalAlpha = 1;
    } else if (o.textos !== false) {
      const cuerpo = Math.max(11, W * 0.0145);
      const salto = cuerpo * 1.5;
      ctx.fillStyle = tinta;
      ctx.textBaseline = 'alphabetic';

      ctx.textAlign = 'left';
      const izq = [
        [pueblo.nombre, '500', 1],
        [pueblo.region, '300', 0.6],
        ['rareza ' + rareza() + ' %', '300', 0.6],
        ['semilla ' + figura.firmaSemilla, '300', 0.6]
      ];
      const arranque = H / 2 - ((izq.length - 1) * salto) / 2;
      izq.forEach(([texto, peso, alfa], i) => {
        ctx.font = peso + ' ' + cuerpo + 'px "Space Grotesk", system-ui, sans-serif';
        ctx.globalAlpha = alfa;
        ctx.fillText(texto, W * 0.06, arranque + i * salto);
      });
      ctx.globalAlpha = 1;

      ctx.textAlign = 'right';
      ctx.font = '300 ' + cuerpo + 'px "Space Grotesk", system-ui, sans-serif';
      const nombres = paletaGen.concat(pueblo.colores);
      const usados = [...new Set(figura.grilla.values())]
        .map(h => (nombres.find(c => c.h.toLowerCase() === h.toLowerCase()) || {}).n || h)
        .slice(0, 6);
      const texto = pueblo.nota + ': ' + (usados.join(', ') || 'lienzo vacío');
      const lineas = envolver(ctx, texto, W * 0.21);
      const inicio = H / 2 - ((lineas.length - 1) * salto) / 2;
      lineas.forEach((l, i) => ctx.fillText(l, W * 0.94, inicio + i * salto));
    }

    // 5. el pie de marca va solo en la imagen que se descarga
    if (o.pie) {
      const cuerpo = Math.max(12, W * 0.026);
      ctx.fillStyle = tinta;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.font = '500 ' + cuerpo + 'px "Space Grotesk", system-ui, sans-serif';
      ctx.letterSpacing = '0.16em';                 // lo ignora quien no lo soporte
      ctx.fillText('MUSUQ PACHA', W / 2, H - cuerpo * 2.6);
      ctx.letterSpacing = '0px';
      ctx.globalAlpha = 0.55;
      ctx.font = '300 ' + cuerpo * 0.78 + 'px "Space Grotesk", system-ui, sans-serif';
      ctx.fillText(o.pie, W / 2, H - cuerpo * 1.1);
      ctx.globalAlpha = 1;
    }

    return animando;
  }

  function celdaEn(px, py) {
    const gx = Math.floor((px - geo.x0) / geo.celda);
    const gy = Math.floor((py - geo.y0) / geo.celda);
    return (gx >= 0 && gy >= 0 && gx < figura.lado && gy < figura.lado) ? [gx, gy] : null;
  }

  return {
    componer, celdaEn,
    generar(ahora, sem) {
      generacion++;
      // la semilla se resuelve acá y no adentro del motor, así el acento y la
      // rareza salen de ella: una misma semilla da siempre el mismo símbolo
      const semilla = sem == null ? (Math.random() * 0xFFFFFFFF) >>> 0 : sem >>> 0;
      // los colores se eligen contra el fondo, no a ciegas: si no contrastan,
      // el símbolo se pierde por más que sean los del pueblo
      const extras = (semilla % 100) < 28 && typeof ACENTO !== 'undefined' ? [ACENTO] : [];
      paletaGen = Motor.paletaContra(pueblo.colores, fondo, 5, extras);
      figura.generar(ahora, semilla, paletaGen);
    },
    limpiar(ahora) { figura.limpiar(ahora); seleccion.clear(); },
    pintar(gx, gy, hex, espejo) { figura.pintar(gx, gy, hex, espejo); },
    borrar(gx, gy, espejo) { figura.borrar(gx, gy, espejo).forEach(k => seleccion.delete(k)); },
    recolorear(hex) {
      for (const k of [...seleccion]) {
        const [x, y] = k.split(',').map(Number);
        if (figura.grilla.has(k)) figura.pintar(x, y, hex, false);
      }
    },
    alternarSeleccion(gx, gy, espejo) {
      for (const [x, y] of espejadas(gx, gy, espejo)) {
        const k = clave(x, y);
        if (!figura.grilla.has(k)) continue;
        seleccion.has(k) ? seleccion.delete(k) : seleccion.add(k);
      }
    },
    seleccionar(gx, gy, espejo) {
      for (const [x, y] of espejadas(gx, gy, espejo)) {
        if (figura.grilla.has(clave(x, y))) seleccion.add(clave(x, y));
      }
    },
    aRgb: Motor.aRgb, aHex: Motor.aHex, oscurecer: Motor.oscurecer,
    get lado() { return figura.lado; },
    set lado(v) { figura.lado = v; seleccion.clear(); },
    get pueblo() { return pueblo; },
    set pueblo(p) { pueblo = p; },
    set fondo(h) { fondo = h; },
    get generacion() { return generacion; },
    get grilla() { return figura.grilla; },
    get seleccion() { return seleccion; },
    get semilla() { return figura.semilla; },
    get firmaSemilla() { return figura.firmaSemilla; },
    get familia() { return figura.familia; },
    get geo() { return geo; },
    get hover() { return hover; },
    set hover(h) { hover = h; },
    set quieto(q) { figura.quieto = q; }
  };
})();
