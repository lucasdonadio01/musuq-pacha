(function () {
  'use strict';
  const libro='https://ffyh.unc.edu.ar/publicaciones/wp-content/uploads/sites/35/2026/03/pueblo-querandi_compressed.pdf';
  const plantas=[
    {id:'tala-frutos',nombre:'Tala',cientifico:'Celtis tala',dx:3.0,dz:-1.7,alto:1.3,
      texto:'La comunidad Telomian Condic recuerda al tala como refugio y árbol sagrado. Sus frutos formaban parte de la alimentación; sus ramas servían para conservar el fuego y fabricar arcos, flechas y herramientas. Estos saberes siguen presentes en la memoria comunitaria.',
      nota:'Ilustración interpretativa generada. Fuente comunitaria contemporánea: no es un registro arqueológico ni una ubicación exacta.',fuente:libro+'#page=10',credito:'Telomian Condic · Nuestra historia, pp. 6 y 10'},
    {id:'macachin',nombre:'Macachín',cientifico:'Nombre comunitario · especie no determinada',dx:-2,dz:-1.4,alto:.95,
      texto:'El vocabulario de la comunidad Telomian Condic registra el macachín entre los alimentos y lo describe como una papa dulce silvestre. La publicación no precisa su especie: conservamos el nombre comunitario sin asignarle una identificación botánica definitiva.',
      nota:'Ilustración orientativa basada en una planta de tipo Oxalis. No prueba que esa sea la especie nombrada en la fuente. Las raíces se muestran fuera del suelo para hacerlas visibles.',fuente:libro+'#page=27',credito:'Telomian Condic · Nuestra historia, p. 23'},
    {id:'carda',nombre:'Cardo de las crónicas',cientifico:'Eryngium sp. · identificación probable',dx:1.2,dz:3.5,alto:1.15,
      texto:'Schmidl relató en el siglo XVI que los querandíes comían una raíz que llamó “cardo” cuando faltaba agua. Su identidad sigue discutida: se propusieron diferentes especies nativas de Eryngium. No debe confundirse automáticamente con el cardo europeo.',
      nota:'Representación orientativa de una carda nativa. La forma botánica exacta del “cardo” histórico no está confirmada.',
      fuente:'https://www.portalguarani.com/2015_roberto_quevedo__/17337_derrotero_y_viaje_al_rio_de_la_plata_y_paraguay__ulrico_schmidl__edicion_dirigida_y_prologada_por_roberto_quevedo__ano_1983.html',credito:'Schmidl · Derrotero y viaje, cap. 7 y nota 42',
      revision:'https://ri.conicet.gov.ar/bitstream/handle/11336/217904/CONICET_Digital_Nro.1bf865b5-f752-41c3-a51f-7beb8e9aa688_B.pdf?isAllowed=y&sequence=2#page=8'}
  ];
  function crear({escena,lienzo,posicion,sueloCerca}) {
    const T=window.THREE,raiz=new T.Group(),escenaCerca=new T.Scene(),loader=new T.TextureLoader(),punto=new T.Vector3();
    raiz.name='Flora Querandí · ilustraciones documentadas';escena.add(raiz);
    let filtro='todo',activa=false,seleccion=null,ultimoBoton=null,camaraActual=null;
    const raycaster=new T.Raycaster(),puntero=new T.Vector2();
    const capa=document.createElement('div');capa.className='flora-marcadores';capa.hidden=true;document.body.append(capa);
    const ficha=document.createElement('aside');ficha.id='flora-ficha';ficha.className='flora-ficha';ficha.hidden=true;ficha.inert=true;ficha.setAttribute('aria-label','Flora y saberes del pueblo Querandí');
    ficha.innerHTML='<button type="button" class="flora-cerrar" aria-label="Cerrar ficha de flora"><svg aria-hidden="true"><use href="#i-cerrar"/></svg></button><p class="flora-rotulo">QUERANDÍ / FLORA Y SABERES</p><img class="flora-imagen" src="assets/flora/tala-frutos.png" alt="Ilustración interpretativa del tala"><h2 tabindex="-1"></h2><p class="flora-cientifico"></p><p class="flora-texto"></p><p class="flora-nota"></p><a class="flora-fuente" target="_blank" rel="noopener"></a><a class="flora-revision" target="_blank" rel="noopener">Identificación botánica · investigación <svg aria-hidden="true"><use href="#i-flecha"/></svg></a>';
    document.body.append(ficha);
    const nodos=plantas.map((dato)=>{
      const material=new T.SpriteMaterial({transparent:true,alphaTest:.16,depthWrite:false,toneMapped:false});
      const objeto=new T.Sprite(material);objeto.name=dato.nombre;objeto.center.set(.5,.06);objeto.scale.set(dato.alto,dato.alto,1);objeto.visible=false;raiz.add(objeto);
      const boton=document.createElement('button');boton.type='button';boton.className='flora-punto';boton.setAttribute('aria-label','Conocer '+dato.nombre);boton.innerHTML='<span class="flora-punto__giro"><span class="flora-punto__placa"><svg aria-hidden="true"><use href="#i-eco"/></svg></span><span class="flora-punto__nombre">'+dato.nombre+'</span></span>';capa.append(boton);
      const item={dato,objeto,boton,listo:false,x:0,y:0,visible:false};
      boton.addEventListener('click',()=>abrir(item));
      // Match the legacy renderer/tree atlas pipeline (no output sRGB conversion).
      loader.load('assets/flora/'+dato.id+'.png',tex=>{tex.anisotropy=2;material.map=tex;material.needsUpdate=true;item.listo=true;},undefined,()=>{boton.dataset.error='true';});
      return item;
    });
    function abrir(item){
      if(!activa)return;seleccion=item;ultimoBoton=item.boton;const d=item.dato;
      ficha.querySelector('.flora-imagen').src='assets/flora/'+d.id+'.png';ficha.querySelector('.flora-imagen').alt='Ilustración interpretativa de '+d.nombre;
      ficha.querySelector('h2').textContent=d.nombre;ficha.querySelector('.flora-cientifico').textContent=d.cientifico;ficha.querySelector('.flora-texto').textContent=d.texto;ficha.querySelector('.flora-nota').textContent=d.nota;
      const a=ficha.querySelector('.flora-fuente');a.href=d.fuente;a.textContent='Fuente · '+d.credito;
      const r=ficha.querySelector('.flora-revision');r.hidden=!d.revision;if(d.revision)r.href=d.revision;
      ficha.hidden=false;ficha.inert=false;document.body.classList.add('con-flora-ficha');ficha.querySelector('h2').focus({preventScroll:true});
    }
    function cerrar(restaurar=false){if(!seleccion)return false;seleccion=null;ficha.hidden=true;ficha.inert=true;document.body.classList.remove('con-flora-ficha');if(restaurar&&activa)ultimoBoton?.focus({preventScroll:true});return true;}
    ficha.querySelector('button').addEventListener('click',()=>cerrar(true));
    ficha.addEventListener('wheel',e=>e.stopPropagation(),{passive:true});ficha.addEventListener('touchmove',e=>e.stopPropagation(),{passive:true});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&seleccion){e.stopImmediatePropagation();e.preventDefault();cerrar(true);} },true);
    return {
      filtrar(tipo){filtro=tipo;if(!['todo','flora'].includes(tipo))cerrar();},cerrar,
      render(renderer,camara){if(activa&&raiz.parent===escenaCerca)renderer.render(escenaCerca,camara);},
      detectar(e){
        if(!activa||!camaraActual)return false;
        const rect=lienzo.getBoundingClientRect();puntero.set((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2);
        raycaster.setFromCamera(puntero,camaraActual);
        const hit=raycaster.intersectObjects(nodos.filter(n=>n.visible&&n.listo).map(n=>n.objeto))[0];
        const item=hit&&nodos.find(n=>n.objeto===hit.object);if(!item)return false;abrir(item);return true;
      },
      actualizar({camara,explorando,zonaId,cercania,enfoque,tiempo,instantaneo,base,dir,enArbol}){
        camaraActual=camara;
        const padre=enArbol&&cercania>.45?escenaCerca:escena;if(raiz.parent!==padre)padre.add(raiz);
        activa=explorando&&zonaId===14&&enfoque>.12&&['todo','flora'].includes(filtro);
        raiz.visible=activa;capa.hidden=!activa;capa.inert=!activa;if(!activa){cerrar();nodos.forEach(n=>n.visible=false);return;}
        const rect=lienzo.getBoundingClientRect(),ocupados=[];
        for(const n of nodos){const d=n.dato,p=posicion(14,d.dx,d.dz);if(!p)continue;
          const indice=nodos.indexOf(n),k=enArbol?T.MathUtils.smoothstep(cercania,.1,.85):0;
          // Pequeños ejemplares a ambos lados del árbol, no una planta gigante en primer plano.
          if(k&&base&&dir){
            const lateral=[-.50,-.08,.35][indice],frente=[.30,.48,.38][indice];
            const x=base.x-dir.z*lateral-dir.x*frente,z=base.z+dir.x*lateral-dir.z*frente;
            const y=sueloCerca?.(x,z)??base.y;
            p.x=T.MathUtils.lerp(p.x,x,k);p.y=T.MathUtils.lerp(p.y,y+.012,k);p.z=T.MathUtils.lerp(p.z,z,k);
          }
          const alto=d.alto*T.MathUtils.lerp(1,.24,k);n.objeto.scale.set(alto,alto,1);
          n.objeto.position.set(p.x,p.y,p.z);n.objeto.visible=n.listo;
          n.objeto.material.rotation=instantaneo?0:Math.sin(tiempo*.65+nodos.indexOf(n))*.018;
          punto.set(p.x,p.y+alto*.84,p.z).project(camara);
          n.x=rect.left+(punto.x+1)*rect.width/2;n.y=rect.top+(1-punto.y)*rect.height/2;
          n.visible=Math.abs(punto.x)<.95&&Math.abs(punto.y)<.88&&Math.abs(punto.z)<1;n.boton.hidden=!n.visible;
          const ancho=44,altoCartel=44;
          const compacta=innerWidth<=760;
          let etiquetaY=compacta?Math.max(285,n.y):n.y;
          for(let intentos=0;intentos<4&&ocupados.some(o=>Math.abs(n.x-o.x)<(ancho+o.w)/2+8&&Math.abs(etiquetaY-o.y)<altoCartel+9);intentos++)etiquetaY+=(compacta?1:-1)*(altoCartel+10);
          ocupados.push({x:n.x,y:etiquetaY,w:ancho});
          n.boton.style.transform='translate('+n.x+'px,'+etiquetaY+'px) translate(-50%,-100%)';
          n.boton.querySelector('.flora-punto__giro').style.transform='perspective(600px) translateY('+(instantaneo?0:Math.sin(tiempo*.9+indice)*2)+'px) rotateX(-12deg) rotateY(-24deg)';
        }
      },estado:()=>({activa,filtro,seleccion:seleccion?.dato.id||null,plantas:nodos.map(n=>({id:n.dato.id,lista:n.listo,visible:n.visible}))})
    };
  }
  window.MUSUQ_FLORA={crear,plantas};
})();
