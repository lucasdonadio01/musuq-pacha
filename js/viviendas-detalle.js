/* Fichas y recorrido de las viviendas. Hereda la estética de los árboles:
   la cámara recorre el mismo territorio y la ficha reúne descripción, entrada y galería.
   Las fotografías documentales y las interpretaciones 3D se identifican por separado. */
(() => {
  'use strict';
  const ruta='assets/viviendas/galeria/';
  const referencia=(archivo,nombre,alt)=>({src:ruta+archivo,nombre,alt,detalle:'Fotografía de referencia · reconstrucción contemporánea',credito:'Referencia aportada para el diseño'});
  const render=(archivo,nombre)=>({src:ruta+archivo,nombre,alt:nombre,detalle:'Ilustración 3D del modelo de Musuq Pacha',credito:'Modelo e ilustración creados para Musuq Pacha',tipo:'ilustracion'});
  const datos={
    'aldea-omaguaca':{nombre:'Aldea de piedra',pueblo:'Omaguaca',rotulo:'ALDEA · OMAGUACA',materiales:'Piedra · patios · caminos de lajas',descripcion:'Seis casas de piedra, patios abiertos y caminos de lajas forman esta aldea. Acercate para ver los detalles o entrá a la casa central y mirá el paisaje desde adentro.',nota:'Interpretación 3D de las referencias aportadas; no es una reconstrucción arqueológica exacta.',radio:28,alto:1.25,puerta:[0,1.4,5.7],fotos:[
      {src:ruta+'omaguaca-foto.png',nombre:'Aldea de piedra · referencia',alt:'Conjunto de casas de piedra, patios y cardones sobre una ladera.',detalle:'Fotografía de referencia aportada para el diseño',credito:'Referencia aportada; autor y localización exacta no confirmados'},
      {src:ruta+'omaguaca-aldea.png',nombre:'Viviendas y patios',alt:'Ilustración de casas de piedra conectadas por espacios comunes y caminos.',detalle:'Ilustración de referencia aportada para el diseño',credito:'Referencia aportada; autor no identificado',tipo:'ilustracion'},
      {src:ruta+'omaguaca-casa.png',nombre:'Casa de piedra · boceto',alt:'Boceto de una vivienda rectangular construida con piedras.',detalle:'Ilustración de referencia aportada para el diseño',credito:'Referencia aportada; autor no identificado',tipo:'ilustracion'},
      render('omaguaca-exterior-3d.png','Aldea · ilustración 3D'),render('omaguaca-interior-3d.png','Casa central · interior 3D')
    ]},
    maloka:{nombre:'Maloka',materiales:'Paja · madera · barro · piedra',descripcion:'Una cubierta de paja envuelve la estructura de madera. La entrada de barro tiene una puerta central y pequeñas ventanas; las piedras acompañan la base. Adentro podés recorrer con la mirada las costillas del techo y el espacio común.',nota:'Interpretación 3D a partir de las referencias de una maloka contemporánea.',fotos:[
      referencia('maloka-frente.png','Fachada de barro','Fachada de barro con puerta abierta, dos ventanas y techo de paja.'),
      referencia('maloka-exterior.png','Cubierta de paja','Vista exterior de la reconstrucción de paja y madera.'),
      referencia('maloka-interior-foto.png','Estructura interior','Arcos y varillas de madera vistos desde el interior de la maloka.'),
      referencia('maloka-ventana.png','Barro y ventana','Detalle de la ventana abierta en el muro de barro y la cubierta vegetal.'),
      render('maloka-exterior-3d.png','Maloka · ilustración 3D'),render('maloka-interior-3d.png','Maloka · interior 3D')
    ]},
    'carpa-pieles':{nombre:'Carpa de pieles',materiales:'Pieles · palos · rocas',descripcion:'Los palos sostienen una cubierta de pieles, sujeta junto al suelo con rocas. La abertura frontal deja entrar la luz y permite acceder al refugio. En el modelo podés observar las uniones de madera, la cara interior de la cubierta y el piso de tierra.',nota:'Interpretación del diseño de referencia; no es una reconstrucción arqueológica exacta.',fotos:[
      {src:ruta+'carpa-ilustracion.png',nombre:'Carpa · ilustración de referencia',alt:'Ilustración de una carpa cónica de pieles sostenida por palos y rocas.',detalle:'Ilustración de referencia aportada para el diseño',credito:'Referencia aportada; autor no identificado',tipo:'ilustracion'},
      render('carpa-exterior-3d.png','Carpa · ilustración 3D'),render('carpa-interior-3d.png','Carpa · interior 3D')
    ]}
  };
  for(const [id,nombre] of [['grande','Carpa grande'],['mediana','Carpa mediana'],['chica','Carpa chica']]){
    datos['carpa-campamento-'+id]={...datos['carpa-pieles'],nombre,rotulo:'CAMPAMENTO · QUERANDÍ'};
  }
  // Google Material Icons: arrow_back, meeting_room and open_in_full (Apache 2.0).
  const icono=d=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="'+d+'"/></svg>';
  const flecha=icono('M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z');
  const puerta=icono('M19 19V4h-6V2H3v17H1v2h12V6h4v15h6v-2h-4zM11 19H5V4h6v15zm-1-8H8v2h2v-2z');
  function crear({lienzo,alCambiar}) {
    const T=window.THREE;
    const camara=new T.PerspectiveCamera(38,1,.005,1500),modelos=new Map();
    const auxiliar=new T.PerspectiveCamera(),direccion=new T.Vector3();
    let seleccionado=null,interior=false,progreso=1,viaje=null,orbita=.48,inclinacion=.32,arrastre=null,reducido=false,ultimoAspecto=0;
    const objetivo=new T.Vector3(),posicion=new T.Vector3(),rotacion=new T.Quaternion(),euler=new T.Euler(0,0,0,'YXZ');
    const ficha=document.createElement('section');ficha.id='vivienda-ficha';ficha.className='vivienda-ficha';ficha.hidden=true;
    ficha.setAttribute('aria-labelledby','vivienda-nombre');
    ficha.innerHTML='<button type="button" class="vivienda-volver" aria-label="Volver a Querandí">'+flecha+'</button><p class="vivienda-rotulo">VIVIENDA · QUERANDÍ</p><h2 id="vivienda-nombre"></h2><p class="vivienda-materiales"></p><p class="vivienda-descripcion"></p><button type="button" class="vivienda-entrar">'+puerta+'<span>Ver por dentro</span></button><h3>Imágenes y referencias</h3><div class="vivienda-galeria"></div><p class="vivienda-nota"></p>';
    document.body.append(ficha);
    const ayuda=document.createElement('p');ayuda.className='vivienda-ayuda';ayuda.hidden=true;ayuda.textContent='Arrastrá para girar · Flechas para mirar';document.body.append(ayuda);
    const visorTeclado=document.createElement('div');visorTeclado.tabIndex=0;visorTeclado.setAttribute('role','group');visorTeclado.className='vivienda-mirar';visorTeclado.hidden=true;visorTeclado.textContent='Usá las flechas para mirar alrededor';visorTeclado.setAttribute('aria-label','Vista 3D de la vivienda. Usá las flechas del teclado para mirar alrededor');document.body.append(visorTeclado);
    function avisar(){alCambiar?.();window.dispatchEvent(new CustomEvent('musuq:estado'));}
    function destinoExterior() {
      const d=datos[seleccionado],movil=lienzo.clientWidth<760,distancia=(d.radio||(seleccionado==='maloka'?13.4:11.6))*(movil?Math.max(1.4,1.28*lienzo.clientHeight/lienzo.clientWidth):1);
      objetivo.set(0,d.alto||(seleccionado==='maloka'?1.65:1.35),0);
      posicion.set(Math.sin(orbita)*distancia,Math.sin(inclinacion)*distancia+objetivo.y,Math.cos(orbita)*distancia);
      const grupo=modelos.get(seleccionado).raiz;grupo.updateMatrixWorld(true);grupo.localToWorld(objetivo);grupo.localToWorld(posicion);
      auxiliar.position.copy(posicion);auxiliar.lookAt(objetivo);rotacion.copy(auxiliar.quaternion);
    }
    function iniciarViaje(destino,quaternion,duracion=.8,siguiente=null) {
      viaje={inicio:camara.position.clone(),giro:camara.quaternion.clone(),fin:destino.clone(),rotacion:quaternion.clone(),duracion,siguiente};progreso=reducido?1:0;
    }
    function abrir(id,baseCamara){
      if(!modelos.has(id)||!datos[id])return false;
      seleccionado=id;interior=false;orbita=.48;inclinacion=.32;viaje=null;
      destinoExterior();
      // Same camera morph as the native-tree zoom: match the orthographic view
      // at the beginning, then approach the real house in world coordinates.
      const hacia=baseCamara.getWorldDirection(new T.Vector3());
      const miraInicio=baseCamara.position.clone().addScaledVector(hacia,300);
      viaje={tipo:'mapa',miraInicio,miraFin:objetivo.clone(),direccionInicio:hacia.negate(),direccionFin:posicion.clone().sub(objetivo).normalize(),distanciaInicio:1200,distanciaFin:posicion.distanceTo(objetivo),alturaInicio:baseCamara.top,alturaFin:posicion.distanceTo(objetivo)*Math.tan(T.MathUtils.degToRad(19)),duracion:1.2};
      progreso=reducido?1:0;ultimoAspecto=lienzo.clientWidth/lienzo.clientHeight;
      const d=datos[id];ficha.querySelector('h2').textContent=d.nombre;ficha.querySelector('.vivienda-materiales').textContent=d.materiales;
      ficha.querySelector('.vivienda-volver').setAttribute('aria-label','Volver a '+(d.pueblo||'Querandí'));
      ficha.querySelector('.vivienda-rotulo').textContent=d.rotulo||'VIVIENDA · QUERANDÍ';
      ficha.querySelector('.vivienda-descripcion').textContent=d.descripcion;ficha.querySelector('.vivienda-nota').textContent=d.nota;
      ficha.querySelector('.vivienda-entrar span').textContent='Ver por dentro';
      window.MUSUQ_FOTOS_ESPECIES?.galeria(ficha.querySelector('.vivienda-galeria'),d.fotos);
      ficha.hidden=false;ficha.scrollTop=0;ayuda.hidden=false;visorTeclado.hidden=false;document.body.classList.add('en-vivienda');
      ficha.querySelector('.vivienda-volver').focus({preventScroll:true});avisar();return true;
    }
    function entrar(){
      const m=modelos.get(seleccionado);if(!m?.camara)return;
      if(viaje)return;
      interior=!interior;viaje=null;progreso=reducido?1:0;
      m.raiz.updateMatrixWorld(true);
      const d=datos[seleccionado];
      const puertaExterior=m.raiz.localToWorld(new T.Vector3(...(d.puerta||[0,seleccionado==='maloka'?1.52:1.08,seleccionado==='maloka'?4.3:3.2])));
      if(interior){
        m.raiz.updateMatrixWorld(true);m.camara.getWorldPosition(posicion);m.camara.getWorldQuaternion(rotacion);
        const fin=posicion.clone(),q=rotacion.clone();euler.setFromQuaternion(q,'YXZ');
        // Orbit outside the roof volume before aligning with the doorway. A
        // straight line from a rear orbit would cut through the house.
        const angulo=T.MathUtils.euclideanModulo(orbita+Math.PI,Math.PI*2)-Math.PI;
        const pasos=Math.max(1,Math.ceil(Math.abs(angulo)/.35)),recorrido=[];
        const movil=lienzo.clientWidth<760,radio=(d.radio||(seleccionado==='maloka'?13.4:11.6))*(movil?Math.max(1.4,1.28*lienzo.clientHeight/lienzo.clientWidth):1);
        const alto=d.alto||(seleccionado==='maloka'?1.65:1.35);
        const centro=m.raiz.localToWorld(new T.Vector3(0,alto,0));
        for(let i=1;i<=pasos;i++){
          const a=angulo*(1-i/pasos),p=m.raiz.localToWorld(new T.Vector3(Math.sin(a)*radio,Math.sin(inclinacion)*radio+alto,Math.cos(a)*radio));
          auxiliar.position.copy(p);auxiliar.lookAt(centro);recorrido.push({fin:p,rotacion:auxiliar.quaternion.clone(),duracion:Math.max(.12,Math.abs(angulo)/pasos*.28)});
        }
        auxiliar.position.copy(puertaExterior);auxiliar.lookAt(fin);
        recorrido.push({fin:puertaExterior,rotacion:auxiliar.quaternion.clone(),duracion:.55},{fin,rotacion:q,duracion:1.0});
        for(let i=recorrido.length-2;i>=0;i--)recorrido[i].siguiente=recorrido[i+1];
        const primero=recorrido[0];iniciarViaje(primero.fin,primero.rotacion,primero.duracion,primero.siguiente);
      }else{orbita=.48;destinoExterior();iniciarViaje(puertaExterior,camara.quaternion,.7,{fin:posicion.clone(),rotacion:rotacion.clone(),duracion:.6});}
      ficha.querySelector('.vivienda-entrar span').textContent=interior?'Volver al exterior':'Ver por dentro';
      ayuda.textContent=interior?'Arrastrá para mirar por dentro · Flechas para mirar':'Arrastrá para girar · Flechas para mirar';avisar();
    }
    function cerrar(todo=false){
      if(!seleccionado)return false;
      if(interior&&!todo){entrar();return true;}
      seleccionado=null;interior=false;arrastre=null;viaje=null;ficha.hidden=true;ayuda.hidden=true;visorTeclado.hidden=true;document.body.classList.remove('en-vivienda');
      document.querySelector('#liberar-zona')?.focus({preventScroll:true});avisar();return true;
    }
    ficha.querySelector('.vivienda-volver').addEventListener('click',()=>cerrar(true));
    ficha.querySelector('.vivienda-entrar').addEventListener('click',entrar);
    ['wheel','touchmove','pointerdown','pointerup'].forEach(tipo=>ficha.addEventListener(tipo,e=>e.stopPropagation(),{passive:true}));
    function mirar(dx,dy){
      if(viaje)return;
      if(interior){euler.y-=dx;euler.x=T.MathUtils.clamp(euler.x-dy,-.95,.95);camara.quaternion.setFromEuler(euler);}
      else {orbita-=dx;inclinacion=T.MathUtils.clamp(inclinacion+dy,.08,.75);destinoExterior();camara.position.copy(posicion);camara.quaternion.copy(rotacion);}
    }
    lienzo.addEventListener('pointerdown',e=>{if(!seleccionado||e.button!==0)return;arrastre={x:e.clientX,y:e.clientY,id:e.pointerId};lienzo.setPointerCapture(e.pointerId);});
    lienzo.addEventListener('pointermove',e=>{if(!arrastre)return;mirar((e.clientX-arrastre.x)*.006,(e.clientY-arrastre.y)*.004);arrastre.x=e.clientX;arrastre.y=e.clientY;});
    ['pointerup','pointercancel','lostpointercapture'].forEach(tipo=>lienzo.addEventListener(tipo,()=>arrastre=null));
    visorTeclado.addEventListener('keydown',e=>{const v={ArrowLeft:[-.09,0],ArrowRight:[.09,0],ArrowUp:[0,-.06],ArrowDown:[0,.06]}[e.key];if(v){e.preventDefault();e.stopPropagation();mirar(...v);}});
    function actualizar(dt,instantaneo){
      reducido=instantaneo;if(!seleccionado)return;
      const ancho=lienzo.clientWidth,alto=lienzo.clientHeight,movil=ancho<760;
      camara.aspect=ancho/alto;camara.fov=interior?modelos.get(seleccionado).camara.fov:38;
      if(!interior&&!viaje&&Math.abs(ultimoAspecto-camara.aspect)>.001){destinoExterior();camara.position.copy(posicion);camara.quaternion.copy(rotacion);}
      ultimoAspecto=camara.aspect;
      ayuda.textContent=(interior?'Arrastrá para mirar por dentro':'Arrastrá para girar')+(movil?'':' · Flechas para mirar');
      let desplazamiento=1;
      if(instantaneo&&viaje&&viaje.tipo!=='mapa'){
        let ultimo=viaje;while(ultimo.siguiente)ultimo=ultimo.siguiente;
        camara.position.copy(ultimo.fin);camara.quaternion.copy(ultimo.rotacion);viaje=null;
      }
      if(viaje){
        progreso=instantaneo?1:Math.min(1,progreso+dt/viaje.duracion);const t=progreso*progreso*(3-2*progreso);
        if(viaje.tipo==='mapa'){
          const distancia=Math.exp(T.MathUtils.lerp(Math.log(viaje.distanciaInicio),Math.log(viaje.distanciaFin),t));
          const altura=Math.exp(T.MathUtils.lerp(Math.log(viaje.alturaInicio),Math.log(viaje.alturaFin),t));
          objetivo.lerpVectors(viaje.miraInicio,viaje.miraFin,t);direccion.lerpVectors(viaje.direccionInicio,viaje.direccionFin,t).normalize();
          camara.position.copy(objetivo).addScaledVector(direccion,distancia);camara.lookAt(objetivo);camara.fov=T.MathUtils.radToDeg(2*Math.atan(altura/distancia));desplazamiento=t;
        }else{camara.position.lerpVectors(viaje.inicio,viaje.fin,t);camara.quaternion.slerpQuaternions(viaje.giro,viaje.rotacion,t);}
        if(progreso===1){const siguiente=viaje.siguiente;viaje=null;if(siguiente)iniciarViaje(siguiente.fin,siguiente.rotacion,siguiente.duracion,siguiente.siguiente);}
      }
      ficha.querySelector('.vivienda-entrar').disabled=!!viaje;
      camara.clearViewOffset();
      if(!interior)camara.setViewOffset(ancho,alto,movil?0:-ancho*.16*desplazamiento,movil?alto*.19*desplazamiento:0,ancho,alto);
      camara.updateProjectionMatrix();
      camara.updateMatrixWorld();
    }
    return {abrir,cerrar,entrar,actualizar,get seleccion(){return seleccionado;},get interior(){return interior;},
      registrar(id,raiz,camera){modelos.set(id,{raiz,camara:camera});},
      get camara(){return seleccionado?camara:null;},
      estado:()=>({seleccion:seleccionado,interior,camara:camara.position.toArray(),transicion:!!viaje})};
  }
  window.MUSUQ_VIVIENDAS_DETALLE={crear,datos};
})();
