/* Ranking de demostración: valores y autor de HOME en Figma, no votos en vivo.
   Las publicaciones locales se conservan en un tablero aparte. */
(() => {
  const tablero = document.getElementById('tablero');
  const ranking = [
    {puesto:1,likes:421,imagen:1}, {puesto:2,likes:383,imagen:3},
    {puesto:3,likes:356,imagen:4}, {puesto:4,likes:216,imagen:5},
    {puesto:5,likes:124,imagen:6}
  ];
  const imagen = (archivo, clase = '') => {
    const img = document.createElement('img');
    img.src = 'assets/ranking/' + archivo; img.alt = ''; img.className = clase;
    return img;
  };
  tablero.replaceChildren();
  ranking.forEach(d => {
    const ficha = document.createElement('article');
    ficha.className = 'ranking-tarjeta ranking-tarjeta--' + d.puesto;
    ficha.setAttribute('role', 'button'); ficha.tabIndex = 0;
    const abrir = () => VisorSimbolo.open({src:'assets/ranking/imagen-' + d.imagen + '.png', title:d.puesto + '° puesto · @miaumiaumichi', filename:'musuq-pacha-puesto-' + d.puesto + '.png'}, ficha);
    ficha.addEventListener('click', abrir);
    ficha.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } });
    ficha.setAttribute('aria-label', d.puesto + '° puesto, ' + d.likes + ' likes, @miaumiaumichi. Datos de la maqueta.');
    const puesto = document.createElement('h3'); puesto.className = 'ranking-puesto';
    puesto.textContent = d.puesto + '° PUESTO';
    const likes = document.createElement('p'); likes.className = 'ranking-likes';
    likes.append(String(d.likes), imagen('icono-3.svg'));
    const autor = document.createElement('p'); autor.className = 'ranking-autor';
    autor.append(imagen('imagen-2.png'), '@miaumiaumichi');
    const datos = document.createElement('div'); datos.className = 'ranking-datos';
    datos.append(likes, autor);
    ficha.append(imagen('imagen-' + d.imagen + '.png', 'ranking-simbolo'), puesto, datos);
    if (d.puesto === 1) {
      const medalla = document.createElement('span'); medalla.className = 'ranking-medalla';
      medalla.setAttribute('aria-hidden', 'true'); medalla.append(imagen('icono-4.svg'));
      ficha.append(medalla);
    }
    tablero.append(ficha);
  });
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
