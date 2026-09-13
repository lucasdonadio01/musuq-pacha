(function () {
  const clave = 'musuq-pacha.sonido.v1';
  const botonesSonido = document.querySelectorAll('[data-audio=efectos]');
  const botonesMusica = document.querySelectorAll('[data-audio=musica]');
  const audioMapa = document.getElementById('audio-mapa');
  let estado = { efectos: true, musica: true };
  try {
    const guardado = JSON.parse(localStorage.getItem(clave));
    if (guardado) {
      estado = { efectos: guardado.efectos !== false, musica: guardado.musica !== false };
    }
  } catch (e) {}

  const musica = new Audio('sonidos/musica.mp3');
  musica.loop = true;
  musica.preload = 'auto';
  musica.volume = 0.18;
  let interactuo = false;

  function guardar() {
    try {
      localStorage.setItem(clave, JSON.stringify(estado));
    } catch (e) {}
  }

  function sincronizar() {
    botonesSonido.forEach((boton) => boton.setAttribute('aria-pressed', String(!estado.efectos)));
    botonesMusica.forEach((boton) => boton.setAttribute('aria-pressed', String(!estado.musica)));
    if (estado.musica && interactuo && !document.hidden) {
      const promesa = musica.play();
      if (promesa) {
        promesa.catch(() => {});
      }
    } else {
      musica.pause();
    }
  }

  window.MUSUQ_SONIDO = {
    get efectos() {
      return estado.efectos;
    },
    get musica() {
      return estado.musica;
    }
  };

  botonesSonido.forEach((boton) => boton.addEventListener('click', () => {
    estado.efectos = !estado.efectos;
    guardar();
    sincronizar();
    window.dispatchEvent(new CustomEvent('musuq:sonido', { detail: { ...estado } }));
  }));
  botonesMusica.forEach((boton) => boton.addEventListener('click', () => {
    estado.musica = !estado.musica;
    guardar();
    sincronizar();
  }));
  window.addEventListener('musuq:modo', (e) => {
    if (audioMapa) {
      audioMapa.hidden = !e.detail.explorando;
    }
  });

  const primeraInteraccion = () => {
    if (interactuo) {
      return;
    }
    interactuo = true;
    sincronizar();
  };
  for (const tipo of ['pointerdown', 'keydown', 'touchstart']) {
    window.addEventListener(tipo, primeraInteraccion, { capture: true, passive: true });
  }
  document.addEventListener('visibilitychange', sincronizar);
  sincronizar();
})();
