/* Indicador de scroll del home: baja de sección en sección y, al llegar al pie, apunta hacia arriba. */
(function(){
  var boton=document.getElementById('deslizar');
  if(!boton) return;
  var orden=['territorio','archivo','encuentro','comunidad','descarga','pie'];
  var pie=document.getElementById('pie');

  function alto(){
    var valor=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--site-header-height'));
    return isNaN(valor)?78:valor;
  }
  function topes(){
    var margen=alto(),y=window.scrollY||window.pageYOffset;
    return orden.map(function(id){
      var seccion=document.getElementById(id);
      if(!seccion) return null;
      return Math.max(0,Math.round(seccion.getBoundingClientRect().top+y-margen));
    }).filter(function(v){return v!==null;});
  }
  function suave(){
    if(document.documentElement.dataset.detener==='true') return 'auto';
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
  }
  function ir(destino){
    window.scrollTo({top:destino,behavior:suave()});
  }

  boton.addEventListener('click',function(){
    var y=window.scrollY||window.pageYOffset,lista=topes(),i,destino=null;
    if(boton.dataset.sentido==='arriba'){
      for(i=lista.length-1;i>=0;i--){ if(lista[i]<y-8){destino=lista[i];break;} }
      ir(destino===null?0:destino);
      return;
    }
    for(i=0;i<lista.length;i++){ if(lista[i]>y+8){destino=lista[i];break;} }
    ir(destino===null?document.documentElement.scrollHeight:destino);
  });

  var pedido=false;
  function revisar(){
    pedido=false;
    if(!pie) return;
    var arriba=pie.getBoundingClientRect().top<=window.innerHeight*0.85;
    boton.dataset.sentido=arriba?'arriba':'abajo';
    boton.setAttribute('aria-label',arriba?'Volver al inicio de la página':'Bajar a la siguiente sección');
  }
  function alScroll(){
    if(pedido) return;
    pedido=true;
    requestAnimationFrame(revisar);
  }
  addEventListener('scroll',alScroll,{passive:true});
  addEventListener('resize',alScroll,{passive:true});
  revisar();
})();
