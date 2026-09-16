(function () {
  'use strict';
  const libro='https://ffyh.unc.edu.ar/publicaciones/wp-content/uploads/sites/35/2026/03/pueblo-querandi_compressed.pdf';
  const plantas=[
    {id:'macachin',nombre:'Macachín',cientifico:'Nombre comunitario · especie no determinada',dx:-2,dz:-1.4,alto:.95,
      texto:'El vocabulario de la comunidad Telomian Condic registra el macachín entre los alimentos y lo describe como una papa dulce silvestre. La publicación no precisa su especie: conservamos el nombre comunitario sin asignarle una identificación botánica definitiva.',
      nota:'Ilustración orientativa basada en una planta de tipo Oxalis. No prueba que esa sea la especie nombrada en la fuente. Las raíces se muestran fuera del suelo para hacerlas visibles.',fuente:libro+'#page=27',credito:'Telomian Condic · Nuestra historia, p. 23'},
    {id:'carda',nombre:'Cardo de las crónicas',cientifico:'Eryngium sp. · identificación probable',dx:1.2,dz:3.5,alto:1.15,
      texto:'Schmidl relató en el siglo XVI que los querandíes comían una raíz que llamó “cardo” cuando faltaba agua. Su identidad sigue discutida: se propusieron diferentes especies nativas de Eryngium. No debe confundirse automáticamente con el cardo europeo.',
      nota:'Representación orientativa de una carda nativa. La forma botánica exacta del “cardo” histórico no está confirmada.',
      fuente:'https://www.portalguarani.com/2015_roberto_quevedo__/17337_derrotero_y_viaje_al_rio_de_la_plata_y_paraguay__ulrico_schmidl__edicion_dirigida_y_prologada_por_roberto_quevedo__ano_1983.html',credito:'Schmidl · Derrotero y viaje, cap. 7 y nota 42',
      revision:'https://ri.conicet.gov.ar/bitstream/handle/11336/217904/CONICET_Digital_Nro.1bf865b5-f752-41c3-a51f-7beb8e9aa688_B.pdf?isAllowed=y&sequence=2#page=8'}
  ];
  function crear({escena,lienzo,posicion,sueloCerca,alAbrir}) {
    const T=window.THREE,raiz=new T.Group(),escenaCerca=new T.Scene(),loader=new T.TextureLoader(),punto=new T.Vector3();
    raiz.name='Flora Querandí · ilustraciones documentadas';escena.add(raiz);
    let filtro='todo',activa=false,seleccion=null,ultimoBoton=null,camaraActual=null;
    let reloj=0,zoom=0,ultimoItem=null,reducido=false,sobre=null,cerca=false,entradaDetalle=0;
    const direccion=new T.Vector3(),derecha=new T.Vector3(),camPos=new T.Vector3(),camMira=new T.Vector3(),mirada=new T.Vector3(),arriba=new T.Vector3();
    const raycaster=new T.Raycaster(),puntero=new T.Vector2();
    const ficha=document.createElement('aside');ficha.id='flora-ficha';ficha.className='flora-ficha';ficha.hidden=true;ficha.inert=true;ficha.setAttribute('aria-label','Flora y saberes del pueblo Querandí');
    ficha.innerHTML='<button type="button" class="flora-cerrar" aria-label="Volver de la planta"><svg aria-hidden="true"><use href="#i-volver"/></svg><span>Volver</span></button><p class="flora-rotulo">QUERANDÍ / FLORA Y SABERES</p><h2 tabindex="-1"></h2><p class="flora-cientifico"></p><p class="flora-texto"></p><p class="flora-nota"></p><a class="flora-fuente" target="_blank" rel="noopener"></a><a class="flora-revision" target="_blank" rel="noopener">Identificación botánica · investigación <svg aria-hidden="true"><use href="#i-flecha"/></svg></a>';
    document.body.append(ficha);
    const nodos=plantas.map((dato)=>{
      const material=new T.SpriteMaterial({transparent:true,alphaTest:.16,depthWrite:false,toneMapped:false});
      const objeto=new T.Sprite(material);objeto.name=dato.nombre;objeto.center.set(.5,.06);objeto.scale.set(dato.alto,dato.alto,1);objeto.visible=false;raiz.add(objeto);
      const item={dato,objeto,listo:false,visible:false,nacimiento:null,crecimiento:0,alto:dato.alto};
      item.cartel=window.MUSUQ_ESPECIE_CARTEL.crear({nombre:dato.nombre,icono:'flora',lienzo,soloHover:true,alTocar:()=>abrir(item)});item.boton=item.cartel.boton;
      // Match the legacy renderer/tree atlas pipeline (no output sRGB conversion).
      loader.load('assets/flora/'+dato.id+'.png',tex=>{tex.anisotropy=2;material.map=tex;material.needsUpdate=true;item.listo=true;const c=document.createElement('canvas');c.width=tex.image.width;c.height=tex.image.height;const ctx=c.getContext('2d');ctx.drawImage(tex.image,0,0);item.alpha=ctx.getImageData(0,0,c.width,c.height);},undefined,()=>{item.boton.dataset.error='true';});
      return item;
    });
    function abrir(item){
      if(!activa||!item||!item.listo)return;alAbrir?.(item.objeto.position);seleccion=item;ultimoItem=item;ultimoBoton=item.boton;const d=item.dato;
      ficha.querySelector('h2').textContent=d.nombre;ficha.querySelector('.flora-cientifico').textContent=d.cientifico;ficha.querySelector('.flora-texto').textContent=d.texto;ficha.querySelector('.flora-nota').textContent=d.nota;
      const a=ficha.querySelector('.flora-fuente');a.href=d.fuente;a.textContent='Fuente · '+d.credito;
      const r=ficha.querySelector('.flora-revision');r.hidden=!d.revision;if(d.revision)r.href=d.revision;
      ficha.hidden=false;ficha.inert=false;document.body.classList.add('con-flora-ficha');ficha.querySelector('h2').focus({preventScroll:true});
    }
    function cerrar(restaurar=false){if(!seleccion)return false;seleccion=null;ficha.hidden=true;ficha.inert=true;document.body.classList.remove('con-flora-ficha');if(restaurar&&activa)ultimoBoton?.focus({preventScroll:true});return true;}
    ficha.querySelector('button').addEventListener('click',()=>cerrar(true));
    ficha.addEventListener('wheel',e=>e.stopPropagation(),{passive:true});ficha.addEventListener('touchmove',e=>e.stopPropagation(),{passive:true});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&seleccion){e.stopImmediatePropagation();e.preventDefault();cerrar(true);} },true);
    function encontrar(e){
      if(!activa||!camaraActual||seleccion)return null;
      const r=lienzo.getBoundingClientRect();puntero.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);raycaster.setFromCamera(puntero,camaraActual);
      for(const hit of raycaster.intersectObjects(nodos.filter(n=>n.visible&&n.crecimiento>.4).map(n=>n.objeto))){
        const n=nodos.find(n=>n.objeto===hit.object),a=n.alpha,u=hit.uv;if(!a||!u)return n;
        const x=Math.max(0,Math.min(a.width-1,Math.floor(u.x*a.width))),y=Math.max(0,Math.min(a.height-1,Math.floor((1-u.y)*a.height)));
        if(a.data[(y*a.width+x)*4+3]>60)return n;
      }return null;
    }
    lienzo.addEventListener('pointermove',e=>{sobre=encontrar(e);if(sobre)lienzo.style.cursor='pointer';});
    lienzo.addEventListener('pointerleave',()=>sobre=null);
    return {
      get seleccion(){return seleccion?.dato.id||null;},
      get zoom(){return zoom;},get enFlora(){return !!seleccion||zoom>.02;},
      filtrar(tipo){filtro=tipo;if(!['todo','flora'].includes(tipo))cerrar();},cerrar,
      abrir(id){abrir(nodos.find(n=>n.dato.id===id));},
      render(renderer,camara){if(activa&&raiz.parent===escenaCerca)renderer.render(escenaCerca,camara);},
      detectar(e){
        const item=encontrar(e);if(!item)return false;abrir(item);return true;
      },
      actualizar({camara,explorando,zonaId,cercania,enfoque,tiempo,instantaneo,base,dir,enArbol,dt=.016,brote=0}){
        camaraActual=camara;
        reducido=instantaneo;reloj+=dt;cerca=enArbol;entradaDetalle=T.MathUtils.smoothstep(cercania,.55,.95);direccion.copy(dir).normalize();derecha.crossVectors(direccion,new T.Vector3(0,1,0)).normalize();
        const padre=(enArbol&&cercania>.45)||seleccion||zoom>.001?escenaCerca:escena;if(raiz.parent!==padre)padre.add(raiz);
        activa=explorando&&zonaId===14&&enfoque>.12&&['todo','flora'].includes(filtro);
        raiz.visible=activa;if(!activa){cerrar();zoom=0;sobre=null;nodos.forEach(n=>{n.visible=false;n.nacimiento=null;n.cartel.ocultar();});return;}
        for(const n of nodos){const d=n.dato,p=posicion(14,d.dx,d.dz);if(!p)continue;
          const indice=nodos.indexOf(n),k=enArbol?T.MathUtils.smoothstep(cercania,.1,.85):0;
          // Pequeños ejemplares a ambos lados del árbol, no una planta gigante en primer plano.
          if(k&&base&&dir){
            const lateral=[-.38,.34][indice],frente=[.48,.38][indice];
            const x=base.x-dir.z*lateral-dir.x*frente,z=base.z+dir.x*lateral-dir.z*frente;
            const y=sueloCerca?.(x,z)??base.y;
            p.x=T.MathUtils.lerp(p.x,x,k);p.y=T.MathUtils.lerp(p.y,y+.012,k);p.z=T.MathUtils.lerp(p.z,z,k);
          }
          if(n.listo&&n.nacimiento===null&&(instantaneo||brote>.12+indice*.12||enArbol))n.nacimiento=reloj+indice*.10;
          const edad=n.nacimiento===null?-1:reloj-n.nacimiento,t=instantaneo?1:T.MathUtils.clamp(edad/.85,0,1),el=t-1;
          const f=Math.max(.001,instantaneo?1:1+2.05*el*el*el+1.05*el*el);n.crecimiento=f;
          const alto=d.alto*T.MathUtils.lerp(1,.24,k);n.alto=alto;n.objeto.scale.set(alto*(1+(1-f)*.16),alto*f,1);
          n.objeto.position.set(p.x,p.y-alto*.28*(1-Math.min(1,f)),p.z);n.objeto.visible=n.listo&&edad>=0;n.visible=n.objeto.visible;
          n.objeto.material.rotation=instantaneo?0:Math.sin(Math.max(0,edad)*12)*Math.exp(-Math.max(0,edad)*4)*.07+Math.sin(tiempo*.65+indice)*.018;
        }
      },
      aplicarCamara(camara,dt){
        // Desde zoom 1, entrar en la cámara de perspectiva y seguir al detalle
        // sin pedir un segundo clic sobre el árbol.
        const objetivo=seleccion?entradaDetalle:0;zoom=reducido?objetivo:zoom+(objetivo-zoom)*(1-Math.exp(-dt*4));if(zoom<.001){zoom=0;return;}
        const n=seleccion||ultimoItem;if(!n)return;
        punto.copy(n.objeto.position);punto.y+=n.alto*.44;
        if(camara.isOrthographicCamera){
          derecha.set(1,0,0).applyQuaternion(camara.quaternion);arriba.set(0,1,0).applyQuaternion(camara.quaternion);
          const altoDestino=n.alto*(innerWidth<700?1.9:1.2),aspecto=(camara.right-camara.left)/(camara.top-camara.bottom);
          camPos.copy(camara.position).addScaledVector(derecha,punto.dot(derecha)-camara.position.dot(derecha)).addScaledVector(arriba,punto.dot(arriba)-camara.position.dot(arriba));
          camPos.addScaledVector(derecha,innerWidth<700?0:-altoDestino*aspecto*.23);if(innerWidth<700)camPos.addScaledVector(arriba,-altoDestino*.35);
          camara.position.lerp(camPos,zoom);camara.top=T.MathUtils.lerp(camara.top,altoDestino,zoom);camara.bottom=-camara.top;camara.right=camara.top*aspecto;camara.left=-camara.right;
        }else{
          const radio=n.alto*.48;camPos.copy(punto).addScaledVector(direccion,-radio*(innerWidth<700?7:5.8)).addScaledVector(derecha,radio*.8);camPos.y+=radio*1.9;
          camMira.copy(punto).addScaledVector(derecha,-radio*(innerWidth<700?0:.9));if(innerWidth<700)camMira.y-=radio*1.3;
          camara.getWorldDirection(mirada);mirada.multiplyScalar(camara.position.distanceTo(punto)).add(camara.position);camara.position.lerp(camPos,zoom);mirada.lerp(camMira,zoom);camara.lookAt(mirada);camara.near=.015;
        }camara.updateProjectionMatrix();camara.updateMatrixWorld(true);
      },
      actualizarCarteles(camara,dt,ocultos=false){for(const [indice,n] of nodos.entries()){punto.copy(n.objeto.position);punto.y+=n.alto*.92;n.cartel.actualizar({camara,punto,visible:!ocultos&&activa&&n.visible&&n.crecimiento>.6&&!seleccion&&zoom<.05,hover:sobre===n,mostrarIcono:cerca,flotante:cerca,tiempo:reloj+indice*2.3,dt,instantaneo:reducido});}},
      estado:()=>({activa,filtro,zoom,seleccion:seleccion?.dato.id||null,plantas:nodos.map(n=>({id:n.dato.id,lista:n.listo,visible:n.visible,crecimiento:n.crecimiento,posicion:n.objeto.position.toArray()}))})
    };
  }
  window.MUSUQ_FLORA={crear,plantas};
})();
