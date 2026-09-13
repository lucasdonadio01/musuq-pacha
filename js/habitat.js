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
   texto:'Ave nativa de pecho negro, vientre blanco y patas rojizas. Recorre el suelo buscando pequeños invertebrados y su llamado de alarma es muy reconocible. Nidifica en el suelo. El vuelo estacionario del visor es una licencia de animación para observar sus detalles.',
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
 function crear({escena,C,P,suelo,celdaEn,rios,lienzo,rumbo}){
  const raiz=new T.Group();raiz.name='Hábitat · tercer zoom';escena.add(raiz);raiz.visible=false;
  const escenaFauna=new T.Scene();escenaFauna.name='Fauna nítida';
  const tiempo={value:0},presencia={value:0};
  const material=new T.ShaderMaterial({vertexColors:true,vertexShader:`varying vec3 c;varying vec3 n;void main(){c=color;n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
   fragmentShader:`varying vec3 c;varying vec3 n;void main(){float l=.73+.27*max(0.,dot(normalize(n),normalize(vec3(-.4,.8,1.))));gl_FragColor=vec4(c*l,1.);}`});
  const mesh=(geo,parent)=>{const m=new T.Mesh(geo,material);parent.add(m);return m;};
  const venado=new T.Group();venado.name='Venado de las pampas · vóxeles';escenaFauna.add(venado);
  mesh(parte([[0,.66,0,.49,.24,.20], [.34,.82,0,.15,.30,.13]],(x,y)=>y<.59?'#e7d2a3':'#b88e57'),venado);
  const cabeza=new T.Group();cabeza.position.set(.4,1.01,0);venado.add(cabeza);
  mesh(parte([[.08,.04,0,.21,.14,.12],[.22,-.02,0,.19,.075,.08]],(x,y)=>x>.31?'#392c21':y<-.035?'#eddfb9':'#ba955e',.04),cabeza);
  mesh(parte([[-.015,.23,.13,.065,.19,.055],[-.015,.23,-.13,.065,.19,.055]],'#c9a675',.035),cabeza);
  mesh(parte([[.12,.09,.115,.028,.032,.023],[.12,.09,-.115,.028,.032,.023]],'#211c16',.019),cabeza);
  const piernas=[];
  for(const x of [-.32,.31])for(const z of [-.145,.145]){
   const p=new T.Group();p.position.set(x,.54,z);venado.add(p);piernas.push(p);
   mesh(parte([[0,-.23,0,.055,.27,.055],[.025,-.49,0,.075,.045,.065]],(x,y)=>y<-.45?'#403326':'#ab8455',.035),p);
  }
  const cola=new T.Group();cola.position.set(-.48,.72,0);venado.add(cola);mesh(parte([[-.05,-.055,0,.095,.14,.07]],'#eadcbb',.04),cola);
  const aves=[];
  const geoAve=parte([[0,.49,0,.26,.18,.15],[.2,.70,0,.12,.12,.11],[-.29,.44,0,.16,.07,.09]],(x,y)=>y<.44?'#ede9d9':x>.06&&y<.6?'#252e2b':'#87988b',.04);
  const geoPico=parte([[.34,.68,0,.105,.025,.024]],(x)=>x>.39?'#34312b':'#cf7a68',.018);
  const geoOjos=parte([[.24,.73,.104,.024,.025,.018],[.24,.73,-.104,.024,.025,.018]],'#bc4a39',.015);
  const geoCresta=parte([[.11,.85,0,.10,.025,.025]],'#26332d',.024);
  const geoPatas=parte([[.04,.20,.08,.019,.18,.02],[.04,.20,-.08,.019,.18,.02],[.10,.025,.08,.09,.018,.025],[.10,.025,-.08,.09,.018,.025]],'#a86c65',.023);
  const alasGeo=[-1,1].map(s=>parte([[-.08,0,s*.26,.30,.05,.33]],(x,y,z)=>Math.abs(z)>.32?'#28362e':Math.abs(z)>.22?'#e9e5d4':'#697d68',.04));
  for(let i=0;i<7;i++){
   const ave=new T.Group();ave.name='Tero · '+i;escenaFauna.add(ave);
   for(const geo of [geoAve,geoPico,geoOjos,geoCresta,geoPatas])mesh(geo,ave);
   const alas=[-1,1].map((s,k)=>{const a=new T.Group();a.position.set(0,.53,s*.08);ave.add(a);mesh(alasGeo[k],a);return a;});
   aves.push({obj:ave,alas});
  }
  const F=window.MUSUQ_FORMAS;
  const matPasto=F.material({tiempo,rumbo:{value:rumbo||new T.Vector3(1,0,0)},fuerza:.2,aparicion:presencia});
  const pastos=F.tiposPasto.map((tipo,k)=>{const m=new T.InstancedMesh(F.pasto(tipo,21+k),matPasto,1800);m.instanceColor=new T.InstancedBufferAttribute(new Float32Array(1800*3),3);m.count=0;m.frustumCulled=false;m.name='Pasto low poly al viento · '+tipo;raiz.add(m);return m;});
  const pasto={get count(){return pastos.reduce((s,m)=>s+m.count,0);}};
  const cactus=new T.Group();cactus.name='Cardones · noroeste';raiz.add(cactus);
  const geoCactus=parte([[0,.4,0,.12,.4,.12],[-.23,.46,0,.1,.25,.09],[-.12,.3,0,.2,.08,.09],[.22,.63,0,.085,.21,.085],[.11,.47,0,.2,.075,.09]],(x,y,z)=>Math.abs(z)>.07?'#688e55':'#7c9c5a',.055);
  const detalles=[];const objetos=[{id:'venado',obj:venado,radio:.17},{id:'tero',obj:aves[0].obj,radio:.075}];
  const punto=new T.Vector3(),direccion=new T.Vector3(),derecha=new T.Vector3(),origen=new T.Vector3(),camPos=new T.Vector3(),camMira=new T.Vector3(),puntoFoco=new T.Vector3();
  const mat=new T.Object3D(),color=new T.Color();let clave='',zonaActual=null,grupoActual=null,edad=0,reloj=0,reducido=false,foco=null,zoom=0,transicion=0;let ruta=null;
  const panel=document.getElementById('vista-fauna'),controles=document.getElementById('fauna-controles');
  const botones=Array.from(document.querySelectorAll('[data-fauna]'));
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
    if(bio.id==='arido'&&g.lat>-27.5&&g.lat<-23&&g.lon>-66.5&&g.lon<-64.7&&cactus.children.length<7){
     const x=C.x[i]+P.q*.22,z=-C.y[i]+P.q*.18;
     if(distanciaRio(x,z)>.12){const c=mesh(geoCactus,cactus);c.position.set(x,suelo(i),z);c.scale.setScalar(.23+azar(i)*.16);c.rotation.y=azar(i+3)*6.28;}
    }
   }
   pastos.forEach(m=>{m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;});
   ruta=null;
   for(let k=0;k<70;k++){
    const p=base.clone().addScaledVector(direccion,-.25-azar(k+2)*.35).addScaledVector(derecha,.05+(azar(k+1)-.5)*.5);
    const i=apto(p.x,p.z,.15);if(i===undefined)continue;
    if(Array.from({length:20},(_,j)=>apto(p.x+Math.cos(j/20*Math.PI*2)*.075,p.z+Math.sin(j/20*Math.PI*2)*.05,.065)!==undefined).every(Boolean)){ruta={x:p.x,z:p.z,i};break;}
   }
   if(!ruta){const i=celdaEn(base.x,-base.z);if(i!==undefined)ruta={x:C.x[i],z:-C.y[i],i};}
   venado.scale.setScalar(.145);aves.forEach((a,i)=>a.obj.scale.setScalar(i===0?.115:.10));
  }
  function abrir(id){
   if(zonaActual?.id!==14||transicion<.94)return;
   const item=objetos.find(o=>o.id===id);if(!item||!item.obj.visible)return;
   foco=item;camPos.copy(item.obj.position);item.obj.getWorldPosition(puntoFoco);puntoFoco.y+=id==='venado'?.105:.065;
   const f=fichas[id];for(const campo of ['nombre','cientifico','ambiente','texto'])document.getElementById('fauna-'+campo).textContent=f[campo];
   const a=document.getElementById('fauna-fuente');a.href=f.fuente;
   panel.hidden=false;panel.inert=false;controles.hidden=true;document.body.classList.add('en-fauna');
   document.getElementById('fauna-volver').focus({preventScroll:true});window.MUSUQ_A11Y?.narrar(f.nombre+'. '+f.texto);
  }
  function cerrar(){if(!foco)return false;foco=null;panel.inert=true;panel.hidden=true;document.body.classList.remove('en-fauna');return true;}
  document.getElementById('fauna-volver').addEventListener('click',cerrar);botones.forEach(b=>b.addEventListener('click',()=>abrir(b.dataset.fauna)));
  function actualizar({dt,instantaneo,zona,grupo,base,dir,cercania}){
   reducido=instantaneo;transicion=cercania;const activa=!!grupo&&!!zona&&cercania>.45;
   raiz.visible=activa;
   if(!activa){clave='';cerrar();zoom=0;controles.hidden=true;return;}
   const nueva=zona.id+':'+grupo.clave;
   if(nueva!==clave){cerrar();preparar(zona,grupo,base,dir);clave=nueva;}
   if(!reducido){reloj+=dt;edad+=dt;}else edad=Math.max(edad,8);
   tiempo.value=reducido?0:reloj;presencia.value=T.MathUtils.smoothstep(cercania,.45,.95);
   venado.visible=zona.id===14&&!!ruta;aves.forEach(a=>a.obj.visible=zona.id===14);
   controles.hidden=zona.id!==14||!!foco||cercania<.94;
   if(zona.id!==14)return;
   const t=edad,anda=!foco||foco.id!=='venado';
   if(ruta&&anda){const a=t*.28;venado.position.set(ruta.x+Math.cos(a)*.075,suelo(ruta.i)+.003,ruta.z+Math.sin(a)*.05);venado.rotation.y=Math.atan2(-Math.cos(a)*.05,-Math.sin(a)*.075);}
   piernas.forEach((p,k)=>p.rotation.z=reducido||!anda?0:Math.sin(t*4+(k===0||k===3?0:Math.PI))*.20);
   cabeza.rotation.z=reducido?0:Math.sin(t*.8)*.055;cola.rotation.x=reducido?0:Math.sin(t*2)*.15;
   aves.forEach((a,i)=>{
    const e=Math.max(0,t-i*.24),f=clamp(e/4),s=f*f*(3-2*f);
    if(i===0){if(foco?.id!=='tero'){a.obj.position.copy(origen).addScaledVector(direccion,.15*(1-s)-.37*s).addScaledVector(derecha,.31*s);a.obj.position.y+=.28+.22*s;}a.obj.rotation.y=-.5;}
    else{a.obj.position.copy(origen).addScaledVector(direccion,.2+s*(.25+i*.06)).addScaledVector(derecha,s*((i%2?1:-1)*(.32+i*.12)));a.obj.position.y+=.28+s*(.75+i*.13)+Math.max(0,e-4)*.08;a.obj.visible=e<15&&e>0;}
    a.alas.forEach((ala,k)=>ala.rotation.x=reducido?(-.15*(k?1:-1)):Math.sin(t*8+i*.7)*.85*(k?1:-1));
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
   if(!raiz.visible||zonaActual?.id!==14||foco||transicion<.94)return false;
   const rect=lienzo.getBoundingClientRect();
   for(const item of objetos){
    if(!item.obj.visible)continue;
    punto.copy(item.obj.position);punto.y+=item.id==='venado'?.10:.06;punto.project(camara);
    if(punto.z<-1||punto.z>1)continue;
    const px=rect.left+(punto.x+1)*rect.width/2,py=rect.top+(1-punto.y)*rect.height/2;
    if(Math.hypot(event.clientX-px,event.clientY-py)<32){abrir(item.id);return true;}
   }return false;
  }
  return {actualizar,aplicarCamara,detectar,cerrar,abrir,bioma,render(renderer,camara){if(raiz.visible)renderer.render(escenaFauna,camara);},get enFauna(){return !!foco||zoom>.02;},get zoom(){return zoom;},estado:()=>({zona:zonaActual?.id,activo:raiz.visible,pasto:pasto.count,cactus:cactus.children.length,fauna:zonaActual?.id===14,foco:foco?.id||null,zoom,aves:aves.filter(a=>a.obj.visible).length,venado:venado.position.toArray(),tero:aves[0].obj.position.toArray()})};
 }
 window.MUSUQ_HABITAT={crear,bioma,fichas};
})();
