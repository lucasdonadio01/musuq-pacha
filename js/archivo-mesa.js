/* Una escena, una cámara. Papeles, sombras y baldosas viven en WebGL.
 * Rótulos proyectados y lectura conservan HTML semántico y nunca quedan tapados. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id), T = window.THREE;
  const root = $('archivo-experiencia'), canvas = $('mesa-escena');
  const reducedPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = {get matches(){return reducedPreference.matches||!!window.MUSUQ_A11Y?.estado.detener;}};
  const bridge = window.MUSUQ_ARCHIVO_TRANSICION;
  let arrivalStart = 0, arriving = !!bridge?.entrada, arrivalProgress = arriving ? 0 : 1;
  if (arriving) root.inert = true;
  const query = new URLSearchParams(location.search), id = query.has('pueblo') ? Number(query.get('pueblo')) : 14;
  const nombre = window.MUSUQ_ARCHIVO_DATOS.nombres[id];
  if (!nombre) { $('archivo-cargando').hidden = true; $('archivo-error').hidden = false; $('error-mensaje').textContent = 'Ese pueblo todavía no está disponible. Volvé al territorio para elegir otro.'; return; }
  const cats = window.MUSUQ_MESA.map(c => id === 14 ? c : {...c, contexto:'Archivo en preparación. No trasladamos documentos de otros pueblos.', fuentesContexto:[], laminas:[]});
  // Warm variants remain anchored to Querandí's #e9bd76 in datos-mapa.js.
  const categoryColors=['#d8ab73','#e3b98c','#b9a494','#e9bd76','#cd966d','#a6b782','#c4b777','#ce9b87'];
  cats.forEach((c,i)=>{c.color=categoryColors[i];});
  document.title = 'Archivo '+nombre+' · Musuq Pacha';
  $('pueblo-nombre').replaceChildren(document.createTextNode(nombre), Object.assign(document.createElement('span'), {textContent:'.'}));
  $('volver-mapa').href = 'index.html?pueblo='+id; $('archivo-link').href = 'archivo.html?pueblo='+id;
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const v3 = (x=0,y=0,z=0) => new T.Vector3(x,y,z);
  let vista='mesa', ci=0, li=0, hover=null, drag=null, lastAction=0, running=true;
  let inspectZoom=1,boardZoom=1,wheelLockUntil=0,wheelDebt=0,lastWheel=0,spin=0,spinGoal=0;
  const categoryButtons=[];
  const categorySummaries={creencias:'Relatos y formas de comprender el mundo.',viviendas:'Refugios, materiales y formas de habitar.',muerte:'Memoria y vínculos con los antepasados.',sociedad:'Escenas de la vida y encuentros en el territorio.',personajes:'Personas, trayectorias y voces del archivo.',naturaleza:'Paisajes y plantas del territorio.',fauna:'Animales y sus ambientes.',patrones:'Formas, motivos y técnicas visuales.'};
  const thanks=document.createElement('p');thanks.className='aporte-gracias';thanks.hidden=true;thanks.setAttribute('role','status');root.append(thanks);
  let width=1,height=1,mobile=false,time=0,lastTime=0,frame=0,sceneReady=false;
  let renderer,scene,camera,target,postScene,postCamera,postMat,tiles,tileUniforms;
  const cards=[],labels=[],hitMeshes=[],resources=new Set(),textures=new Map(),piles=[];
  let anotando=false;
  const archivoAPI={
    actual:()=>vista==='lamina'?cats[ci].laminas[li]:null,
    agregar(item){
      if(id!==14||!sceneReady)return false;
      const category=cats.findIndex(c=>c.id==='sociedad');
      let index=cats[category].laminas.findIndex(l=>l.id===item.id),card;
      if(index<0){index=cats[category].laminas.length;cats[category].laminas.push(item);card=makePaper(item,category,index);piles[category].cards.push(card);arrange();}
      else card=cards.find(c=>c.ci===category&&c.li===index);
      openCategory(category);openDetail(index,true);card.group.position.copy(piles[category].center);card.group.position.z=175;card.group.scale.setScalar(mobile?1.4:1.55);
      card.aporteInicio=performance.now()+250;card.zoomHint=null;thanks.hidden=false;thanks.textContent='Gracias por reconstruir la memoria';announce('Tu aporte ya está en el archivo.');return true;
    },
    anotar(valor){anotando=valor;drag=null;tilt.set(0,0);spin=spinGoal=0;},
    limpiar(){for(const t of textures.values()){if(!t.userData.base)continue;const c=t.image,ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(t.userData.base,0,0);t.needsUpdate=true;}},
    uv(e){const h=hit(e);return h&&h.object.userData.card?.item===this.actual()?{x:h.uv.x,y:1-h.uv.y}:null;},
    proyectar(p){const c=cards.find(c=>c.item===this.actual());if(!c)return null;const v=v3((p.x-.5)*c.w,(.5-p.y)*c.h,3);c.group.localToWorld(v);v.project(camera);return {x:(v.x+1)*width/2,y:(1-v.y)*height/2};},
    resaltar(trazos){const t=textures.get(this.actual()?.id);if(!t?.userData.base)return;const c=t.image,ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(t.userData.base,0,0);ctx.save();ctx.strokeStyle='#fc6020';ctx.globalAlpha=.65;ctx.lineWidth=13;ctx.lineCap=ctx.lineJoin='round';for(const trazo of trazos){ctx.beginPath();trazo.forEach((p,i)=>ctx[i?'lineTo':'moveTo'](p.x*c.width,p.y*c.height));ctx.stroke();}ctx.restore();t.needsUpdate=true;}
  };
  function renderContextSources(node,cat){
    node.replaceChildren();const sources=cat.fuentesContexto||[];node.hidden=!sources.length;
    if(!sources.length)return;
    const label=document.createElement('span');label.className='contexto-fuentes-rotulo';label.textContent=sources.length===1?'Fuente de esta descripción':'Fuentes de esta descripción';node.append(label);
    const list=document.createElement('ul');sources.forEach(source=>{const item=document.createElement('li'),link=document.createElement('a');link.textContent=source.nombre;link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';item.append(link);list.append(item);});node.append(list);
  }
  function readableFallback(message){
    arriving=false;bridge?.terminar();
    running=false;document.body.classList.add('sin-webgl');root.replaceChildren();
    const h=document.createElement('h1');h.textContent='Archivo '+nombre;root.append(h);
    const note=document.createElement('p');note.textContent=message+' Podés consultar todos los documentos en esta vista de lectura.';root.append(note);
    const retry=document.createElement('button');retry.textContent='Reintentar la mesa 3D';retry.onclick=()=>location.reload();root.append(retry);
    cats.forEach(cat=>{
      const section=document.createElement('section'),heading=document.createElement('h2');heading.textContent=cat.nombre;section.append(heading);
      const context=document.createElement('p');context.textContent=cat.contexto;section.append(context);
      const sources=document.createElement('div');sources.className='contexto-fuentes';renderContextSources(sources,cat);section.append(sources);
      cat.laminas.forEach(item=>{const figure=document.createElement('figure');if(item.imagen){const img=document.createElement('img');img.src=item.imagen;img.alt=item.titulo;img.loading='lazy';figure.append(img);}const title=document.createElement('h3');title.textContent=item.titulo;figure.append(title);[item.descripcion,item.limite,[item.credito,item.licencia].filter(Boolean).join(' · ')].filter(Boolean).forEach(text=>{const p=document.createElement('p');p.textContent=text;figure.append(p);});if(item.fuente){const a=document.createElement('a');a.textContent='Consultar la fuente de la imagen';a.href=item.fuente;a.target='_blank';a.rel='noopener noreferrer';figure.append(a);}section.append(figure);});root.append(section);
    });
  }
  if(!T){readableFallback('No se pudo cargar el motor 3D.');return;}
  const pan=v3(),parallax=v3(),look=v3(),desiredLook=v3(),camGoal=v3(),pointer=new T.Vector2(0,0),tilt=new T.Vector2();
  const raycaster=new T.Raycaster(),floor=new T.Plane(v3(0,0,1),0),floorPoint=v3(),temp=v3();
  const audios={abrir:new Audio('sonidos/zoom-1.mp3'),cerrar:new Audio('sonidos/zoom-3-reversa.mp3')};
  Object.values(audios).forEach(a=>{a.preload='none';a.volume=.45;});
  function sound(k){if(window.MUSUQ_SONIDO?.efectos!==false){const a=audios[k];a.currentTime=0;a.play().catch(()=>{});}}
  addEventListener('musuq:sonido',e=>{if(e.detail?.efectos===false||window.MUSUQ_SONIDO?.efectos===false)Object.values(audios).forEach(a=>a.pause());});
  const inputProtegido=e=>!!document.querySelector('dialog[open]')||!!e.target?.closest?.('#header');
  function el(tag,text){const e=document.createElement(tag);if(text)e.textContent=text;return e;}
  function track(r){resources.add(r);return r;}
  function announce(text){$('archivo-estado').textContent=text;}
  cats.forEach((cat,i)=>{const b=el('button');b.type='button';b.className='categoria-etiqueta pixel-button';b.append(el('span',cat.nombre));const subtitle=el('small',categorySummaries[cat.id]);subtitle.className='categoria-subtitulo';b.append(subtitle);b.style.setProperty('--category-color',cat.color);b.setAttribute('aria-label','Explorar '+cat.nombre);b.onclick=()=>{if(vista==='mesa'||ci!==i)openCategory(i,true);else if(vista==='lamina')back();};$('categoria-opciones').append(b);categoryButtons.push({button:b,x:0,y:0,ready:false});});
  function pixelFeedback(button){if(!button||reduced.matches)return;const step=(Number(button.dataset.pixelStep)||0)+1;button.dataset.pixelStep=String(step);button.style.setProperty('--pixel-shift',step%2?'14px':'-8px');button.style.setProperty('--pixel-cross',step%2?'-10px':'8px');}
  document.addEventListener('click',e=>pixelFeedback(e.target.closest('.pixel-button')));
  function route(push=true){if(push)history.pushState({},'',location.pathname+location.search+(vista==='mesa'?'':'#'+cats[ci].id+(vista==='lamina'?'/'+(li+1):'')));}
  function updateView(){
    thanks.hidden=true;
    window.MUSUQ_ARCHIVO_APORTES?.cambiarVista();
    document.body.dataset.vista=vista;
    $('categoria-cabecera').hidden=vista==='mesa';$('detalle').hidden=vista!=='lamina';$('inspector-controles').hidden=vista!=='lamina';
    $('laminas-accesibles').hidden=vista!=='categoria';document.querySelector('.archivo-titulo').setAttribute('aria-hidden',String(vista!=='mesa'));
    $('hover-etiqueta').hidden=true;hover=null;pan.set(0,0,0);lastAction=performance.now();tilt.set(0,0);
    inspectZoom=1;syncZoomButton();spin=spinGoal=0;cards.forEach(c=>{c.group.rotation.y=T.MathUtils.euclideanModulo(c.group.rotation.y+Math.PI,Math.PI*2)-Math.PI;});
    categoryButtons.forEach((entry,i)=>{const active=vista!=='mesa'&&ci===i;entry.button.hidden=vista!=='mesa'&&!active;entry.button.classList.toggle('seleccionada',active);entry.button.setAttribute('aria-current',active?'true':'false');});
    if(vista!=='mesa'){$('categoria-titulo').textContent=cats[ci].nombre;root.style.setProperty('--selected-color',cats[ci].color);}
  }
  function pulse(point){if(!tileUniforms||reduced.matches)return;tileUniforms.origin.value.set(point.x,point.y);tileUniforms.start.value=time;}
  function colorWave(point,color){if(!tileUniforms)return;tileUniforms.colorFrom.value.copy(tileUniforms.colorTo.value);tileUniforms.colorTo.value.set(color);tileUniforms.colorOrigin.value.set(point.x,point.y);tileUniforms.colorStart.value=reduced.matches?time-10:time;pulse(point);}
  function openCategory(index,user=false,push=true){
    ci=index;li=0;vista='categoria';const c=cats[ci];updateView();route(push);
    $('categoria-rotulo').textContent=nombre+' / '+(c.laminas.filter(x=>x.imagen).length||'Sin')+' documentos';$('categoria-titulo').textContent=c.nombre;$('categoria-resumen').textContent=c.contexto;
    $('laminas-accesibles').replaceChildren();c.laminas.forEach((l,j)=>{const b=el('button',l.titulo);b.onclick=()=>openDetail(j,true);$('laminas-accesibles').append(b);});
    colorWave(piles[ci]?.center||v3(),c.color);
    if(user){sound('abrir');}announce(c.nombre+'. Seleccioná una imagen del montón.');
  }
  function openDetail(index,user=false,push=true){
    const keyboardEntry=$('laminas-accesibles').contains(document.activeElement);
    const c=cats[ci],l=c.laminas[index];if(!l)return;li=index;vista='lamina';updateView();route(push);
    const selectedCard=cards.find(x=>x.ci===ci&&x.li===li);if(selectedCard)selectedCard.zoomHint=performance.now()+700;
    $('detalle-pueblo').textContent='Archivo / '+nombre;$('detalle-categoria').textContent=c.nombre;$('detalle-contexto').textContent=c.contexto;renderContextSources($('detalle-fuentes'),c);
    $('lamina-tipo').textContent=l.enInvestigacion?'Investigación pendiente':l.tipo||l.atribucion||'Documento / '+(l.fecha||'Fuente histórica');
    $('lamina-titulo').textContent=l.titulo;$('lamina-descripcion').textContent=l.descripcion;$('lamina-limite').textContent=l.limite||'';
    $('lamina-credito').textContent=[l.credito,l.licencia].filter(Boolean).join(' · ');$('lamina-fuente').hidden=!l.fuente;if(l.fuente)$('lamina-fuente').href=l.fuente;
    $('lamina-relacion').hidden=!l.fuenteRelacion;if(l.fuenteRelacion){const link=$('lamina-relacion').querySelector('a');link.href=l.fuenteRelacion;link.textContent=l.fuenteRelacionNombre||'Leer el contexto comunitario';}
    $('lamina-contador').textContent=(index+1)+' / '+c.laminas.length;$('lamina-anterior').disabled=index===0;$('lamina-siguiente').disabled=index===c.laminas.length-1;
    $('detalle').scrollTop=0;if(keyboardEntry)$('lamina-titulo').focus({preventScroll:true});if(user){const card=cards.find(x=>x.ci===ci&&x.li===li);pulse(card?.group.position||piles[ci]?.center||v3());sound('abrir');}announce(l.titulo);
  }
  function back(push=true){if(vista==='mesa')return;sound('cerrar');if(vista==='lamina'){openCategory(ci,false,push);}else{vista='mesa';boardZoom=1;updateView();route(push);colorWave(piles[ci]?.center||v3(),'#e9bd76');}categoryButtons[ci]?.button.focus({preventScroll:true});}
  $('volver-mesa').onclick=()=>back();$('volver-categoria').onclick=()=>back();
  $('lamina-anterior').onclick=()=>openDetail(li-1,true);$('lamina-siguiente').onclick=()=>openDetail(li+1,true);
  $('girar-imagen').onclick=()=>{if(!reduced.matches)spinGoal+=Math.PI*2;announce('Vista de la imagen en 360 grados.');};
  function syncZoomButton(){
    const enlarged=inspectZoom<.999,button=$('zoom-imagen');
    const label=enlarged?'Restablecer zoom':'Acercar imagen';
    button.setAttribute('aria-label',label);button.title=label;
    button.querySelector('use').setAttribute('href',enlarged?'#i-zoom-out':'#i-zoom-in');
  }
  $('zoom-imagen').onclick=()=>{
    if(vista!=='lamina')return;
    inspectZoom=inspectZoom<.999?1:.68;syncZoomButton();
    announce(inspectZoom<1?'Imagen ampliada. Volvé a pulsar para restablecer el zoom.':'Zoom restablecido.');
  };
  $('reintentar').onclick=()=>location.reload();
  function fromHash(){if(!running)return;const [key,n]=location.hash.slice(1).split('/');const i=cats.findIndex(c=>c.id===key);if(i<0){vista='mesa';updateView();colorWave(v3(),'#e9bd76');return;}openCategory(i,false,false);const num=Number(n)-1;if(n&&Number.isInteger(num))openDetail(num,false,false);}
  addEventListener('popstate',fromHash);
  document.addEventListener('keydown',e=>{
    if(!running||inputProtegido(e))return;
    if(e.key==='Escape'){e.preventDefault();back();}
    if(e.target!==canvas)return;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const x=(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0),y=(e.key==='ArrowUp'?1:e.key==='ArrowDown'?-1:0);if(vista==='lamina'){if(!reduced.matches){tilt.x=clamp(tilt.x+y*.08,-.4,.4);tilt.y=clamp(tilt.y+x*.08,-.4,.4);}}else{pan.x=clamp(pan.x+x*40,-145,145);pan.y=clamp(pan.y+y*40,-145,145);}}
  });

  const paperVertex=`varying vec2 vUv;varying vec3 vWorld;varying vec3 vNormal;
    void main(){vUv=uv;vec4 p=modelMatrix*vec4(position,1.);vWorld=p.xyz;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*p;}`;
  const paperFragment=`uniform sampler2D map;uniform float shade,aporte;varying vec2 vUv;varying vec3 vWorld;varying vec3 vNormal;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){vec3 ink=texture2D(map,vUv).rgb;
      vec2 cell=floor(vUv*vec2(24.,30.));float threshold=length((cell+.5)/vec2(24.,30.)-.5)*.85+hash(cell)*.28;
      float reveal=clamp(aporte/1.35,0.,1.);if(reveal<threshold)discard;
      float edge=(1.-smoothstep(0.,.055,reveal-threshold))*(1.-step(1.,reveal));
      ink=mix(ink,vec3(.99,.38,.12),edge*.85);
      float gleam=exp(-pow((vUv.x+vUv.y*.35-(aporte-1.35)*1.1)/.10,2.))*step(1.35,aporte)*(1.-step(3.,aporte));
      float g=hash(floor(vUv*vec2(1100.,1400.)))-.5;
      float f=sin(vUv.x*2350.+sin(vUv.y*970.)*1.2)*sin(vUv.y*2200.)*.5;
      vec3 N=normalize(vNormal+vec3(g*.15,f*.06,0.));vec3 V=normalize(cameraPosition-vWorld);vec3 L=normalize(vec3(-.6,.8,1.8));
      float sheen=pow(max(dot(N,normalize(L+V)),0.),35.)*.055;
      float light=.94+.06*max(dot(N,L),0.);gl_FragColor=vec4(ink*(light+g*.022+f*.008)*shade+sheen+gleam*.40,1.);}`;
  function paperMaterial(texture){return track(new T.ShaderMaterial({uniforms:{map:{value:texture},shade:{value:1},aporte:{value:10}},vertexShader:paperVertex,fragmentShader:paperFragment,side:T.DoubleSide}));}
  function wrap(ctx,text,x,y,max,lineHeight){let line='';for(const word of text.split(' ')){const next=line+word+' ';if(ctx.measureText(next).width>max&&line){ctx.fillText(line,x,y);line=word+' ';y+=lineHeight;}else line=next;}ctx.fillText(line,x,y);return y+lineHeight;}
  function baseTexture(item){
    if(textures.has(item.id))return textures.get(item.id);
    const c=document.createElement('canvas');c.width=768;c.height=960;const ctx=c.getContext('2d');
    const paint=(img)=>{ctx.fillStyle='#faf7ef';ctx.fillRect(0,0,c.width,c.height);
      if(img){const factor=Math.min(710/img.naturalWidth,842/img.naturalHeight);const w=img.naturalWidth*factor,h=img.naturalHeight*factor;ctx.drawImage(img,(768-w)/2,32+(842-h)/2,w,h);}
      else{ctx.fillStyle='#8c8375';ctx.fillRect(40,45,20,20);ctx.fillStyle='#262622';ctx.font='38px "Space Grotesk",sans-serif';const y=wrap(ctx,item.titulo||'Investigación en curso',46,175,660,49);ctx.font='24px "Space Grotesk",sans-serif';ctx.fillStyle='#666054';wrap(ctx,item.descripcion||'Todavía no incorporamos documentación verificada para esta categoría.',46,y+46,650,37);}
      ctx.fillStyle='#665f54';ctx.font='15px "Space Grotesk",sans-serif';ctx.fillText((item.id||'ARCHIVO').toUpperCase()+' / '+(item.imagen?'DOCUMENTO':'POR INVESTIGAR'),32,928);ctx.fillRect(714,916,13,13);const base=document.createElement('canvas');base.width=c.width;base.height=c.height;base.getContext('2d').drawImage(c,0,0);texture.userData.base=base;texture.needsUpdate=true;};
    const texture=track(new T.CanvasTexture(c));texture.userData={};texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);textures.set(item.id,texture);paint();
    if(item.imagen){const img=new Image();img.onload=()=>paint(img);img.onerror=()=>{paint();announce('No se pudo cargar '+item.titulo+'. Su ficha sigue disponible.');};img.src=item.imagen;}
    return texture;
  }
  function labelTexture(cat){const c=document.createElement('canvas');c.width=1024;c.height=220;const ctx=c.getContext('2d');ctx.fillStyle='#f6f2e8';ctx.fillRect(0,0,1024,220);ctx.fillStyle='#252521';ctx.font='58px "Space Grotesk",sans-serif';ctx.fillText(cat.nombre,43,113);ctx.fillStyle='#71695c';ctx.font='22px "Space Grotesk",sans-serif';ctx.fillText('ARCHIVO / '+nombre.toUpperCase(),46,166);ctx.fillStyle='#fc6020';ctx.fillRect(940,89,28,28);return track(new T.CanvasTexture(c));}
  function shadow(w,h){return new T.Mesh(track(new T.PlaneGeometry(w*1.75,h*1.65)),track(new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{opacity:{value:.19}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float opacity;void main(){vec2 p=abs(vUv-.5);vec2 d=max(p-vec2(.24,.27),0.);float s=exp(-dot(d,d)*95.);gl_FragColor=vec4(.18,.15,.11,s*opacity);}' })));}
  function makePaper(item,catIndex,itemIndex){
    const group=new T.Group(),w=154+(itemIndex%3)*11,h=196+(itemIndex%2)*10;
    const geo=track(new T.PlaneGeometry(w,h,14,18)),p=geo.attributes.position;
    for(let k=0;k<p.count;k++){const x=p.getX(k)/w,y=p.getY(k)/h;p.setZ(k,Math.pow(Math.abs(x)*2,5)*1.2+Math.sin(y*4+x*2)*.48);}geo.computeVertexNormals();
    const front=new T.Mesh(geo,paperMaterial(baseTexture(item)));front.position.z=2;group.add(front);
    const edge=new T.Mesh(track(new T.BoxGeometry(w,h,.9)),track(new T.MeshBasicMaterial({color:0xe5dfd0})));group.add(edge);
    const sh=shadow(w,h);scene.add(sh);scene.add(group);
    const card={group,front,edge,shadow:sh,ci:catIndex,li:itemIndex,item,w,h,base:v3(),goal:v3(),angle:0,hover:0};front.userData.card=card;hitMeshes.push(front);cards.push(card);return card;
  }
  const scatter=[[-56,39,-.20],[52,20,.23],[-43,-49,.12],[70,-35,-.18],[9,67,-.08],[7,-12,.055]];
  function arrange(){
    const centers=mobile?[[-175,435],[185,430],[-185,145],[170,155],[-175,-135],[185,-155],[-185,-435],[175,-445]]:[[-505,140],[-215,225],[95,220],[475,140],[-475,-220],[-110,-160],[215,-220],[545,-225]];
    piles.forEach((pile,i)=>{pile.center.set(centers[i][0],centers[i][1],0);pile.cards.forEach((c,j)=>{const s=scatter[j%scatter.length];const multi=pile.cards.length>1;c.base.set(pile.center.x+(multi?s[0]:0),pile.center.y+(multi?s[1]:0),9+j*2.1);c.angle=(multi?s[2]:[.12,-.10,.08,-.09][i%4])+(i%3-1)*.026;if(!sceneReady){c.group.position.copy(c.base);c.group.rotation.z=c.angle;}});pile.label.position.set(pile.center.x+9,pile.center.y-(pile.cards.length>1?192:143),5);pile.label.rotation.z=[-.05,.06,-.035,.08][i%4];});
  }
  function buildFloor(){
    tileUniforms={time:{value:0},start:{value:-100},origin:{value:new T.Vector2()},reduced:{value:reduced.matches?1:0},colorFrom:{value:new T.Color('#e9bd76')},colorTo:{value:new T.Color('#e9bd76')},colorOrigin:{value:new T.Vector2()},colorStart:{value:-100},darken:{value:0}};
    const mat=track(new T.ShaderMaterial({extensions:{derivatives:true},uniforms:tileUniforms,vertexShader:`uniform float time,start,reduced,colorStart;uniform vec2 origin,colorOrigin;varying vec2 vUv;varying vec3 vN;varying float vTone,vH,vColor;
      void main(){vec4 p=instanceMatrix*vec4(position,1.);vec2 center=instanceMatrix[3].xy;float age=time-start;float d=distance(center,origin);float q=(d-age*630.)/61.;float lift=exp(-q*q)*smoothstep(0.,.13,age)*(1.-smoothstep(1.9,2.8,age))*26.*(1.-reduced);p.z+=lift;vUv=uv;vN=normal;vH=lift;vTone=fract(sin(dot(center,vec2(12.9898,78.233)))*43758.5453);
      float radius=max(0.,time-colorStart)*630.;vColor=1.-smoothstep(radius-65.,radius+65.,distance(center,colorOrigin));gl_Position=projectionMatrix*modelViewMatrix*p;}`,
      fragmentShader:`uniform vec3 colorFrom,colorTo;uniform float darken;varying vec2 vUv;varying vec3 vN;varying float vTone,vH,vColor;void main(){vec3 color=mix(colorFrom,colorTo,vColor)+(vTone-.5)*.012;float light=.81+.19*max(vN.z,0.)+.04*vN.y-.035*vN.x;vec2 edge=min(vUv,1.-vUv);float seam=1.-smoothstep(0.,max(fwidth(vUv.x),fwidth(vUv.y))*1.2,min(edge.x,edge.y));color-=seam*.027*max(vN.z,0.);gl_FragColor=vec4((color*light-vH*.0004)*(1.-darken),1.);}`}));
    const step=18,cols=190,rows=150;tiles=new T.InstancedMesh(track(new T.BoxGeometry(step,step,6)),mat,cols*rows);const dummy=new T.Object3D();let k=0;
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){dummy.position.set((x-cols/2)*step,(y-rows/2)*step,-4);dummy.updateMatrix();tiles.setMatrixAt(k++,dummy.matrix);}tiles.frustumCulled=false;scene.add(tiles);
  }
  function buildPost(){
    target=track(new T.WebGLRenderTarget(1,1,{minFilter:T.LinearFilter,magFilter:T.LinearFilter}));target.depthTexture=track(new T.DepthTexture(1,1,T.UnsignedIntType));
    postScene=new T.Scene();postCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);
    postMat=track(new T.ShaderMaterial({uniforms:{color:{value:target.texture},depth:{value:target.depthTexture},pixel:{value:new T.Vector2()},focus:{value:1000},strength:{value:0},dim:{value:0},near:{value:20},far:{value:6000}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`
      uniform sampler2D color,depth;uniform vec2 pixel;uniform float focus,strength,dim,near,far;varying vec2 vUv;
      float distanceAt(vec2 uv){float z=texture2D(depth,uv).x*2.-1.;return 2.*near*far/(far+near-z*(far-near));}
      void main(){float d=distanceAt(vUv);float coc=clamp(abs(d-focus)/100.,0.,1.);float r=strength*coc;vec3 c=texture2D(color,vUv).rgb;vec3 sum=c*2.;
      for(int i=0;i<12;i++){float a=float(i)*2.39996;float rad=sqrt((float(i)+.5)/12.);vec2 o=vec2(cos(a),sin(a))*rad*pixel*r;sum+=texture2D(color,vUv+o).rgb;}c=sum/14.;c*=1.-dim*smoothstep(36.,130.,d-focus);gl_FragColor=vec4(c,1.);}` }));
    postScene.add(new T.Mesh(track(new T.PlaneGeometry(2,2)),postMat));
  }
  function resize(){width=root.clientWidth;height=root.clientHeight;const was=mobile;mobile=width<=700;renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.4:1.65));renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();const ratio=renderer.getPixelRatio();target.setSize(Math.round(width*ratio),Math.round(height*ratio));postMat.uniforms.pixel.value.set(1/width,1/height);if(was!==mobile||!sceneReady)arrange();if(!sceneReady){cameraGoal();camera.position.copy(camGoal);look.copy(desiredLook);camera.lookAt(look);} }
  function cameraGoal(){
    const fov=Math.tan(T.MathUtils.degToRad(camera.fov*.5));let span;
    if(vista==='mesa'){span=(mobile?Math.max(1170,720/camera.aspect):Math.max(800,1500/camera.aspect))*boardZoom;desiredLook.set(pan.x,pan.y+10,0);}
    else if(vista==='categoria'){span=mobile?Math.max(1060,680/camera.aspect):Math.max(810,1120/camera.aspect);desiredLook.copy(piles[ci].center).add(pan);desiredLook.y-=15;}
    else{span=(mobile?Math.max(980,650/camera.aspect):Math.max(715,1120/camera.aspect))*inspectZoom;desiredLook.copy(piles[ci].center);desiredLook.x+=mobile?0:150;desiredLook.y+=mobile?-180:0;}
    const dist=span/(2*fov);camGoal.set(desiredLook.x+parallax.x,desiredLook.y-dist*.045+parallax.y,dist);
  }
  function desiredCard(card){
    card.goal.copy(card.base);let angle=card.angle,rx=0,ry=0,scale=1;
    if(vista!=='mesa'&&card.ci!==ci){const away=card.base.clone().sub(piles[ci].center);away.z=0;if(away.lengthSq()>0)away.normalize();card.goal.addScaledVector(away,mobile?300:440);scale=.82;}
    if(vista!=='mesa'&&card.ci===ci){const center=piles[ci].center,count=piles[ci].cards.length;
      if(count>1){const spots=mobile?[[-114,160],[100,150],[-113,-28],[116,-36],[-99,-220],[124,-218]]:[[-244,60],[-135,-93],[-5,98],[117,-77],[240,77],[48,-172]];const s=spots[card.li%spots.length];card.goal.set(center.x+s[0],center.y+s[1],18+card.li*2.4);}else card.goal.z=18;
    }
    const active=vista==='lamina'&&card.ci===ci&&card.li===li;
    if(active){const p=piles[ci].center;card.goal.set(p.x+(mobile?0:0),p.y+(mobile?70:20),175);angle=-.035;rx=tilt.x;ry=tilt.y+spin;scale=mobile?1.4:1.55;}
    if(active&&!reduced.matches&&card.zoomHint!=null){const t=clamp((time*1000-card.zoomHint)/1050,0,1);scale*=1+.095*Math.sin(Math.PI*t)**2;}
    else if(hover===card){card.goal.z+=vista==='mesa'?40:70;angle*=.6;rx=-.035;ry=.028;}
    if(active&&anotando)return {angle,rx,ry,scale,active};
    if(!reduced.matches){const slow=time*.56+card.ci*.7+card.li*.8;card.goal.z+=Math.sin(slow)*(active?7:1.0);rx+=Math.sin(slow*.73)*(active?.038:.007);ry+=Math.cos(slow*.62)*(active?.052:.006);if(active)angle+=Math.sin(slow*.4)*.023;
      // Let the advancing floor wave pass underneath the whole sheet, never through it.
      const age=time-tileUniforms.start.value;if(age>=0&&age<2.8){const d=Math.hypot(card.goal.x-tileUniforms.origin.value.x,card.goal.y-tileUniforms.origin.value.y);const band=Math.max(0,Math.abs(d-age*630)-Math.hypot(card.w,card.h)*.6);card.goal.z+=Math.exp(-band*band/(85*85))*31*(1-T.MathUtils.smoothstep(age,1.9,2.8));}}
    return {angle,rx,ry,scale,active};
  }
  function updateCategoryLabels(ease){
    categoryButtons.forEach((entry,i)=>{let x,y,rotation=0;const selected=vista!=='mesa'&&i===ci;
      if(entry.button.hidden){entry.ready=false;return;}
      if(vista==='mesa'){temp.copy(piles[i].label.position).project(camera);x=(temp.x+1)*width/2;y=(1-temp.y)*height/2;x=clamp(x,63,width-63);y=clamp(y,111,height-30);rotation=-piles[i].label.rotation.z*180/Math.PI;}
      else if(selected){x=width*.5;y=mobile?49:54;}
      if(!entry.ready||reduced.matches){entry.x=x;entry.y=y;entry.ready=true;}else{entry.x+=(x-entry.x)*ease;entry.y+=(y-entry.y)*ease;}
      entry.button.style.transform=`translate3d(${entry.x}px,${entry.y}px,0) translate(-50%,-50%) rotate(${rotation}deg)`;
      entry.button.style.setProperty('--button-width',selected?'auto':mobile?'100px':'126px');
      entry.button.style.zIndex=selected?'3':'2';
    });
  }
  function render(now){
    if(!running)return;frame=requestAnimationFrame(render);if(document.hidden){lastTime=now;return;}time=now/1000;const dt=Math.min((now-lastTime)/1000||.016,.045);lastTime=now;const ease=reduced.matches?1:1-Math.exp(-dt*5.5),fast=reduced.matches?1:1-Math.exp(-dt*8);
    if(reduced.matches)spin=spinGoal=0;
    else{spin+=(spinGoal-spin)*(1-Math.exp(-dt*2.1));if(Math.abs(spinGoal-spin)<.001)spin=spinGoal;}
    if(arriving){
      arrivalProgress=reduced.matches?1:clamp((now-arrivalStart)/1900,0,1);
      if(arrivalProgress>=1){arriving=false;bridge?.terminar();announce('Archivo '+nombre+'. Elegí una categoría de la mesa.');}
    }
    parallax.lerp(v3(reduced.matches?0:pointer.x*(vista==='mesa'?14:5),reduced.matches?0:pointer.y*9,0),fast);cameraGoal();
    if(arriving){const p=arrivalProgress*arrivalProgress*(3-2*arrivalProgress);camGoal.z*=.58+.42*p;}
    camera.position.lerp(camGoal,ease);look.lerp(desiredLook,ease);camera.lookAt(look);camera.updateMatrixWorld();tileUniforms.time.value=time;
    cards.forEach(card=>{const g=desiredCard(card);card.group.position.lerp(card.goal,ease);card.group.rotation.x+=(g.rx-card.group.rotation.x)*fast;card.group.rotation.y+=(g.ry-card.group.rotation.y)*fast;card.group.rotation.z+=(g.angle-card.group.rotation.z)*ease;card.group.scale.lerp(v3(g.scale,g.scale,g.scale),ease);
      const elevated=card.group.position.z-card.base.z;card.shadow.position.set(card.group.position.x+4+elevated*.10,card.group.position.y-8-elevated*.14,card.base.z-2);card.shadow.rotation.z=card.group.rotation.z;card.shadow.scale.setScalar(card.group.scale.x*(1+elevated*.002));card.shadow.material.uniforms.opacity.value=.19/(1+elevated*.006);
      const shade=vista!=='mesa'&&card.ci!==ci?.52:vista==='lamina'&&!g.active?.76:1;card.front.material.uniforms.shade.value+=(shade-card.front.material.uniforms.shade.value)*ease;
      const aporteAge=card.aporteInicio==null||reduced.matches?10:Math.max(0,(now-card.aporteInicio)/1000);
      card.front.material.uniforms.aporte.value=aporteAge;card.edge.visible=aporteAge>=1.35;
      if(g.active&&!thanks.hidden&&card.aporteInicio!=null){
        const age=Math.max(0,(now-card.aporteInicio)/1000);temp.set(0,-card.h*.5-17,3);card.group.localToWorld(temp);temp.project(camera);
        const x=mobile?width*.5:clamp((temp.x+1)*width/2,160,width*.65-160),y=clamp((1-temp.y)*height/2,100,mobile?height*.39-46:height-110);
        thanks.style.left=x+'px';thanks.style.top=y+'px';thanks.style.opacity=String(reduced.matches?1:clamp(age/.3,0,1)*(1-clamp((age-3.4)/.8,0,1)));
        if(age>4.2)thanks.hidden=true;
      }
      if(arriving){
        const p=clamp((arrivalProgress-.13-card.ci*.055)/.40,0,1),reveal=1-Math.pow(1-p,3);
        card.group.visible=p>0;card.shadow.visible=p>0;
        card.group.scale.setScalar(g.scale*reveal);
        card.group.position.z=card.goal.z+(1-reveal)*65;
        card.group.rotation.z=g.angle+(1-reveal)*.14;
      }else{card.group.visible=true;card.shadow.visible=true;}
    });
    updateCategoryLabels(ease);
    window.MUSUQ_ARCHIVO_APORTES?.actualizar();
    categoryButtons.forEach((entry,i)=>{entry.button.style.opacity=arriving?String(clamp((arrivalProgress-.28-i*.055)/.22,0,1)):'';});
    tileUniforms.darken.value+=((vista==='mesa'?0:.22)-tileUniforms.darken.value)*ease;
    const focusCard=vista==='lamina'?cards.find(c=>c.ci===ci&&c.li===li):hover;let blur=0,dim=0;
    if(focusCard){temp.copy(focusCard.group.position).applyMatrix4(camera.matrixWorldInverse);postMat.uniforms.focus.value+=(-temp.z-postMat.uniforms.focus.value)*fast;blur=vista==='lamina'?5.6:3.4;dim=vista==='lamina'?.16:.03;}
    postMat.uniforms.strength.value+=(blur-postMat.uniforms.strength.value)*fast;postMat.uniforms.dim.value+=(dim-postMat.uniforms.dim.value)*fast;
    canvas.dataset.zoom=String(vista==='lamina'?inspectZoom:boardZoom);renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(postScene,postCamera);
  }
  function setPointer(e){const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);raycaster.setFromCamera(pointer,camera);}
  function hit(e){setPointer(e);return raycaster.intersectObjects(hitMeshes,false)[0]||null;}
  function onMove(e){if(!sceneReady)return;setPointer(e);
    if(anotando)return;
    if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>5)drag.moved=true;
      if(drag.mode==='tilt'){if(!reduced.matches){tilt.x=clamp(drag.tiltX-dy*.0035,-.4,.4);tilt.y=clamp(drag.tiltY+dx*.0035,-.45,.45);}}
      else{const visible=2*Math.tan(T.MathUtils.degToRad(camera.fov/2))*camera.position.z;pan.x=clamp(drag.panX-dx/height*visible,-145,145);pan.y=clamp(drag.panY+dy/height*visible,-145,145);}return;
    }
    const intersection=hit(e),card=intersection?.object.userData.card;hover=card||null;canvas.style.cursor=card?'pointer':'grab';
    const label=$('hover-etiqueta');const active=card&&vista==='lamina'&&card.ci===ci&&card.li===li;label.hidden=!card||active;if(card&&!active){label.textContent=vista==='mesa'||card.ci!==ci?cats[card.ci].nombre+' · Acercate':card.item.titulo;label.style.left=clamp(e.clientX-root.getBoundingClientRect().left+16,8,width-260)+'px';label.style.top=clamp(e.clientY-root.getBoundingClientRect().top+19,5,height-50)+'px';}
  }
  canvas.addEventListener('pointerdown',e=>{if(!sceneReady||anotando||e.button!==0)return;const h=hit(e);drag={x:e.clientX,y:e.clientY,moved:false,hit:h,mode:vista==='lamina'?'tilt':'pan',tiltX:tilt.x,tiltY:tilt.y,panX:pan.x,panY:pan.y};canvas.setPointerCapture(e.pointerId);canvas.classList.add('arrastrando');});
  canvas.addEventListener('pointermove',onMove);
  canvas.addEventListener('pointerup',e=>{if(!drag)return;const d=drag;drag=null;canvas.classList.remove('arrastrando');if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(d.moved)return;
    const h=d.hit;if(h){const c=h.object.userData.card;if(c){if(vista==='mesa'||c.ci!==ci)openCategory(c.ci,true);else if(vista==='categoria'||c.li!==li)openDetail(c.li,true);}}else{setPointer(e);if(raycaster.ray.intersectPlane(floor,floorPoint))pulse(floorPoint);}
  });
  ['pointercancel','lostpointercapture'].forEach(k=>canvas.addEventListener(k,()=>{drag=null;canvas.classList.remove('arrastrando');}));
  canvas.addEventListener('pointerleave',()=>{if(!drag){hover=null;pointer.set(0,0);$('hover-etiqueta').hidden=true;}});
  canvas.addEventListener('wheel',e=>{
    if(inputProtegido(e)||anotando)return;
    e.preventDefault();const now=performance.now(),delta=clamp(e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?height:1),-140,140);
    if(now<wheelLockUntil){wheelLockUntil=now+180;return;}
    if(vista==='mesa'){boardZoom=clamp(boardZoom+delta*.0012,.82,1);return;}
    if(now-lastAction<380)return;
    if(vista==='lamina'){inspectZoom=clamp(inspectZoom+delta*.0013,.68,1.15);syncZoomButton();if(inspectZoom>1.10){back();wheelLockUntil=now+400;}return;}
    if(now-lastWheel>240||delta<0)wheelDebt=0;lastWheel=now;wheelDebt+=Math.max(delta,0);
    if(wheelDebt>40){back();wheelDebt=0;wheelLockUntil=now+400;}
  },{passive:false});
  function failure(err){console.warn('No se pudo iniciar la mesa 3D.',err);cancelAnimationFrame(frame);readableFallback('La mesa 3D no está disponible en este momento.');}
  async function init(){try{
    await document.fonts.ready;
    renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setClearColor(0xe9bd76,1);time=performance.now()/1000;
    scene=new T.Scene();camera=new T.PerspectiveCamera(35,1,20,6000);buildFloor();buildPost();
    cats.forEach((cat,i)=>{const label=new T.Object3D();const pile={center:v3(),label,cards:[]};piles.push(pile);const items=cat.laminas.length?cat.laminas:[{id:cat.id+'-pendiente',titulo:cat.nombre,descripcion:'Esta categoría todavía está en investigación.',enInvestigacion:true}];items.forEach((item,j)=>pile.cards.push(makePaper(item,i,j)));});
    resize();sceneReady=true;fromHash();$('archivo-cargando').hidden=true;
    if(arriving){
      arrivalStart=performance.now();camera.position.z*=.58;
      cards.forEach(card=>{card.group.visible=false;card.shadow.visible=false;});
      categoryButtons.forEach(entry=>entry.button.style.opacity='0');
      pulse(v3());bridge.revelar();
    }
    frame=requestAnimationFrame(render);
    new ResizeObserver(resize).observe(root);
    const syncMotion=()=>{
      const stopped=reduced.matches;
      tileUniforms.reduced.value=stopped?1:0;tilt.set(0,0);
      if(stopped){
        spin=spinGoal=0;parallax.set(0,0,0);
        tileUniforms.start.value=time-100;
        tileUniforms.colorStart.value=time-10;
      }
    };
    reducedPreference.addEventListener('change',syncMotion);
    addEventListener('musuq:accesibilidad',syncMotion);
    syncMotion();
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();running=false;cancelAnimationFrame(frame);failure('Contexto gráfico perdido. Usá Reintentar.');});
  }catch(err){failure(err);}}
  addEventListener('pagehide',e=>{Object.values(audios).forEach(a=>a.pause());if(e.persisted)return;running=false;cancelAnimationFrame(frame);resources.forEach(r=>r.dispose?.());renderer?.dispose();});
  window.MUSUQ_ARCHIVO_APORTES?.montar(archivoAPI);
  updateView();init();
})();
