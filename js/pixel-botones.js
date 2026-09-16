/* Inspiración: reactbits.dev/animations/pixel-transition.
   Adaptación sin dependencias para botones: 720 ms entrada / 450 ms salida.
   El contenido original nunca se duplica, oculta o reemplaza. */
(() => {
  'use strict';
  const selector = '.territorio__texto .boton,.comunidad .boton,.nav__ingresar,.bloque .boton,.acciones > .accion,.compartir__acciones .boton';
  const estados = new Set();
  const permiteHover = matchMedia('(hover:hover)');

  document.querySelectorAll(selector).forEach(boton => {
    const capa = document.createElement('span');
    capa.className = 'pixel-boton__mosaico';
    capa.setAttribute('aria-hidden', 'true');
    let sobre = false;
    let firma = '';
    const permitido = () => !boton.disabled && !boton.classList.contains('nav__perfil');
    const actualizar = () => {
      boton.dataset.pixelActivo = String(permitido() && (sobre || boton.matches(':focus-visible')));
    };
    const montar = () => {
      const perfil = boton.classList.contains('nav__perfil');
      if (boton.classList.contains('pixel-boton') === perfil) boton.classList.toggle('pixel-boton', !perfil);
      if (!perfil && !boton.contains(capa)) boton.append(capa);
      actualizar();
    };
    const dimensionar = () => {
      const ancho = boton.clientWidth, alto = boton.clientHeight;
      if (!ancho || !alto || firma === `${ancho}/${alto}`) return;
      firma = `${ancho}/${alto}`;
      const paso = alto / 3;
      const columnas = Math.ceil(ancho / paso);
      const total = columnas * 3;
      // Orden mezclado estable. No hay nuevos sorteos ni saltos al interrumpir el hover.
      const orden = Array.from({length:total}, (_,i) => i);
      let semilla = total * 37 + 11;
      for (let i = total - 1; i > 0; i--) {
        semilla = (semilla * 1664525 + 1013904223) >>> 0;
        const j = semilla % (i + 1);
        [orden[i], orden[j]] = [orden[j], orden[i]];
      }
      const fragmento = document.createDocumentFragment();
      for (let i = 0; i < total; i++) {
        const celda = document.createElement('span');
        celda.className = 'pixel-boton__celda';
        celda.style.cssText = `left:${i % columnas * paso}px;top:${Math.floor(i / columnas) * paso}px;width:${paso + 1}px;height:${paso + 1}px;--pixel-orden:${orden[i] / Math.max(total - 1, 1)}`;
        fragmento.append(celda);
      }
      capa.replaceChildren(fragmento);
    };
    montar(); dimensionar();
    new ResizeObserver(dimensionar).observe(boton);
    // La sesión demo y «Copiar enlace local» pueden cambiar el contenido del botón.
    new MutationObserver(montar).observe(boton, {childList:true, attributes:true, attributeFilter:['class','disabled']});
    boton.addEventListener('pointerenter', e => { sobre = permiteHover.matches && e.pointerType !== 'touch'; actualizar(); });
    boton.addEventListener('pointerleave', () => { sobre = false; actualizar(); });
    boton.addEventListener('pointercancel', () => { sobre = false; actualizar(); });
    boton.addEventListener('focus', actualizar);
    boton.addEventListener('blur', actualizar);
    estados.add(() => { sobre = false; actualizar(); });
  });
  addEventListener('blur', () => estados.forEach(restablecer => restablecer()));
  document.addEventListener('visibilitychange', () => { if (document.hidden) estados.forEach(restablecer => restablecer()); });
})();
