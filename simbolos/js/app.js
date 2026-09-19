(() => {
 'use strict';
 const $=s=>document.querySelector(s),C=Composicion,portada=$('#portada'),taller=$('#taller'),lienzo=$('#lienzo'),ctx=lienzo.getContext('2d'),estado=$('#estado');
 let pueblo=Patrones.pueblos[0],color=pueblo.colores[0].h,fondo=pueblo.fondo,tinta='#1B1A19',alcance='pieza',celda=null,drag=null;
 const drafts=new Map(),dpr=()=>Math.min(devicePixelRatio||1,2);
 const quiet=()=>matchMedia('(prefers-reduced-motion:reduce)').matches||Boolean(window.MUSUQ_A11Y?.estado.detener);
 function avisar(text){estado.textContent=text;}
 function menu(open){$('#menu').classList.toggle('abierto',open);}
 $('#volver').onclick=()=>menu(true);$('#cerrarMenu').onclick=()=>menu(false);
 function aplicarFondo(hex){
  fondo=hex;Simbolo.fondo=hex;const rgb=Simbolo.aRgb(hex),claro=(.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2])/255>.52;
  tinta=claro?'#1B1A19':'#F5F2EB';const root=document.documentElement.style;
  root.setProperty('--fondo',hex);root.setProperty('--tinta',tinta);root.setProperty('--suave',claro?'#514b45':'#ded5cc');root.setProperty('--linea',claro?'#80776c':'#aa9e8d');
  Fondo.paleta(hex,Simbolo.aHex(rgb.map(v=>v+((claro?0:255)-v)*(claro ? .16 : .22))));$('#colorFondo').value=hex;
 }
 function dibujarMapa(){
  const cv=$('#mapa'),d=dpr(),step=4;cv.width=MAPA.cols*step*d;cv.height=MAPA.filas.length*step*d;cv.style.width=MAPA.cols*step+'px';cv.style.height=MAPA.filas.length*step+'px';
  const c=cv.getContext('2d');c.scale(d,d);const index=MAPA.orden.indexOf(pueblo.id),mark=String(index+1);
  MAPA.filas.forEach((row,y)=>[...row].forEach((v,x)=>{if(v==='.')return;c.fillStyle=index>=0&&v===mark?pueblo.colores[0].h:'#777';c.fillRect(x*step,y*step,step-1,step-1);}));
  cv.hidden=index<0;$('#mapaPie').textContent=pueblo.bioma;
 }
 function armarPueblos(){
  $('#listaPueblos').replaceChildren();Patrones.pueblos.forEach(p=>{
   const li=document.createElement('li'),b=document.createElement('button');b.type='button';b.setAttribute('aria-pressed',String(p.id===pueblo.id));
   const sw=document.createElement('span');sw.className='muestra';sw.style.background=p.colores[0].h;
   const text=document.createElement('span'),name=document.createElement('b'),region=document.createElement('i');name.textContent=p.nombre;region.textContent=p.region;text.append(name,region);b.append(sw,text);b.onclick=()=>elegirPueblo(p);li.append(b);$('#listaPueblos').append(li);
  });
 }
 function elegirColor(hex,name){
  color=hex;$('#colorLibre').value=hex;$('#notaColor').textContent=name||'Color libre';
  $('#paleta').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.hex===hex)));
  if(C.current()&&(alcance==='pieza'||celda)){C.color(hex,alcance==='celda'?celda:null);sync();avisar(alcance==='celda'?'Color aplicado a la celda.':'Color aplicado a la pieza.');}
  else if(alcance==='celda')avisar('Tocá una celda de la composición para aplicar este color.');
 }
 function armarPaleta(){
  const el=$('#paleta'),more=el.querySelector('.mas');el.querySelectorAll('button').forEach(b=>b.remove());
  pueblo.colores.forEach(c=>{const b=document.createElement('button');b.type='button';b.style.background=c.h;b.dataset.hex=c.h;b.title=c.n;b.setAttribute('aria-label',c.n);b.setAttribute('aria-pressed',String(c.h===color));b.onclick=()=>elegirColor(c.h,c.n);el.insertBefore(b,more);});
  $('#notaColor').textContent=pueblo.colores.find(c=>c.h===color)?.n||'Color libre';
 }
 function mini(def){
  const cv=document.createElement('canvas');cv.width=cv.height=100;cv.setAttribute('aria-hidden','true');const c=cv.getContext('2d'),w=def.filas[0].length,h=def.filas.length,step=76/Math.max(w,h);
  def.filas.forEach((row,y)=>[...row].forEach((n,x)=>{if(n==='.')return;c.fillStyle=def.colores[+n-1];c.fillRect((100-w*step)/2+x*step,(100-h*step)/2+y*step,Math.ceil(step),Math.ceil(step));}));return cv;
 }
 function banco(){
  $('#banco-piezas').replaceChildren();Patrones.piezas[pueblo.id].forEach(def=>{
   const b=document.createElement('button');b.type='button';b.className='pieza-mini';b.dataset.pieza=def.id;b.setAttribute('aria-label','Agregar '+def.nombre);const text=document.createElement('span');text.textContent=def.nombre;b.append(mini(def),text);
   b.onclick=()=>{celda=null;if(!C.add(def.id)){avisar('Podés combinar hasta '+C.limite+' piezas. Quitá una para sumar otra.');return;}sync();avisar(def.nombre+' agregada. Arrastrala para ubicarla.');};$('#banco-piezas').append(b);
  });
  $('#referencias-piezas').replaceChildren();[...new Set(Patrones.piezas[pueblo.id].map(p=>p.ref))].forEach(id=>{
   const ref=Patrones.refs[id],b=document.createElement('button'),im=document.createElement('img'),s=document.createElement('span');b.type='button';b.className='referencia-mini';b.setAttribute('aria-label','Ver referencia: '+ref.titulo);im.src='assets/referencias/'+ref.imagen;im.alt=ref.titulo+' · '+ref.cultura;s.textContent=ref.titulo;b.append(im,s);b.onclick=()=>abrirReferencia(ref,b);$('#referencias-piezas').append(b);
  });$('#referencias-nota').textContent=Patrones.avisos[pueblo.id];
 }
 function sync(animate=true){
  Simbolo.lado=C.N;Simbolo.cantidadPiezas=C.items.length;Simbolo.cargar(C.compose(),performance.now(),animate);Simbolo.seleccion.clear();const item=C.current();
  if(item)C.cells(item).filter(c=>alcance==='pieza'||(celda&&c.x===celda[0]&&c.y===celda[1])).forEach(c=>Simbolo.seleccion.add(c.x+','+c.y));
  const select=$('#pieza-actual');select.replaceChildren();if(!C.items.length){const o=document.createElement('option');o.textContent='Sumá una pieza';select.append(o);}
  C.items.forEach((i,n)=>{const o=document.createElement('option');o.value=i.id;o.textContent=(n+1)+'. '+C.find(i.tipo).nombre;o.selected=i.id===C.selected;select.append(o);});
  select.disabled=!C.items.length;document.querySelectorAll('.pieza-acciones button').forEach(b=>b.disabled=!item);
  $('#pieza-deshacer').disabled=!C.canUndo;$('#pieza-rehacer').disabled=!C.canRedo;$('#png').disabled=!C.items.length;$('#limpiar').disabled=!C.items.length;
 }
 function elegirPueblo(p){
  drafts.set(pueblo.id,{items:JSON.parse(JSON.stringify(C.items)),selected:C.selected});pueblo=p;Simbolo.pueblo=p;color=p.colores[0].h;celda=null;
  C.switchTo(p.id,drafts.get(p.id));aplicarFondo(p.fondo);armarPueblos();armarPaleta();dibujarMapa();banco();sync();menu(false);
  $('#puebloActual').textContent=p.nombre;avisar('Combiná piezas de '+p.nombre+'. Las fotos muestran sus referencias.');
 }
 const refDialog=$('#referencia-dialog');let refOpener=null,refClosing=false;
 function abrirReferencia(ref,button){
  refOpener=button;refClosing=false;const im=$('#referencia-imagen');im.src='assets/referencias/'+ref.imagen;im.alt=ref.titulo+' · '+ref.cultura;
  $('#referencia-titulo').textContent=ref.titulo;$('#referencia-lugar').textContent=ref.lugar;$('#referencia-cultura').textContent=ref.cultura;$('#referencia-descripcion').textContent=ref.descripcion;$('#referencia-fuente').textContent='Fuente: '+ref.fuente;
  $('#referencia-aclaracion').textContent=Patrones.avisos[pueblo.id]+' Las piezas del juego son simplificaciones geométricas contemporáneas de estas formas.';
  $('#referencia-figma').href='https://www.figma.com/design/GD2CfjtdvtZAZVxsYDf7ba/tif-multi?node-id='+ref.node.replace(':','-');
  refDialog.showModal();$('.referencia-cerrar').focus();
  if(!quiet())refDialog.animate([{opacity:0,transform:'translateY(20px) scale(.96)',filter:'blur(5px)'},{opacity:1,transform:'none',filter:'blur(0)'}],{duration:360,easing:'cubic-bezier(.16,1,.3,1)'});
 }
 async function cerrarReferencia(){
  if(refClosing||!refDialog.open)return;refClosing=true;if(!quiet())await refDialog.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translateY(12px) scale(.98)'}],{duration:220,easing:'ease-in',fill:'forwards'}).finished.catch(()=>{});
  refDialog.close();refDialog.getAnimations().forEach(a=>a.cancel());refClosing=false;refOpener?.focus();
 }
 $('.referencia-cerrar').onclick=cerrarReferencia;refDialog.addEventListener('cancel',e=>{e.preventDefault();cerrarReferencia();});
 refDialog.addEventListener('click',e=>{if(e.target!==refDialog)return;const r=refDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)cerrarReferencia();});
 function cuadro(now){
  if(!taller.hidden&&!document.hidden){const r=lienzo.getBoundingClientRect();if(r.width&&r.height){const d=dpr(),w=Math.round(r.width*d),h=Math.round(r.height*d);if(lienzo.width!==w||lienzo.height!==h){lienzo.width=w;lienzo.height=h;}ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,r.width,r.height);Simbolo.componer(ctx,r.width,r.height,now,{interfaz:true,tinta});
   if(!C.items.length){ctx.fillStyle=tinta;ctx.textAlign='center';ctx.font='500 16px "Space Grotesk"';ctx.fillText('Elegí una pieza para empezar',r.width/2,r.height/2);}
  }}requestAnimationFrame(cuadro);
 }
 function ondaDesdeElSimbolo(){if(Fondo.cfg.quieto)return;const r=lienzo.getBoundingClientRect();Fondo.onda(r.left+r.width/2,r.top+r.height/2);}
 function generar(){C.variation(pueblo.id);celda=null;sync();ondaDesdeElSimbolo();avisar('Nueva combinación de las mismas piezas. Podés deshacerla.');}
 const celdaDe=e=>{const r=lienzo.getBoundingClientRect();return Simbolo.celdaEn(e.clientX-r.left,e.clientY-r.top);};
 lienzo.addEventListener('pointerdown',e=>{
  if(e.button&&e.button!==0)return;const cell=celdaDe(e);if(!cell)return;const item=C.hit(...cell);if(!item){celda=null;C.select(null);sync(false);return;}
  C.select(item.id);celda=cell;lienzo.focus({preventScroll:true});
  if(alcance==='celda'){C.color(color,cell);sync();avisar('Celda coloreada. Las otras celdas mantienen su color.');return;}
  drag={id:e.pointerId,x:cell[0],y:cell[1],ix:item.x,iy:item.y,moved:false};sync(false);lienzo.setPointerCapture(e.pointerId);
 });
 lienzo.addEventListener('pointermove',e=>{const cell=celdaDe(e);Simbolo.hover=cell;if(!drag||!cell)return;const x=drag.ix+cell[0]-drag.x,y=drag.iy+cell[1]-drag.y;if(x===C.current().x&&y===C.current().y)return;if(!drag.moved){C.checkpoint();drag.moved=true;}C.move(x,y,false);sync(false);});
 ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>lienzo.addEventListener(ev,()=>{if(drag?.moved)avisar('Pieza ubicada.');drag=null;}));
 lienzo.addEventListener('pointerleave',()=>{if(!drag)Simbolo.hover=null;});
 $('#pieza-actual').onchange=e=>{C.select(+e.target.value);celda=null;sync(false);};
 const actions={'pieza-girar':'rotate','pieza-espejar':'flip','pieza-duplicar':'duplicate','pieza-quitar':'remove','pieza-deshacer':'undo','pieza-rehacer':'redo'};
 Object.entries(actions).forEach(([id,action])=>$('#'+id).onclick=()=>{const result=C[action]();celda=null;sync();avisar(action==='duplicate'&&!result?'Llegaste al límite de piezas.':'Composición actualizada.');});
 document.querySelectorAll('[data-alcance]').forEach(b=>b.onclick=()=>{alcance=b.dataset.alcance;celda=null;document.querySelectorAll('[data-alcance]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('#ayuda-color-pieza').textContent=alcance==='pieza'?'Elegí una pieza y después un color.':'Tocá una celda; o usá flechas y Enter sobre el lienzo.';sync(false);});
 $('#colorLibre').oninput=e=>elegirColor(e.target.value);$('#colorFondo').oninput=e=>aplicarFondo(e.target.value);
 $('#generar').onclick=generar;$('#limpiar').onclick=()=>{C.clear();celda=null;sync();avisar('Lienzo vacío. Podés deshacer o sumar otra pieza.');};
 lienzo.addEventListener('keydown',e=>{
  if(document.querySelector('dialog[open]'))return;const key=e.key.toLowerCase(),i=C.current();
  if((e.ctrlKey||e.metaKey)&&key==='z'){e.preventDefault();e.shiftKey?C.redo():C.undo();sync();return;}
  const move={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
  if(i&&move){
   e.preventDefault();
   if(alcance==='celda'){
    const cells=C.cells(i),start=celda||[cells[0].x,cells[0].y];
    const candidates=cells.filter(c=>move[0]?(c.x-start[0])*move[0]>0:(c.y-start[1])*move[1]>0);
    candidates.sort((a,b)=>{
     const cost=c=>move[0]?Math.abs(c.y-start[1])*100+Math.abs(c.x-start[0]):Math.abs(c.x-start[0])*100+Math.abs(c.y-start[1]);return cost(a)-cost(b);
    });
    celda=candidates.length?[candidates[0].x,candidates[0].y]:start;
    avisar('Celda '+(celda[0]+1)+', '+(celda[1]+1)+'. Enter para aplicar el color.');
   }else C.move(i.x+move[0],i.y+move[1]);
   sync(false);
  }
  if(i&&alcance==='celda'&&(e.key==='Enter'||e.key===' ')){
   e.preventDefault();const c=C.cells(i)[0];celda=celda||[c.x,c.y];C.color(color,celda);sync(false);avisar('Color aplicado a la celda seleccionada.');
  }
  if(i&&key==='r'){C.rotate();sync();}if(i&&['Delete','Backspace'].includes(e.key)){e.preventDefault();C.remove();sync();}
  if(key==='g')generar();if(e.key==='Escape'){C.select(null);celda=null;sync(false);}
 });
  /* ---------- exportar ---------- */
  const SITIO = 'lucasdonadio01.github.io/musuq-pacha';

  function componerCuadro(W, H, ahora, conPie) {
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    const r = lienzo.getBoundingClientRect();
    const d = dpr();
    c.fillStyle = fondo;
    c.fillRect(0, 0, W, H);
    try {
      const objetivo = W / H;
      let sw = r.width * d, sh = r.height * d;
      if (sw / sh > objetivo) sw = sh * objetivo; else sh = sw / objetivo;
      const sx = r.left * d + (r.width * d - sw) / 2;
      const sy = r.top * d + (r.height * d - sh) / 2;
      c.drawImage(Fondo.lienzo, sx, sy, sw, sh, 0, 0, W, H);
    } catch (err) { /* sin WebGL queda el fondo plano */ }
    Simbolo.componer(c, W, H, ahora, { interfaz: false, tinta, pie: conPie ? SITIO : null });
    return cv;
  }

  const overlay = $('#exportar');
  let compartido = null;
  const nombreSimbolo = $('#simbolo-nombre');
  function datosActuales() {
    return {v:1,nombre:nombreSimbolo.value,pueblo:pueblo.nombre,lado:Simbolo.lado,fondo,
      celdas:[...Simbolo.grilla].map(([k,h])=>[...k.split(',').map(Number),h])};
  }
  const abrirExport = abrir => {
    if (!abrir) { overlay.close(); return; }
    compartido = datosActuales();
    if (!Comunidad.validar(compartido)) { avisar('Combiná al menos una pieza antes de compartirla.');return; }
    mostrarCompartido();
  };
  function mostrarCompartido() {
    nombreSimbolo.value = compartido.nombre;
    Comunidad.dibujar($('#compartir-preview'),compartido);
    $('#compartir-pueblo').textContent = 'Inspiración · '+compartido.pueblo;
    $('#compartir-estado').textContent = '';
    $('.enlace-manual').hidden = true;
    $('#publicar-simbolo').disabled = false;
    if (/^(localhost|127\.|\[::1\])/.test(location.hostname)) {
      $('#enlace-simbolo').textContent = 'Copiar enlace local';
      $('.compartir__nota').textContent = 'Este tablero se guarda en tu navegador. Estás en una vista local: el enlace solo abre en esta computadora. Para compartirlo con otras personas, usá el sitio publicado. No hay concurso público habilitado.';
    }
    overlay.showModal();
  }
  $('#png').addEventListener('click', () => abrirExport(true));
  $('#cancelarExport').addEventListener('click', () => abrirExport(false));
  overlay.addEventListener('click', e => { if (e.target === overlay) abrirExport(false); });

  nombreSimbolo.addEventListener('input',()=>{
    if (compartido) compartido.nombre = nombreSimbolo.value;
    $('#publicar-simbolo').disabled = false;
  });
  $('#publicar-simbolo').addEventListener('click',()=>{
    try { Comunidad.guardar(compartido);$('#compartir-estado').textContent='Listo. Tu símbolo está en el tablero de este navegador.';$('#publicar-simbolo').disabled=true; }
    catch(e){$('#compartir-estado').textContent=e.message;}
  });
  $('#enlace-simbolo').addEventListener('click',async()=>{
    try {
      if(location.protocol==='file:')throw Error('Para compartir un enlace abrí el sitio desde el servidor o la web publicada. El editor funciona sin conexión.');
      const url=Comunidad.enlace(compartido,'./index.html');
      try { await navigator.clipboard.writeText(url);$('#compartir-estado').textContent=/^(localhost|127\.|\[::1\])/.test(location.hostname)?'Enlace local copiado. Solo funciona en esta computadora; compartilo desde el sitio publicado para que otras personas puedan abrirlo.':'Enlace copiado. Quien lo abra podrá ver este símbolo, sin depender de tu tablero local.'; }
      catch { $('.enlace-manual').hidden=false;$('#enlace-manual').value=url;$('#enlace-manual').focus();$('#enlace-manual').select();$('#compartir-estado').textContent='El navegador bloqueó la copia automática. Copiá el enlace del campo.'; }
    } catch(e){$('#compartir-estado').textContent=e.message;}
  });
  function leerEnlace() {
    if(!location.hash.startsWith('#simbolo='))return;
    compartido=Comunidad.decodificar(location.hash);
    if(compartido)mostrarCompartido();
    else { avisar('El enlace del símbolo no es válido. Podés crear uno nuevo.');$('#bloque .bajada').textContent='No pudimos leer ese símbolo. Podés empezar y crear el tuyo.'; }
  }


 async function entrar(){
  if(entrar.yendo)return;entrar.yendo=true;taller.hidden=false;dibujarMapa();sync();
  portada.classList.add('portada--sale');await Mosaico.caer();portada.hidden=true;Mosaico.detener();ondaDesdeElSimbolo();
  avisar('Sumá una pieza desde el banco. Arrastrala para combinarla.');
 }
 $('#entrar').onclick=entrar;
 const movimiento=matchMedia('(prefers-reduced-motion:reduce)');
 function sincronizarMovimiento(){const q=quiet();Simbolo.quieto=q;Fondo.cfg.quieto=q;Mosaico.quieto=q;}
 addEventListener('musuq:accesibilidad',sincronizarMovimiento);movimiento.addEventListener('change',sincronizarMovimiento);
 Simbolo.pueblo=pueblo;Simbolo.lado=C.N;C.reset(pueblo.id,false);aplicarFondo(pueblo.fondo);armarPueblos();armarPaleta();banco();sync();$('#puebloActual').textContent=pueblo.nombre;
 if(!Fondo.iniciar($('#fondo')))$('#fondo').style.display='none';
 sincronizarMovimiento();requestAnimationFrame(cuadro);Mosaico.iniciar($('#mosaico'),$('#bloque'));leerEnlace();addEventListener('hashchange',leerEnlace);
 window.__mp={Simbolo,Fondo,Mosaico,Composicion:C,componerCuadro,entrar,get pueblo(){return pueblo;}};
})();
