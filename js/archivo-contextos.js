/* Introducciones de categoría, independientes de la ficha de cada imagen.
 * Consultadas el 16/09/2026. La memoria comunitaria se atribuye explícitamente;
 * la evidencia de La Noria no se generaliza a todos los querandíes ni épocas. */
(function () {
  'use strict';
  const comunidad = 'https://ffyh.unc.edu.ar/publicaciones/wp-content/uploads/sites/35/2026/03/pueblo-querandi_compressed.pdf';
  const arqueologia = 'https://ri.conicet.gov.ar/handle/11336/121783';
  const fuenteComunitaria = (paginaPDF, paginas) => ({
    nombre: 'Comunidad Telomian Condic / UNC (2025), '+paginas,
    url: comunidad+'#page='+paginaPDF
  });
  const fuenteArqueologica = paginas => ({
    nombre: 'Camino y equipo (2018) · La Noria, '+paginas,
    url: arqueologia
  });
  const contextos = {
    sociedad: {
      contexto: 'En el siglo XVI, las comunidades querandíes tenían jefes locales autónomos y zonas de caza y pesca. La memoria comunitaria también describe la recolección de alimentos y los recorridos por el territorio para encontrarse e intercambiar saberes con otros pueblos.',
      fuentesContexto: [
        {nombre:'FFyL–UBA · Querandí, nota de alcance',url:'https://terminologias.filo.uba.ar/apps/riodelaplatacolonial/?tema=553'},
        fuenteComunitaria(10,'pp. 6–7')
      ]
    },
    creencias: {
      contexto: 'Para la comunidad Telomian Condic, el tala es un árbol sagrado y una referencia de identidad, no solo parte del paisaje. Su cosmovisión relaciona la vida con la tierra, las aguas y el cielo; la ceremonia Troha celebra el nuevo año siguiendo la luna.',
      fuentesContexto: [{nombre:'Gómez, Gorbalán y equipo (2023) · Relato comunitario, sección 3',url:'https://portal.amelica.org/ameli/journal/785/7854257004/movil/'},fuenteComunitaria(17,'p. 13')]
    },
    viviendas: {
      contexto: 'La memoria de Telomian Condic llama quillá o pirí, «paraviento», a las viviendas de sus ancestros. En La Noria, algunas marcas del suelo podrían corresponder a postes de refugios, aunque su forma exacta sigue en estudio.',
      fuentesContexto: [fuenteComunitaria(11,'p. 7'),fuenteArqueologica('pp. 101–102')]
    },
    muerte: {
      contexto: 'La memoria de los antepasados está ligada al territorio. En su relato de 2025, la comunidad Telomian Condic recuerda enterratorios en la zona del kairuz, al sur de Tandil, donde también sitúa encuentros ancestrales para intercambiar saberes y trabajos con otros pueblos.',
      fuentesContexto: [fuenteComunitaria(10,'p. 6')]
    },
    personajes: {
      contexto: 'La comunidad Telomian Condic recuerda a quien le da nombre como un dirigente que reunió a distintas comunidades frente a los españoles. Hoy, las personas mayores, reconocidas por su experiencia, integran un Consejo con especial peso en la organización comunitaria.',
      fuentesContexto: [fuenteComunitaria(5,'p. 1')]
    },
    naturaleza: {
      contexto: 'La memoria comunitaria cuenta que aprovechaban el tala para el fuego, la alimentación y las herramientas, y dispersaban semillas donde faltaban plantas. Hoy recuperan la carpintería querandí: recolectan ramas y las trabajan a mano con piedras, cuchillo y fuego.',
      fuentesContexto: [fuenteComunitaria(10,'pp. 6–7'),fuenteComunitaria(21,'p. 17')]
    },
    fauna: {
      contexto: 'Los animales formaban parte de la alimentación y de los recorridos de caza. En La Noria, el venado de las pampas fue la principal presa identificada; también se aprovecharon guanacos y ñandúes. Esta evidencia explica usos alimentarios, pero no permite atribuirles un carácter sagrado.',
      fuentesContexto: [fuenteArqueologica('pp. 100–103')]
    },
    patrones: {
      contexto: 'Los habitantes prehispánicos de La Noria decoraron parte de sus recipientes con líneas geométricas, incisiones e impresiones, especialmente en los bordes. Estas técnicas permiten comparar tradiciones alfareras de la región, aunque no bastan para conocer el significado de cada motivo.',
      fuentesContexto: [fuenteArqueologica('pp. 96–98 y 103')]
    }
  };
  if (Array.isArray(window.MUSUQ_MESA)) {
    window.MUSUQ_MESA = window.MUSUQ_MESA.map(categoria => Object.assign({},categoria,contextos[categoria.id]||{}));
  }
})();
