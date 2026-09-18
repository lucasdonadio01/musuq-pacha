/* Un dibujo, muchas profundidades: UVs fijas, sin generar otro patrón. */
(() => {
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const quieto=()=>reduced.matches||document.documentElement.dataset.detener==='true';
  // One shared generator instance per artwork, including its enlarged viewer.
  const figuras=new Map();
  function dibujar(canvas,img,now){
    const ctx=canvas.getContext('2d'),lado=384,n=9,s=lado/n;
    if(canvas.width!==lado){canvas.width=canvas.height=lado;}
    ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,lado,lado);
    ctx.drawImage(img,0,0,lado,lado);
    if(quieto())return;
    if(!figuras.has(img.src)){
      const fondo=Array.from(ctx.getImageData(s/2,s/2,1,1).data).slice(0,3),grilla=new Map();
      for(let y=0;y<n;y++)for(let x=0;x<n;x++){
        const c=Array.from(ctx.getImageData((x+.5)*s,(y+.5)*s,1,1).data).slice(0,3);
        if(c.some((v,i)=>Math.abs(v-fondo[i])>18))grilla.set(x+','+y,Motor.aHex(c));
      }
      const motor=Motor.crear(n);motor.cargar(grilla,now-2000);
      figuras.set(img.src,{motor,grilla,fondo:Motor.aHex(fondo),etapa:'armado',siguiente:now+1900+figuras.size*270});
    }
    const f=figuras.get(img.src);
    if(now>=f.siguiente){
      if(f.etapa==='armado'){f.motor.limpiar(now);f.etapa='desarme';f.siguiente=now+900;}
      else {f.motor.cargar(f.grilla,now);f.etapa='armado';f.siguiente=now+3500;}
    }
    ctx.fillStyle=f.fondo;ctx.fillRect(0,0,lado,lado);
    const animando=f.motor.dibujar(ctx,0,0,s,now,{sombra:true});
    if(!animando&&f.etapa==='armado'){ctx.clearRect(0,0,lado,lado);ctx.drawImage(img,0,0,lado,lado);}
  }
  function instalar(img,tarjeta){
    const marco=document.createElement('span');marco.className=img.className+' patron-vivo';img.className='patron-vivo__original';img.before(marco);marco.append(img);
    const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');marco.append(canvas);
    let frame=0,activo=false,visible=false;
    function detener(){activo=false;cancelAnimationFrame(frame);marco.classList.remove('patron-vivo--activo');}
    function animar(now){
      if(!activo||quieto()||document.hidden||!img.naturalWidth){detener();return;}
      dibujar(canvas,img,now);
      frame=requestAnimationFrame(animar);
    }
    const actualizar=()=>{if(!visible||quieto()||document.hidden||!img.naturalWidth){detener();return;}if(activo)return;activo=true;marco.classList.add('patron-vivo--activo');frame=requestAnimationFrame(animar);};
    new IntersectionObserver(([e])=>{visible=e.isIntersecting;actualizar();}).observe(tarjeta);
    img.addEventListener('load',actualizar);
    document.addEventListener('visibilitychange',actualizar);reduced.addEventListener('change',actualizar);addEventListener('musuq:accesibilidad',actualizar);
  }
  function material(T,textura,dorado){
    return new T.ShaderMaterial({side:T.DoubleSide,uniforms:{map:{value:textura},tiempo:{value:0},profundidad:{value:1},oro:{value:dorado?1:0}},
      vertexShader:`varying vec2 vUv; varying float vRelieve; uniform float tiempo; uniform float profundidad;
        void main(){vUv=uv;vec3 p=position;float d=length(uv-.5);vRelieve=sin(tiempo*1.7-d*15.);p.z+=vRelieve*.065*profundidad;p.y+=sin(tiempo+uv.x*6.)*.012*profundidad;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
      fragmentShader:`uniform sampler2D map;uniform float tiempo;uniform float oro;uniform float profundidad;varying vec2 vUv;varying float vRelieve;
        void main(){vec4 tex=texture2D(map,vUv);float luz=.97+.035*vRelieve*profundidad;
        float brillo=pow(max(0.,sin((vUv.x+vUv.y)*5.-tiempo*.65)),18.);
        vec3 color=tex.rgb*luz;vec3 metal=vec3(1.,.74,.24);
        color=mix(color,color*vec3(1.08,.94,.70),oro*.28);color+=metal*brillo*oro*.23;
        gl_FragColor=vec4(color,tex.a);}`
    });
  }
  window.PatronVivo={instalar,material,dibujar};
})();
