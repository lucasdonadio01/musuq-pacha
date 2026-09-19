/* Visor de solo lectura. No abre el generador ni el formulario de publicación. */
(() => {
  'use strict';
  const dialog = document.createElement('dialog');
  dialog.className = 'visor-simbolo';
  dialog.setAttribute('aria-label', 'Ver símbolo');
  // Google Material: arrow_back y download. Etiquetas accesibles sin texto visible.
  dialog.innerHTML = '<div class="visor-simbolo__escena"></div><div class="visor-simbolo__acciones"><button type="button" aria-label="Volver al tablero" title="Volver" autofocus><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z"/></svg></button><a download aria-label="Descargar símbolo" title="Descargar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg></a></div><p class="visor-simbolo__estado" role="status">Cargando símbolo…</p>';
  document.body.append(dialog);
  const host = dialog.querySelector('.visor-simbolo__escena');
  const back = dialog.querySelector('button'), download = dialog.querySelector('a');
  const status = dialog.querySelector('[role=status]');
  back.append(document.createTextNode('Volver'));download.append(document.createTextNode('Descargar'));
  const relieve=true;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let renderer, scene, camera, sheet, texture, frame, resize, opener, previousOverflow;
  let generation = 0, zoom = 1, targetZoom = 1, pointer = {x:0,y:0};

  function cleanup() {
    generation++; cancelAnimationFrame(frame); resize?.disconnect();
    scene?.traverse(object => { object.geometry?.dispose(); if(object.material) object.material.dispose(); });
    texture?.dispose(); renderer?.dispose(); renderer?.forceContextLoss();
    renderer = scene = camera = sheet = texture = null;
    host.replaceChildren();
  }
  function close() { if (dialog.open) dialog.close(); }
  back.addEventListener('click', close);
  dialog.addEventListener('cancel', e => { e.preventDefault(); e.stopPropagation(); close(); });
  dialog.addEventListener('close', () => {
    cleanup(); document.documentElement.style.overflow = previousOverflow;
    opener?.focus({preventScroll:true});
  });
  dialog.addEventListener('keydown', e => e.stopPropagation());
  dialog.addEventListener('wheel', e => {
    e.preventDefault(); e.stopPropagation();
    targetZoom = Math.max(0.8, Math.min(1.8, targetZoom * Math.exp(-e.deltaY * 0.001)));
  }, {passive:false});
  host.addEventListener('pointermove', e => {
    const rect = host.getBoundingClientRect();
    pointer.x = (e.clientX - rect.left) / rect.width * 2 - 1;
    pointer.y = (e.clientY - rect.top) / rect.height * 2 - 1;
  });
  host.addEventListener('pointerleave', () => { pointer.x = pointer.y = 0; });

  async function open({src, title, filename,puesto}, trigger) {
    if (dialog.open) return;
    opener = trigger || document.activeElement; previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    dialog.setAttribute('aria-label', title || 'Ver símbolo');
    status.textContent = 'Cargando símbolo…'; status.hidden = false;
    download.href = src; download.download = filename || 'musuq-pacha-simbolo.png';
    dialog.showModal(); back.focus({preventScroll:true});
    const current = ++generation;
    zoom = targetZoom = 1; pointer = {x:0,y:0};
    dialog.dataset.puesto=puesto||'';
    const img = new Image(); img.src = src;
    try {
      await img.decode();
      if (current !== generation || !dialog.open) return;
      const T = window.THREE;
      if (!T) throw new Error('WebGL no disponible');
      renderer = new T.WebGLRenderer({antialias:true,alpha:true});
      renderer.setPixelRatio(Math.min(devicePixelRatio,2));
      renderer.outputEncoding = T.sRGBEncoding;
      renderer.domElement.setAttribute('aria-hidden','true'); host.append(renderer.domElement);
      scene = new T.Scene(); camera = new T.PerspectiveCamera(35,1,0.1,100);
      sheet = new T.Group(); scene.add(sheet);
      const ratio = img.naturalWidth / img.naturalHeight;
      const w = ratio >= 1 ? 2.6 : 2.6 * ratio, h = ratio >= 1 ? 2.6 / ratio : 2.6;
      const animado=puesto&&window.PatronVivo?document.createElement('canvas'):null;
      if(animado)window.PatronVivo.dibujar(animado,img,performance.now());
      texture = new T.Texture(animado||img); texture.encoding = T.sRGBEncoding;
      texture.magFilter = T.NearestFilter; texture.minFilter = T.LinearFilter;
      texture.generateMipmaps = false; texture.needsUpdate = true;
      const paper = new T.Mesh(new T.PlaneGeometry(w+0.16,h+0.16),new T.MeshBasicMaterial({color:0xf1ebdf}));
      paper.position.z=-.085;
      const material=window.PatronVivo?.material(T,texture,puesto===1)||new T.MeshBasicMaterial({map:texture});
      const image = new T.Mesh(new T.PlaneGeometry(w,h,36,36),material);
      image.position.z = 0.008; sheet.add(paper,image);
      const shadow = new T.Mesh(new T.PlaneGeometry(w+0.16,h+0.16),new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.16}));
      shadow.position.set(0.06,-0.09,-0.15); sheet.add(shadow);
      let distance = 6;
      const fit = () => {
        const width = host.clientWidth, height = host.clientHeight;
        camera.aspect = width / height; camera.updateProjectionMatrix();
        distance = Math.max((h+0.3)/0.70,(w+0.3)/camera.aspect/0.78)/(2*Math.tan(35*Math.PI/360));
        renderer.setSize(width,height);
      };
      resize = new ResizeObserver(fit); resize.observe(host); fit();
      status.hidden = true;
      const start = performance.now(); let last = start;
      const render = now => {
        if (!dialog.open || current !== generation) return;
        const t = (now-start)/1000, dt = Math.min((now-last)/1000,0.05); last = now;
        const quieto=reduced.matches||document.documentElement.dataset.detener==='true';
        if(animado){window.PatronVivo.dibujar(animado,img,now);texture.needsUpdate=true;}
        if(material.uniforms){material.uniforms.tiempo.value=quieto?0:t;material.uniforms.profundidad.value+=((relieve&&!quieto?1:0)-material.uniforms.profundidad.value)*.1;}
        const easing = 1-Math.exp(-dt*7);
        zoom += (targetZoom-zoom)*easing;
        const entry = reduced.matches ? 1 : 1-Math.pow(1-Math.min(t/0.7,1),3);
        camera.position.z = distance / zoom + (1-entry)*1.8;
        sheet.rotation.x += ((quieto||!relieve?0:Math.sin(t*0.6)*0.025-pointer.y*0.16)-sheet.rotation.x)*easing;
        sheet.rotation.y += ((quieto||!relieve?0:Math.sin(t*0.43)*0.035+pointer.x*0.22)-sheet.rotation.y)*easing;
        sheet.rotation.z = quieto||!relieve ? 0 : Math.sin(t*0.35)*0.018;
        sheet.position.y = quieto||!relieve ? 0 : Math.sin(t*0.7)*0.035;
        renderer.render(scene,camera); frame=requestAnimationFrame(render);
      }; frame=requestAnimationFrame(render);
    } catch (error) {
      if (current !== generation || !dialog.open) return;
      cleanup();
      if (img.complete && img.naturalWidth) {
        img.alt = title || 'Símbolo'; img.className = 'visor-simbolo__fallback'; host.append(img);
        status.hidden = true;
      } else status.textContent = 'No se pudo cargar el símbolo. Podés volver e intentar otra vez.';
    }
  }
  window.VisorSimbolo = {open};
})();
