(() => {
  'use strict';
  const root = document.documentElement, body = document.body;
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const fino = matchMedia('(hover:hover) and (pointer:fine)');
  const quieto = () => reduced.matches || root.dataset.detener === 'true';
  const esperar = ms => new Promise(listo => setTimeout(listo, quieto() ? 0 : ms));
  const portada = document.getElementById('portada');
  const actividades = document.getElementById('actividades');

  let fondoActivo = false;
  try {
    if (typeof Fondo !== 'undefined') {
      Fondo.paleta('#111111', '#F66227');
      Fondo.cfg.pixel = 7;
      fondoActivo = Fondo.iniciar(document.getElementById('eventos-pixel-blast')) !== false;
    }
  } catch { fondoActivo = false; }
  if (!fondoActivo) document.querySelector('.eventos-fondo').classList.add('eventos-fondo--estatico');
  const pausarFondo = () => {
    if (fondoActivo) Fondo.cfg.quieto = quieto() || document.hidden || body.classList.contains('eventos--actividades');
  };
  pausarFondo();
  document.addEventListener('visibilitychange', pausarFondo);
  addEventListener('musuq:accesibilidad', pausarFondo);
  reduced.addEventListener('change', pausarFondo);

  let vista = null, cambio = 0, desdePortada = false;
  function mostrar(nombre, animar) {
    if (vista === nombre) return;
    const entra = nombre === 'actividades' ? actividades : portada;
    const sale = entra === actividades ? portada : actividades;
    const habiaVista = vista !== null;
    vista = nombre;
    body.classList.toggle('eventos--actividades', nombre === 'actividades');
    pausarFondo();
    const turno = ++cambio, suave = animar && !quieto();
    const terminar = () => {
      if (turno !== cambio) return;
      sale.hidden = true; sale.classList.remove('eventos-vista--sale');
      if (suave) entra.classList.add('eventos-vista--entra');
      entra.hidden = false;
      scrollTo({top:0, behavior:'instant'});
      if (suave) requestAnimationFrame(() => requestAnimationFrame(() => entra.classList.remove('eventos-vista--entra')));
      if (!habiaVista) return;
      const foco = nombre === 'actividades' ? document.getElementById('actividades-titulo') : portada.querySelector('a[href="#actividades"]');
      foco?.focus({preventScroll:true});
    };
    if (!suave || sale.hidden) terminar();
    else { sale.classList.add('eventos-vista--sale'); setTimeout(terminar, 380); }
  }
  const segunHash = animar => mostrar(location.hash === '#actividades' ? 'actividades' : 'portada', animar);
  addEventListener('hashchange', () => segunHash(true));
  portada.querySelectorAll('a[href="#actividades"]').forEach(enlace => enlace.addEventListener('click', () => { desdePortada = true; }));
  document.querySelectorAll('[data-volver]').forEach(enlace => enlace.addEventListener('click', e => {
    e.preventDefault();
    if (desdePortada) { desdePortada = false; history.back(); return; }
    history.pushState(null, '', location.pathname + location.search);
    segunHash(true);
  }));
  segunHash(false);

  document.querySelectorAll('.previo, .evento-imagen').forEach(previo => {
    const soltar = () => { previo.classList.remove('previo--activo'); previo.style.setProperty('--px', 0); previo.style.setProperty('--py', 0); };
    previo.addEventListener('pointerenter', () => { if (fino.matches && !quieto()) previo.classList.add('previo--activo'); });
    previo.addEventListener('pointermove', e => {
      if (!fino.matches || quieto()) return;
      const r = previo.getBoundingClientRect();
      previo.style.setProperty('--px', ((e.clientX - r.left) / r.width * 2 - 1).toFixed(3));
      previo.style.setProperty('--py', ((e.clientY - r.top) / r.height * 2 - 1).toFixed(3));
    });
    previo.addEventListener('pointerleave', soltar);
    previo.addEventListener('pointercancel', soltar);
  });

  const compartir = document.querySelector('[data-compartir]');
  const estadoCompartir = document.querySelector('.actividades-estado');
  compartir?.addEventListener('click', async () => {
    const url = location.href.split('#')[0] + '#actividades';
    try { await navigator.clipboard.writeText(url); estadoCompartir.textContent = 'Enlace copiado.'; }
    catch { estadoCompartir.textContent = 'Copiá este enlace: ' + url; }
  });

  function abrir(dialogo, origen) {
    if (!dialogo || dialogo.open) return;
    dialogo.origen = origen || document.activeElement;
    dialogo.showModal();
  }
  const cerrar = dialogo => { if (dialogo.open) dialogo.close(); };
  document.querySelectorAll('[data-abrir]').forEach(boton => boton.addEventListener('click', () => abrir(document.getElementById(boton.dataset.abrir), boton)));
  document.querySelectorAll('dialog').forEach(dialogo => {
    dialogo.addEventListener('click', e => {
      if (e.target.closest('[data-cerrar]')) { cerrar(dialogo); return; }
      if (e.target !== dialogo) return;
      const r = dialogo.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) cerrar(dialogo);
    });
    dialogo.addEventListener('close', () => {
      if (dialogo.sinFoco) { dialogo.sinFoco = false; return; }
      const origen = dialogo.origen;
      if (origen?.isConnected) setTimeout(() => origen.focus({preventScroll:true}), 0);
    });
  });

  const datos = {
    inscripcion: {
      texto: {nombre:'Marta Gimenez', correo:'marta.gimenez@ejemplo.com'},
      opciones: {compania:['En familia'], interes:['Taller de símbolos','Recorrido']},
      titulo: '¡Inscripción confirmada!',
      mensaje: correo => `Te esperamos el jueves 24 de septiembre en La Rural. Te mandamos los detalles a ${correo}.`
    },
    proyecto: {
      texto: {proyecto:'Tejidos en píxel', nombre:'Tomás Rivas', correo:'tomas.rivas@ejemplo.com', descripcion:'Una mesa para pasar patrones de fajas y matras a píxeles y armar entre todos un símbolo grande durante el encuentro.'},
      opciones: {tipo:['Taller']},
      titulo: '¡Recibimos tu propuesta!',
      mensaje: correo => `La leemos con el equipo y te escribimos a ${correo} antes del encuentro.`
    }
  };

  const confirmacion = document.getElementById('dialogo-confirmacion');
  const lienzo = confirmacion.querySelector('canvas'), ctx = lienzo.getContext('2d');
  const verdes = ['#1F8A4C','#34C46A','#8BE3A8','#0F5A2B','#C6F5D3'];
  const LADO = 15;
  let motor = null, cuadro = 0, ultimoCambio = 0, semilla = 1;
  function dibujarPatron(ahora) {
    cuadro = 0;
    if (!confirmacion.open || !motor) return;
    const lado = lienzo.clientWidth || 280, dpr = Math.min(devicePixelRatio || 1, 2);
    if (lienzo.width !== Math.round(lado * dpr)) { lienzo.width = lienzo.height = Math.round(lado * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, lado, lado);
    motor.dibujar(ctx, 0, 0, lado / LADO, ahora);
    if (quieto()) return;
    if (ahora - ultimoCambio > 2600) { ultimoCambio = ahora; motor.generar(ahora, (++semilla * 2654435761) >>> 0, verdes); }
    cuadro = requestAnimationFrame(dibujarPatron);
  }
  function iniciarPatron() {
    if (typeof Motor === 'undefined') return;
    motor = Motor.crear(LADO); motor.quieto = quieto();
    const ahora = performance.now(); ultimoCambio = ahora;
    semilla = (Math.random() * 0xffffffff) >>> 0;
    motor.generar(ahora, semilla, verdes);
    cancelAnimationFrame(cuadro); cuadro = requestAnimationFrame(dibujarPatron);
  }
  confirmacion.addEventListener('close', () => { cancelAnimationFrame(cuadro); cuadro = 0; });

  document.querySelectorAll('form[data-autocompletar]').forEach(form => {
    const d = datos[form.dataset.autocompletar];
    const dialogo = form.closest('dialog');
    const enviar = form.querySelector('[type=submit]');
    const estado = form.querySelector('.evento-form__estado');
    let fase = 'vacio';
    async function completar() {
      fase = 'llenando';
      estado.textContent = 'Completando tus datos…';
      for (const [nombre, valor] of Object.entries(d.texto)) {
        const campo = form.elements[nombre], caja = campo.closest('.evento-campo');
        caja.classList.add('evento-campo--escribiendo');
        if (quieto()) campo.value = valor;
        else for (let i = 1; i <= valor.length; i++) { campo.value = valor.slice(0, i); await esperar(valor.length > 40 ? 9 : 28); }
        caja.classList.remove('evento-campo--escribiendo');
        await esperar(90);
      }
      for (const [nombre, valores] of Object.entries(d.opciones)) {
        for (const opcion of form.querySelectorAll(`input[name="${nombre}"]`)) {
          if (!valores.includes(opcion.value)) continue;
          opcion.checked = true; await esperar(150);
        }
      }
      fase = 'listo';
      enviar.disabled = false;
      estado.textContent = 'Listo. Revisá los datos y tocá Finalizar.';
    }
    const disparar = e => {
      if (fase !== 'vacio' || e.target.closest('[data-cerrar],[type=submit]')) return;
      if (e.target.closest('.evento-campo,.evento-opciones')) completar();
    };
    form.addEventListener('pointerdown', disparar);
    form.addEventListener('focusin', disparar);
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (fase !== 'listo') return;
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const correo = form.elements.correo.value.trim();
      confirmacion.querySelector('h2').textContent = d.titulo;
      confirmacion.querySelector('p').textContent = d.mensaje(correo);
      const origen = dialogo.origen;
      dialogo.sinFoco = true;
      cerrar(dialogo);
      setTimeout(() => {
        form.reset(); fase = 'vacio'; enviar.disabled = true; estado.textContent = '';
        abrir(confirmacion, origen);
        iniciarPatron();
      }, quieto() ? 0 : 280);
    });
  });

  if (location.hash === '#inscripcion') {
    history.replaceState(null, '', location.pathname + location.search);
    const boton = portada.querySelector('[data-abrir="dialogo-inscripcion"]');
    setTimeout(() => { boton.focus({preventScroll:true}); abrir(document.getElementById('dialogo-inscripcion'), boton); }, quieto() ? 0 : 450);
  }
  if (location.hash === '#proyecto' || location.hash === '#propuesta') {
    history.replaceState(null, '', location.pathname + location.search);
    const boton = portada.querySelector('[data-abrir="dialogo-proyecto"]');
    setTimeout(() => { boton.focus({preventScroll:true}); abrir(document.getElementById('dialogo-proyecto'), boton); }, quieto() ? 0 : 450);
  }
})();
