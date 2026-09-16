(function () {
  'use strict';
  if (window.MUSUQ_SONIDO) return;
  const clave = 'musuq-pacha.sonido.v1';
  const scriptURL = document.currentScript?.src || new URL('js/sonido.js', location.href).href;
  const audioExistente = document.getElementById('musica');
  // El micrositio conserva Shasta; las otras secciones comparten la pista del mapa.
  const musica = audioExistente || new Audio(new URL('../sonidos/musica.mp3', scriptURL).href);
  musica.loop = true;
  musica.preload = 'auto';
  musica.volume = audioExistente ? 0.4 : 0.18;
  let estado = { efectos: true, musica: true };
  let interactuo = false;
  function normalizar(valor) {
    return { efectos: valor?.efectos !== false, musica: valor?.musica !== false };
  }
  try { estado = normalizar(JSON.parse(localStorage.getItem(clave))); } catch (_) {}

  function guardar() {
    try { localStorage.setItem(clave, JSON.stringify(estado)); } catch (_) {}
  }
  function sincronizar() {
    for (const tipo of ['efectos', 'musica']) {
      document.querySelectorAll('[data-audio="' + tipo + '"]').forEach(boton => {
        const etiqueta = (estado[tipo] ? 'Silenciar ' : 'Activar ') + (tipo === 'musica' ? 'música' : 'sonidos');
        boton.setAttribute('aria-pressed', String(!estado[tipo]));
        boton.setAttribute('aria-label', etiqueta);
        boton.title = etiqueta;
      });
    }
    musica.muted = !estado.musica;
    if (estado.musica && interactuo && !document.hidden) {
      const intento = musica.play();
      if (intento?.catch) intento.catch(() => {});
    } else musica.pause();
  }
  function notificar() {
    window.dispatchEvent(new CustomEvent('musuq:sonido', { detail: {...estado} }));
  }
  function fijar(tipo, activo) {
    if (!['efectos', 'musica'].includes(tipo) || typeof activo !== 'boolean') return;
    estado[tipo] = activo;
    guardar(); sincronizar(); notificar();
    return estado[tipo];
  }
  function alternar(tipo) {
    if (!['efectos', 'musica'].includes(tipo)) return;
    return fijar(tipo, !estado[tipo]);
  }
  window.MUSUQ_SONIDO = {
    get efectos() { return estado.efectos; },
    get musica() { return estado.musica; },
    alternar, fijar, sincronizar
  };
  // Delegación única: también funciona con controles del editor montados después.
  document.addEventListener('click', e => {
    const boton = e.target.closest?.('button[data-audio]');
    if (boton && !boton.disabled) alternar(boton.dataset.audio);
  });
  window.addEventListener('musuq:modo', e => {
    const audioMapa = document.getElementById('audio-mapa');
    if (audioMapa) audioMapa.hidden = !e.detail.explorando;
  });
  const primeraInteraccion = () => {
    if (interactuo && (!estado.musica || !musica.paused)) return;
    interactuo = true; sincronizar();
  };
  for (const tipo of ['pointerdown', 'keydown', 'touchstart']) {
    window.addEventListener(tipo, primeraInteraccion, { capture:true, passive:true });
  }
  window.addEventListener('storage', e => {
    if (e.key !== clave) return;
    try { estado = normalizar(JSON.parse(e.newValue)); sincronizar(); notificar(); } catch (_) {}
  });
  window.addEventListener('pagehide', () => musica.pause());
  window.addEventListener('pageshow', sincronizar);
  document.addEventListener('visibilitychange', sincronizar);
  sincronizar();
})();
