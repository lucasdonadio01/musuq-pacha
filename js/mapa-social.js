/* THESIS: el mapa sigue siendo la superficie de exploración; la interfaz acompaña sus bordes.
 * OWN-WORLD: Space Grotesk, carbón, naranja y violeta; píxeles cuadrados de las referencias.
 * STORY: buscar un pueblo, distinguir el progreso demo y descubrir contenido sin bloquearlo.
 * FIRST VIEWPORT: header persistente, búsqueda a izquierda, comentarios arriba y elementos abajo a derecha.
 * FORM: extensión del mapa existente, composición fijada por las referencias del usuario. */
(() => {
  'use strict';
  const normalizar = texto => String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const icono = id => `<svg aria-hidden="true" focusable="false"><use href="#i-${id}"/></svg>`;
  const crear = (tag, clase, texto) => {
    const el = document.createElement(tag);
    if (clase) el.className = clase;
    if (texto) el.textContent = texto;
    return el;
  };
  let sesion = !!window.MUSUQ_SESION?.activa;
  let iniciado = false, comentariosActivos = true, filtro = 'todo', estadoAnterior = '';
  let abierto = false, ui, selector, buscador, lista, tituloLista, cuenta, notasLista;
  let panelComentarios, listaComentarios, capaComentarios, filtros, estadoFiltros;
  const marcadores = [];
  const movimientoReducido = matchMedia('(prefers-reduced-motion: reduce)');
  let siguienteRebote = 0;
  function detenerRebotes(){marcadores.forEach(m=>{m.animacion?.cancel();m.animacion=null;m.proximo=performance.now()+2500+Math.random()*12000;});}
  movimientoReducido.addEventListener('change',detenerRebotes);
  addEventListener('musuq:accesibilidad',detenerRebotes);
  document.addEventListener('visibilitychange',detenerRebotes);
  const comentarios = [
    {pueblo:'querandi', usuario:'@adriplatense', texto:'Cuidado con el boss!!!!', respuestas:3, likes:16, dx:0, dz:0},
    {pueblo:'qom', usuario:'@miaumiaumichi', texto:'Tip: Guardá las recompensas para mejorar el pueblo', respuestas:2, likes:10, dx:0.7, dz:0.2},
    {pueblo:'omaguaca', usuario:'@boquita4ever', texto:'No te acerques si todavía no pasaste la misión 5', respuestas:16, likes:42, dx:0, dz:0},
    {pueblo:'tehuelche', usuario:'@ilychasca', texto:'Si necesitas ayuda acá buscame en el juego!!!!!', respuestas:54, likes:78, dx:0, dz:0},
    {pueblo:'guarani', usuario:'@rioymonte', texto:'Me quedé recorriendo esta parte del mapa 🌿', respuestas:4, likes:23, dx:0, dz:0},
    {pueblo:'diaguita', usuario:'@sol.del.valle', texto:'¿Quién más está explorando por acá?', respuestas:7, likes:31, dx:0, dz:0},
    {pueblo:'huarpe', usuario:'@pixel.cuyano', texto:'Este paisaje es mi favorito hasta ahora.', respuestas:2, likes:19, dx:0, dz:0},
    {pueblo:'comeching', usuario:'@sierras.adentro', texto:'Guardé esta zona para volver después.', respuestas:3, likes:12, dx:0, dz:0},
    {pueblo:'querandi', usuario:'@trama.del.sur', texto:'Tocá las plantas para conocer sus usos.', respuestas:5, likes:28, dx:2.4, dz:1.8},
    {pueblo:'querandi', usuario:'@archivo.abierto', texto:'En el archivo están las fuentes para seguir leyendo.', respuestas:2, likes:14, dx:-2.3, dz:-1.8},
    {pueblo:'selk', usuario:'@viento.austral', texto:'Llegué al sur. ¡Qué viaje!', respuestas:6, likes:35, dx:0, dz:0},
    {pueblo:'charr', usuario:'@orilla.pixel', texto:'Probá activar el relieve y mirar de cerca.', respuestas:1, likes:17, dx:0, dz:0}
  ];
  function desbloqueado(nombre) {
    return ['qom','querandi','omaguaca'].some(p => normalizar(nombre).includes(p));
  }
  function avatar(semilla, indice = 0) {
    const canvas = crear('canvas', 'perfil-patron');
    canvas.width = canvas.height = 81;
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    if (typeof Motor !== 'undefined' && typeof PUEBLOS !== 'undefined' && PUEBLOS.length) {
      const p = PUEBLOS[indice % PUEBLOS.length];
      const m = Motor.crear(9); m.quieto = true;
      m.generar(0, semilla, Motor.paletaContra(p.colores, p.fondo, 3));
      ctx.fillStyle = p.fondo; ctx.fillRect(0, 0, 81, 81);
      for (const [k, h] of m.grilla) {
        const [x, y] = k.split(',').map(Number);
        ctx.fillStyle = h; ctx.fillRect(x * 9, y * 9, 9, 9);
      }
    } else {
      ctx.fillStyle = '#9E6FF8'; ctx.fillRect(0, 0, 81, 81);
      ctx.fillStyle = '#202020'; ctx.fillRect(27, 9, 27, 63); ctx.fillRect(9, 27, 63, 27);
    }
    return canvas;
  }
  function protegerScroll(el) {
    el.addEventListener('wheel', e => e.stopPropagation(), {passive:true});
    el.addEventListener('touchmove', e => e.stopPropagation(), {passive:true});
    el.addEventListener('keydown', e => { if (['PageDown','PageUp','Home','End'].includes(e.key)) e.stopPropagation(); });
  }
  function abrirBuscador(valor, enfocar = true) {
    abierto = valor;
    document.body.classList.toggle('buscador-abierto', valor);
    selector.classList.toggle('selector--abierto', valor);
    selector.querySelector('.buscador-trigger').setAttribute('aria-expanded', String(valor));
    const contenido = selector.querySelector('.selector__contenido'); contenido.inert = !valor;
    if (valor) {
      actualizarLista();
      if (enfocar) buscador.focus({preventScroll:true});
    }
  }
  function actualizarLista() {
    if (!lista || !ui) return;
    const consulta = normalizar(buscador.value).trim(); let cantidad = 0;
    for (const li of lista.children) {
      const boton = li.querySelector('button'); if (!boton) continue;
      const zona = ui.zonas.find(z => z.id === Number(boton.dataset.zona)); if (!zona) continue;
      const libre = desbloqueado(zona.nombre);
      li.hidden = consulta ? !normalizar(zona.nombre + ' ' + zona.criterio).includes(consulta) : !libre;
      if (!li.hidden) cantidad++;
      let badge = boton.querySelector('.pueblo-estado');
      if (!badge) { badge = crear('small', 'pueblo-estado'); boton.append(badge); }
      badge.hidden = !sesion;
      badge.innerHTML = icono(libre ? 'unlock' : 'lock') + '<span>' + (libre ? 'Desbloqueado' : 'Bloqueado') + '</span>';
      boton.classList.toggle('pueblo-bloqueado', sesion && !libre);
      boton.setAttribute('aria-label', zona.nombre + (sesion ? libre ? ', desbloqueado' : ', bloqueado, disponible para explorar' : ''));
    }
    tituloLista.textContent = consulta ? 'Resultados' : sesion ? 'Tus desbloqueados' : 'Recomendados';
    cuenta.textContent = String(cantidad);
    document.getElementById('sin-resultados').hidden = cantidad > 0;
    notasLista.textContent = sesion ? 'Sesión demo · Podés explorar todos los pueblos.' : 'Elegí una recomendación o buscá cualquier pueblo.';
  }
  function construirBuscador() {
    selector = document.getElementById('selector'); buscador = document.getElementById('buscar-pueblo'); lista = document.getElementById('lista-pueblos');
    if (!selector || !buscador || !lista) return;
    tituloLista = selector.querySelector('.selector__cabecera h2'); cuenta = document.getElementById('cantidad-pueblos');
    notasLista = selector.querySelector('.selector__nota');
    const contenido = crear('div', 'selector__contenido'); contenido.id = 'buscador-pueblos-contenido';
    while (selector.firstChild) contenido.append(selector.firstChild);
    const trigger = crear('button', 'buscador-trigger pixel-control'); trigger.type = 'button';
    trigger.innerHTML = icono('buscar') + '<span>Buscador de pueblos</span>';
    trigger.setAttribute('aria-controls', contenido.id); trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('click', () => abrirBuscador(!abierto));
    selector.append(trigger, contenido); contenido.inert = true;
    buscador.placeholder = 'Nombre o territorio';
    buscador.addEventListener('input', actualizarLista);
    lista.addEventListener('click', e => { if (e.target.closest('button[data-zona]')) abrirBuscador(false, false); });
    selector.addEventListener('keydown', e => { if (e.key === 'Escape' && abierto) { e.stopPropagation(); abrirBuscador(false, false); trigger.focus(); } });
    protegerScroll(selector);
  }
  function construirFicha() {
    const panel = document.getElementById('mapa-panel');
    if (!panel) return;
    const volver = crear('button', 'ficha-volver'); volver.type = 'button';
    volver.innerHTML = icono('volver') + '<span>VOLVER</span>';
    volver.addEventListener('click', () => document.getElementById('liberar-zona').click());
    panel.prepend(volver);
    const badge = crear('p', 'ficha-progreso'); badge.id = 'ficha-progreso'; badge.hidden = true; panel.append(badge);
    const archivo = document.getElementById('ver-archivo');
    if (archivo) archivo.innerHTML = '<span>VER EN EL ARCHIVO</span>' + icono('flecha-derecha');
    const criterio = panel.querySelector('.panel__criterio');
    if (criterio) criterio.classList.add('ficha-ubicacion');
    protegerScroll(panel);
    const siguiente=document.getElementById('vista-arbol-siguiente');
    document.getElementById('vista-arbol-descripcion')?.after(siguiente);
  }
  function construirComentarios() {
    panelComentarios = crear('aside', 'mapa-comentarios'); panelComentarios.id = 'mapa-comentarios'; panelComentarios.setAttribute('aria-label', 'Comentarios de ejemplo');
    const cabecera = crear('div', 'mapa-comentarios__cabecera');
    const titulo = crear('button', 'mapa-comentarios__titulo', 'Comentarios'); titulo.type = 'button';
    titulo.setAttribute('aria-expanded', 'true'); titulo.setAttribute('aria-controls', 'lista-comentarios-demo');
    titulo.addEventListener('click', () => {
      const compacto = panelComentarios.classList.toggle('mapa-comentarios--compacto');
      titulo.setAttribute('aria-expanded', String(!compacto));
      if (!compacto && matchMedia('(max-width:760px)').matches && filtros) {
        filtros.classList.add('mapa-elementos--cerrado');
        filtros.querySelector('.mapa-elementos__titulo').setAttribute('aria-expanded', 'false');
        filtros.querySelector('fieldset').inert = true;
      }
    });
    const toggle = crear('button', 'toggle-cuadrados'); toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Mostrar comentarios de ejemplo'); toggle.setAttribute('aria-pressed', 'true');
    toggle.setAttribute('aria-controls', 'lista-comentarios-demo'); toggle.innerHTML = '<span aria-hidden="true"></span>';
    const aviso = crear('p', 'mapa-comentarios__aviso', 'EJEMPLOS · NO SON PUBLICACIONES REALES');
    listaComentarios = crear('div', 'mapa-comentarios__lista'); listaComentarios.id = 'lista-comentarios-demo';
    listaComentarios.tabIndex = 0; listaComentarios.setAttribute('aria-label', 'Recorrer comentarios de ejemplo');
    cabecera.append(titulo, toggle); panelComentarios.append(cabecera, aviso, listaComentarios);
    const capas = document.querySelector('#herramientas .capas');
    if (capas) {
      panelComentarios.append(capas);
      const fronteras = capas.querySelector('#boton-fronteras');
      if (fronteras) {
        fronteras.setAttribute('aria-label', 'Mostrar Argentina y provincias');
        for (const nodo of fronteras.childNodes) if (nodo.nodeType === Node.TEXT_NODE) nodo.textContent = 'Mapa arg. ';
      }
    }
    capaComentarios = crear('div', 'mapa-marcadores'); capaComentarios.setAttribute('aria-label', 'Comentarios de ejemplo en el territorio');
    comentarios.forEach((dato, i) => {
      const fila = crear('article', 'comentario-demo'); fila.id = 'comentario-demo-' + i;
      const autor = crear('div', 'comentario-demo__autor'); autor.append(avatar(902 + i * 83, i), crear('span', '', dato.usuario));
      const cuerpo = crear('div', 'comentario-demo__cuerpo'); cuerpo.append(crear('p', '', dato.texto));
      const numeros = crear('div', 'comentario-demo__numeros');
      numeros.innerHTML = `<span>${dato.respuestas}${icono('chat')}</span><span>${dato.likes}${icono('heart')}</span>`;
      numeros.setAttribute('aria-label', `${dato.respuestas} respuestas y ${dato.likes} reacciones simuladas`);
      cuerpo.append(numeros); fila.append(autor, cuerpo); listaComentarios.append(fila);
      const marker = crear('button', 'mapa-comentario-marker'); marker.type = 'button';
      marker.setAttribute('aria-label', `${dato.usuario}, comentario de ejemplo: ${dato.texto}`);
      marker.append(avatar(902 + i * 83, i));
      const globo = crear('span', 'mapa-comentario-marker__globo');
      const firma = crear('span','mapa-globo__autor');firma.append(avatar(902+i*83,i),crear('span','',dato.usuario));
      const detalle = crear('span','mapa-globo__detalle');
      const cifras = crear('span','mapa-globo__cifras');cifras.innerHTML=`<span>${dato.respuestas}${icono('chat')}</span><span>${dato.likes}${icono('heart')}</span>`;
      cifras.setAttribute('aria-label',`${dato.respuestas} respuestas y ${dato.likes} likes de ejemplo`);
      detalle.append(crear('span','mapa-globo__texto',dato.texto),cifras);globo.append(firma,detalle);marker.append(globo);
      marker.setAttribute('aria-expanded','false');
      const pausar = ()=>{marker.getAnimations().forEach(a=>a.cancel());};
      const cerrar = ()=>{marker.classList.remove('mapa-comentario-marker--abierto');marker.setAttribute('aria-expanded','false');};
      const mostrar = ()=>{
        pausar();
        marcadores.forEach(m=>m.cerrar());
        marker.classList.add('mapa-comentario-marker--abierto');marker.setAttribute('aria-expanded','true');
      };
      // El clic no fija el globo. En pantallas táctiles se lee desde el panel.
      marker.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')mostrar();});
      marker.addEventListener('pointerleave',cerrar);
      marker.addEventListener('pointercancel',cerrar);
      marker.addEventListener('focus',()=>{if(marker.matches(':focus-visible'))mostrar();});
      marker.addEventListener('blur',cerrar);
      marker.addEventListener('keydown',e=>{
        if(e.key==='Escape'){e.preventDefault();e.stopPropagation();cerrar();marker.blur();}
      });
      capaComentarios.append(marker); marcadores.push({dato, marker, cerrar, zona:null,proximo:performance.now()+2000+i*1750,animacion:null});
    });
    toggle.addEventListener('click', () => {
      comentariosActivos = !comentariosActivos;
      detenerRebotes();
      marcadores.forEach(m=>m.cerrar());
      toggle.setAttribute('aria-pressed', String(comentariosActivos));
      panelComentarios.classList.toggle('mapa-comentarios--oculto', !comentariosActivos);
      listaComentarios.hidden = !comentariosActivos; aviso.hidden = !comentariosActivos;
      capaComentarios.hidden = !comentariosActivos;
      if (comentariosActivos) {
        panelComentarios.classList.remove('mapa-comentarios--compacto');
        titulo.setAttribute('aria-expanded','true');
        if (matchMedia('(max-width:760px)').matches && filtros) {
          filtros.classList.add('mapa-elementos--cerrado'); filtros.querySelector('fieldset').inert = true;
          filtros.querySelector('.mapa-elementos__titulo').setAttribute('aria-expanded','false');
        }
      }
    });
    document.body.append(capaComentarios, panelComentarios);
    protegerScroll(panelComentarios);
  }
  function construirFiltros() {
    filtros = crear('aside', 'mapa-elementos pixel-control'); filtros.id = 'mapa-elementos';
    filtros.hidden = true; filtros.inert = true;
    filtros.setAttribute('aria-label', 'Filtrar elementos del mapa');
    const titulo = crear('button', 'mapa-elementos__titulo'); titulo.type = 'button';
    titulo.innerHTML = '<span>Elementos</span>' + icono('eco'); titulo.setAttribute('aria-expanded', 'true'); titulo.setAttribute('aria-controls', 'elementos-opciones');
    const opciones = crear('fieldset', 'mapa-elementos__opciones'); opciones.id = 'elementos-opciones';
    const legend = crear('legend', 'solo-lectores', 'Tipo de elemento'); opciones.append(legend);
    const tipos = [['todo','Ver todo'],['arboles','Árboles'],['construcciones','Construcciones'],['flora','Flora'],['fauna','Fauna']];
    // Google Material Icons: apps, home y pets; árbol y eco reutilizan los del mapa.
    const trazos = {
      todo:'M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z',
      construcciones:'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
      fauna:'M4.5 9C5.88 9 7 7.88 7 6.5S5.88 4 4.5 4 2 5.12 2 6.5 3.12 9 4.5 9zm4.5-4c1.38 0 2.5-1.12 2.5-2.5S10.38 0 9 0 6.5 1.12 6.5 2.5 7.62 5 9 5zm6 0c1.38 0 2.5-1.12 2.5-2.5S16.38 0 15 0s-2.5 1.12-2.5 2.5S13.62 5 15 5zm4.5 4c1.38 0 2.5-1.12 2.5-2.5S20.88 4 19.5 4 17 5.12 17 6.5 18.12 9 19.5 9zm-2.34 3.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32-.11-.04-.22-.07-.33-.09-.25-.04-.51-.04-.77-.04s-.52 0-.78.05c-.11.02-.22.05-.33.09-.7.24-1.28.78-1.75 1.32-.87 1.02-1.6 1.89-2.48 2.91C5.18 14.39 3.57 16.08 4 18.2c.42 1.06 1.22 2.11 2.62 2.42.78.16 3.27-.47 5.28-.47h.2c2.01 0 4.5.63 5.28.47 1.4-.31 2.2-1.36 2.62-2.42.43-2.12-1.18-3.81-2.84-5.34z'
    };
    tipos.forEach(([valor, texto]) => {
      const label = crear('label', 'elemento-opcion'), input = crear('input');
      input.type = 'radio'; input.name = 'mapa-elemento'; input.value = valor; input.checked = valor === 'todo';
      const cuadro = crear('span', 'elemento-opcion__cuadro'); cuadro.setAttribute('aria-hidden', 'true');
      cuadro.innerHTML = trazos[valor] ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${trazos[valor]}"/></svg>` : icono(valor === 'arboles' ? 'arbol' : 'eco');
      label.append(input, cuadro, crear('span', '', texto)); opciones.append(label);
      input.addEventListener('change', () => {
        if (!input.checked) return;
        filtro = valor; ui?.filtrar(valor);
        estadoFiltros.textContent = valor === 'construcciones' ? 'Todavía no hay construcciones documentadas en esta vista.' : valor === 'flora' ? 'Elegí Querandí para explorar las plantas y sus usos.' : valor === 'fauna' ? 'Fauna de Querandí · Elegí un animal para conocerlo.' : '';
        estadoFiltros.hidden = !estadoFiltros.textContent;
        if (matchMedia('(max-width:760px)').matches) {
          filtros.classList.add('mapa-elementos--cerrado');
          titulo.setAttribute('aria-expanded','false'); opciones.inert = true;
        }
      });
    });
    titulo.addEventListener('click', () => {
      const cerrado = filtros.classList.toggle('mapa-elementos--cerrado'); titulo.setAttribute('aria-expanded', String(!cerrado)); opciones.inert = cerrado;
      if (!cerrado && matchMedia('(max-width:760px)').matches) {
        panelComentarios.classList.add('mapa-comentarios--compacto');
        panelComentarios.querySelector('.mapa-comentarios__titulo').setAttribute('aria-expanded','false');
      }
    });
    estadoFiltros = crear('p', 'mapa-elementos__estado'); estadoFiltros.hidden = true; estadoFiltros.setAttribute('aria-live','polite');
    filtros.append(titulo, opciones, estadoFiltros); document.body.append(filtros); protegerScroll(filtros);
    const especies=crear('div','mapa-especies');especies.id='especies-opciones';especies.hidden=true;
    for(const [tipo,datos] of [['fauna',Object.entries(window.MUSUQ_HABITAT?.fichas||{}).map(([id,d])=>({id,nombre:d.nombre}))],['flora',window.MUSUQ_FLORA?.plantas||[]]]){
      const grupo=crear('div','mapa-especies__grupo');grupo.append(crear('p','mapa-especies__rotulo',tipo==='fauna'?'Animales':'Plantas'));
      datos.forEach(d=>{
        const b=crear('button','mapa-especie');b.type='button';b.dataset.especie=d.id;b.dataset.tipo=tipo;b.setAttribute('aria-pressed','false');
        b.innerHTML=(tipo==='flora'?icono('eco'):`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${trazos.fauna}"/></svg>`);
        b.append(crear('span','',d.nombre));
        b.addEventListener('click',()=>ui?.verEspecie(tipo,d.id));grupo.append(b);
      });especies.append(grupo);
    }
    const vacio=crear('p','mapa-especies__vacio','Todavía no hay especies disponibles en esta vista.');vacio.hidden=true;especies.append(vacio);
    filtros.append(especies);
    titulo.addEventListener('click',()=>{especies.inert=filtros.classList.contains('mapa-elementos--cerrado');});
    if (matchMedia('(max-width:760px)').matches) { filtros.classList.add('mapa-elementos--cerrado'); titulo.setAttribute('aria-expanded','false'); opciones.inert = true; }
  }
  function actualizarEstado() {
    if (!iniciado || !ui) return;
    const estado = ui.estado();
    const clave = [estado.explorando, estado.zonaId, estado.nivel, estado.arbol, estado.fauna, estado.faunaLista, estado.flora, estado.filtro, sesion].join('|');
    if (clave === estadoAnterior) return;
    estadoAnterior = clave;
    if (estado.zonaId && !document.body.classList.contains('mapa-con-pueblo') && matchMedia('(max-width:760px)').matches) {
      panelComentarios.classList.add('mapa-comentarios--compacto');
      panelComentarios.querySelector('.mapa-comentarios__titulo').setAttribute('aria-expanded','false');
    }
    document.body.classList.toggle('mapa-con-pueblo', !!estado.zonaId);
    document.body.dataset.mapaNivel = String(estado.nivel || 0);
    for (const el of [panelComentarios, capaComentarios, filtros]) { el.inert = !estado.explorando; el.classList.toggle('mapa-ui-activo', estado.explorando); }
    const mostrarElementos = estado.explorando && !!estado.zonaId;
    filtros.hidden = !mostrarElementos; filtros.inert = !mostrarElementos;
    filtros.classList.toggle('mapa-ui-activo', mostrarElementos);
    const detalle=estado.nivel>=2,especies=filtros.querySelector('.mapa-especies'),opciones=filtros.querySelector('fieldset'),titulo=filtros.querySelector('.mapa-elementos__titulo');
    filtros.classList.toggle('mapa-elementos--especies',detalle);
    filtros.setAttribute('aria-label',detalle?'Fauna & flora':'Filtrar elementos del mapa');
    titulo.querySelector('span').textContent=detalle?'Fauna & flora':'Elementos';
    titulo.setAttribute('aria-controls',detalle?'especies-opciones':'elementos-opciones');
    opciones.hidden=detalle;especies.hidden=!detalle;
    especies.inert=!detalle||filtros.classList.contains('mapa-elementos--cerrado');
    estadoFiltros.hidden=detalle||!estadoFiltros.textContent;
    especies.querySelectorAll('.mapa-especies__grupo').forEach(g=>g.hidden=estado.zonaId!==14);
    especies.querySelector('.mapa-especies__vacio').hidden=estado.zonaId===14;
    especies.querySelectorAll('[data-especie]').forEach(b=>{
      b.setAttribute('aria-pressed',String(estado[b.dataset.tipo]===b.dataset.especie));
      b.disabled=b.dataset.tipo==='fauna'&&!estado.faunaLista;
    });
    opciones.querySelectorAll('input').forEach(input=>input.checked=input.value===estado.filtro);
    const zona = ui.zonas.find(z => z.id === estado.zonaId);
    const badge = document.getElementById('ficha-progreso');
    if (badge) {
      badge.hidden = !(sesion && zona);
      if (zona) badge.innerHTML = icono(desbloqueado(zona.nombre) ? 'unlock' : 'lock') + '<span>' + (desbloqueado(zona.nombre) ? 'Desbloqueado en tu sesión demo' : 'Bloqueado en tu sesión demo · Podés explorarlo') + '</span>';
    }
    if (!estado.explorando) abrirBuscador(false, false);
  }
  function proyectar() {
    const ahora=performance.now();
    if (ui && comentariosActivos && !document.hidden) {
      const estado = ui.estado();
      const visibles = estado.explorando && Number(estado.nivel) < 2;
      for (const m of marcadores) {
        if (!m.zona) m.zona = ui.zonas.find(z => normalizar(z.nombre).includes(m.dato.pueblo));
        if (!visibles || !m.zona || (estado.zonaId && estado.zonaId !== m.zona.id)) { m.marker.hidden = true; m.cerrar(); m.animacion?.cancel(); continue; }
        const p = ui.proyectarZona(m.zona.id, m.dato.dx, m.dato.dz);
        const mostrar = p?.visible && p.x > 22 && p.x < innerWidth - 22 && p.y > document.getElementById('header').getBoundingClientRect().bottom + 12 && p.y < innerHeight - 34;
        m.marker.hidden = !mostrar;
        if (mostrar) {
          m.marker.style.transform = `translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,0) translate(-50%,-100%) perspective(600px) rotateX(8deg) rotateZ(-1deg)`;
          const ancho=Math.min(340,innerWidth-32),centro=Math.max(ancho/2+16,Math.min(innerWidth-ancho/2-16,p.x));
          m.marker.style.setProperty('--globo-desplazamiento',(centro-p.x).toFixed(1)+'px');
          m.marker.classList.toggle('globo-abajo',p.y<200);
          const leyendo=m.marker.matches(':hover,:focus-visible')||m.marker.classList.contains('mapa-comentario-marker--abierto');
          if(!movimientoReducido.matches&&!window.MUSUQ_A11Y?.estado.detener&&!leyendo&&ahora>m.proximo&&ahora>siguienteRebote){
            m.animacion=m.marker.animate([{translate:'0 0',offset:0},{translate:'0 -6px',offset:.32},{translate:'0 0',offset:.60},{translate:'0 -2px',offset:.79},{translate:'0 0',offset:1}],{duration:850,easing:'cubic-bezier(.37,0,.63,1)'});
            m.proximo=ahora+14000+Math.random()*12000;siguienteRebote=ahora+1600+Math.random()*1100;
          }
        }else {m.cerrar();m.animacion?.cancel();}
      }
      actualizarEstado();
    }
    requestAnimationFrame(proyectar);
  }
  function iniciar() {
    if (iniciado || !window.MUSUQ_MAPA_UI) return;
    ui = window.MUSUQ_MAPA_UI; iniciado = true;
    construirBuscador(); construirFicha(); construirComentarios(); construirFiltros();
    actualizarLista(); actualizarEstado(); proyectar();
    matchMedia('(max-width:760px)').addEventListener('change', e => {
      if (!e.matches) return;
      filtros.classList.add('mapa-elementos--cerrado');
      filtros.querySelector('.mapa-elementos__titulo').setAttribute('aria-expanded','false');
      filtros.querySelector('fieldset').inert = true;
      panelComentarios.classList.add('mapa-comentarios--compacto');
      panelComentarios.querySelector('.mapa-comentarios__titulo').setAttribute('aria-expanded','false');
    });
    document.getElementById('header').addEventListener('click', e => {
      const enlace = e.target.closest('a');
      if (enlace && ['#territorio','#comunidad'].includes(enlace.getAttribute('href'))) ui.salir?.();
    });
    document.addEventListener('click', e => {
      if (abierto && !selector.contains(e.target)) abrirBuscador(false, false);
    });
    addEventListener('musuq:sesion', e => { sesion = e.detail.activa; actualizarLista(); actualizarEstado(); });
    addEventListener('musuq:modo', actualizarEstado); addEventListener('musuq:estado', actualizarEstado);
    const relieve = document.getElementById('boton-relieve'), fronteras = document.getElementById('boton-fronteras');
    for (const el of [relieve, fronteras]) if (el) el.classList.add('control-cuadrados');
  }
  addEventListener('musuq:mapa-listo', iniciar);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, {once:true}); else iniciar();
})();
