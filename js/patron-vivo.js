/* Un dibujo, muchas profundidades: UVs fijas, sin generar otro patrón. */
(() => {
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const quieto=()=>reduced.matches||document.documentElement.dataset.detener==='true';
  function instalar(img,tarjeta){
    const marco=document.createElement('span');marco.className=img.className+' patron-vivo';img.className='patron-vivo__original';img.before(marco);marco.append(img);
    const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');marco.append(canvas);
    const ctx=canvas.getContext('2d');let frame=0,activo=false;
    function detener(){activo=false;cancelAnimationFrame(frame);marco.classList.remove('patron-vivo--activo');}
    function dibujar(now){
      if(!activo||quieto()||document.hidden||!img.naturalWidth){detener();return;}
      const lado=384;canvas.width=canvas.height=lado;ctx.imageSmoothingEnabled=false;
      ctx.drawImage(img,0,0,lado,lado);
      const n=9,s=lado/n,t=now/1000;
      for(let y=0;y<n;y++)for(let x=0;x<n;x++){
        const distancia=Math.hypot(x-4,y-4),z=Math.sin(t*2.1-distancia*.8),a=1+z*.025;
        ctx.save();ctx.translate((x+.5)*s,(y+.5)*s-z*1.7);ctx.scale(a,a);
        ctx.drawImage(img,x*img.naturalWidth/n,y*img.naturalHeight/n,img.naturalWidth/n,img.naturalHeight/n,-s/2,-s/2,s,s);ctx.restore();
      }
      frame=requestAnimationFrame(dibujar);
    }
    const iniciar=()=>{if(activo||quieto())return;activo=true;marco.classList.add('patron-vivo--activo');frame=requestAnimationFrame(dibujar);};
    tarjeta.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')iniciar();});tarjeta.addEventListener('pointerleave',detener);tarjeta.addEventListener('pointercancel',detener);
    tarjeta.addEventListener('focus',iniciar);tarjeta.addEventListener('blur',detener);tarjeta.addEventListener('click',detener);
    document.addEventListener('visibilitychange',detener);reduced.addEventListener('change',detener);addEventListener('musuq:accesibilidad',detener);
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
  window.PatronVivo={instalar,material};
})();
