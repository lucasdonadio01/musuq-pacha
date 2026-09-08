# AGENTS.md — leeme antes de tocar nada

Sitio del **generador de símbolos de Musuq Pacha**, el juego del TIF de Diseño
Multimedia y de Interacción (UADE, 2026). El interlocutor es **Lucas Donadio**, y se
le habla en **castellano rioplatense**. Los textos de la interfaz también.

Se desarrolló dentro del repo `pwm` y se mudó acá el 08/09/2026; el historial anterior
está en `git log` de ese repo. Los documentos del TIF y el tablero 3D siguen allá.

## Reglas que no se negocian

1. **Sin build, sin npm, sin un solo pedido externo.** La entrega del TP2 se abre con
   doble clic desde un pendrive. La tipografía va empotrada en base64 en `css/fuente.css`.
2. **Todo el texto de la interfaz en rioplatense.**
3. **`js/motor.js` es el motor compartido: no lo forkees.** Las familias de patrones, la
   semilla y el morph viven ahí, con una instancia por figura — el juego usa una y el
   mosaico de la portada una por baldosa. Es a propósito: si el mosaico tuviera su copia
   del morph, al primer ajuste quedarían dos efectos distintos.
4. **Bumpeá el `?v=` de `index.html`** cuando toques un `.js` o el `.css`.

## Lo que costó llegar acá (no lo repitas)

- **La simetría se fuerza en un solo lugar**, en `generarGrilla` con `espejar()`, no en
  cada familia. Lucas rechazó las figuras torcidas que salían cuando cada familia se
  encargaba por su cuenta.
- **La generación no usa la paleta del pueblo tal cual.** Pasa por
  `Motor.paletaContra(colores, fondo, n)`, que filtra por contraste contra el fondo del
  lienzo, estira con variantes profundas y claras si no alcanza, y elige con castigo por
  parecido para que los colores se separen en tono. Sin el filtro, sobre el crema salían
  símbolos en rosa y blanco que no se veían; sin el castigo, salían tres variantes del
  mismo ocre. La paleta de pintar sigue mostrando los seis documentados: eso es identidad
  del pueblo y no se toca.
- **La variedad va adentro de las familias, no en el sorteo.** `flor` reparte en ocho
  especies y `mandala` en cinco trazas, y entre las dos se llevan el 65 % del menú. Si
  hay que sumar variedad, sumala ahí y no como familia nueva.
- **El fondo (PixelBlast) necesita dos cosas** para parecerse al de reactbits: cuadrados
  binarios comparados contra una matriz de **Bayer 4×4**, y un **piso de `smoothstep`**
  sobre el ruido. Sin el piso, el fbm saltea puntos sueltos por toda la pantalla en vez
  de dejar los claros vacíos.
- **El color de los puntos del fondo se mezcla hacia el blanco o el negro**, nunca con un
  delta fijo: sobre un rojo pleno sumar 24 a cada canal se satura y los puntos desaparecen.
- **La entrada al juego es una caída con gravedad**, no un barrido de píxeles. El taller
  se muestra *antes* de soltar las baldosas, así lo que aparece atrás ya está dibujado.
  El port del Pixel Transition de reactbits quedó en el historial (`js/pixelswap.js`), por
  si vuelve a hacer falta: si vuelve, tiene que ser grueso —8 a 12 columnas, cada celda
  aparece entera en 0,4 s—, porque una grilla fina que crece suave se lee como un fundido
  y ya fue rechazada dos veces.
- **La geometría del lienzo se calcula dentro del bucle de dibujo.** Un cuadro dibujado
  con el taller todavía oculto la dejaba en cero y después ningún click encontraba celda.
  El bucle ahora saltea los cuadros con el lienzo en cero.
- **El panel de vista previa headless no dispara `rAF`.** Todo lo animado hay que
  razonarlo o empujarlo con `setTimeout`; ahí no se puede observar.
- **Los heredoc de bash de más de ~7 KB se truncan** y la shell después reporta una
  comilla sin cerrar. Escribí los archivos largos por partes.

- **La vista mobile es otra disposición, no la de escritorio apretada.** Un solo HTML:
  `fondo` vive en la barra de acciones y `grilla` / `espejo` en el rail izquierdo para
  que las dos vistas usen los mismos elementos sin mover nodos por JS. Los iconos son
  símbolos de Material definidos una vez en un `<svg><defs>` y reusados con `<use>`.
- **El modo de volanta lo decide el ancho del lienzo que se dibuja**, no un flag global:
  por debajo de 620 px van al pie, por encima a los costados. Gracias a eso el PNG de
  2000 px sale con volantas laterales aunque se exporte desde el teléfono.

## Al terminar

Commiteá, y si hay algo que Lucas tiene que hacer a mano, dejalo escrito acá abajo.

## Necesita Lucas

- Nada pendiente.
