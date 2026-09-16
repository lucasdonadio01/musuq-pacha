/* Google Material icons on actual Three.js plates. HTML is only the keyboard hit area. */
(function(){
 'use strict';
 const T=window.THREE,escena=new T.Scene(),recursos=[];
 const capa=document.createElement('div');capa.className='especie-accesos';document.body.append(capa);
 const geometrias={caja:new T.BoxGeometry(1,1,.13),cara:new T.PlaneGeometry(1,1)};
 const verde=new T.MeshBasicMaterial({color:0xe4fe44,toneMapped:false});
 const canto=new T.MeshBasicMaterial({color:0x849523,toneMapped:false});
 const negro=new T.MeshBasicMaterial({color:0x202020,toneMapped:false});
 const texturas=new Map();
 function textura(icono){
   if(texturas.has(icono))return texturas.get(icono);
   const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');
   const path=icono==='flora'?document.querySelector('#i-eco path')?.getAttribute('d'):'M4.5 9C5.88 9 7 7.88 7 6.5S5.88 4 4.5 4 2 5.12 2 6.5 3.12 9 4.5 9zm4.5-4c1.38 0 2.5-1.12 2.5-2.5S10.38 0 9 0 6.5 1.12 6.5 2.5 7.62 5 9 5zm6 0c1.38 0 2.5-1.12 2.5-2.5S16.38 0 15 0s-2.5 1.12-2.5 2.5S13.62 5 15 5zm4.5 4c1.38 0 2.5-1.12 2.5-2.5S20.88 4 19.5 4 17 5.12 17 6.5 18.12 9 19.5 9zm-2.34 3.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32-.11-.04-.22-.07-.33-.09-.25-.04-.51-.04-.77-.04s-.52 0-.78.05c-.11.02-.22.05-.33.09-.7.24-1.28.78-1.75 1.32-.87 1.02-1.6 1.89-2.48 2.91C5.18 14.39 3.57 16.08 4 18.2c.42 1.06 1.22 2.11 2.62 2.42.78.16 3.27-.47 5.28-.47h.2c2.01 0 4.5.63 5.28.47 1.4-.31 2.2-1.36 2.62-2.42.43-2.12-1.18-3.81-2.84-5.34z';
   ctx.scale(128/24,128/24);ctx.fillStyle='#202020';if(path)ctx.fill(new Path2D(path));
   const tex=new T.CanvasTexture(c);texturas.set(icono,tex);return tex;
 }
 function crear({nombre,icono,lienzo,alTocar,soloHover=false}){
   const raiz=new T.Group();raiz.name='Cartel 3D · '+nombre;escena.add(raiz);raiz.visible=false;
   const simbolo=new T.Group();raiz.add(simbolo);
   const placa=new T.Mesh(geometrias.caja,[canto,canto,verde,canto,verde,verde]);simbolo.add(placa);
   for(const [x,y] of [[-.25,.56],[.25,-.56]]){const pixel=new T.Mesh(geometrias.caja,verde);pixel.scale.set(.18,.18,1);pixel.position.set(x,y,0);simbolo.add(pixel);}
   const iconMat=new T.MeshBasicMaterial({map:textura(icono),transparent:true,depthWrite:false,toneMapped:false});recursos.push(iconMat);
   const cara=new T.Mesh(geometrias.cara,iconMat);cara.scale.set(.66,.66,1);cara.position.z=.071;simbolo.add(cara);
   const dorso=cara.clone();dorso.position.z=-.071;dorso.rotation.y=Math.PI;simbolo.add(dorso);
   const ancho=Math.max(1.9,Math.min(4.8,nombre.length*.17));
   const c=document.createElement('canvas');c.width=Math.ceil(ancho/.78*96);c.height=96;const ctx=c.getContext('2d');
   const tex=new T.CanvasTexture(c),mat=new T.MeshBasicMaterial({map:tex,transparent:true,toneMapped:false});recursos.push(tex,mat);
   const etiqueta=new T.Group();
   const fondo=new T.Mesh(geometrias.caja,negro);fondo.scale.set(ancho,.78,1);etiqueta.add(fondo);
   const texto=new T.Mesh(geometrias.cara,mat);texto.scale.set(ancho,.78,1);texto.position.z=.075;etiqueta.add(texto);etiqueta.position.x=.64+ancho/2;raiz.add(etiqueta);
   const pintar=()=>{ctx.clearRect(0,0,c.width,96);ctx.fillStyle='#e4fe44';ctx.font='500 36px "Space Grotesk", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(nombre,c.width/2,48,c.width-28);tex.needsUpdate=true;};pintar();document.fonts.ready.then(pintar);
   const boton=document.createElement('button');boton.className='especie-acceso';boton.type='button';boton.hidden=true;boton.setAttribute('aria-label','Conocer '+nombre);boton.dataset.especie3d=nombre;capa.append(boton);
   let sobre=false,foco=false,presencia=0;
   boton.addEventListener('pointerenter',()=>sobre=true);boton.addEventListener('pointerleave',()=>sobre=false);
   boton.addEventListener('focus',()=>foco=true);boton.addEventListener('blur',()=>foco=false);boton.addEventListener('click',alTocar);
   const proyectado=new T.Vector3(),ancla=new T.Vector3(),arriba=new T.Vector3();
   return {boton,raiz,
     ocultar(){raiz.visible=false;boton.hidden=true;presencia=0;sobre=false;},
     actualizar({camara,punto,visible,hover=false,mostrarIcono=false,flotante=false,tiempo=0,dt=.016,instantaneo=false}){
       const rect=lienzo.getBoundingClientRect();
       const unidad=camara.isOrthographicCamera?(camara.top-camara.bottom)/rect.height:2*camara.position.distanceTo(punto)*Math.tan(T.MathUtils.degToRad(camara.fov/2))/rect.height;
       ancla.copy(punto);if(soloHover){arriba.set(0,1,0).applyQuaternion(camara.quaternion);ancla.addScaledVector(arriba,unidad*22);}
       if(flotante&&!instantaneo){arriba.set(0,1,0).applyQuaternion(camara.quaternion);ancla.addScaledVector(arriba,unidad*4*Math.sin(tiempo*1.1));}
       proyectado.copy(ancla).project(camara);
       const dentro=visible&&Math.abs(proyectado.x)<.96&&Math.abs(proyectado.y)<.94&&Math.abs(proyectado.z)<1;
       boton.hidden=!dentro;if(!dentro){raiz.visible=false;presencia=0;sobre=false;return;}
       const objetivo=Number(!soloHover||mostrarIcono||hover||sobre||foco);
       presencia=instantaneo?objetivo:presencia+(objetivo-presencia)*(1-Math.exp(-dt*(objetivo?16:22)));
       raiz.position.copy(ancla);raiz.quaternion.copy(camara.quaternion);raiz.rotateY(-.35);raiz.rotateX(.10);raiz.scale.setScalar(unidad*40*Math.max(.001,presencia));raiz.visible=presencia>.02;
       simbolo.rotation.y=flotante&&!instantaneo?tiempo*Math.PI*2/24:0;
       etiqueta.visible=hover||sobre||foco;etiqueta.position.x=(proyectado.x>.4?-1:1)*(.64+ancho/2);
       boton.style.transform=`translate(${rect.left+(proyectado.x+1)*rect.width/2}px,${rect.top+(1-proyectado.y)*rect.height/2}px) translate(-50%,-50%)`;
       boton.dataset.visible=String(raiz.visible);boton.dataset.nombre=String(etiqueta.visible);
     }
   };
 }
 window.MUSUQ_ESPECIE_CARTEL={crear,render(renderer,camara){renderer.clearDepth();renderer.render(escena,camara);}};
 addEventListener('pagehide',e=>{if(e.persisted)return;Object.values(geometrias).forEach(g=>g.dispose());[verde,canto,negro,...recursos,...texturas.values()].forEach(r=>r.dispose());});
})();
