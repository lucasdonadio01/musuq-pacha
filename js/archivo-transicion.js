/* Puente de una sola entrada: mapa → territorio → mesa. Sin efecto en enlaces directos. */
(function () {
  'use strict';
  const key = 'musuq.archivo.entrada.v1', html = document.documentElement;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || !!window.MUSUQ_A11Y?.estado.detener;
  const params = new URLSearchParams(location.search);
  let entrada = null, outgoing = null, arrivalTimer = 0;
  const colorSeguro = color => /^#[0-9a-f]{6}$/i.test(color || '') ? color : '#e9bd76';
  function finishArrival() {
    clearTimeout(arrivalTimer);
    html.classList.remove('archivo-llegando', 'archivo-revelando');
    const root = document.getElementById('archivo-experiencia');
    if (root) root.inert = false;
  }
  if (/\/archivo\.html$/.test(location.pathname) && params.get('desde') === 'mapa') {
    try {
      const saved = JSON.parse(sessionStorage.getItem(key));
      sessionStorage.removeItem(key);
      const age = Date.now() - saved?.time;
      if (saved && String(saved.pueblo) === params.get('pueblo') && age >= 0 && age < 20000 && !reduced()) entrada = saved;
    } catch (_) { /* El enlace sigue funcionando sin almacenamiento. */ }
    params.delete('desde');
    history.replaceState(history.state, '', location.pathname + (params.size ? '?' + params : '') + location.hash);
    if (entrada) {
      html.style.setProperty('--archivo-puente-color', colorSeguro(entrada.color));
      html.classList.add('archivo-llegando');
      arrivalTimer = setTimeout(finishArrival, 8000);
    }
  }
  function cancelDeparture() {
    if (!outgoing) return;
    cancelAnimationFrame(outgoing.frame);
    outgoing.restore?.();
    outgoing = null;
    html.classList.remove('archivo-saliendo');
    html.style.removeProperty('--archivo-puente-opacity');
    document.getElementById('archivo-puente-estado')?.remove();
    try { sessionStorage.removeItem(key); } catch (_) {}
  }
  function salir({url, pueblo, color, progress, restore}) {
    if (outgoing) return;
    const destination = new URL(url, location.href);
    if (destination.origin !== location.origin) return;
    if (reduced()) { location.assign(destination.href); return; }
    destination.searchParams.set('desde', 'mapa');
    const start = performance.now();
    outgoing = {frame:0, restore};
    html.style.setProperty('--archivo-puente-color', colorSeguro(color));
    html.style.setProperty('--archivo-puente-opacity', '0');
    html.classList.add('archivo-saliendo');
    const status = document.createElement('p');
    status.id = 'archivo-puente-estado'; status.setAttribute('role', 'status');
    status.textContent = 'Entrando al archivo…'; document.body.append(status);
    const tick = now => {
      if (!outgoing) return;
      const t = Math.min(1, (now - start) / 1650), ease = t * t * (3 - 2 * t);
      progress(ease);
      html.style.setProperty('--archivo-puente-opacity', String(Math.max(0, Math.min(1, (t - .57) / .34))));
      if (t < 1) { outgoing.frame = requestAnimationFrame(tick); return; }
      try { sessionStorage.setItem(key, JSON.stringify({pueblo, color:colorSeguro(color), time:Date.now()})); }
      catch (_) { destination.searchParams.delete('desde'); }
      location.assign(destination.href);
    };
    outgoing.frame = requestAnimationFrame(tick);
  }
  // Bloquear acciones accidentales durante el viaje, pero permitir Escape para cancelarlo.
  ['click','wheel','keydown'].forEach(type => document.addEventListener(type, event => {
    if (!outgoing) return;
    if (type === 'keydown' && event.key === 'Escape') cancelDeparture();
    event.preventDefault(); event.stopImmediatePropagation();
  }, {capture:true, passive:false}));
  addEventListener('pageshow', event => { if (event.persisted) { cancelDeparture(); finishArrival(); } });
  window.MUSUQ_ARCHIVO_TRANSICION = {
    entrada, salir,
    revelar() { if (!entrada) return; html.classList.add('archivo-revelando'); },
    terminar: finishArrival
  };
})();
