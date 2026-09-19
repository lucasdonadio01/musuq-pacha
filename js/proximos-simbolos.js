window.ProximosSimbolos = (() => {
  const C = Composicion, N = C.N;
  const tonos = (tipo, paleta) => { const d = C.find(tipo); return paleta ? d.colores.map((_, n) => paleta[n % paleta.length]) : [...d.colores]; };
  function centro(tipo, paleta) {
    const d = C.find(tipo), i = C.add(tipo, 0, 0, false);
    i.x = (N - d.filas[0].length) >> 1; i.y = (N - d.filas.length) >> 1; i.palette = tonos(tipo, paleta);
  }
  function anillo(tipo, x, y, giro, paleta) {
    const d = C.find(tipo); let w = d.filas[0].length, h = d.filas.length;
    if (giro % 2) [w, h] = [h, w];
    for (let k = 0; k < 4; k++) {
      const i = C.add(tipo, 0, 0, false);
      i.turn = (k + giro) % 4; i.x = x; i.y = y; i.palette = tonos(tipo, paleta);
      [x, y, w, h] = [N - y - h, x, h, w];
    }
  }
  const recetas = [
    ['omaguaca', 'Cruces en rojo', '@luna.trama', '#F2EDE5', 'om-cruce', [['om-guarda', 6, 1], ['om-zigzag', 8, 4], ['om-rombo', 1, 1]]],
    ['querandi', 'Ritmo de cuatro', '@tomi.pixel', '#EEF0E8', 'qu-rombo', [['qu-cruce', 8, 1], ['qu-escalon', 1, 1]]],
    ['qom', 'Bandas del río', '@juli.entrelaza', '#F0E9DD', 'qo-doble', [['qo-bandas', 8, 1], ['qo-modulo', 2, 2]]],
    ['omaguaca', 'Encuentro de rombos', '@mateo.formas', '#231F2A', 'om-rombo', [['om-rombo', 8, 2], ['om-cruce', 2, 2]], ['#F2C57C', '#F66227']],
    ['querandi', 'Camino escalonado', '@cami.crea', '#2B2A28', 'qu-trama', [['qu-bandas', 8, 1], ['qu-escalon', 1, 1]], ['#D8A93F', '#E4E0D2', '#A8B472']],
    ['qom', 'Trama compartida', '@nico.color', '#3F4D4A', 'qo-doble', [['qo-linea', 7, 1], ['qo-linea', 7, 5], ['qo-modulo', 2, 2]], ['#F0E9DD', '#CE796F', '#D3AB65']],
    ['omaguaca', 'Entre guardas', '@ana.modular', '#E9D9B8', 'om-rombo', [['om-espiga', 9, 1], ['om-cruce', 2, 2]], ['#9C2447', '#F2EDE5']],
    ['querandi', 'Líneas que se cruzan', '@fede.cuadros', '#DCE3C9', 'qu-cruce', [['qu-trama', 8, 2], ['qu-cruce', 2, 2]]],
    ['qom', 'Punto de encuentro', '@sol.tejida', '#E7D3B0', 'qo-doble', [['qo-linea', 7, 2], ['qo-escalon', 1, 1]]],
    ['omaguaca', 'Módulos en ronda', '@vale.mosaico', '#F66227', 'om-cruce', [['om-zigzag', 8, 5], ['om-banda', 7, 1], ['om-rombo', 2, 2]], ['#1A1A1A', '#F2EDE5']],
    ['querandi', 'Paso a paso', '@emma.dibuja', '#9E6FF8', 'qu-trama', [['qu-rombo', 7, 0], ['qu-escalon', 1, 1]], ['#1A1A1A', '#E4FE44']],
    ['qom', 'Bandas abiertas', '@mora.combina', '#E4FE44', 'qo-doble', [['qo-bandas', 8, 0], ['qo-escalon', 2, 2, 1]], ['#1A1A1A', '#7542BD', '#F66227']]
  ];
  const ranking = [
    ['querandi', 'Estrella de la llanura', '@pampa.viva', '#252331', 'qu-rombo', [['qu-trama', 8, 0], ['qu-cruce', 1, 1]], ['#E4FE44', '#F66227', '#EEF0E8']],
    ['qom', 'Corriente', '@rio.abierto', '#F0E9DD', 'qo-doble', [['qo-linea', 7, 4], ['qo-escalon', 1, 1, 1], ['qo-doble', 8, 0]]],
    ['omaguaca', 'Guarda del norte', '@trama.norte', '#8E2140', 'om-rombo', [['om-guarda', 6, 0], ['om-cruce', 1, 1], ['om-zigzag', 8, 4]], ['#F2EDE5', '#E3A857']],
    ['querandi', 'Rombos del sur', '@sur.creativo', '#DCE3C9', 'qu-cruce', [['qu-rombo', 7, 0], ['qu-trama', 1, 1]]],
    ['omaguaca', 'Raíz', '@raiz.andina', '#231F2A', 'om-cruce', [['om-espiga', 9, 1], ['om-rombo', 2, 2]], ['#F2C57C', '#9E6FF8']]
  ];
  const armar = ([id, nombre, autor, fondo, medio, anillos, paleta]) => {
    const pueblo = Patrones.pueblos.find(p => p.id === id);
    C.clear(); centro(medio, paleta);
    anillos.forEach(([tipo, x, y, giro = 0]) => anillo(tipo, x, y, giro, paleta));
    return {v:1, nombre, autor, pueblo:pueblo.nombre, region:pueblo.region, lado:N, fondo,
      celdas:[...C.compose()].map(([k, h]) => [...k.split(',').map(Number), h])};
  };
  const lista = recetas.map(armar);
  window.RankingSimbolos = ranking.map(armar);
  C.clear();
  return lista;
})();
