/* Terraza escenográfica: cuatro celdas contiguas al este, sin desplazar
   ningún otro pueblo. El polígono geográfico y su superficie no se modifican. */
(() => {
  const C=window.DATOS_MAPA?.cuadrados;if(!C)return;
  const celdas=[[-7.1875,.3125],[-6.5625,.3125],[-6.5625,.9375],[-6.5625,1.5625]];
  for(const [x,z] of celdas){
    const i=C.x.findIndex((cx,j)=>cx===x&&C.y[j]===-z);
    if(i<0||C.fuera[i]||C.zonas[i]!==0)continue;
    C.zonas[i]=1<<2;C.nivel[i]=4;
  }
})();
