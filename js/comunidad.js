/* Datos portables del tablero. Sin servicios externos ni votos ficticios. */
window.Comunidad = (() => {
  const KEY = 'musuq-comunidad-v1', HEX = /^#[0-9a-f]{6}$/i;
  function validar(v) {
    if (!v || v.v !== 1 || ![7,9,11,13].includes(v.lado) || !HEX.test(v.fondo) ||
        typeof v.nombre !== 'string' || v.nombre.length > 48 || typeof v.pueblo !== 'string' ||
        v.pueblo.length > 40 || !Array.isArray(v.celdas) || !v.celdas.length || v.celdas.length > v.lado ** 2) return null;
    const usadas = new Set();
    for (const c of v.celdas) {
      if (!Array.isArray(c) || c.length !== 3 || !Number.isInteger(c[0]) || !Number.isInteger(c[1]) ||
          c[0] < 0 || c[1] < 0 || c[0] >= v.lado || c[1] >= v.lado || !HEX.test(c[2])) return null;
      const k = c[0] + ',' + c[1]; if (usadas.has(k)) return null; usadas.add(k);
    }
    return {v:1,nombre:v.nombre.trim() || 'Mi símbolo',pueblo:v.pueblo,lado:v.lado,fondo:v.fondo,celdas:v.celdas.map(c=>c.slice())};
  }
  function codificar(v) { const d = validar(v); if (!d) throw Error('El símbolo no es válido.'); return btoa(unescape(encodeURIComponent(JSON.stringify(d)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
  function decodificar(hash) { try { const s=hash.replace(/^#simbolo=/,''); if(s.length>18000)return null; return validar(JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/')))))); } catch { return null; } }
  function leer() { try { const a=JSON.parse(localStorage.getItem(KEY)||'[]'); return Array.isArray(a)?a.slice(0,40).map(validar).filter(Boolean):[]; } catch { return []; } }
  function guardar(v) {
    const d=validar(v);if(!d)throw Error('Generá o pintá un símbolo antes de compartirlo.');
    const firma=codificar(d), anteriores=leer().filter(x=>codificar(x)!==firma);
    try { localStorage.setItem(KEY,JSON.stringify([d,...anteriores].slice(0,40))); }
    catch { throw Error('Este navegador no permite guardar el tablero. Podés compartir el enlace sin guardarlo.'); }
    return d;
  }
  function dibujar(canvas,v) {
    const d=validar(v);if(!d)return;
    canvas.width=330;canvas.height=330;const c=canvas.getContext('2d');
    c.fillStyle=d.fondo;c.fillRect(0,0,330,330);const paso=286/d.lado;
    d.celdas.forEach(([x,y,h])=>{c.fillStyle=h;c.fillRect(22+x*paso,22+y*paso,Math.ceil(paso),Math.ceil(paso));});
  }
  function enlace(v,base) { const u=new URL(base,location.href);u.search='';u.hash='simbolo='+codificar(v);return u.href; }
  return {KEY,validar,codificar,decodificar,leer,guardar,dibujar,enlace};
})();
