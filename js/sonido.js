(function () {
  const clave = 'musuq-pacha.sonido.v1';
  const botonSonido = document.getElementById('boton-sonido');
  const botonMusica = document.getElementById('boton-musica');
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
    if (botonSonido) {
      botonSonido.setAttribute('aria-pressed', String(!estado.efectos));
    }
    if (botonMusica) {
      botonMusica.setAttribute('aria-pressed', String(!estado.musica));
    }
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

  if (botonSonido) {
    botonSonido.addEventListener('click', () => {
      estado.efectos = !estado.efectos;
      guardar();
      sincronizar();
      window.dispatchEvent(new CustomEvent('musuq:sonido', { detail: { ...estado } }));
    });
  }
  if (botonMusica) {
    botonMusica.addEventListener('click', () => {
      estado.musica = !estado.musica;
      guardar();
      sincronizar();
    });
  }

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
