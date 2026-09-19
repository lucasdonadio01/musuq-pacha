/* Ranking de ejemplo; preferencias y votos propios se guardan en este navegador. */
(() => {
  const tablero = document.getElementById('tablero');
  const ranking = [
    {puesto:1,likes:421,imagen:1,autor:'@pampa.viva'}, {puesto:2,likes:383,imagen:3,autor:'@rio.abierto'},
    {puesto:3,likes:356,imagen:4,autor:'@trama.norte'}, {puesto:4,likes:216,imagen:5,autor:'@sur.creativo'},
    {puesto:5,likes:124,imagen:6,autor:'@raiz.andina'}
  ];
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
    abrir.setAttribute('aria-label','Visualizar '+d.puesto+'° puesto de '+d.autor);
    abrir.onclick=()=>VisorSimbolo.open({src:'assets/ranking/imagen-'+d.imagen+'.png',title:d.puesto+'° puesto · '+d.autor,filename:'musuq-pacha-puesto-'+d.puesto+'.png',puesto:d.puesto},abrir);
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
    ficha.append(abrir,imagen('imagen-' + d.imagen + '.png', 'ranking-simbolo'), puesto, datos);
    if (d.puesto === 1) {
      const medalla = document.createElement('span'); medalla.className = 'ranking-medalla';
      medalla.setAttribute('aria-hidden', 'true'); medalla.append(imagen('icono-4.svg'));
      puesto.prepend(medalla);
    }
    tablero.append(ficha);
    window.PatronVivo?.instalar(ficha.querySelector('.ranking-simbolo'),ficha);
  });
  addEventListener('musuq:sesion',()=>{botones.forEach(fn=>fn());mensaje.textContent='';});
  addEventListener('storage',e=>{if(e.key===key||e.key===null){votos=readVotes();botones.forEach(fn=>fn());}});
  const guardados = document.getElementById('comunidad-local');
  const lista = document.getElementById('tablero-local');
  function renderLocales() {
    const locales = Comunidad.leer(); guardados.hidden = !locales.length;
    lista.replaceChildren();
    locales.forEach(d => {
      const a = document.createElement('button'); a.type = 'button'; a.className = 'simbolo-local';
      const cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true');
      Comunidad.dibujar(cv, d);
      a.addEventListener('click', () => VisorSimbolo.open({src:cv.toDataURL('image/png'), title:d.nombre, filename:'musuq-pacha-simbolo.png'}, a));
      const titulo = document.createElement('strong'); titulo.textContent = d.nombre;
      const pie = document.createElement('small'); pie.textContent = d.pueblo;
      const texto = document.createElement('div'); texto.append(titulo, pie);
      a.append(cv, texto); lista.append(a);
    });
  }
  renderLocales();
  addEventListener('storage', e => { if (e.key === Comunidad.KEY || e.key === null) renderLocales(); });
  addEventListener('pageshow', renderLocales);
})();
