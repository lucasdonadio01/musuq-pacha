(() => {
  'use strict';
  const galeria = document.querySelector('[data-galeria]');
  if (!galeria) return;
  const marco = galeria.querySelector('.encuentro-fotos');
  const fotos = [...marco.querySelectorAll('.encuentro-foto')];
  const puntos = [...galeria.querySelectorAll('.encuentro-puntos button')];
  const estado = galeria.querySelector('[data-galeria-estado]');
  let actual = 0, inicio = null;
  function ir(indice, anunciar = true) {
    actual = (indice + fotos.length) % fotos.length;
    fotos.forEach((foto, i) => {
      const activa = i === actual;
      foto.classList.toggle('encuentro-foto--activa', activa);
      if (activa) { foto.removeAttribute('aria-hidden'); foto.loading = 'eager'; } else foto.setAttribute('aria-hidden', 'true');
    });
    puntos.forEach((punto, i) => { if (i === actual) punto.setAttribute('aria-current', 'true'); else punto.removeAttribute('aria-current'); });
    if (anunciar) estado.textContent = `Foto ${actual + 1} de ${fotos.length}`;
  }
  galeria.querySelector('[data-galeria-prev]').addEventListener('click', () => ir(actual - 1));
  galeria.querySelector('[data-galeria-next]').addEventListener('click', () => ir(actual + 1));
  puntos.forEach((punto, i) => punto.addEventListener('click', () => ir(i)));
  galeria.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); ir(actual - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); ir(actual + 1); }
  });
  marco.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') inicio = e.clientX; });
  marco.addEventListener('pointerup', e => {
    if (inicio === null) return;
    const recorrido = e.clientX - inicio; inicio = null;
    if (Math.abs(recorrido) > 40) ir(actual + (recorrido < 0 ? 1 : -1));
  });
  marco.addEventListener('pointercancel', () => { inicio = null; });
  new IntersectionObserver((entradas, observador) => {
    if (!entradas.some(entrada => entrada.isIntersecting)) return;
    fotos.forEach(foto => { foto.loading = 'eager'; });
    observador.disconnect();
  }, {rootMargin:'400px 0px'}).observe(galeria);
  ir(0, false);
})();
