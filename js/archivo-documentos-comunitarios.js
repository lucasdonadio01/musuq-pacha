(function () {
  'use strict';
  const base = 'assets/archivo/documentos/';
  const pdf = 'https://ffyh.unc.edu.ar/publicaciones/wp-content/uploads/sites/35/2026/03/pueblo-querandi_compressed.pdf';
  const credito = 'Comunidad Telomian Condic · Grupo Mirrí · Facultad de Filosofía y Humanidades, UNC, 2025. Diseño interior: María Bella y Luis Sánchez Zárate.';
  const licencia = 'CC BY-NC-SA 4.0 · Atribución-NoComercial-CompartirIgual';
  const memoria = 'Fuente comunitaria contemporánea, elaborada entre 2024 y 2025. Este facsímil reproduce la publicación de 2025; no es un objeto arqueológico ni un documento de la época narrada.';
  const documentos = [
    {
      categoria: 'personajes', id: 'QUm001',
      titulo: 'Telomian Condic · Memoria comunitaria',
      imagen: base + 'QUm001-telomian-condic.png',
      descripcion: 'La comunidad explica el nombre Telomian Condic y recuerda a quien organizó a las comunidades en las luchas contra los españoles. Página 1 de «Pueblo Nación Querandí · Comunidad Telomian Condic: nuestra historia».',
      limite: memoria + ' Se conserva la voz y la atribución de la comunidad, sin presentar un retrato imaginado del personaje.',
      fuente: pdf + '#page=5', paginaImpresa: 1, paginaPDF: 5,
      contexto: 'Una página de memoria comunitaria sobre Telomian Condic y el nombre de la comunidad.'
    },
    {
      categoria: 'naturaleza', id: 'QUm002',
      titulo: 'El tala · Memoria del territorio',
      imagen: base + 'QUm002-tala.png',
      descripcion: 'La comunidad relata su vínculo con los bosques de tala y los usos que recuerda para la madera, las semillas y las hojas. Página 6 de «Pueblo Nación Querandí · Comunidad Telomian Condic: nuestra historia».',
      limite: memoria + ' La página documenta el relato comunitario sobre el árbol y el territorio; no constituye un registro botánico histórico.',
      fuente: pdf + '#page=10', paginaImpresa: 6, paginaPDF: 10,
      contexto: 'Memoria comunitaria sobre el tala, sus usos y los lugares de encuentro.'
    },
    {
      categoria: 'viviendas', id: 'QUm003',
      titulo: 'Quillá y pirí · Formas de habitar',
      imagen: base + 'QUm003-viviendas.png',
      descripcion: 'La publicación nombra las viviendas quillá o pirí y su orientación oeste-este dentro de un relato territorial. La página incluye fragmentos de la carta náutica de Sebastián Gaboto, de 1544. Página 7.',
      limite: memoria + ' El mapa es una reproducción histórica identificada por la publicación; no muestra una vivienda ni permite reconstruir su apariencia.',
      fuente: pdf + '#page=11', paginaImpresa: 7, paginaPDF: 11,
      contexto: 'Un testimonio textual sobre quillá y pirí, acompañado por el mapa histórico reproducido en la fuente.'
    },
    {
      categoria: 'creencias', id: 'QUm004',
      titulo: 'Chu Querandí · Cosmovisión',
      imagen: base + 'QUm004-chu-querandi.png',
      descripcion: 'La comunidad presenta su relación con la tierra, el tala, Soychú y Gualichú, y advierte sobre la diversidad entre pueblos indígenas. Página 10 de «Pueblo Nación Querandí · Comunidad Telomian Condic: nuestra historia».',
      limite: memoria + ' Se reproduce la explicación de esta comunidad, sin extenderla a todos los pueblos indígenas ni convertirla en una escena ceremonial reconstruida.',
      fuente: pdf + '#page=14', paginaImpresa: 10, paginaPDF: 14,
      contexto: 'Una explicación de la cosmovisión escrita desde la comunidad Telomian Condic.'
    },
    {
      categoria: 'fauna', id: 'QUm005',
      titulo: 'Animales · Vocabulario querandí het',
      imagen: base + 'QUm005-fauna.png',
      descripcion: 'Página del vocabulario comunitario que reúne palabras para animales y elementos de la vida cotidiana. Página 22 de «Pueblo Nación Querandí · Comunidad Telomian Condic: nuestra historia».',
      limite: memoria + ' Es un registro lingüístico del trabajo de recuperación de la lengua. Las equivalencias se conservan como aparecen en la fuente y no se interpretan como una clasificación zoológica.',
      fuente: pdf + '#page=26', paginaImpresa: 22, paginaPDF: 26,
      contexto: 'Un documento lingüístico con nombres de animales en querandí het.'
    },
    {
      categoria: 'patrones', id: 'QUm006',
      titulo: 'Decoraciones cerámicas · Texto comunitario',
      imagen: base + 'QUm006-decoraciones-ceramicas.png',
      descripcion: 'Recorte del párrafo sobre decoraciones con líneas, puntos, guardas geométricas, texturas y relieves en vasijas. Página 16 de «Pueblo Nación Querandí · Comunidad Telomian Condic: nuestra historia».',
      limite: memoria + ' Es una descripción textual, no un muestrario de motivos verificados. Se recortó únicamente el párrafo original y su fondo para omitir las fotografías contemporáneas de la página; no se redibujó el contenido.',
      fuente: pdf + '#page=20', paginaImpresa: 16, paginaPDF: 20,
      contexto: 'Una descripción documental de decoraciones cerámicas. La selección no atribuye ningún motivo gráfico concreto como patrón querandí.'
    }
  ].map(function (documento) {
    return Object.assign({
      credito: credito,
      licencia: licencia,
      licenciaURL: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
      fecha: '2025',
      atribucion: 'Memoria comunitaria contemporánea',
      tipoDocumento: 'Facsímil de publicación comunitaria',
      enInvestigacion: false
    }, documento);
  });

  window.MUSUQ_DOCUMENTOS_COMUNITARIOS = documentos;
  if (Array.isArray(window.MUSUQ_MESA)) {
    window.MUSUQ_MESA = window.MUSUQ_MESA.map(function (categoria) {
      const laminas = documentos.filter(function (documento) { return documento.categoria === categoria.id; });
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
