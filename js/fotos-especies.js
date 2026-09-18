/* Fotografías de referencia, con atribución y visor compartido para las fichas. */
(() => {
  'use strict';
  const fotos={
    macachin:{src:'assets/especies/macachin-referencia.jpg',nombre:'Macachín',detalle:'Oxalis articulata · referencia botánica',alt:'Flores rosadas y hojas de Oxalis articulata.',autor:'Didier Descouens',fuente:'https://commons.wikimedia.org/wiki/File:(MHNT)_Oxalis_articulata_-_Habit.jpg',licencia:'CC BY-SA 4.0',urlLicencia:'https://creativecommons.org/licenses/by-sa/4.0/'},
    carda:{src:'assets/especies/carda-referencia.jpg',nombre:'Cardo de las crónicas',detalle:'Eryngium horridum · referencia botánica',alt:'Carda nativa: roseta de hojas largas y detalles de sus flores.',autor:'Andrés González',fuente:'https://commons.wikimedia.org/wiki/File:Eryngium_horridum.jpg',licencia:'CC BY-SA 3.0',urlLicencia:'https://creativecommons.org/licenses/by-sa/3.0/'},
    venado:{src:'assets/archivo/objetos/FAU-venado.jpg',nombre:'Venado de las pampas',detalle:'Ozotoceros bezoarticus',alt:'Venado de las pampas descansando en un pastizal.',autor:'Pablo H. Capovilla',fuente:'https://commons.wikimedia.org/wiki/File:Ozotoceros_bezoarticus_655660653.jpg',licencia:'CC BY 4.0',urlLicencia:'https://creativecommons.org/licenses/by/4.0/'},
    tero:{src:'assets/especies/tero.jpg',nombre:'Tero',detalle:'Vanellus chilensis',alt:'Tero de perfil en un pastizal, con pecho negro, ojo rojo y cresta.',autor:'Marcosdec',fuente:'https://commons.wikimedia.org/wiki/File:Tero_com%C3%BAn_Vanellus_chilensis.jpg',licencia:'CC BY-SA 4.0',urlLicencia:'https://creativecommons.org/licenses/by-sa/4.0/'}
  };
  const extras={
    macachin:[['macachin-flores','Flores rosadas de macachín.','そらみみ','Flowers_of_Oxalis_articulata_20181102.jpg','CC BY-SA 4.0','by-sa/4.0'],['macachin-hojas','Detalle de las hojas de macachín.','Harry Rose','Oxalis_articulata_leaf1_NT_(16419218000).jpg','CC BY 2.0','by/2.0']],
    carda:[['carda-planta','Inflorescencias de Eryngium horridum en el campo.','Gabriel Collares','Caraguatá_(do_tupi_karagûatá),_Eryngium_horridum.jpg','CC BY 4.0','by/4.0'],['carda-detalle','Roseta de hojas dentadas de Eryngium horridum.','Gabriel Collares','Caraguatá_(do_tupi_karagûatá),_Eryngium_horridum_-_55008371804.jpg','CC BY 4.0','by/4.0']],
    venado:[['venado-pastizal','Hembra de venado de las pampas y su cría en el pastizal.','Fabio Rage','O._bezoarticus_doe.jpg','CC BY 2.0','by/2.0'],['venado-movimiento','Venado de las pampas corriendo entre pastos.','Fabio Rage','O._bezoarticus_doe_running.jpg','CC BY 2.0','by/2.0']],
    tero:[['tero-vuelo','Tero con las alas abiertas en vuelo.','Charles J. Sharp','Southern_lapwing_(Vanellus_chilensis_chilensis)_in_flight_Chiloe.jpg','CC BY-SA 4.0','by-sa/4.0'],['tero-paisaje','Tero de pie en un humedal de Chiloé.','Charles J. Sharp','Southern_lapwing_(Vanellus_chilensis_chilensis)_Chiloe.jpg','CC BY-SA 4.0','by-sa/4.0']]
  };
  // Conservamos la referencia original del macachín (1920 px). Para las otras
  // especies, las dos tomas nuevas sustituyen miniaturas de menor resolución.
  const albumes=Object.fromEntries(Object.entries(fotos).map(([id,f])=>[id,[...(id==='macachin'?[f]:[]),...extras[id].map(([archivo,alt,autor,fuente,licencia,url])=>({...f,src:'assets/especies/'+archivo+'.jpg',alt,autor,fuente:'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(fuente),licencia,urlLicencia:'https://creativecommons.org/licenses/'+url+'/'}))]]));
  // Google Material Icons: open_in_full / close (Apache 2.0).
  const ampliar='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21 11V3h-8l3.29 3.29-10 10L3 13v8h8l-3.29-3.29 10-10L21 11z"/></svg>';
  const visor=document.createElement('dialog');
  visor.className='especie-visor';visor.setAttribute('aria-labelledby','especie-visor-titulo');
  visor.innerHTML='<div class="especie-visor__interior"><button type="button" class="especie-visor__cerrar" aria-label="Cerrar foto ampliada" autofocus><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button><figure><img class="especie-visor__imagen" alt=""><p class="especie-visor__error" hidden>No se pudo cargar la foto. Podés abrir la fuente original desde el crédito.</p><figcaption><h2 id="especie-visor-titulo"></h2><p class="especie-visor__detalle"></p><p class="especie-visor__credito"></p></figcaption></figure></div>';
  document.body.append(visor);
  const imagen=visor.querySelector('img');let origen=null,album=[],indice=0,cerrando=false,animacion;
  const reducido=()=>matchMedia('(prefers-reduced-motion:reduce)').matches||document.documentElement.dataset.detener==='true';
  const navegacion=document.createElement('nav');navegacion.className='especie-visor__navegacion';navegacion.setAttribute('aria-label','Fotos de la ficha');
  navegacion.innerHTML='<button type="button" aria-label="Foto anterior"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z"/></svg></button><span aria-live="polite"></span><button type="button" aria-label="Foto siguiente"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 4-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg></button>';visor.querySelector('figure').append(navegacion);
  function credito(nodo,f) {
    if(!f.fuente){nodo.textContent=f.credito||'Referencia aportada para el diseño';return;}
    const autor=document.createElement('a'),licencia=document.createElement('a');
    autor.href=f.fuente;autor.textContent=f.autor;licencia.href=f.urlLicencia;licencia.textContent=f.licencia;
    [autor,licencia].forEach(a=>{a.target='_blank';a.rel='noopener';});
    nodo.replaceChildren(f.tipo==='ilustracion'?'Ilustración: ':'Foto: ',autor,...(f.urlLicencia?[' · ',licencia]:[]));
  }
  function pintar(f){
    imagen.hidden=false;visor.querySelector('.especie-visor__error').hidden=true;
    imagen.alt=f.alt;imagen.src=f.src;
    visor.querySelector('h2').textContent=f.nombre;
    visor.querySelector('.especie-visor__detalle').textContent=f.detalle;
    credito(visor.querySelector('.especie-visor__credito'),f);
    navegacion.hidden=album.length<2;navegacion.querySelector('span').textContent=(indice+1)+' / '+album.length;
  }
  function abrir(id,boton,items) {
    const f=typeof id==='object'?id:fotos[id];if(!f || visor.open)return;
    origen=boton;album=items||[f];indice=Math.max(0,album.indexOf(f));cerrando=false;visor.classList.remove('especie-visor--cerrando');pintar(f);
    visor.showModal();document.body.classList.add('con-foto-especie');
    if(!reducido())animacion=visor.querySelector('.especie-visor__interior').animate([{opacity:0,transform:'translateY(24px) scale(.96)',filter:'blur(5px)'},{opacity:1,transform:'translateY(0) scale(1)',filter:'blur(0)'}],{duration:380,easing:'cubic-bezier(.16,1,.3,1)'});
  }
  function cambiar(paso){if(cerrando||album.length<2)return;indice=(indice+paso+album.length)%album.length;pintar(album[indice]);if(!reducido())imagen.animate([{opacity:.15,translate:(paso*16)+'px 0'},{opacity:1,translate:'0 0'}],{duration:260,easing:'ease-out'});}
  navegacion.firstElementChild.addEventListener('click',()=>cambiar(-1));navegacion.lastElementChild.addEventListener('click',()=>cambiar(1));
  visor.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();e.stopPropagation();cambiar(e.key==='ArrowLeft'?-1:1);}});
  imagen.addEventListener('error',()=>{imagen.hidden=true;visor.querySelector('.especie-visor__error').hidden=false;});
  async function cerrar(){
    if(!visor.open||cerrando)return;cerrando=true;animacion?.cancel();visor.classList.add('especie-visor--cerrando');
    if(!reducido()){animacion=visor.querySelector('.especie-visor__interior').animate([{opacity:1,transform:'translateY(0) scale(1)',filter:'blur(0)'},{opacity:0,transform:'translateY(16px) scale(.975)',filter:'blur(4px)'}],{duration:210,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});try{await animacion.finished;}catch{}}
    visor.close();animacion?.cancel();cerrando=false;
  }
  visor.addEventListener('cancel',e=>{e.preventDefault();cerrar();});
  visor.querySelector('button').addEventListener('click',cerrar);
  let desdeFondo=false;
  visor.addEventListener('pointerdown',e=>{desdeFondo=e.target===visor;});
  visor.addEventListener('click',e=>{if(desdeFondo&&e.target===visor)cerrar();desdeFondo=false;});
  visor.addEventListener('close',()=>{document.body.classList.remove('con-foto-especie');origen?.focus({preventScroll:true});origen=null;});
  // Consume Escape before the map/plant listeners can leave the current zoom.
  document.addEventListener('keydown',e=>{if(visor.open && e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();cerrar();}},true);
  ['wheel','touchmove','pointerdown','pointerup'].forEach(tipo=>visor.addEventListener(tipo,e=>e.stopPropagation(),{passive:true}));
  function mostrar(ficha,id,antesDe) {
    const items=albumes[id];if(!items)return;
    let grupo=ficha.querySelector('.especie-galeria');
    if(!grupo){grupo=document.createElement('div');grupo.className='especie-galeria';ficha.querySelector(antesDe).before(grupo);}
    grupo.setAttribute('aria-label','Fotos de '+fotos[id].nombre);galeria(grupo,items);
    ficha.scrollTop=0;
  }
  function galeria(nodo,items) {
    nodo.replaceChildren();
    items.forEach(f=>{
      const figura=document.createElement('figure');figura.className='vivienda-foto';
      const boton=document.createElement('button');boton.type='button';boton.className='especie-foto__abrir';
      boton.setAttribute('aria-label','Ampliar: '+f.nombre);boton.setAttribute('aria-haspopup','dialog');
      const img=document.createElement('img');img.src=f.src;img.alt=f.alt;img.loading='lazy';img.decoding='async';
      const expandir=document.createElement('span');expandir.className='especie-foto__expandir';expandir.innerHTML=ampliar;
      boton.append(img,expandir);boton.addEventListener('click',()=>abrir(f,boton,items));
      const leyenda=document.createElement('figcaption');leyenda.textContent=f.nombre;
      img.addEventListener('error',()=>{boton.disabled=true;leyenda.textContent='Imagen no disponible';});
      figura.append(boton,leyenda);nodo.append(figura);
    });
  }
  window.MUSUQ_FOTOS_ESPECIES={mostrar,galeria};
})();
