(() => {
  const tablero=document.getElementById('tablero');
  function ejemplos() {
    return PUEBLOS.slice(0,5).map((p,i)=>{
      const m=Motor.crear(9);m.quieto=true;m.generar(0,1907+i*31,Motor.paletaContra(p.colores,p.fondo,3));
      return {v:1,nombre:['Cruce','Encuentro','Trama','Semilla','Ronda'][i],pueblo:p.nombre,lado:9,fondo:p.fondo,celdas:[...m.grilla].map(([k,h])=>[...k.split(',').map(Number),h]),ejemplo:true};
    });
  }
  function render() {
    const locales=Comunidad.leer();const muestras=ejemplos();
    const items=locales.length?[...locales,...muestras].slice(0,Math.max(5,locales.length)):muestras;
    document.getElementById('tablero-rotulo').textContent=locales.length?'Comunidad · En este navegador':'Ranking semanal · Vista previa';
    document.getElementById('comunidad-titulo').textContent=locales.length?'Tus símbolos, acá':'Mejores símbolos';
    if(locales.length)document.getElementById('tablero-nota').textContent='Tus creaciones, de la más reciente a la primera. Este tablero es local: compartí el enlace de cada símbolo para que otras personas lo vean.';
    tablero.replaceChildren();
    items.forEach((d,i)=>{
      const a=document.createElement('a');a.className='simbolo-tarjeta';a.href=Comunidad.enlace(d,'simbolos/');
      const cv=document.createElement('canvas');cv.setAttribute('aria-hidden','true');Comunidad.dibujar(cv,d);
      const texto=document.createElement('div'),titulo=document.createElement('strong'),pie=document.createElement('small'),tipo=document.createElement('span');
      titulo.textContent=d.nombre;pie.textContent=d.pueblo;tipo.textContent=d.ejemplo?'EJEMPLO · VER SÍMBOLO':'TU CREACIÓN · COMPARTIR';
      texto.append(titulo,pie,tipo);a.append(cv,texto);tablero.append(a);
    });
  }
  render();addEventListener('storage',e=>{if(e.key===Comunidad.KEY)render();});addEventListener('pageshow',render);
})();
