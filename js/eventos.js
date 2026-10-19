(() => {
  'use strict';
  const root = document.documentElement, body = document.body;
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const fino = matchMedia('(hover:hover) and (pointer:fine)');
  const quieto = () => reduced.matches || root.dataset.detener === 'true';
  const esperar = ms => new Promise(listo => setTimeout(listo, quieto() ? 0 : ms));
  const portada = document.getElementById('portada');
  const vistas = {portada, actividades: document.getElementById('actividades')};
  const compra = document.getElementById('entradas');

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
    if (fondoActivo) Fondo.cfg.quieto = quieto() || document.hidden || body.classList.contains('eventos--landing');
  };
  pausarFondo();
  document.addEventListener('visibilitychange', pausarFondo);
  addEventListener('musuq:accesibilidad', pausarFondo);
  reduced.addEventListener('change', pausarFondo);

  let vista = null, anterior = null, cambio = 0, desdePortada = false, origenPortada = null;
  const irACompra = suave => {
    compra.scrollIntoView({behavior: suave && !quieto() ? 'smooth' : 'instant', block:'start'});
    document.getElementById('entradas-titulo').focus({preventScroll:true});
  };
  function mostrar(nombre, animar, destino) {
    if (vista === nombre) { if (destino) irACompra(animar); return; }
    const entra = vistas[nombre];
    const salen = Object.values(vistas).filter(v => v !== entra && !v.hidden);
    const habiaVista = vista !== null;
    anterior = vista; vista = nombre;
    body.classList.toggle('eventos--landing', nombre !== 'portada');
    pausarFondo();
    const turno = ++cambio, suave = animar && !quieto();
    const terminar = () => {
      if (turno !== cambio) return;
      salen.forEach(sale => { sale.hidden = true; sale.classList.remove('eventos-vista--sale'); });
      if (suave) entra.classList.add('eventos-vista--entra');
      entra.hidden = false;
      if (destino) compra.scrollIntoView({behavior:'instant', block:'start'}); else scrollTo({top:0, behavior:'instant'});
      if (suave) requestAnimationFrame(() => requestAnimationFrame(() => entra.classList.remove('eventos-vista--entra')));
      if (!habiaVista) return;
      const foco = nombre === 'portada' ? (origenPortada?.isConnected ? origenPortada : portada.querySelector('a[href="#actividades"]')) : document.getElementById((destino ? 'entradas' : nombre) + '-titulo');
      foco?.focus({preventScroll:true});
    };
    if (!suave || !salen.length) terminar();
    else { salen.forEach(sale => sale.classList.add('eventos-vista--sale')); setTimeout(terminar, 380); }
  }
  const segunHash = animar => {
    if (location.hash === '#inscripcion') history.replaceState(null, '', location.pathname + location.search + '#entradas');
    const nombre = location.hash.slice(1);
    mostrar(nombre === 'actividades' || nombre === 'entradas' ? 'actividades' : 'portada', animar, nombre === 'entradas');
  };
  addEventListener('hashchange', () => segunHash(true));
  portada.querySelectorAll('a[href="#actividades"], a[href="#entradas"]').forEach(enlace => enlace.addEventListener('click', () => { desdePortada = true; origenPortada = enlace; }));
  document.querySelectorAll('[data-volver]').forEach(enlace => enlace.addEventListener('click', e => {
    e.preventDefault();
    if (desdePortada && anterior === 'portada') { desdePortada = false; history.back(); return; }
    desdePortada = false;
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

  const galeria = document.querySelector('.evento-imagen[data-galeria]');
  if (galeria) {
    const fotos = [...galeria.querySelectorAll('.evento-foto')];
    const puntos = [...galeria.querySelectorAll('.evento-puntos button')];
    const estadoGaleria = galeria.querySelector('[data-galeria-estado]');
    let actual = 0, reloj = 0, pausa = false;
    const programar = () => { clearTimeout(reloj); if (!pausa && !document.hidden && !quieto() && !body.classList.contains('eventos--landing')) reloj = setTimeout(() => ir(actual + 1, false), 4500); };
    function ir(indice, anunciar = true) {
      actual = (indice + fotos.length) % fotos.length;
      fotos.forEach((foto, i) => {
        const activa = i === actual;
        foto.classList.toggle('evento-foto--activa', activa);
        if (activa) { foto.removeAttribute('aria-hidden'); foto.loading = 'eager'; } else foto.setAttribute('aria-hidden', 'true');
      });
      puntos.forEach((punto, i) => { if (i === actual) punto.setAttribute('aria-current', 'true'); else punto.removeAttribute('aria-current'); });
      if (anunciar) estadoGaleria.textContent = `Imagen ${actual + 1} de ${fotos.length}`;
      programar();
    }
    puntos.forEach((punto, i) => punto.addEventListener('click', () => ir(i)));
    galeria.addEventListener('pointerenter', () => { pausa = true; programar(); });
    galeria.addEventListener('pointerleave', () => { pausa = false; programar(); });
    galeria.addEventListener('focusin', () => { pausa = true; programar(); });
    galeria.addEventListener('focusout', e => { if (!galeria.contains(e.relatedTarget)) { pausa = false; programar(); } });
    let inicio = null;
    galeria.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') inicio = e.clientX; });
    galeria.addEventListener('pointerup', e => {
      if (inicio === null) return;
      const recorrido = e.clientX - inicio; inicio = null;
      if (Math.abs(recorrido) > 40) ir(actual + (recorrido < 0 ? 1 : -1));
    });
    document.addEventListener('visibilitychange', programar);
    addEventListener('musuq:accesibilidad', programar);
    addEventListener('hashchange', programar);
    addEventListener('load', () => fotos.forEach(foto => { foto.loading = 'eager'; }));
    ir(0, false);
  }

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
    entradas: {
      texto: {nombre:'Marta Gimenez', correo:'marta.gimenez@ejemplo.com', dni:'32.458.910'},
      opciones: {tipo:['general'], dia:['sabado'], pago:['mercadopago']},
      cantidad: 2,
      tarjeta: {tarjeta:'4509 9535 6623 3704', vencimiento:'11/30', codigo:'123'},
      titulo: '¡Compra confirmada!',
      esperamos: '¡Te esperamos!',
      mensaje: (correo, form) => {
        const n = Number(form.elements.cantidad.value);
        const tipo = form.querySelector('input[name="tipo"]:checked'), dia = form.querySelector('input[name="dia"]:checked');
        const cuando = tipo && tipo.value === 'pase' ? tipo.dataset.texto : (dia ? dia.dataset.texto : '');
        const que = n === 1 ? (tipo ? tipo.dataset.nombre : 'la entrada') : (tipo && tipo.value === 'pase' ? `los ${n} pases` : `las ${n} entradas`);
        return `Te enviamos ${que} a ${correo}. Nos vemos ${cuando} en el Palacio Libertad, de 11:30 a 20 h: mostrá el QR del mail en la puerta.`;
      }
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
  confirmacion.addEventListener('close', () => {
    cancelAnimationFrame(cuadro); cuadro = 0;
    if (!confirmacion.volverAPortada) return;
    confirmacion.volverAPortada = false;
    history.pushState(null, '', location.pathname + location.search);
    segunHash(true);
  });

  document.querySelectorAll('form[data-autocompletar]').forEach(form => {
    const d = datos[form.dataset.autocompletar];
    const dialogo = form.closest('dialog');
    const enviar = form.querySelector('[type=submit]');
    const estado = form.querySelector('.evento-form__estado');
    let fase = 'vacio';
    const salida = form.elements.cantidad;
    const total = form.querySelector('[data-total]');
    const pesos = n => '$ ' + n.toLocaleString('es-AR');
    const dias = form.querySelector('[data-dias]');
    function mostrarDias() {
      if (!dias) return;
      const pase = form.querySelector('input[name="tipo"]:checked')?.value === 'pase';
      dias.classList.toggle('evento-opciones--apagadas', pase);
      dias.querySelector('[data-dias-pase]').hidden = !pase;
      dias.querySelectorAll('input').forEach((campo, i) => {
        campo.disabled = pase;
        if (pase) campo.checked = false;
        campo.required = !pase && i === 0;
      });
    }
    function actualizarTotal() {
      if (!total) return;
      const tipo = form.querySelector('input[name="tipo"]:checked');
      const nuevo = pesos((tipo ? Number(tipo.dataset.precio) : 0) * Number(salida.value));
      if (total.textContent === nuevo) return;
      total.textContent = nuevo;
      if (quieto()) return;
      total.parentElement.classList.add('evento-total--cambia');
      setTimeout(() => total.parentElement.classList.remove('evento-total--cambia'), 220);
    }
    function fijarCantidad(n) {
      if (!salida) return;
      salida.value = Math.min(10, Math.max(1, n));
      form.querySelector('[data-cantidad="-1"]').disabled = salida.value <= 1;
      form.querySelector('[data-cantidad="1"]').disabled = salida.value >= 10;
      actualizarTotal();
    }
    async function escribir(campo, valor) {
      const caja = campo.closest('.evento-campo');
      caja.classList.add('evento-campo--escribiendo');
      if (quieto()) campo.value = valor;
      else for (let i = 1; i <= valor.length; i++) { campo.value = valor.slice(0, i); await esperar(valor.length > 40 ? 9 : 28); }
      caja.classList.remove('evento-campo--escribiendo');
    }
    let llenandoTarjeta = false;
    async function mostrarPago() {
      const elegido = form.querySelector('input[name="pago"]:checked')?.value;
      form.querySelectorAll('[data-pago]').forEach(panel => { panel.hidden = panel.dataset.pago !== elegido; });
      form.querySelectorAll('.evento-tarjeta-datos input').forEach(campo => { campo.required = elegido === 'tarjeta'; });
      if (elegido !== 'tarjeta' || !d.tarjeta || llenandoTarjeta || fase === 'vacio') return;
      const vacios = Object.entries(d.tarjeta).filter(([nombre]) => !form.elements[nombre].value);
      if (!vacios.length) return;
      llenandoTarjeta = true;
      enviar.disabled = true;
      estado.textContent = 'Completando los datos de la tarjeta…';
      await esperar(220);
      for (const [nombre, valor] of vacios) { await escribir(form.elements[nombre], valor); await esperar(90); }
      llenandoTarjeta = false;
      if (fase === 'listo') { enviar.disabled = false; estado.textContent = 'Listo. Revisá los datos y tocá Pagar.'; }
    }
    if (salida) {
      form.querySelectorAll('[data-cantidad]').forEach(boton => boton.addEventListener('click', () => fijarCantidad(Number(salida.value) + Number(boton.dataset.cantidad))));
      form.addEventListener('change', e => {
        if (e.target.name === 'tipo') { mostrarDias(); actualizarTotal(); }
        if (e.target.name === 'pago') mostrarPago();
      });
      fijarCantidad(1);
      mostrarDias();
    }
    async function completar() {
      fase = 'llenando';
      estado.textContent = 'Completando tus datos…';
      for (const [nombre, valor] of Object.entries(d.texto)) {
        await escribir(form.elements[nombre], valor);
        await esperar(90);
      }
      for (const [nombre, valores] of Object.entries(d.opciones)) {
        const marcada = form.querySelector(`input[name="${nombre}"]:checked`);
        if (marcada && marcada.type === 'radio') continue;
        for (const opcion of form.querySelectorAll(`input[name="${nombre}"]`)) {
          if (!valores.includes(opcion.value) || opcion.disabled) continue;
          opcion.checked = true;
          opcion.dispatchEvent(new Event('change', {bubbles:true}));
          await esperar(150);
        }
      }
      if (d.cantidad && salida) for (let n = Number(salida.value) + 1; n <= d.cantidad; n++) { await esperar(180); fijarCantidad(n); }
      fase = 'listo';
      await mostrarPago();
      if (llenandoTarjeta) return;
      enviar.disabled = false;
      estado.textContent = `Listo. Revisá los datos y tocá ${enviar.textContent.trim()}.`;
    }
    const disparar = e => {
      if (fase !== 'vacio' || e.target.closest('[data-cerrar],[type=submit]')) return;
      if (e.target.closest('.evento-campo,.evento-opciones,.evento-cantidad')) completar();
    };
    form.addEventListener('pointerdown', disparar);
    form.addEventListener('focusin', disparar);
    const verificar = form.dataset.autocompletar === 'proyecto' ? document.getElementById('dialogo-verificar-proyecto') : null;
    verificar?.querySelector('[data-verificar-confirmar]').addEventListener('click', () => { verificar.sinFoco = true; cerrar(verificar); enviarDatos(); });
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (fase !== 'listo') return;
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (verificar) {
        verificar.querySelector('[data-verificar-nombre]').textContent = form.elements.proyecto.value.trim();
        abrir(verificar, enviar);
        verificar.querySelector('[data-verificar-confirmar]').focus();
        return;
      }
      enviarDatos();
    });
    function enviarDatos() {
      const correo = form.elements.correo.value.trim();
      confirmacion.querySelector('h2').textContent = d.titulo;
      confirmacion.querySelector('p').textContent = d.mensaje(correo, form);
      const esperamos = confirmacion.querySelector('.evento-confirmacion__esperamos');
      esperamos.textContent = d.esperamos || '';
      esperamos.hidden = !d.esperamos;
      const origen = dialogo ? dialogo.origen : document.getElementById('entradas-titulo');
      if (dialogo) { dialogo.sinFoco = true; cerrar(dialogo); }
      confirmacion.volverAPortada = !dialogo;
      setTimeout(() => {
        form.reset(); fase = 'vacio'; enviar.disabled = true; estado.textContent = '';
        if (salida) { fijarCantidad(1); mostrarPago(); mostrarDias(); }
        abrir(confirmacion, origen);
        iniciarPatron();
      }, quieto() ? 0 : 280);
    }
  });

  const dias = [...document.querySelectorAll('.crono__dia')];
  function elegirDia(tab, enfocar) {
    dias.forEach(otro => {
      const activo = otro === tab;
      otro.setAttribute('aria-selected', activo);
      otro.tabIndex = activo ? 0 : -1;
      document.getElementById(otro.getAttribute('aria-controls')).hidden = !activo;
    });
    if (enfocar) tab.focus();
  }
  dias.forEach((tab, i) => {
    tab.addEventListener('click', () => elegirDia(tab));
    tab.addEventListener('keydown', e => {
      const paso = {ArrowRight:1, ArrowDown:1, ArrowLeft:-1, ArrowUp:-1}[e.key];
      if (paso) { e.preventDefault(); elegirDia(dias[(i + paso + dias.length) % dias.length], true); }
      else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); elegirDia(dias[e.key === 'Home' ? 0 : dias.length - 1], true); }
    });
  });
  const hoy = new Date(), fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  const delEvento = dias.find(tab => document.getElementById(tab.getAttribute('aria-controls')).querySelector('time')?.dateTime.startsWith(fechaHoy));
  if (delEvento) elegirDia(delEvento);

  if (location.hash === '#proyecto' || location.hash === '#propuesta') {
    history.replaceState(null, '', location.pathname + location.search);
    const boton = portada.querySelector('[data-abrir="dialogo-proyecto"]');
    setTimeout(() => { boton.focus({preventScroll:true}); abrir(document.getElementById('dialogo-proyecto'), boton); }, quieto() ? 0 : 450);
  }
})();
