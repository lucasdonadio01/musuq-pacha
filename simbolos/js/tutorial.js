/* Tutorial del taller: recorre las zonas del generador con una carta y vela el resto.
   El anillo del botón pierde un tramo por cada paso que pasa. */
window.Tutorial=(()=>{
 const pasos=[
  {titulo:'Pueblos',texto:'Cada pueblo tiene sus propios patrones. Elegí uno para empezar.',zona:['.rail--izq .rotulo','#listaPueblos'],ancho:'.rail--izq',alterna:['.barra'],lado:'derecha'},
  {titulo:'Patrones',texto:'Tocá un patrón para sumarlo al tablero. Combiná los que quieras.',zona:['.rail--der .rotulo','.rail--der .piezas-ayuda','#banco-piezas'],ancho:'.rail--der',lado:'izquierda'},
  {titulo:'Seleccioná y arrastrá',texto:'Tocá un patrón del tablero y arrastralo para armar tu símbolo.',tablero:true,lado:'dentro'},
  {titulo:'Posiciones',texto:'Girá, espejá o duplicá el patrón que tengas seleccionado.',zona:['.piezas-etiqueta','#pieza-actual','.pieza-acciones','.pieza-historial'],ancho:'.rail--der',lado:'izquierda'}
 ];
 const dialogo=document.getElementById('tutorial');
 if(!dialogo)return {abrir(){}};
 const velo=dialogo.querySelector('.tuto__velo'),carta=dialogo.querySelector('.tuto__carta'),textos=dialogo.querySelector('.tuto__texto'),foco=dialogo.querySelector('.tuto__foco'),titulo=document.getElementById('tuto-titulo'),texto=document.getElementById('tuto-texto'),boton=document.getElementById('tuto-siguiente'),tramos=[...dialogo.querySelectorAll('.tuto__tramo')];
 const M=16,SALE_X=13,SALE_Y=15,AIRE=24,CURVA='cubic-bezier(.22,1,.36,1)';
 let paso=0,cerrando=false,cambiando=false,pedido=false;

 const quieto=()=>matchMedia('(prefers-reduced-motion:reduce)').matches||document.documentElement.dataset.detener==='true';
 const espera=ms=>new Promise(r=>setTimeout(r,quieto()?0:ms));
 const cuadro=()=>new Promise(r=>requestAnimationFrame(()=>r()));
 const visible=b=>b.width>0&&b.height>0;

 function union(selectores){
  let r=null;
  selectores.forEach(s=>{const e=document.querySelector(s);if(!e)return;const b=e.getBoundingClientRect();if(!visible(b))return;
   r=r?{left:Math.min(r.left,b.left),top:Math.min(r.top,b.top),right:Math.max(r.right,b.right),bottom:Math.max(r.bottom,b.bottom)}:{left:b.left,top:b.top,right:b.right,bottom:b.bottom};});
  return r;
 }
 function zona(p){
  if(p.tablero){
   const l=document.getElementById('lienzo').getBoundingClientRect(),g=Simbolo.geo,n=Simbolo.lado,a=8;
   if(g.W&&g.celda)return {left:l.left+g.x0-a,top:l.top+g.y0-a,right:l.left+g.x0+n*g.celda+a,bottom:l.top+g.y0+n*g.celda+a};
   return {left:l.left,top:l.top,right:l.right,bottom:l.bottom};
  }
  let r=union(p.zona),ancho=null;
  if(r){r.left-=12;r.right+=12;r.top-=14;r.bottom+=14;ancho=p.ancho&&document.querySelector(p.ancho)?.getBoundingClientRect();}
  else if(p.alterna){r=union(p.alterna);}
  if(r&&ancho&&visible(ancho)){r.left=ancho.left;r.right=ancho.right;}
  return r;
 }
 /* En móvil el panel de piezas queda debajo del lienzo: se trae la zona al centro antes de medir. */
 function traer(r){
  if(!r)return;const alto=innerHeight;
  if(r.top<0||r.bottom>alto)window.scrollBy({top:(r.top+r.bottom)/2-alto/2,behavior:'instant'});
 }
 function hueco(r){
  const s=velo.style;
  s.setProperty('--tuto-l',Math.round(r.left)+'px');s.setProperty('--tuto-t',Math.round(r.top)+'px');
  s.setProperty('--tuto-r',Math.round(r.right)+'px');s.setProperty('--tuto-b',Math.round(r.bottom)+'px');
 }
 function ubicar(r,lado){
  const cw=carta.offsetWidth,ch=carta.offsetHeight,vw=innerWidth,vh=innerHeight;
  const entra=(x,y)=>x>=M&&x+cw+SALE_X<=vw-M&&y>=M&&y+ch+SALE_Y<=vh-M;
  const centroX=Math.min(Math.max((r.left+r.right)/2-cw/2,M),vw-M-SALE_X-cw);
  const opciones={
   derecha:[r.right+AIRE,r.top+12],
   izquierda:[r.left-cw-SALE_X-6,(r.top+r.bottom)/2-ch/2],
   abajo:[centroX,r.bottom+AIRE],
   arriba:[centroX,r.top-AIRE-ch-SALE_Y],
   dentro:[centroX,r.bottom-ch-40]
  };
  let elegida=null;
  for(const nombre of [lado,'abajo','arriba']){const o=opciones[nombre];if(o&&entra(o[0],o[1])){elegida=o;break;}}
  const [x,y]=elegida||opciones.dentro;
  carta.style.translate=Math.round(Math.min(Math.max(x,M),vw-M-SALE_X-cw))+'px '+Math.round(Math.min(Math.max(y,M),vh-M-SALE_Y-ch))+'px';
 }
 function acomodar(){
  pedido=false;if(!dialogo.open)return;
  const p=pasos[paso];let r=zona(p);traer(r);r=zona(p);
  if(!r)r={left:innerWidth/2,right:innerWidth/2,top:innerHeight/2,bottom:innerHeight/2};
  hueco(r);ubicar(r,r.left===r.right?'dentro':p.lado);
 }
 function pedir(){if(pedido)return;pedido=true;requestAnimationFrame(acomodar);}

 function escribir(i){
  const p=pasos[i];titulo.textContent=p.titulo;texto.textContent=p.texto;
  tramos.forEach(t=>t.classList.toggle('tuto__tramo--apagado',+t.dataset.orden<i));
  boton.setAttribute('aria-label',(i===pasos.length-1?'Terminar el tutorial':'Siguiente consejo')+', paso '+(i+1)+' de '+pasos.length);
 }
 function latido(){
  if(quieto()||!foco.animate)return;
  foco.animate([{scale:.7,opacity:.4},{scale:1.12,opacity:1,offset:.55},{scale:1,opacity:1}],{duration:560,easing:CURVA});
 }
 async function avanzar(){
  if(cambiando||cerrando)return;
  if(paso>=pasos.length-1){cerrar();return;}
  cambiando=true;
  textos.classList.add('tuto__texto--cambia');await espera(180);
  paso++;escribir(paso);acomodar();
  await cuadro();textos.classList.remove('tuto__texto--cambia');latido();
  await espera(260);cambiando=false;
 }
 async function cerrar(){
  if(cerrando||!dialogo.open)return;cerrando=true;
  tramos.forEach(t=>t.classList.add('tuto__tramo--apagado'));
  await espera(200);dialogo.classList.remove('tuto--visible');await espera(520);
  dialogo.close();cerrando=false;
  document.getElementById('lienzo')?.focus({preventScroll:true});
 }
 boton.addEventListener('click',avanzar);
 dialogo.addEventListener('cancel',e=>{e.preventDefault();cerrar();});
 dialogo.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();cerrar();}});
 addEventListener('resize',pedir,{passive:true});
 addEventListener('scroll',pedir,{passive:true});

 return {
  async abrir(){
   if(dialogo.open)return;
   paso=0;escribir(0);
   dialogo.classList.add('tuto--quieto');dialogo.classList.remove('tuto--visible');
   dialogo.showModal();boton.focus({preventScroll:true});
   acomodar();carta.offsetWidth;
   dialogo.classList.remove('tuto--quieto');
   await cuadro();dialogo.classList.add('tuto--visible');latido();
  },
  cerrar,
  get abierto(){return dialogo.open;}
 };
})();
