(() => {
  const tablero = document.getElementById('tablero');
  const cantidades = [421, 383, 356, 216, 124];
  const ranking = RankingSimbolos.map((simbolo, i) => ({...simbolo, puesto:i + 1, likes:cantidades[i]}));
  const key='musuq-ranking-likes-v1';
  const readVotes=()=>{try{const value=JSON.parse(localStorage.getItem(key));return new Set(Array.isArray(value)?value.filter(n=>Number.isInteger(n)&&n>=1&&n<=5):[]);}catch{return new Set();}};
  let votos=readVotes();
  const mensaje=document.createElement('p');mensaje.className='ranking-estado';mensaje.setAttribute('role','status');tablero.after(mensaje);
  const imagen = (archivo, clase = '') => {
    const img = document.createElement('img');
    img.src = 'assets/ranking/' + archivo; img.alt = ''; img.className = clase;
    return img;
  };
  const botones=[];
  tablero.replaceChildren();
  ranking.forEach(d => {
    const ficha = document.createElement('article');
    ficha.className = 'ranking-tarjeta ranking-tarjeta--' + d.puesto;
    const abrir=document.createElement('button');abrir.type='button';abrir.className='ranking-abrir';
    abrir.setAttribute('aria-label','Visualizar '+d.nombre+', '+d.puesto+'° puesto de '+d.autor);
    const copia = document.createElement('canvas'); Comunidad.dibujar(copia, d);
    abrir.onclick=()=>VisorSimbolo.open({src:copia.toDataURL('image/png'),title:d.nombre,autor:d.autor,region:d.region,pueblo:d.pueblo,filename:'musuq-pacha-puesto-'+d.puesto+'.png',puesto:d.puesto},abrir);
    const puesto = document.createElement('h3'); puesto.className = 'ranking-puesto';
    puesto.textContent = d.puesto + '° PUESTO';
    const likes = document.createElement('button');likes.type='button'; likes.className = 'ranking-likes';
    const numero=document.createElement('span');likes.append(numero,imagen('icono-3.svg'));
    function update(){const voted=votos.has(d.puesto),logged=!!window.MUSUQ_SESION?.activa;numero.textContent=d.likes+(voted?1:0);likes.setAttribute('aria-pressed',String(voted));likes.setAttribute('aria-disabled',String(!logged));likes.setAttribute('aria-label',(voted?'Quitar me gusta':'Me gusta')+' al '+d.puesto+'° puesto de '+d.autor);likes.title=logged?'Me gusta':'Iniciá sesión para dar me gusta';}
    likes.onclick=e=>{e.stopPropagation();if(!window.MUSUQ_SESION?.activa){mensaje.textContent='Iniciá sesión para dar me gusta.';document.getElementById('ingresar')?.focus();return;}votos.has(d.puesto)?votos.delete(d.puesto):votos.add(d.puesto);try{localStorage.setItem(key,JSON.stringify([...votos]));}catch{}update();mensaje.textContent=votos.has(d.puesto)?'Le diste me gusta al símbolo de '+d.autor+'.':'Quitaste tu me gusta.';if(!matchMedia('(prefers-reduced-motion:reduce)').matches&&!window.MUSUQ_A11Y?.estado.detener)likes.animate([{transform:'scale(1)'},{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:280});};
    botones.push(update);update();
    const autor = document.createElement('p'); autor.className = 'ranking-autor';
    const avatar=window.MUSUQ_SESION?.avatar(260+d.puesto*317,d.puesto)||imagen('imagen-2.png');
    autor.append(avatar,d.autor);
    const datos = document.createElement('div'); datos.className = 'ranking-datos';
    datos.append(likes, autor);
    const lienzo = document.createElement('canvas'); lienzo.className = 'ranking-simbolo'; lienzo.width = lienzo.height = 330; lienzo.setAttribute('aria-hidden', 'true');
    ficha.append(abrir, lienzo, puesto, datos);
    if (d.puesto === 1) {
      const medalla = document.createElement('span'); medalla.className = 'ranking-medalla';
      medalla.setAttribute('aria-hidden', 'true'); medalla.append(imagen('icono-4.svg'));
      puesto.prepend(medalla);
    }
    tablero.append(ficha);
  });
  const detenido = () => matchMedia('(prefers-reduced-motion:reduce)').matches || !!window.MUSUQ_A11Y?.estado.detener || document.documentElement.dataset.detener === 'true';
  const vivos = [...tablero.querySelectorAll('canvas.ranking-simbolo')].map((lienzo, i) => ({lienzo, d:ranking[i], grilla:new Map(ranking[i].celdas.map(([x, y, h]) => [x + ',' + y, h])), motor:typeof Motor !== 'undefined' ? Motor.crear(ranking[i].lado) : null, armado:false, cambio:0}));
  let cuadro = 0, enPantalla = true;
  function medida(v) {
    const r = v.lienzo.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2), lado = Math.max(1, Math.round(r.width * dpr));
    if (v.lienzo.width !== lado) v.lienzo.width = v.lienzo.height = lado;
    const borde = lado * 22 / 330;
    return {ctx:v.lienzo.getContext('2d'), lado, borde, celda:(lado - borde * 2) / v.d.lado};
  }
  function quieto(v) {
    const {ctx, lado, borde, celda} = medida(v);
    ctx.fillStyle = v.d.fondo; ctx.fillRect(0, 0, lado, lado);
    v.d.celdas.forEach(([x, y, h]) => { ctx.fillStyle = h; ctx.fillRect(borde + x * celda, borde + y * celda, Math.ceil(celda), Math.ceil(celda)); });
  }
  function vivo(v, ahora) {
    if (ahora >= v.cambio) {
      if (v.armado) { v.motor.limpiar(ahora); v.cambio = ahora + 1000 + Math.random() * 1600; }
      else { v.motor.cargar(v.grilla, ahora); v.cambio = ahora + 4200 + Math.random() * 3600; }
      v.armado = !v.armado;
    }
    const {ctx, lado, borde, celda} = medida(v);
    ctx.fillStyle = v.d.fondo; ctx.fillRect(0, 0, lado, lado);
    v.motor.dibujar(ctx, borde, borde, celda, ahora);
  }
  function paso(ahora) {
    cuadro = 0;
    if (!enPantalla || document.hidden || detenido()) { vivos.forEach(quieto); return; }
    vivos.forEach(v => vivo(v, ahora));
    cuadro = requestAnimationFrame(paso);
  }
  const arrancar = () => { if (!cuadro) cuadro = requestAnimationFrame(paso); };
  if (vivos.some(v => !v.motor)) vivos.forEach(quieto);
  else {
    const inicio = performance.now();
    vivos.forEach((v, i) => { v.cambio = inicio + 150 + i * 700 + Math.random() * 900; });
    new IntersectionObserver(([entrada]) => { enPantalla = entrada.isIntersecting; if (enPantalla) arrancar(); }).observe(tablero);
    document.addEventListener('visibilitychange', arrancar);
    addEventListener('musuq:accesibilidad', arrancar);
    addEventListener('resize', () => { if (detenido()) vivos.forEach(quieto); });
    arrancar();
  }
  addEventListener('musuq:sesion',()=>{botones.forEach(fn=>fn());mensaje.textContent='';});
  addEventListener('storage',e=>{if(e.key===key||e.key===null){votos=readVotes();botones.forEach(fn=>fn());}});
  const lista = document.getElementById('tablero-local');
  const regionDe = nombre => [...Patrones.pueblos, ...PUEBLOS].find(p => p.nombre === nombre)?.region || '';
  function renderLocales() {
    lista.replaceChildren();
    [...Comunidad.leer(), ...ProximosSimbolos].forEach(d => {
      const a = document.createElement('button'); a.type = 'button'; a.className = 'simbolo-local';
      const cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true');
      Comunidad.dibujar(cv, d);
      const autor = d.autor || '@tomi.rivas', region = d.region || regionDe(d.pueblo);
      a.setAttribute('aria-label', 'Ver ' + d.nombre + ' de ' + autor);
      a.addEventListener('click', () => VisorSimbolo.open({src:cv.toDataURL('image/png'), title:d.nombre, autor, region, pueblo:d.pueblo, filename:'musuq-pacha-simbolo.png'}, a));
      a.append(cv); lista.append(a);
    });
  }
  renderLocales();
  addEventListener('storage', e => { if (e.key === Comunidad.KEY || e.key === null) renderLocales(); });
  addEventListener('pageshow', renderLocales);
})();
