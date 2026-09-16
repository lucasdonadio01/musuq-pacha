(function () {
  'use strict';
  if (window.MUSUQ_A11Y) return;
  const root = document.documentElement;
  const dialogo = document.getElementById('menu-accesibilidad');
  const form = document.getElementById('ajustes-accesibilidad');
  if (!dialogo || !form) return;
  const estadoUI = document.getElementById('estado-accesibilidad');
  const clave = 'musuq-pacha.accesibilidad.v1';
  const defaults = {color:'normal',tamano:100,narrador:false,silenciado:false,velocidad:1,detener:false,enlaces:false,espaciado:false};
  const normalizar = raw => ({
    ...defaults,
    color: ['normal','daltonismo','contraste','grises'].includes(raw?.color) ? raw.color : 'normal',
    tamano: [75,100,125,150,175,200].includes(raw?.tamano) ? raw.tamano : 100,
    velocidad: [0.75,1,1.5].includes(raw?.velocidad) ? raw.velocidad : 1,
    ...Object.fromEntries(['narrador','silenciado','detener','enlaces','espaciado'].map(k=>[k,raw?.[k]===true]))
  });
  let guardado;
  try { guardado = normalizar(JSON.parse(localStorage.getItem(clave))); }
  catch (_) { guardado = {...defaults}; }
  let estado = {...guardado};
  let origen = null;
  let ultimoTexto = '';
  let demoraVoz = 0;
  let voces = [];
  const hayVoz = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const synth = hayVoz ? window.speechSynthesis : null;
  const fontOriginal = new Map();
  const selectorTextos = 'p,h1,h2,h3,a,button,label,input,legend,output,span,li';
  const paleta = ['#e69f00','#56b4e9','#d55e00','#cc79a7','#0072b2','#f0e442','#009e73','#9999dd'];
  window.MUSUQ_A11Y = {
    get estado() { return {...estado}; },
    colorZona(zona) { return estado.color==='daltonismo' ? paleta[(zona.id-1)%paleta.length] : zona.color; },
    narrar(texto) { narrar(texto); }
  };

  function escalarTexto() {
    for (const [el] of fontOriginal) el.style.removeProperty('font-size');
    fontOriginal.clear();
    const elementos = [...document.querySelectorAll(selectorTextos)].filter(el=>!el.closest('svg'));
    for (const el of elementos) fontOriginal.set(el,parseFloat(getComputedStyle(el).fontSize));
    if (estado.tamano!==100) for (const [el,size] of fontOriginal) el.style.fontSize=size*estado.tamano/100+'px';
  }
  function aplicar() {
    root.dataset.color = estado.color;
    root.dataset.detener = String(estado.detener);
    root.dataset.enlaces = String(estado.enlaces);
    root.dataset.espaciado = String(estado.espaciado);
    root.dataset.textoGrande = String(estado.tamano>=150);
    escalarTexto();
    window.dispatchEvent(new CustomEvent('musuq:accesibilidad',{detail:{...estado}}));
    if (!estado.narrador || estado.silenciado) cancelarVoz();
  }
  function cancelarVoz() {
    clearTimeout(demoraVoz);
    if(synth)synth.cancel();
  }
  function narrar(texto, inmediato=false) {
    if(!hayVoz||!estado.narrador||estado.silenciado||!texto)return;
    ultimoTexto=String(texto).replace(/\s+/g,' ').trim().slice(0,1400);
    cancelarVoz();
    const leer=()=>{
      if(!estado.narrador||estado.silenciado)return;
      const frase=new SpeechSynthesisUtterance(ultimoTexto);
      const voz=voces.find(v=>/^es[-_]AR/i.test(v.lang))||voces.find(v=>/^es/i.test(v.lang));
      frase.lang=voz?.lang||'es-AR';
      if(voz)frase.voice=voz;
      frase.rate=estado.velocidad;
      frase.onerror=e=>{
        if(!['interrupted','canceled'].includes(e.error))document.getElementById('estado-narrador').textContent='No se pudo reproducir la voz. Revisá las voces y el audio de tu navegador.';
      };
      synth.speak(frase);
    };
    if(inmediato)leer();else demoraVoz=setTimeout(leer,250);
  }
  if(hayVoz){
    const actualizarVoces=()=>{voces=synth.getVoices();};
    actualizarVoces();synth.addEventListener('voiceschanged',actualizarVoces);
  }else{
    form.elements.narrador.disabled=true;
    document.getElementById('estado-narrador').textContent='Este navegador no ofrece síntesis de voz. El sitio sigue siendo compatible con lectores de pantalla.';
    document.getElementById('silenciar-narrador').disabled=true;
    form.querySelectorAll('[data-velocidad]').forEach(b=>b.disabled=true);
  }
  function sincronizarFormulario() {
    form.elements.color.value=estado.color;
    form.elements.tamano.value=estado.tamano;
    for(const k of ['narrador','detener','enlaces','espaciado'])form.elements[k].checked=estado[k];
    document.getElementById('tamano-texto').setAttribute('aria-valuetext',estado.tamano+' por ciento');
    document.getElementById('tamano-valor').textContent=estado.tamano+' %';
    document.getElementById('texto-menos').disabled=estado.tamano===75;
    document.getElementById('texto-mas').disabled=estado.tamano===200;
    const mute=document.getElementById('silenciar-narrador');
    mute.setAttribute('aria-pressed',String(estado.silenciado));
    mute.querySelector('span').textContent=estado.silenciado?'Activar sonido':'Silenciar';
    for(const b of form.querySelectorAll('[data-velocidad]'))b.setAttribute('aria-pressed',String(Number(b.dataset.velocidad)===estado.velocidad));
    document.getElementById('ayuda-color').hidden=estado.color!=='daltonismo';
  }
  function abrir(boton) {
    if(dialogo.open)return;
    origen=boton;estado={...guardado};sincronizarFormulario();
    dialogo.showModal();
    document.querySelectorAll('[aria-controls="menu-accesibilidad"]').forEach(b=>b.setAttribute('aria-expanded','true'));
    document.getElementById('cerrar-accesibilidad').focus();
  }
  function cerrar(guardar=false) {
    cancelarVoz();
    if(guardar){
      guardado={...estado};
      try{localStorage.setItem(clave,JSON.stringify(guardado));estadoUI.textContent='Preferencias de accesibilidad guardadas.';}
      catch(_){estadoUI.textContent='Preferencias aplicadas. El navegador no permite guardarlas para la próxima visita.';}
    }else estado={...guardado};
    aplicar();dialogo.close();
    document.querySelectorAll('[aria-controls="menu-accesibilidad"]').forEach(b=>b.setAttribute('aria-expanded','false'));
    origen?.focus({preventScroll:true});
    if(guardar&&estado.narrador&&!estado.silenciado){
      const enMapa = document.body.classList.contains('en-mapa');
      const titulo = enMapa ? document.querySelector('.panel__nombre') : document.querySelector('main h1') || document.querySelector('h1');
      const descripcion = enMapa ? document.querySelector('.panel__criterio') : document.querySelector('main .bajada') || document.querySelector('#detalle:not([hidden]) #detalle-contexto');
      const contenido = [titulo?.textContent, descripcion?.textContent].filter(Boolean).join('. ') || document.title;
      narrar(contenido,true);
    }
  }
  for(const id of ['abrir-accesibilidad','accesibilidad-mapa'])document.getElementById(id)?.addEventListener('click',e=>abrir(e.currentTarget));
  document.getElementById('cerrar-accesibilidad').addEventListener('click',()=>cerrar());
  dialogo.addEventListener('cancel',e=>{e.preventDefault();cerrar();});
  dialogo.addEventListener('click',e=>{if(e.target===dialogo){const r=dialogo.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)cerrar();}});
  form.addEventListener('submit',e=>{e.preventDefault();cerrar(true);});
  form.addEventListener('input',e=>{
    const el=e.target;
    if(el.name==='color')estado.color=el.value;
    else if(el.name==='tamano')estado.tamano=Number(el.value);
    else if(['narrador','detener','enlaces','espaciado'].includes(el.name))estado[el.name]=el.checked;
    sincronizarFormulario();aplicar();
    if(el.name==='narrador'&&el.checked){estado.silenciado=false;sincronizarFormulario();narrar('Narrador activado. Así se va a ver el texto del sitio.',true);}
  });
  for(const [id,delta] of [['texto-menos',-25],['texto-mas',25]])document.getElementById(id).addEventListener('click',()=>{estado.tamano=Math.max(75,Math.min(200,estado.tamano+delta));sincronizarFormulario();aplicar();});
  document.getElementById('silenciar-narrador').addEventListener('click',()=>{estado.silenciado=!estado.silenciado;sincronizarFormulario();if(estado.silenciado)cancelarVoz();else narrar(ultimoTexto||'Sonido activado.',true);});
  for(const b of form.querySelectorAll('[data-velocidad]'))b.addEventListener('click',()=>{estado.velocidad=Number(b.dataset.velocidad);sincronizarFormulario();narrar('Velocidad de lectura '+b.textContent+'.',true);});
  document.getElementById('restablecer-accesibilidad').addEventListener('click',()=>{estado={...defaults};sincronizarFormulario();aplicar();});
  document.addEventListener('focusin',e=>{
    const el=e.target;
    if(el===origen&&dialogo.open)return;
    let texto=el.getAttribute('aria-label')||el.textContent;
    if(el.matches('input'))texto=(el.getAttribute('aria-label')||el.closest('label')?.textContent||'Campo de texto')+(el.value?'. '+el.value:'');
    narrar(texto);
  });
  document.addEventListener('mouseup',()=>{const texto=window.getSelection()?.toString();if(texto?.trim())narrar(texto);});
  window.addEventListener('pagehide',cancelarVoz);
  let esperaResize;
  window.addEventListener('resize',()=>{clearTimeout(esperaResize);esperaResize=setTimeout(escalarTexto,120);});
  window.addEventListener('storage',e=>{if(e.key===clave&&!dialogo.open){try{guardado=normalizar(JSON.parse(e.newValue));estado={...guardado};aplicar();}catch(_){}}});
  window.addEventListener('musuq:modo',e=>{const boton=document.getElementById('accesibilidad-mapa');if(boton)boton.hidden=!e.detail.explorando;});

  const buscarDialogo=document.getElementById('busqueda-global'),buscar=document.getElementById('buscar-global');
  const sinAcentos=t=>t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function resultados(){
    const lista=document.getElementById('resultados-global');lista.replaceChildren();
    const filtro=sinAcentos(buscar.value.trim());
    for(const zona of window.DATOS_MAPA?.zonas||[]){
      if(!sinAcentos(zona.nombre+' '+zona.criterio).includes(filtro))continue;
      const li=document.createElement('li'),b=document.createElement('button');b.type='button';b.textContent=zona.nombre+' · '+zona.criterio;
      b.addEventListener('click',()=>{buscarDialogo.close();window.dispatchEvent(new CustomEvent('musuq:seleccionar',{detail:{id:zona.id}}));});li.append(b);lista.append(li);
    }
    document.getElementById('busqueda-vacia').hidden=!!lista.children.length;
    escalarTexto();
  }
  if (buscarDialogo && buscar) {
    document.getElementById('abrir-busqueda')?.addEventListener('click',()=>{buscarDialogo.showModal();buscar.value='';resultados();buscar.focus();});
    buscar.addEventListener('input',resultados);
  }
  document.querySelectorAll('[data-cerrar-dialogo]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
  document.querySelectorAll('svg:not(.iconos-sitio)').forEach(el=>{el.setAttribute('aria-hidden','true');el.setAttribute('focusable','false');});
  aplicar();
  window.addEventListener('DOMContentLoaded',()=>{escalarTexto();sincronizarFormulario();});
})();
