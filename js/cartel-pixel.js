(function () {
  const TAM = 16;
  const PALETA = ['#E5FF38', '#FFB33F', '#F47ADD', '#F66227', '#1D7AA9', '#6B8703', '#D92F1B', '#9C3A01'];
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)');
  const GROSOR = 9;
  const coloresEspecie = new Map();
  const medidor = document.createElement('canvas').getContext('2d');
  if (document.fonts && document.fonts.load) {
    document.fonts.load('400 100px "Space Grotesk"').catch(() => {});
  }

  function azarDe(texto) {
    let h = 2166136261;
    for (const letra of texto) {
      h ^= letra.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return () => {
      h ^= h << 13;
      h ^= h >>> 17;
      h ^= h << 5;
      return (h >>> 0) / 4294967296;
    };
  }

  function colorDe(especie) {
    if (!coloresEspecie.size && window.MUSUQ_BOSQUES) {
      const { especies, porZona } = window.MUSUQ_BOSQUES;
      Object.keys(especies).forEach((id, indice) => {
        const ocupados = new Set();
        for (const lista of Object.values(porZona)) {
          if (lista.includes(id)) {
            lista.forEach((otra) => {
              if (coloresEspecie.has(otra)) {
                ocupados.add(coloresEspecie.get(otra));
              }
            });
          }
        }
        const opciones = PALETA.map((_, k) => PALETA[(indice + k) % PALETA.length]);
        coloresEspecie.set(id, opciones.find((c) => !ocupados.has(c)) || opciones[0]);
      });
    }
    return coloresEspecie.get(especie) || PALETA[0];
  }

  function tinta(color) {
    const canal = (k) => {
      const v = parseInt(color.slice(1 + k * 2, 3 + k * 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    const luz = 0.2126 * canal(0) + 0.7152 * canal(1) + 0.0722 * canal(2);
    return (luz + 0.05) / 0.056 >= 1.05 / (luz + 0.05) ? '#121212' : '#ffffff';
  }


  function forma(especie) {
    const filas = [
      '...#.......#', '...#.#####..', '..#########.', '..#########.',
      '##########..', '.##########.', '.###########', '.###########',
      '.#.########.', '...########.', '....###.###.', '....#.......'
    ];
    const celdas = [];
    filas.forEach((fila,y)=>[...fila].forEach((c,x)=>{if(c==='#')celdas.push([x,y]);}));
    if(especie!=='calden'){
      const azar=azarDe(especie);
      if(azar()>.5)celdas.push([5,11]);
      if(azar()>.5)celdas.push([10,1]);
    }
    return celdas;
  }

  function lineasNombre(nombre) {
    const texto=nombre.toUpperCase();
    medidor.font='400 100px "Space Grotesk", system-ui, sans-serif';
    const ancho=t=>medidor.measureText(t).width||t.length*62;
    const palabras=texto.split(/\s+/);
    let mejor={lineas:[texto],tam:Math.min(28,13000/ancho(texto))};
    if(palabras.length>1&&mejor.tam<19){
      for(let k=1;k<palabras.length;k++){
        const lineas=[palabras.slice(0,k).join(' '),palabras.slice(k).join(' ')];
        const tam=Math.min(23,13000/Math.max(...lineas.map(ancho)));
        if(tam>mejor.tam)mejor={lineas,tam};
      }
    }
    return mejor;
  }

  function svg(clase){
    const el=document.createElementNS('http://www.w3.org/2000/svg','svg');
    el.setAttribute('class',clase);el.setAttribute('aria-hidden','true');
    return el;
  }

  function cara(celdas,clase){
    const el=svg('cartel-pixel__cara '+clase);el.setAttribute('viewBox','0 0 192 192');
    const path=document.createElementNS(el.namespaceURI,'path');
    path.setAttribute('d',celdas.map(([x,y])=>'M'+x*TAM+' '+y*TAM+'h16v16h-16Z').join(''));
    el.append(path);return el;
  }

  function volumen(celdas){
    const cuerpo=document.createElement('span');cuerpo.className='cartel-pixel__cuerpo';
    cuerpo.setAttribute('aria-hidden','true');
    const ocupadas=new Set(celdas.map(([x,y])=>x+':'+y));
    cuerpo.append(cara(celdas,'cartel-pixel__dorso'),cara(celdas,'cartel-pixel__frente'));
    for(const [x,y] of celdas){
      for(const [dx,dy,lado] of [[0,-1,'arriba'],[0,1,'abajo'],[-1,0,'izquierda'],[1,0,'derecha']]){
        if(ocupadas.has((x+dx)+':'+(y+dy)))continue;
        const borde=document.createElement('i');borde.className='cartel-pixel__canto cartel-pixel__canto--'+lado;
        borde.style.left=(x*TAM+(dx===1?TAM:0))+'px';
        borde.style.top=(y*TAM+(dy===1?TAM:0))+'px';
        cuerpo.append(borde);
      }
    }
    return cuerpo;
  }

  function textoEnRelieve(clase,nodos,profundidad){
    const relieve=document.createElement('span');relieve.className=clase+' cartel-pixel__relieve';
    for(let k=0;k<=6;k++){
      const capa=document.createElement('span');
      capa.className='cartel-pixel__glifo'+(k===6?' cartel-pixel__glifo--frente':'');
      capa.style.transform='translateZ('+(GROSOR+0.2+k*profundidad/6)+'px)';
      const interior=document.createElement('span');
      for(const nodo of nodos)interior.append(typeof nodo==='string'?document.createTextNode(nodo):nodo.cloneNode(true));
      capa.append(interior);
      relieve.append(capa);
    }
    return relieve;
  }

  function crear({especie,nombre,alCambiarSobre,alTocar}){
    const azar=azarDe(especie),celdas=forma(especie);
    const color=especie==='calden'?'#E5FF38':colorDe(especie);
    const boton=document.createElement('button');
    boton.type='button';boton.className='cartel-pixel';
    boton.setAttribute('aria-label','Ver '+nombre+', árbol nativo');
    boton.style.setProperty('--c',color);boton.style.setProperty('--t',tinta(color));
    boton.style.setProperty('--fase',(-azar()*8).toFixed(2)+'s');
    const giro=document.createElement('span');giro.className='cartel-pixel__giro';
    giro.setAttribute('aria-hidden','true');
    const diseno=document.createElement('span');diseno.className='cartel-pixel__diseno';diseno.dataset.visible='false';
    const fondo=volumen(celdas);
    const contenido=document.createElement('span');contenido.className='cartel-pixel__contenido';
    function componer(){
      const {lineas,tam}=lineasNombre(nombre),renglones=[];
      lineas.forEach((linea,k)=>{if(k)renglones.push(document.createElement('br'));renglones.push(linea);});
      const titulo=textoEnRelieve('cartel-pixel__nombre',renglones,2.8);
      titulo.style.fontSize=tam.toFixed(2)+'px';
      const tipo=textoEnRelieve('cartel-pixel__tipo',['ÁRBOL',document.createElement('br'),'NATIVO'],2.2);
      const flecha=svg('cartel-pixel__icono');
      flecha.setAttribute('viewBox','0 0 960 960');
      const uso=document.createElementNS(flecha.namespaceURI,'use');
      uso.setAttribute('href','#i-flecha-derecha');flecha.append(uso);
      contenido.replaceChildren(titulo,tipo,textoEnRelieve('cartel-pixel__flecha',[flecha],4));
    }
    componer();
    let destruido=false;
    document.fonts?.load('400 100px "Space Grotesk"').then(()=>{if(!destruido)componer();}).catch(()=>{});
    diseno.append(fondo,contenido);
    const rejilla=document.createElement('span');rejilla.className='cartel-pixel__rejilla';
    giro.append(diseno,rejilla);boton.append(giro);
    const orden=celdas.map(()=>azar());
    let armado=false,animaciones=[],temporizador=0;
    const sinMovimiento=()=>reducido.matches||!!window.MUSUQ_A11Y?.estado.detener;
    function limpiar(){
      animaciones.forEach(a=>a.cancel());animaciones=[];rejilla.replaceChildren();clearTimeout(temporizador);
    }
    function transicion(hacia){
      limpiar();
      if(sinMovimiento()||typeof Element.prototype.animate!=='function'){
        diseno.dataset.visible=String(hacia);return;
      }
      const total=hacia?740:420,duracion=hacia?390:270,espera=total-duracion;
      diseno.dataset.visible='false';
      celdas.forEach(([x,y],i)=>{
        const pixel=document.createElement('span');pixel.className='cartel-pixel__pixel';
        pixel.style.left=x*TAM+'px';pixel.style.top=y*TAM+'px';rejilla.append(pixel);
        const lejos={transform:'translateZ(-22px) translateY(8px) scale(.12)',opacity:0};
        const cerca={transform:'translateZ(9px) translateY(0) scale(1)',opacity:1};
        animaciones.push(pixel.animate(hacia?[lejos,cerca]:[cerca,lejos],
          {duration:duracion,delay:orden[i]*espera,easing:'cubic-bezier(.22,.8,.3,1)',fill:'both'}));
      });
      temporizador=setTimeout(()=>{limpiar();diseno.dataset.visible=String(hacia);},total);
    }
    function ajustarMovimiento(){
      boton.classList.toggle('sin-movimiento',sinMovimiento());
      if(sinMovimiento()){limpiar();diseno.dataset.visible=String(armado);}
    }
    reducido.addEventListener('change',ajustarMovimiento);
    window.addEventListener('musuq:accesibilidad',ajustarMovimiento);ajustarMovimiento();
    giro.addEventListener('pointerenter',()=>alCambiarSobre?.(true));
    giro.addEventListener('pointerleave',()=>alCambiarSobre?.(false));
    boton.addEventListener('focus',()=>alCambiarSobre?.(true));
    boton.addEventListener('blur',()=>alCambiarSobre?.(false));
    boton.addEventListener('click',()=>alTocar?.());
    return {
      elemento:boton,
      armar(valor){if(valor===armado)return;armado=valor;boton.classList.toggle('armado',valor);transicion(valor);},
      destruir(){destruido=true;limpiar();reducido.removeEventListener('change',ajustarMovimiento);window.removeEventListener('musuq:accesibilidad',ajustarMovimiento);boton.remove();}
    };
  }
  window.MUSUQ_CARTEL_PIXEL={crear};
})();
