/* Imágenes verificadas para la mesa documental. Cargar después de
 * archivo-coleccion.js y en lugar de archivo-documentos-comunitarios.js.
 * No incluye páginas de texto ni imágenes generadas por IA. */
(function () {
  'use strict';
  const base = 'assets/archivo/objetos/';
  const commons = 'https://commons.wikimedia.org/wiki/File:';
  const comunidad = 'https://ffyh.unc.edu.ar/publicaciones/wp-content/uploads/sites/35/2026/03/pueblo-querandi_compressed.pdf';
  const laNoria = 'https://buenosaires.gob.ar/gcaba_historico/cultura/patrimonio-de-la-ciudad/espacio-la-noria';
  const objetos = [
    {
      categoria: 'creencias', id: 'QUo001',
      titulo: 'La luna · Los ciclos de la Troha',
      imagen: base + 'CRE-luna-llena.jpg',
      descripcion: 'La comunidad celebra la Troha en la costanera del Río de la Plata para recibir un nuevo año. La luna organiza ese calendario y se relaciona con las aguas y la vida. Esta fotografía permite observar el astro al que refiere el relato.',
      limite: 'Referencia astronómica contemporánea. No muestra una ceremonia querandí, la luna roja de noviembre ni el cielo registrado desde territorio querandí. La relación cultural procede del relato comunitario citado, no de la fotografía.',
      fuente: commons + 'FullMoon2010.jpg',
      fuenteRelacion: comunidad + '#page=17',
      credito: 'Gregory H. Revera · Madison, Alabama, 22/10/2010 · Wikimedia Commons · Versión reducida, sin recorte local.',
      licencia: 'CC BY-SA 3.0', licenciaURL: 'https://creativecommons.org/licenses/by-sa/3.0/',
      fecha: '2010', atribucion: 'Referencia astronómica contemporánea',
      contexto: 'La observación de la luna, presentada junto a la explicación comunitaria de sus ciclos.'
    },
    {
      categoria: 'viviendas', id: 'QUo002',
      titulo: 'Carendies · Escena de 1599',
      imagen: base + 'VIV-carendies-1599.jpg',
      descripcion: 'Grabado publicado en la edición de 1599 de las crónicas del viaje de Ulrich Schmidl. La escena titulada «Carendies» incluye construcciones agrupadas en el margen superior izquierdo.',
      limite: 'Ilustración colonial publicada, vinculada a Querandí por la descripción de la fuente. Su perspectiva europea y sus convenciones gráficas no permiten tomar las construcciones como una reconstrucción arqueológica exacta de las viviendas querandíes.',
      fuente: commons + 'Carendies_(Querand%C3%AD).jpg',
      credito: 'Crónicas de Ulrich Schmidl · Edición de 1599 · Wikimedia Commons. Recorte de los márgenes de la reproducción.',
      licencia: 'Dominio público · Public Domain Mark 1.0',
      licenciaURL: 'https://creativecommons.org/publicdomain/mark/1.0/',
      fecha: '1599', atribucion: 'Ilustración histórica · Mirada colonial',
      contexto: 'Construcciones representadas en una ilustración histórica, con los límites de esa mirada colonial.'
    },
    {
      categoria: 'muerte', id: 'QUo003',
      titulo: 'La Noria · Territorio y memoria',
      imagen: base + 'MUER-la-noria-territorio.jpg',
      descripcion: 'Detalle del terreno de la excavación arqueológica de La Noria, fotografiada en 2016 y publicada por el Gobierno de la Ciudad. La comunidad Telomian Condic identifica La Noria como sitio de arqueología y memoria querandí en su publicación de 2025.',
      limite: 'Imagen de contexto territorial y de memoria. No identifica una tumba, un enterratorio ni una práctica funeraria. El recorte conserva solamente el suelo y excluye a las personas presentes en la fotografía completa; no muestra restos humanos.',
      fuente: commons + 'La_Noria_archaeological_site.jpg',
      fuenteRelacion: comunidad + '#page=15',
      fuentePrimaria: 'https://buenosaires.gob.ar/cultura/patrimonio-de-la-ciudad/espacio-la-noria/visitas-y-agenda',
      credito: 'Gobierno de la Ciudad Autónoma de Buenos Aires · Autor fotográfico no identificado · Wikimedia Commons. Recorte del terreno.',
      licencia: 'CC BY 2.5 Argentina', licenciaURL: 'https://creativecommons.org/licenses/by/2.5/ar/',
      fecha: '2016', atribucion: 'Contexto territorial · Memoria de La Noria',
      contexto: 'Un lugar de memoria comunitaria. Esta selección no incorpora imágenes funerarias ni atribuye tumbas.'
    },
    {
      categoria: 'personajes', id: 'QUo004',
      titulo: 'Ulrich Schmidl · El cronista',
      imagen: base + 'PER-schmidl.jpg',
      descripcion: 'Retrato grabado de Ulrich Schmidl, publicado en la edición de 1599 de su relato del Río de la Plata. La reproducción digital procede de «Historia Argentina», Diego Abad de Santillán, TEA, 1971.',
      limite: 'Representa al cronista europeo, no a una persona querandí. Se incluye para identificar una de las voces externas que produjeron documentos coloniales sobre la región. Es un retrato publicado, no un rostro reconstruido.',
      fuente: commons + 'Ulrich_Schmidl.jpg',
      credito: 'Levinus Hulsius, según la ficha de Commons · Reproducción de Historia Argentina, TEA, 1971 · Wikimedia Commons.',
      licencia: 'Dominio público en Argentina según Wikimedia Commons',
      fecha: '1599 · Reproducción de 1971', atribucion: 'Retrato histórico · Cronista colonial',
      contexto: 'Un retrato documentado del cronista europeo para reconocer la perspectiva de sus relatos.'
    },
    {
      categoria: 'creencias', id: 'QUo005', portada: true,
      titulo: 'El tala · Árbol sagrado e identidad',
      imagen: base + 'NAT-tala-escobar.jpg',
      descripcion: 'Integrantes del pueblo se reconocen como Taluhet, Pueblo de los Talas, y describen al tala como sagrado. Vinculan sus formas angulares con la armonía y la organización cultural. La foto muestra un ejemplar actual de Escobar, como referencia de ese árbol.',
      limite: 'Fotografía botánica de 2022, no de un árbol ceremonial identificado. El nido visible no tiene un significado ritual documentado en las fuentes consultadas. La interpretación cultural se atribuye al relato comunitario de 2023.',
      fuente: commons + 'Ejemplar_de_Tala_con_nido._Reserva_privada_El_Talar_de_Bel%C3%A9n._Escobar,_Provincia_de_Buenos_Aires._Argentina.jpg',
      fuenteRelacion: 'https://portal.amelica.org/ameli/journal/785/7854257004/movil/',
      fuenteRelacionNombre: 'Leer el relato sobre el tala sagrado',
      credito: 'STF!Bs.As. gestion · Wikimedia Commons · Versión reducida, sin recorte.',
      licencia: 'CC BY-SA 4.0', licenciaURL: 'https://creativecommons.org/licenses/by-sa/4.0/',
      fecha: '2022', atribucion: 'Fotografía de naturaleza · Buenos Aires',
      contexto: 'El tala como vínculo de identidad y cosmovisión, según el relato comunitario.'
    },
    {
      categoria: 'naturaleza', id: 'QUo010',
      titulo: 'Arco y flecha · Trabajar la madera',
      imagen: base + 'NAT-arco-comunitario.png',
      descripcion: 'Arco y flecha publicados en la sección de carpintería querandí. La comunidad describe cómo reconoce las ramas por su dureza y textura, las pule con piedras y les da forma con cuchillo y fuego. La imagen muestra un resultado de ese trabajo con materiales naturales.',
      limite: 'Fotografía de una publicación comunitaria de 2025. No se indica fabricante, fecha de elaboración ni especie de madera de esta pieza. No es una reliquia precolombina identificada ni una reconstrucción arqueológica certificada.',
      fuente: comunidad + '#page=21',
      credito: 'Comunidad Telomian Condic · Grupo Mirrí · FFyH, UNC, 2025, p. 17 · Fotografía sin autor individual indicado. Imagen extraída del PDF, sin reconstrucción.',
      licencia: 'CC BY-NC-SA 4.0', licenciaURL: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
      fecha: 'Publicación de 2025', atribucion: 'Objeto publicado por la comunidad · Carpintería',
      contexto: 'Los materiales naturales y los saberes para trabajarlos.'
    },
    {
      categoria: 'naturaleza', id: 'QUo011',
      titulo: 'Utensilios de madera · Ñapartalú',
      imagen: base + 'NAT-utensilios-comunitarios.png',
      descripcion: 'Dos utensilios de madera, uno con forma de cuchara y otro bifurcado, acompañan el relato del ciclo de carpintería de 2023. Muestran cómo las ramas pueden transformarse en objetos de uso mediante el trabajo manual y la transmisión de saberes.',
      limite: 'La forma es visible en la fotografía; la publicación no da nombres ni funciones específicas para estas dos piezas. No se les atribuye un uso ritual. Se conserva la imagen original, sin añadir detalles.',
      fuente: comunidad + '#page=21',
      credito: 'Comunidad Telomian Condic · Grupo Mirrí · FFyH, UNC, 2025, p. 17 · Fotografía sin autor individual indicado. Imagen extraída del PDF.',
      licencia: 'CC BY-NC-SA 4.0', licenciaURL: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
      fecha: 'Publicación de 2025', atribucion: 'Objetos publicados por la comunidad · Carpintería'
    },
    {
      categoria: 'fauna', id: 'QUo006',
      titulo: 'Venado de las pampas · Alimentación y caza',
      imagen: base + 'FAU-venado.jpg',
      descripcion: 'El venado fue la principal presa identificada en La Noria. Los restos muestran su importancia en la alimentación de quienes ocuparon ese sitio antes de la colonización. Esta foto actual sirve para reconocer la especie; el vínculo alimentario se basa en el estudio arqueológico enlazado.',
      limite: 'Fotografía contemporánea tomada fuera de Buenos Aires. No registra una cacería histórica. La evidencia de un sitio no representa todas las épocas ni todas las comunidades querandíes, y no demuestra que el venado fuera sagrado.',
      fuente: commons + 'Ozotoceros_bezoarticus_655660653.jpg',
      fuentePrimaria: 'https://www.inaturalist.org/photos/655660653',
      fuenteRelacion: 'https://ri.conicet.gov.ar/handle/11336/121783',
      fuenteRelacionNombre: 'Leer el estudio de fauna de La Noria (2018)',
      credito: 'Pablo H. Capovilla · iNaturalist / Wikimedia Commons · Versión reducida, sin recorte.',
      licencia: 'CC BY 4.0', licenciaURL: 'https://creativecommons.org/licenses/by/4.0/',
      fecha: '2026', atribucion: 'Referencia contemporánea de fauna',
      contexto: 'Fotografías actuales de especies, diferenciadas de los registros históricos o culturales.'
    },
    {
      categoria: 'patrones', id: 'QUo008',
      titulo: 'Fragmento cerámico · La Noria',
      imagen: base + 'PAT-fragmento-la-noria.jpg',
      descripcion: 'Fotografía de un fragmento cerámico con marcas de decoración incluida en la documentación del sitio La Noria publicada por el área de Patrimonio de la Ciudad. Se recortó la fotografía de la pieza dentro de la lámina original.',
      limite: 'Procedencia documentada: La Noria. La página consultada no proporciona número de inventario, autoría individual ni interpretación del significado de estas marcas. No se presenta el diseño como símbolo de todos los querandíes. El recorte omite el esquema del recipiente y su escala.',
      fuente: laNoria,
      fuenteImagen: 'https://static.buenosaires.gob.ar/sites/default/files/2023-06/21A.jpg',
      credito: 'Gobierno de la Ciudad Autónoma de Buenos Aires · Patrimonio de la Ciudad · Autor fotográfico no identificado. Recorte de la fotografía original.',
      licencia: 'CC BY 2.5 Argentina', licenciaURL: 'https://creativecommons.org/licenses/by/2.5/ar/',
      fecha: 'Fecha de la fotografía no indicada', atribucion: 'Pieza arqueológica · Procedencia La Noria',
      contexto: 'Superficies cerámicas documentadas: un fragmento de La Noria y una fotografía de la publicación comunitaria.'
    },
    {
      categoria: 'patrones', id: 'QUo009',
      titulo: 'Cerámica · Trabajo comunitario actual',
      imagen: base + 'PAT-ceramica-comunitaria.jpg',
      descripcion: 'Objetos cerámicos fotografiados en la sección «Alfarería y carpintería» de la publicación de la comunidad Telomian Condic, página 16. Esa sección describe el taller Brumbrúm y la recuperación contemporánea de técnicas de alfarería.',
      limite: 'La publicación no identifica individualmente la fecha, autoría o procedencia de estas dos piezas. No se presentan como hallazgos arqueológicos de La Noria ni como objetos precolombinos. La imagen es un recorte de la fotografía publicada; se excluyeron texto y fotografías de personas.',
      fuente: comunidad + '#page=20',
      credito: 'Comunidad Telomian Condic · Grupo Mirrí · FFyH, Universidad Nacional de Córdoba, 2025. Autor fotográfico no indicado. Recorte sin reconstrucción.',
      licencia: 'CC BY-NC-SA 4.0', licenciaURL: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
      fecha: 'Publicación de 2025', atribucion: 'Publicación comunitaria contemporánea'
    }
  ];

  window.MUSUQ_OBJETOS = objetos;
  if (Array.isArray(window.MUSUQ_MESA)) {
    window.MUSUQ_MESA = window.MUSUQ_MESA.map(function (categoria) {
      if (categoria.id === 'sociedad') return categoria;
      const laminas = objetos.filter(function (objeto) { return objeto.categoria === categoria.id; })
        .sort((a,b) => Number(!!b.portada) - Number(!!a.portada));
      if (!laminas.length) return categoria;
      return Object.assign({}, categoria, {
        contexto: laminas[0].contexto,
        imagen: laminas[0].imagen,
        enInvestigacion: false,
        laminas: laminas
      });
    });
  }
})();
