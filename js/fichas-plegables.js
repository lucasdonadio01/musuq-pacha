/* Fichas del árbol, la fauna y la flora en el celular: cada vez que se abre una arranca plegada
   (volver, rótulo y nombre) para que se vea la ilustración; la flecha o un toque la despliega. */
(function(){
  const movil=matchMedia('(max-width:760px)');
  const quieto=()=>matchMedia('(prefers-reduced-motion:reduce)').matches||document.documentElement.dataset.detener==='true';
  const flecha='<svg viewBox="0 -960 960 960" aria-hidden="true" focusable="false"><path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z"/></svg>';
  const tipos=[
    {ficha:'.vista-arbol__carta',volver:'.vista-arbol__volver',fijas:['.vista-arbol__rotulo','.vista-arbol__nombre'],nombre:'.vista-arbol__nombre'},
    {ficha:'#vista-fauna',volver:'#fauna-volver',fijas:['.fauna__rotulo','#fauna-nombre'],nombre:'#fauna-nombre'},
    {ficha:'#flora-ficha',volver:'.flora-cerrar',fijas:['.flora-rotulo','h2'],nombre:'h2'}
  ];
  const fichas=[];

  function hijoDirecto(ficha,el){while(el&&el.parentElement!==ficha)el=el.parentElement;return el;}
  function plegar(item,plegada,animar){
    const {ficha,boton}=item;
    if(!movil.matches)plegada=false;
    if(ficha.classList.contains('ficha--plegada')===plegada)return;
    const antes=ficha.getBoundingClientRect().height;
    ficha.classList.toggle('ficha--plegada',plegada);
    boton.setAttribute('aria-expanded',String(!plegada));
    boton.setAttribute('aria-label',plegada?'Ver la ficha completa':'Plegar la ficha');
    if(!animar||quieto()||!ficha.animate||!antes)return;
    const despues=ficha.getBoundingClientRect().height;
    ficha.classList.add('ficha--animando');
    const curva='cubic-bezier(.22,1,.36,1)';
    ficha.animate([{height:antes+'px'},{height:despues+'px'}],{duration:420,easing:curva}).finished.catch(()=>{}).then(()=>ficha.classList.remove('ficha--animando'));
    if(!plegada)[...ficha.children].filter(h=>!h.classList.contains('ficha-plegable__fija')&&h!==boton).forEach((h,i)=>h.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:320,delay:90+i*30,easing:curva,fill:'backwards'}));
  }
  function preparar(tipo){
    const ficha=document.querySelector(tipo.ficha);
    if(!ficha||ficha.classList.contains('ficha-plegable'))return !!ficha;
    ficha.classList.add('ficha-plegable');
    const volver=hijoDirecto(ficha,ficha.querySelector(tipo.volver));
    if(volver)volver.classList.add('ficha-plegable__fija','ficha-plegable__volver');
    tipo.fijas.forEach(s=>hijoDirecto(ficha,ficha.querySelector(s))?.classList.add('ficha-plegable__fija'));
    const boton=document.createElement('button');
    boton.type='button';boton.className='ficha-plegable__toggle';boton.innerHTML=flecha;
    ficha.append(boton);
    const item={ficha,boton};fichas.push(item);
    boton.addEventListener('click',e=>{e.stopPropagation();plegar(item,!ficha.classList.contains('ficha--plegada'),true);});
    ficha.addEventListener('click',e=>{if(ficha.classList.contains('ficha--plegada')&&!e.target.closest('button,a'))plegar(item,false,true);});
    // cada especie o árbol nuevo vuelve a arrancar plegado
    const nombre=ficha.querySelector(tipo.nombre);
    if(nombre)new MutationObserver(()=>plegar(item,true,false)).observe(nombre,{childList:true,characterData:true,subtree:true});
    new MutationObserver(()=>{if(!ficha.hidden)plegar(item,true,false);}).observe(ficha,{attributes:true,attributeFilter:['hidden']});
    plegar(item,true,false);
    return true;
  }
  function prepararTodas(){return tipos.map(preparar).every(Boolean);}
  if(!prepararTodas()){
    // la ficha de flora se crea cuando carga el mapa
    const espera=new MutationObserver(()=>{if(prepararTodas())espera.disconnect();});
    espera.observe(document.body,{childList:true});
  }
  movil.addEventListener('change',()=>fichas.forEach(item=>plegar(item,movil.matches,false)));
})();
