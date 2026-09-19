/* Modelos originales realizados en Blender según las referencias del diseño.
   Planta hueca + cámara interior en cada GLB. Zoom 1 y ficha de detalle. */
(() => {
  'use strict';
  const lugares=[
    {id:'maloka',zona:14,nombre:'Maloka',x:-3.4375,z:16.5625,escala:.25,giro:-Math.PI/2,ancho:5.2,largo:7.0},
    {id:'carpa-pieles',zona:14,nombre:'Toldo',x:-4.0625,z:14.0625,escala:.28,giro:Math.PI/5,ancho:5.0,largo:5.0},
    {id:'aldea-omaguaca',zona:2,nombre:'Aldea de piedra',x:-7.1875,z:.9375,escala:.1,giro:0,ancho:16.5,largo:15.5},
    {id:'carpa-campamento-grande',modelo:'carpa-pieles',zona:14,nombre:'Toldo grande',x:-8.15,z:15.54,escala:.20,ancho:5,largo:5},
    {id:'carpa-campamento-mediana',modelo:'carpa-pieles',zona:14,nombre:'Toldo mediano',x:-8.30,z:16.85,escala:.165,ancho:5,largo:5},
    {id:'carpa-campamento-chica',modelo:'carpa-pieles',zona:14,nombre:'Toldo chico',x:-7.20,z:16.30,escala:.135,ancho:5,largo:5}
  ];
  const fogon={x:-7.95,z:16.23,escala:.18};
  lugares.filter(d=>d.modelo==='carpa-pieles').forEach(d=>d.giro=Math.atan2(fogon.x-d.x,fogon.z-d.z));
  function crear({escena,suelo,lienzo,alAbrir}) {
    const T=window.THREE;if(!T?.GLTFLoader)return null;
    const detalle=window.MUSUQ_VIVIENDAS_DETALLE?.crear({lienzo});
    const raycaster=new T.Raycaster(),puntero=new T.Vector2();let camaraActual=null;
    const raiz=new T.Group();raiz.name='Viviendas del territorio';raiz.visible=false;escena.add(raiz);
    // Existing map elements use unlit/custom materials. These lights illuminate
    // only the Lambert surfaces of the new houses, leaving the terrain unchanged.
    const ambiente=new T.HemisphereLight(0xfff8e9,0x827451,.88);
    const sol=new T.DirectionalLight(0xffedcf,.67);sol.position.set(-5,9,5);
    escena.add(ambiente,sol);
    const loader=new T.GLTFLoader(),modelos=new Map();let filtro='todo',error=false,activo=false,zonaActual=null;
    const casas=lugares.map(d=>{
      const grupo=new T.Group();grupo.name=d.nombre;grupo.rotation.y=d.giro;grupo.visible=false;raiz.add(grupo);
      return {d,grupo,listo:false,crecimiento:0};
    });
    function cargarModelo(id){
      if(modelos.has(id))return modelos.get(id);
      const promesa=new Promise((resolve,reject)=>loader.load(`assets/viviendas/${id}.glb`,gltf=>{
        const materiales=new Map();
        gltf.scene.traverse(o=>{
          if(!o.isMesh)return;
          const convertir=m=>{
            if(!materiales.has(m))materiales.set(m,/llama|brasa/.test(m.name)?new T.MeshBasicMaterial({color:m.color.clone().convertLinearToSRGB(),side:T.DoubleSide}):new T.MeshLambertMaterial({color:m.color.clone().convertLinearToSRGB(),side:T.DoubleSide}));
            return materiales.get(m);
          };
          o.material=Array.isArray(o.material)?o.material.map(convertir):convertir(o.material);
        });
        resolve(gltf.scene);
      },undefined,reject));
      modelos.set(id,promesa);return promesa;
    }
    function cargar(zonaId) {
      casas.filter(c=>c.d.zona===zonaId&&!c.solicitado).forEach(c=>{c.solicitado=true;cargarModelo(c.d.modelo||c.d.id).then(plantilla=>{
        const modelo=plantilla.clone(true);c.camara=null;modelo.traverse(o=>{if(o.isCamera&&!c.camara)c.camara=o;});
        c.grupo.add(modelo);c.listo=true;
        detalle?.registrar(c.d.id,c.grupo,c.camara);
        window.dispatchEvent(new CustomEvent('musuq:viviendas-listas'));
      }).catch(()=>{error=true;window.dispatchEvent(new CustomEvent('musuq:viviendas-error'));});});
    }
    const fogata=new T.Group();fogata.name='Fogata del campamento';fogata.visible=false;raiz.add(fogata);
    let fogataSolicitada=false;
    function cargarFogata(){
      if(fogataSolicitada)return;fogataSolicitada=true;
      cargarModelo('fogata-querandi').then(modelo=>{fogata.add(modelo.clone(true));fogata.userData.lista=true;}).catch(()=>{error=true;});
    }
    // More detailed cardones stay in the same landscape, including tree zooms.
    const cardones=new T.Group();cardones.name='Cardones Omaguaca · 3D';escena.add(cardones);
    const puntosCardon=[[-7.39,2.03],[-6.99,2.25],[-7.34,2.52],[-7.06,2.96],[-7.4,2.94],[-7.02,2.59]];
    let cardonesSolicitados=false;
    function cargarCardones(){
      if(cardonesSolicitados)return;cardonesSolicitados=true;
      loader.load('assets/viviendas/cardon-omaguaca.glb',gltf=>{
        gltf.scene.traverse(o=>{if(o.isMesh){const convertir=m=>new T.MeshLambertMaterial({color:m.color.clone().convertLinearToSRGB(),side:T.DoubleSide});o.material=Array.isArray(o.material)?o.material.map(convertir):convertir(o.material);}});
        puntosCardon.forEach(([x,z],i)=>{const c=gltf.scene.clone(true);c.userData.punto=[x,z];c.userData.escala=.085+i%3*.013;c.rotation.y=i*2.17;cardones.add(c);});
      },undefined,()=>{error=true;});
    }
    function actualizar({explorando,zonaId,cercania,dt,instantaneo,brote,camara}) {
      camaraActual=camara;
      if(zonaActual!==zonaId)detalle?.cerrar(true);zonaActual=zonaId;
      activo=explorando&&lugares.some(d=>d.zona===zonaId)&&cercania<.04;
      if(!activo)detalle?.cerrar(true);
      detalle?.actualizar(dt,instantaneo);
      if(activo)cargar(zonaId);
      if(activo&&zonaId===14)cargarFogata();
      fogata.visible=activo&&zonaId===14&&!!fogata.userData.lista;
      const yf=suelo(fogon.x,fogon.z),sf=fogon.escala;
      fogata.position.set(fogon.x,(yf||0)+.012,fogon.z);fogata.scale.set(sf,sf*T.MathUtils.smoothstep(brote,.45,.85),sf);
      if(explorando&&zonaId===2)cargarCardones();
      cardones.visible=explorando&&zonaId===2&&['todo','flora','construcciones'].includes(filtro);
      cardones.children.forEach(c=>{const [x,z]=c.userData.punto,y=suelo(x,z);c.visible=y!==null;c.position.set(x,(y||0)+.008,z);const s=c.userData.escala;c.scale.set(s,s*T.MathUtils.smoothstep(brote,.35,.8),s);});
      raiz.visible=activo&&['todo','construcciones'].includes(filtro);
      casas.forEach((c,i)=>{
        if(!activo||c.d.zona!==zonaId){c.crecimiento=0;c.grupo.visible=false;return;}
        const destino=c.listo&&brote>.28+i*.12?1:0;
        c.crecimiento=instantaneo?destino:T.MathUtils.lerp(c.crecimiento,destino,1-Math.exp(-dt*7));
        if(c.crecimiento>.999)c.crecimiento=1;
        const y=suelo(c.d.x,c.d.z);
        c.grupo.visible=c.listo&&y!==null&&c.crecimiento>.001;
        c.grupo.position.set(c.d.x,(y||0)+.008,c.d.z);
        c.grupo.scale.set(c.d.escala,c.d.escala*Math.max(.001,c.crecimiento),c.d.escala);
      });
    }
    function bajoPuntero(e){
      if(!raiz.visible||!camaraActual||detalle?.seleccion)return null;
      const r=lienzo.getBoundingClientRect();puntero.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
      raycaster.setFromCamera(puntero,camaraActual);
      const visibles=casas.filter(c=>c.grupo.visible&&c.crecimiento>.95);
      const impactos=raycaster.intersectObjects(visibles.map(c=>c.grupo),true);
      if(!impactos.length)return null;
      return visibles.find(c=>{let ob=impactos[0].object;while(ob){if(ob===c.grupo)return true;ob=ob.parent;}return false;});
    }
    function abrir(id){if(!activo||!camaraActual||!casas.some(c=>c.d.id===id&&c.d.zona===zonaActual&&c.listo&&c.grupo.visible))return false;alAbrir?.();return detalle?.abrir(id,camaraActual)||false;}
    return {actualizar,abrir,cerrar:todo=>detalle?.cerrar(todo),get seleccion(){return detalle?.seleccion;},get interior(){return detalle?.interior;},
      detectar(e){if(detalle?.seleccion)return true;const casa=bajoPuntero(e);return casa?abrir(casa.d.id):false;},
      hover(e){return !!bajoPuntero(e);},get camara(){return detalle?.camara;},
      get foco(){const d=lugares.find(d=>d.id===detalle?.seleccion);return d&&!detalle?.interior?{x:d.x,z:d.z,radio:Math.max(d.ancho,d.largo)*d.escala/2}:null;},
      filtrar(tipo){filtro=tipo;if(!['todo','construcciones'].includes(tipo))detalle?.cerrar(true);},
      estado:()=>({activo,visible:raiz.visible,error,fogata:raiz.visible&&fogata.visible,cardones:cardones.visible?cardones.children.length:0,detalle:detalle?.estado(),casas:casas.map(c=>({id:c.d.id,zona:c.d.zona,listo:c.listo,visible:raiz.visible&&c.grupo.visible,crecimiento:c.crecimiento,posicion:c.grupo.position.toArray(),camaraInterior:!!c.camara}))})};
  }
  function ocupa(x,z,margen=0,zonaId=null){
    // Keep the shared clearing open; nearby crowns otherwise cover the small tent.
    if((zonaId===null||zonaId===14)&&Math.hypot(x-fogon.x,z-fogon.z)<1.38+margen)return true;
    return lugares.some(d=>{
      if(zonaId!==null&&d.zona!==zonaId)return false;
      const dx=(x-d.x)/d.escala,dz=(z-d.z)/d.escala,c=Math.cos(d.giro),s=Math.sin(d.giro);
      const lx=c*dx-s*dz,lz=s*dx+c*dz,p=margen/d.escala;
      return (Math.abs(lx)<d.ancho/2+p&&Math.abs(lz)<d.largo/2+p)||(Math.abs(lx)<1+p&&lz>d.largo/2&&lz<d.largo/2+1.8+p);
    });
  }
  window.MUSUQ_VIVIENDAS={crear,lugares,ocupa,fogon};
})();
