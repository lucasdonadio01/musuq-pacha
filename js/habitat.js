(function(){
 'use strict';
 const T=window.THREE;
 const azar=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
 const clamp=v=>Math.max(0,Math.min(1,v));
 const fichas={
  venado:{nombre:'Venado de las pampas',cientifico:'Ozotoceros bezoarticus',ambiente:'Pastizales pampeanos y abiertos del centro del país.',
   texto:'Cérvido nativo de pelaje pardo claro y vientre blanco. Se alimenta de plantas del pastizal. Su distribución se redujo y fragmentó: conservar los ambientes abiertos es fundamental para su supervivencia. El modelo representa una hembra, sin astas.',
   fuente:'https://sib.gob.ar/especies/ozotoceros-bezoarticus'},
  tero:{nombre:'Tero',cientifico:'Vanellus chilensis',ambiente:'Pastizales, campos abiertos y orillas de humedales.',
   texto:'Ave nativa de pecho negro, vientre blanco y patas rojizas. Recorre el suelo buscando pequeños invertebrados y su llamado de alarma es muy reconocible. Nidifica en el suelo. La pose sobre la rama es una licencia artística del visor, no una representación de su lugar de nidificación.',
   fuente:'https://sib.gob.ar/especies/vanellus-chilensis'}
 };
 function bioma(x,y){
  const g=window.MUSUQ_BOSQUES.geografia(x,y),{lon,lat}=g;
  if(lat<-38){return lon<-70.5||lat<-54?{id:'bosque',color:'#6f8a4b',pasto:.7}:{id:'estepa',color:'#a6a074',pasto:.22};}
  if(lon<-64.5&&lat>-33||lon<-67){return {id:'arido',color:'#bf9c69',pasto:.10};}
  if(lat>-30&&lon>-57){return {id:'selva',color:'#518249',pasto:.78};}
  if(lat>-31){return {id:'chaco',color:'#8b9750',pasto:.44};}
  return {id:'pastizal',color:'#819d45',pasto:.80};
 }
 function parte(formas,pintar,paso=.065){
  const vox=new Map();
  for(const [cx,cy,cz,rx,ry,rz] of formas){
   for(let x=Math.floor((cx-rx)/paso);x<=Math.ceil((cx+rx)/paso);x++)
    for(let y=Math.floor((cy-ry)/paso);y<=Math.ceil((cy+ry)/paso);y++)
     for(let z=Math.floor((cz-rz)/paso);z<=Math.ceil((cz+rz)/paso);z++){
      if(((x*paso-cx)/rx)**2+((y*paso-cy)/ry)**2+((z*paso-cz)/rz)**2<=1)vox.set(x+','+y+','+z,[x,y,z]);
     }
  }
  const pos=[],nor=[],col=[],c=new T.Color();
  const caras=[[[1,0,0],[[1,-1,-1],[1,1,-1],[1,1,1],[1,-1,1]]],[[-1,0,0],[[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,-1,-1]]],[[0,1,0],[[-1,1,-1],[-1,1,1],[1,1,1],[1,1,-1]]],[[0,-1,0],[[-1,-1,1],[-1,-1,-1],[1,-1,-1],[1,-1,1]]],[[0,0,1],[[1,-1,1],[1,1,1],[-1,1,1],[-1,-1,1]]],[[0,0,-1],[[-1,-1,-1],[-1,1,-1],[1,1,-1],[1,-1,-1]]]];
  for(const [x,y,z] of vox.values()){
   c.set(typeof pintar==='function'?pintar(x*paso,y*paso,z*paso):pintar).multiplyScalar(.94+azar(x*3+y*17+z*61)*.12);
   for(const [n,vs] of caras){
    if(vox.has((x+n[0])+','+(y+n[1])+','+(z+n[2])))continue;
    for(const i of [0,1,2,0,2,3]){pos.push((x+vs[i][0]*.5)*paso,(y+vs[i][1]*.5)*paso,(z+vs[i][2]*.5)*paso);nor.push(...n);col.push(c.r,c.g,c.b);}
   }
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('normal',new T.Float32BufferAttribute(nor,3));geo.setAttribute('color',new T.Float32BufferAttribute(col,3));
  geo.userData.voxeles=vox.size;return geo;
 }
 function crear({escena,C,P,suelo,celdaEn,rios,lienzo,rumbo,alAbrir}){
  const raiz=new T.Group();raiz.name='Hábitat · tercer zoom';escena.add(raiz);raiz.visible=false;
  const escenaFauna=new T.Scene();escenaFauna.name='Fauna nítida';escenaFauna.visible=false;
  const escenaFaunaFrente=new T.Scene();escenaFaunaFrente.name='Fauna delante del árbol';escenaFaunaFrente.visible=false;
  const tiempo={value:0},presencia={value:0};
  const material=new T.ShaderMaterial({vertexColors:true,vertexShader:`varying vec3 c;varying vec3 n;void main(){c=color;n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
   fragmentShader:`varying vec3 c;varying vec3 n;void main(){float l=.73+.27*max(0.,dot(normalize(n),normalize(vec3(-.4,.8,1.))));gl_FragColor=vec4(c*l,1.);}`});
  const mesh=(geo,parent)=>{const m=new T.Mesh(geo,material);parent.add(m);return m;};
  const cargador=new T.TextureLoader(),texturas={venado:[],tero:[],'tero-posado':[],'venado-bebiendo':[]};
  let spritesListos=false;
  const cargas=[];
  for(const [id,total] of [['venado',6],['tero',4],['tero-posado',1],['venado-bebiendo',1]])for(let i=0;i<total;i++){
   cargas.push(new Promise((resolve,reject)=>{const tex=cargador.load('assets/fauna/'+id+'-'+i+'.webp',resolve,undefined,reject);tex.encoding=T.LinearEncoding;texturas[id].push(tex);}));
  }
  Promise.all(cargas).then(()=>{
   // Sprite's shader takes the absolute scale; flip UVs instead of scale.x.
   texturas.teroIzquierda=texturas.tero.map(original=>{
    const espejo=original.clone();espejo.repeat.x=-1;espejo.offset.x=1;
    espejo.needsUpdate=true;return espejo;
   });
   spritesListos=true;
  }).catch(error=>{console.error('No se pudieron cargar las ilustraciones de fauna',error);});
  function animalSprite(id){
   const obj=new T.Group(),imagen=new T.Sprite(new T.SpriteMaterial({map:texturas[id][0],transparent:true,alphaTest:.35,depthWrite:true}));
   obj.name=id+' · ilustración animada';imagen.scale.setScalar(id==='venado'?1.6:2.);
   imagen.center.set(.5,id==='venado'?.063:.44);obj.add(imagen);obj.userData.sprite=imagen;escenaFauna.add(obj);return obj;
  }
  const venado=animalSprite('venado');
  const aves=Array.from({length:7},()=>({obj:animalSprite('tero')}));
  aves.forEach((a,i)=>{a.delante=i===0||i%2===1;if(a.delante)escenaFaunaFrente.add(a.obj);});
  aves[0].obj.userData.sprite.center.set(.56,.235);
  aves[0].obj.userData.sprite.scale.setScalar(1.55);
  function pose(obj,id,frame,respirar){
   const imagen=obj.userData.sprite;
   imagen.material.map=texturas[id][frame];imagen.scale.y=(id==='venado-bebiendo'?1.6/1.5:id==='venado'?1.6:id==='tero-posado'?1.55:2.)*(1+respirar);
   obj.userData.frame=frame;
  }
  const F=window.MUSUQ_FORMAS;
  const matPasto=F.material({tiempo,rumbo:{value:rumbo||new T.Vector3(1,0,0)},fuerza:.2,aparicion:presencia});
  const pastos=F.tiposPasto.map((tipo,k)=>{const m=new T.InstancedMesh(F.pasto(tipo,21+k),matPasto,1800);m.instanceColor=new T.InstancedBufferAttribute(new Float32Array(1800*3),3);m.count=0;m.frustumCulled=false;m.name='Pasto low poly al viento · '+tipo;raiz.add(m);return m;});
  const pasto={get count(){return pastos.reduce((s,m)=>s+m.count,0);}};
  const cactus=new T.Group();cactus.name='Cardones · noroeste';raiz.add(cactus);
  const geoCactus=parte([[0,.4,0,.12,.4,.12],[-.23,.46,0,.1,.25,.09],[-.12,.3,0,.2,.08,.09],[.22,.63,0,.085,.21,.085],[.11,.47,0,.2,.075,.09]],(x,y,z)=>Math.abs(z)>.07?'#688e55':'#7c9c5a',.055);
  const detalles=[];const objetos=[{id:'venado',obj:venado,radio:.17},{id:'tero',obj:aves[0].obj,radio:.075}];
  objetos.forEach(item=>{item.cartel=window.MUSUQ_ESPECIE_CARTEL.crear({nombre:fichas[item.id].nombre,icono:'fauna',lienzo,alTocar:()=>abrir(item.id)});});
  const punto=new T.Vector3(),direccion=new T.Vector3(),derecha=new T.Vector3(),origen=new T.Vector3(),camPos=new T.Vector3(),camMira=new T.Vector3(),puntoFoco=new T.Vector3();
  const mat=new T.Object3D(),color=new T.Color();let clave='',zonaActual=null,grupoActual=null,edad=0,reloj=0,reducido=false,foco=null,zoom=0,transicion=0;let ruta=null,activa=false,filtro='todo';
  const panel=document.getElementById('vista-fauna');
  const mostrarFauna=()=>activa&&(filtro==='todo'||filtro==='fauna')&&zonaActual?.id===14;
  function aplicarFiltro(){
   raiz.visible=activa&&(filtro==='todo'||filtro==='flora');
   const faunaVisible=mostrarFauna();
   escenaFauna.visible=escenaFaunaFrente.visible=faunaVisible;
   if(!faunaVisible){cerrar();zoom=0;venado.visible=false;aves.forEach(a=>a.obj.visible=false);}
  }
  function filtrar(tipo='todo'){
   filtro=['todo','arboles','construcciones','flora','fauna'].includes(tipo)?tipo:'todo';
   aplicarFiltro();return filtro;
  }
  function distanciaRio(x,z){
   let min=Infinity;
   for(const [ax,az,bx,bz] of detalles){const dx=bx-ax,dz=bz-az,t=clamp(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1));min=Math.min(min,Math.hypot(x-ax-dx*t,z-az-dz*t));}
   return min;
  }
  function apto(x,z,margen=.07){const i=celdaEn(x,-z);return i!==undefined&&(C.zonas[i]&(1<<zonaActual.id))&&Math.abs(x-C.x[i])<P.q*.5-margen&&Math.abs(z+C.y[i])<P.q*.5-margen&&distanciaRio(x,z)>.09?i:undefined;}
  function preparar(zona,grupo,base,dir){
   zonaActual=zona;grupoActual=grupo;origen.copy(base);direccion.copy(dir);derecha.crossVectors(direccion,new T.Vector3(0,1,0)).normalize();edad=0;foco=null;zoom=0;detalles.length=0;cactus.clear();pastos.forEach(m=>m.count=0);
   for(const l of rios)for(let k=2;k<l.p.length;k+=2){const ax=l.p[k-2],az=-l.p[k-1],bx=l.p[k],bz=-l.p[k+1];if(Math.min(ax,bx)<base.x+3&&Math.max(ax,bx)>base.x-3&&Math.min(az,bz)<base.z+3&&Math.max(az,bz)>base.z-3)detalles.push([ax,az,bx,bz]);}
   let n=0;
   for(let i=0;i<C.x.length;i++){
    if(!(C.zonas[i]&(1<<zona.id))||Math.hypot(C.x[i]-base.x,-C.y[i]-base.z)>P.q*3.6)continue;
    const bio=bioma(C.x[i],C.y[i]),g=window.MUSUQ_BOSQUES.geografia(C.x[i],C.y[i]);
    const cantidad=Math.floor(42*bio.pasto);
    for(let k=0;k<cantidad&&n<5400;k++){
     const seed=i*107+k*17,x=C.x[i]+(azar(seed)-.5)*(P.q-.06),z=-C.y[i]+(azar(seed+2)-.5)*(P.q-.06);
     if(distanciaRio(x,z)<.068||Math.hypot(x-base.x,z-base.z)<.07||azar(seed+3)<.18)continue;
     const mp=pastos[n%3],alto=.022+azar(seed+4)*.034;mat.position.set(x,suelo(i)+.002,z);mat.rotation.set(0,azar(seed+1)*6.28,0);mat.scale.set(alto,alto,alto);mat.updateMatrix();mp.setMatrixAt(mp.count,mat.matrix);
     color.set(bio.color).multiplyScalar(1.1+azar(seed+5)*.3);mp.setColorAt(mp.count++,color);n++;
    }
    if(zona.id!==2&&bio.id==='arido'&&g.lat>-27.5&&g.lat<-23&&g.lon>-66.5&&g.lon<-64.7&&cactus.children.length<7){
     const x=C.x[i]+P.q*.22,z=-C.y[i]+P.q*.18;
     if(distanciaRio(x,z)>.12){const c=mesh(geoCactus,cactus);c.position.set(x,suelo(i),z);c.scale.setScalar(.23+azar(i)*.16);c.rotation.y=azar(i+3)*6.28;}
    }
   }
   pastos.forEach(m=>{m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;});
   ruta=null;let mejor=Infinity;
   for(let k=0;k<450;k++){
    const p=base.clone().addScaledVector(direccion,-.12-azar(k+2)*.48).addScaledVector(derecha,-.28-azar(k+1)*.60);
    const i=apto(p.x,p.z,.15);if(i===undefined)continue;
    const distancia=distanciaRio(p.x,p.z),score=(Number.isFinite(distancia)?Math.abs(distancia-.17):1)+Math.abs(suelo(i)-base.y)*.6;
    if(score>=mejor)continue;
    if(Array.from({length:20},(_,j)=>apto(p.x+Math.cos(j/20*Math.PI*2)*.075,p.z+Math.sin(j/20*Math.PI*2)*.05,.065)===i).every(Boolean)){ruta={x:p.x,z:p.z,i};mejor=score;}
   }
   if(!ruta){const i=celdaEn(base.x,-base.z);if(i!==undefined)ruta={x:C.x[i],z:-C.y[i],i};}
   let bebida=null,puntaje=Infinity;
   for(const [ax,az,bx,bz] of detalles)for(let k=0;k<=12;k++){
    const rx=ax+(bx-ax)*k/12,rz=az+(bz-az)*k/12;
    const x=rx+derecha.x*.106,z=rz+derecha.z*.106;
    const lado=(x-base.x)*derecha.x+(z-base.z)*derecha.z;
    const prof=(x-base.x)*direccion.x+(z-base.z)*direccion.z;
    if(lado>-.22||lado<-.95||prof>.15||prof<-.8)continue;
    const i=apto(x,z,.04),ri=celdaEn(rx,-rz);if(i===undefined||ri===undefined||Math.abs(suelo(i)-suelo(ri))>.018)continue;
    const pies=[-.022,.015,.08,.105].every(d=>{const j=celdaEn(x+derecha.x*d,-z-derecha.z*d);return j!==undefined&&Math.abs(suelo(j)-suelo(i))<.018&&distanciaRio(x+derecha.x*d,z+derecha.z*d)>.039;});
    if(!pies)continue;
    const s=Math.abs(lado+.52)+Math.abs(prof+.30)*.5;
    if(s<puntaje){puntaje=s;bebida={x,z,i,bebe:true,rx,rz};}
   }
   if(bebida)ruta=bebida;
   venado.scale.setScalar(.145);aves.forEach((a,i)=>a.obj.scale.setScalar(i===0?.115:.10));
  }
  function abrir(id){
   if(!mostrarFauna()||!spritesListos||transicion<.94)return;
   const item=objetos.find(o=>o.id===id);if(!item||!item.obj.visible)return;
   alAbrir?.();
   foco=item;camPos.copy(item.obj.position);item.obj.getWorldPosition(puntoFoco);puntoFoco.y+=id==='venado'?.105:.065;
   const f=fichas[id];for(const campo of ['nombre','cientifico','ambiente','texto'])document.getElementById('fauna-'+campo).textContent=f[campo];
   const a=document.getElementById('fauna-fuente');a.href=f.fuente;
   window.MUSUQ_FOTOS_ESPECIES?.mostrar(panel,id,'#fauna-texto');
   panel.hidden=false;panel.inert=false;document.body.classList.add('en-fauna');
   document.getElementById('fauna-volver').focus({preventScroll:true});window.MUSUQ_A11Y?.narrar(f.nombre+'. '+f.texto);
  }
  function cerrar(){if(!foco)return false;foco=null;panel.inert=true;panel.hidden=true;document.body.classList.remove('en-fauna');return true;}
  document.getElementById('fauna-volver').addEventListener('click',cerrar);
  function actualizar({dt,instantaneo,zona,grupo,base,dir,cercania,arbolVisual}){
   reducido=instantaneo;transicion=cercania;activa=!!grupo&&!!zona&&cercania>.45;
   if(!activa){clave='';aplicarFiltro();return;}
   const nueva=zona.id+':'+grupo.clave;
   if(nueva!==clave){cerrar();preparar(zona,grupo,base,dir);clave=nueva;}
   if(!reducido){reloj+=dt;edad+=dt;}else edad=Math.max(edad,8);
   tiempo.value=reducido?0:reloj;presencia.value=T.MathUtils.smoothstep(cercania,.45,.95);
   venado.visible=spritesListos&&zona.id===14&&!!ruta;aves.forEach(a=>a.obj.visible=spritesListos&&zona.id===14);
   aplicarFiltro();
   if(!mostrarFauna())return;
   const t=edad,anda=!foco||foco.id!=='venado';
   if(ruta?.bebe){
    venado.position.set(ruta.x,suelo(ruta.i)+.010,ruta.z);venado.rotation.y=0;
    venado.userData.sprite.center.set(.55,.08);venado.userData.sprite.scale.x=1.6;
    pose(venado,'venado-bebiendo',0,reducido?0:Math.sin(t*2.3)*.005);
   }else{
    if(ruta&&anda){const a=t*.28;venado.position.set(ruta.x+Math.cos(a)*.075,suelo(ruta.i)+.003,ruta.z+Math.sin(a)*.05);}
    venado.userData.sprite.center.set(.5,.063);
    pose(venado,'venado',reducido||!anda?4:Math.floor(t*5)%4,reducido?0:Math.sin(t*2)*.009);
   }
   aves.forEach((a,i)=>{
    const e=Math.max(0,t-i*.38),f=clamp(e/(4+i*.12)),s=f*f*(3-2*f);
    if(i===0){
     if(foco?.id!=='tero'&&arbolVisual){
      arbolVisual.updateMatrixWorld(true);
      a.obj.position.set(grupo.id==='tala'?-.13:-.19,grupo.id==='tala'?.415:.376,.008);arbolVisual.localToWorld(a.obj.position);
     }
     const volando=foco?.id==='tero';
     a.obj.userData.sprite.center.set(volando?.5:.56,volando?.44:.235);
     a.obj.userData.sprite.scale.x=volando?2.:1.55;
     pose(a.obj,volando?'tero':'tero-posado',volando?(reducido?1:[0,1,2,3,2,1][Math.floor(t*7)%6]):0,reducido?0:Math.sin(t*1.8)*.008);
     return;
    }
    else{a.obj.position.copy(origen).addScaledVector(direccion,(a.delante?-.12:.2)+s*(a.delante?-.28:.48)).addScaledVector(derecha,(a.delante?-.14:.1)+s*((i%2?1:-1)*(.32+i*.12)));a.obj.position.y+=.28+s*(.75+i*.13)+Math.max(0,e-4)*.08;a.obj.visible=spritesListos&&e<15&&e>0;}
    const secuencia=[0,1,2,3,2,1];
    pose(a.obj,i%2===0&&spritesListos?'teroIzquierda':'tero',reducido?1:secuencia[Math.floor(t*7+i*1.7)%6],reducido?0:Math.sin(t*4+i)*.012);
    a.obj.userData.sprite.scale.x=2.;
    if(!spritesListos)a.obj.visible=false;
   });
  }
  function aplicarCamara(camara,dt){
   const objetivo=foco?1:0;zoom=reducido?objetivo:zoom+(objetivo-zoom)*(1-Math.exp(-dt*4));if(zoom<.001){zoom=0;return;}
   const d=foco||objetos.find(o=>o.id===panel.dataset.ultimo)||objetos[0];
   if(foco)panel.dataset.ultimo=foco.id;
   const alto=d.id==='venado'?.105:.065;
   puntoFoco.copy(d.obj.position);puntoFoco.y+=alto;
   camPos.copy(puntoFoco).addScaledVector(direccion,-d.radio*(innerWidth<700?6:4.8)).addScaledVector(derecha,d.radio*.8);camPos.y+=d.radio*1.9;
   camMira.copy(puntoFoco).addScaledVector(derecha,-d.radio*(innerWidth<700?0:.9));
   if(innerWidth<700)camMira.y-=d.radio*1.0;
   punto.copy(camara.position);camara.getWorldDirection(punto);punto.multiplyScalar(camara.position.distanceTo(puntoFoco)).add(camara.position);
   camara.position.lerp(camPos,zoom);punto.lerp(camMira,zoom);camara.lookAt(punto);camara.near=.015;camara.updateProjectionMatrix();
  }
  function detectar(event,camara){
   if(!mostrarFauna()||!spritesListos||foco||transicion<.94)return false;
   const rect=lienzo.getBoundingClientRect();
   for(const item of objetos){
    if(!item.obj.visible)continue;
    punto.copy(item.obj.position);punto.y+=item.id==='venado'?.10:.06;punto.project(camara);
    if(punto.z<-1||punto.z>1)continue;
    const px=rect.left+(punto.x+1)*rect.width/2,py=rect.top+(1-punto.y)*rect.height/2;
    if(Math.hypot(event.clientX-px,event.clientY-py)<32){abrir(item.id);return true;}
   }return false;
  }
  function actualizarCarteles(camara,dt,ocultos=false){
   for(const item of objetos){punto.copy(item.obj.position);punto.y+=item.id==='venado'?.26:.16;item.cartel.actualizar({camara,punto,visible:!ocultos&&mostrarFauna()&&spritesListos&&transicion>.94&&item.obj.visible&&!foco&&zoom<.05,dt,instantaneo:reducido});}
  }
  return {get seleccion(){return foco?.id||null;},get disponible(){return mostrarFauna()&&spritesListos&&transicion>=.94;},actualizar,actualizarCarteles,aplicarCamara,detectar,cerrar,abrir,bioma,filtrar,render(renderer,camara,delante=false){if(mostrarFauna())renderer.render(delante?escenaFaunaFrente:escenaFauna,camara);},get enFauna(){return !!foco||zoom>.02;},get zoom(){return zoom;},estado:()=>({zona:zonaActual?.id,filtro,activo:activa&&(raiz.visible||mostrarFauna()),flora:raiz.visible,pasto:pasto.count,cactus:cactus.children.length,fauna:mostrarFauna(),foco:foco?.id||null,zoom,aves:aves.filter(a=>a.obj.visible).length,venado:venado.position.toArray(),tero:aves[0].obj.position.toArray(),distanciaVenadoRio:distanciaRio(venado.position.x,venado.position.z),venadoLateral:(venado.position.x-origen.x)*derecha.x+(venado.position.z-origen.z)*derecha.z,bandada:aves.slice(1).map(a=>({delante:a.delante,visible:a.obj.visible}))})};
 }
 window.MUSUQ_HABITAT={crear,bioma,fichas};
})();
