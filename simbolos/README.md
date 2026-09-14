# MUSUQ PACHA · Generador de símbolos

Repo del **sitio web** de Musuq Pacha, el juego del TIF de Diseño Multimedia y de
Interacción (UADE, 2026). El resto del proyecto —el tablero 3D, los documentos de
investigación y el informe— vive aparte, en el repo `pwm` del TIF.

Minijuego web donde se arma el **símbolo de un pueblo originario** sobre una grilla:
se genera al azar o se pinta píxel por píxel, y se baja como PNG.

Abrir `index.html`. **No hay build, no hay npm, no hay pedidos externos:** ni Google
Fonts, ni CDN, ni three.js. Todo lo que necesita está en esta carpeta, que es lo que
pide la entrega offline del TP2.

## Qué hay adentro

| Archivo | Qué resuelve |
|---|---|
| `js/pueblos.js` | Los 8 pueblos, su bioma y su paleta. Los colores salen del territorio y de materiales documentados (tierras, minerales, tintes, lanas), no de gusto |
| `js/mapa.js` | Argentina rasterizada a 22 × 50 píxeles, con la zona de cada pueblo marcada. Sale de Natural Earth 110m con la misma proyección Albers del tablero |
| `js/motor.js` | **El motor compartido**: familias de patrones, semilla y morph. Una instancia por figura |
| `js/simbolo.js` | La figura del juego: fachada sobre una instancia del motor, más la geometría del lienzo, la selección y las volantas |
| `js/mosaico.js` | La portada: una baldosa por instancia del motor, cambiando por tandas |
| `js/fondo.js` | El **PixelBlast** de reactbits porteado a WebGL crudo: un fragment shader, sin three.js ni postprocessing |
| `js/app.js` | La interfaz y la descarga |

## Las decisiones que importan

**El morph, que es lo de `species-in-pieces.com`.** Cuando pasás de una generación a
otra, ningún píxel se apaga y se vuelve a prender: cada píxel encendido **conserva su
identidad**. Se emparejan por cercanía (voraz, sobre todos los pares ordenados por
distancia) los píxeles de ahora con las celdas del símbolo nuevo, y cada uno **viaja**
hasta su destino con arco, escalonado por distancia al centro, `easeInOutQuart` de
920 ms, achicándose un 16 % en el medio del vuelo e interpolando su color en el camino.
Los que sobran se van hacia afuera achicándose a cero; los que faltan nacen del centro.
El que ya estaba en su lugar casi no se mueve, que es lo que hace que se lea como una
figura que se reacomoda y no como una que se borra.

**La portada es el mismo motor, muchas veces.** El mosaico que rodea al título es
una grilla de baldosas y **cada baldosa es una instancia de `Motor`** con su propio
pueblo, su fondo y su figura de 7 × 7. Cada 950 ms se regenera una quinta parte de las
baldosas, con un desfasaje adentro de la tanda: siempre hay algo cambiando pero nunca
cambia todo de golpe. Como es el mismo motor, **el morph de la portada es exactamente el
del juego** y no pueden quedar desincronizados. El mosaico deja un marco alrededor por
donde se ve el PixelBlast, y se detiene al entrar para no comer cuadros.
**Al tocar "empezar" las baldosas se caen.** El juego se dibuja primero, abajo, con la
portada todavía encima; recién ahí cada baldosa pega un salto corto y se desploma
girando, con su propio retraso, hasta salir de pantalla. El cartel del centro no se cae:
se va en opacidad. Cuando la última baldosa sale, la portada se saca del medio. El
`caer()` devuelve una promesa, y tiene un tope de 4 s para que se cumpla sí o sí.

**Al pasar el mouse** la baldosa crece y queda arriba de las vecinas, y **las vecinas
crecen un poco también**, con una caída cuadrática por distancia: el conjunto se levanta
como una ola. Mientras la tengas debajo del cursor **no se regenera**. El calor baja
despacio, así que un barrido deja varias grandes atrás. **Un click la regenera.**

**Los colores de la generación se eligen contra el fondo, no a ciegas.**
`Motor.paletaContra()` filtra los colores del pueblo por contraste de luminancia contra
el fondo del lienzo —eso es lo que deja afuera a la arcilla rosada y a la tiza sobre un
crema, que era donde el símbolo se perdía—, y cuando la paleta documentada no alcanza la
**estira con variantes profundas y claras de esos mismos colores**, que siguen siendo el
color del territorio con otra saturación. Después elige de a uno con castigo por
parecido, así los elegidos se separan en tono: Omaguaca sale ocre + verde de cardón,
Mapuche sale rojo kelü + azul de witral + amarillo de michay. Medido sobre 40
generaciones en crema: contraste mínimo 0,25 y promedio 0,50, sin un solo color flojo.
Sobre un fondo oscuro la selección se invierte sola a las variantes claras.

Hay además un **acento**, un naranja chillón que no es color documentado de ningún
pueblo sino una decisión de diseño: entra en el sorteo del minijuego en poco menos de un
tercio de las tiradas —la decisión sale de la semilla— y sale seguido como fondo en el
mosaico de la portada. Si el símbolo va al informe, esto hay que aclararlo.

**Todo lo que responde al mouse sigue a la tinta**, no a un negro fijo: `--toque`,
`--toque-fuerte`, `--linea` y hasta el rojo del botón de vaciar se recalculan con el
fondo, así que sobre un fondo oscuro los bordes y los hover no desaparecen.

Los seis colores documentados siguen estando enteros en la paleta de pintar: si querés
usar la tiza sobre crema, podés. Y el cuentagotas (`I`) levanta cualquier variante que
haya salido en el dibujo.

**El espejo se fuerza en un solo lugar.** `generarGrilla` pasa toda figura por
`espejar()` antes de devolverla, así ninguna familia puede sacar algo torcido por más
que se agregue una nueva después. Medido: 60 generaciones seguidas, 0 asimétricas.

**La variedad está adentro de las familias, no en el sorteo.** `flor` tiene **diez
especies** (margarita, girasol, estrella, trébol, anillos, capullo, doble, espiga, más
**calada** y **rosa**, que son las dos de chart de tejido: cuerpo macizo calado en
retícula diagonal y rosa de ocho puntas) y `mandala` **ocho trazas** (octante, chakana,
rombos anidados, radios, damero radial, cuadrados anidados, estrella de ocho y aspa).
Medido sobre 150 generaciones: mandala 33 %, flor 31 %, trama 13 %. `demonio` es
una careta de oni —cara ancha, barbilla en punta, cuernos de tres estilos, ojos rasgados
y boca con colmillos— y sale poco a propósito.

**Ocho familias de patrones, una semilla.** `organico` crece por vecindad sobre media
grilla y espeja; `flor` recorta pétalos con `cos(ángulo · n)`; `mandala` sortea un
octante y lo replica ocho veces; `trama` repite rombos y cruces (es la que mejor lee en
las baldosas chicas); `abstracto` arma emblemas de barras y columnas; `calavera`
y `animal` son plantillas con variación. El menú tiene **pesos**: flores y mandalas se
llevan la mayoría. Hay además un **piso de llenado**: si una variante cae en una figura
de tres celdas se reintenta **dentro de la misma familia** hasta cuatro veces, y recién
si no sale se cae a una flor. Cambiar de familia al primer fallo desbalanceaba el
sorteo: los mandalas flacos se volvían flores y el porcentaje real no daba. Todo sale de un `mulberry32` sembrado, así que **la semilla que se muestra
abajo del nombre del pueblo reproduce el símbolo exacto** — `Simbolo.generar(t, 0x2735CC9B)`
devuelve el mismo dibujo. Es la firma única de cada generación.

**El fondo es dithering ordenado, no ruido.** El campo de ruido pasa por un `smoothstep`
que aplasta a cero todo lo que está por debajo del piso, y después se compara contra una
matriz de Bayer 4×4. Eso da lo del referente: claros de verdad vacíos, núcleos macizos y
un fleco deshilachado en el borde. Sin el `smoothstep` el ruido tramaba la pantalla
entera de forma pareja, que no es el efecto.

**Todo se compone en un solo lugar.** `Simbolo.componer()` dibuja la grilla de puntos,
los píxeles con su sombra y las volantas de los costados, y la usan por igual la pantalla
y el PNG. Lo que ves es exactamente lo que baja.

## La descarga

El botón de descargar abre un overlay con dos formatos: **historia 9:16** (1080 × 1920) y
**cuadrado 1:1** (1080 × 1080). La imagen lleva al pie **MUSUQ PACHA** y el link del
sitio. Dos cosas que hay que respetar si se toca:

- El fondo se recorta del canvas WebGL **con la misma proporción que la imagen pedida**,
  centrado en el lienzo. Si se estirara la ventana entera, el 9:16 bajado desde una
  pantalla apaisada saldría deformado.
- El símbolo **se compone directo en la medida pedida**, no se escala la composición de
  pantalla. Por eso el modo de volanta lo decide la proporción del lienzo que se está
  dibujando (vertical o cuadrado → al pie; apaisado → a los costados) y los dos formatos
  salen bien sin un caso especial por cada uno.

En vez del número de generación, la volanta muestra una **rareza en %**: es inventada,
pero sale de la semilla —así que un símbolo siempre vale lo mismo— y la curva está
sesgada hacia abajo para que un número alto se sienta un hallazgo.

## Mobile

La vista angosta (≤ 760 px) **no es la de escritorio apretada**, es otra disposición:
arriba el pueblo elegido con una flecha que abre el menú, debajo las herramientas y los
colores como iconos, el lienzo en el medio con todo el ancho, y las acciones abajo sin
texto. Los pueblos, el mapa y los ajustes del lienzo pasan a ese menú, que tapa la
pantalla. **El símbolo también cambia**: se lleva el 66 % del ancho en vez del 38 %, y
las volantas de los costados —que ahí lo aplastaban— se van al pie en dos líneas. Como
la decisión se toma según el ancho del lienzo que se está dibujando, el PNG exportado
(2000 px) conserva las volantas laterales aunque lo bajes desde el teléfono.

## Música

`audio/shasta.mp3` suena de fondo en loop al **40 %**. Ningún navegador deja arrancar
audio solo, así que se engancha al primer gesto: tocar una baldosa del mosaico ya
alcanza, y si no, el botón de empezar. Si el navegador igual la frena, se vuelve a
intentar en el gesto siguiente en vez de quedar muda. Se silencia con el botón de la
derecha del header. El ícono de accesibilidad que está al lado **es un lugar reservado**:
se ve y responde al mouse, pero todavía no hace nada, así que no entra en el orden de
tabulación.

> El tema lo aportó Lucas. El sitio es público, así que conviene confirmar que se puede
> redistribuir antes de la entrega.

## Controles

- **Pueblo:** cambia la paleta, el fondo sugerido, la zona marcada en el mapa y genera
- **`Q`** pincel · **`W`** borrador · **`E`** selección · **`I`** copiar color · **`G`** generar · `Esc` limpia la selección
- Debajo del símbolo, centrados: **generar**, **descargar** y **vaciar** (en rojo, que es el único destructivo)
- **La ruedita del mouse** pasa al color siguiente de la paleta del pueblo
- Sobre el lienzo el puntero del sistema se apaga y se dibuja **el ícono de la herramienta**, que crece al apretar. Es un elemento y no un `cursor` de CSS porque un cursor no se puede animar. Solo con mouse: con dedo no hay puntero que seguir
- Con **selección** marcás las celdas que querés y después tocás un color para cambiarlas todas juntas
- **Fondo:** cualquier color. La tinta se invierte sola si el fondo es oscuro, y los puntos
  del PixelBlast se mezclan hacia el blanco o el negro (nunca con un delta: sobre un rojo
  pleno sumar unidades no cambia nada y desaparecían)
- **Grilla** 7 / 9 / 11 / 13, por defecto 11 · **espejo al pintar**

## Pendiente

- **`file://` no está verificado.** Anda servido por HTTP (probado). Como no hay módulos
  ES ni imágenes externas, en Chrome debería abrir con doble clic, pero conviene
  confirmarlo antes de mandarlo a la cátedra
- Los símbolos son **generativos, no reproducciones** de iconografía real de cada pueblo.
  Si van al informe, hay que decirlo así
- Las zonas del mapa son **aproximaciones por latitud y longitud**, no territorios
  citables. Mismo problema que los biomas del tablero, anotado en la spec del tablero
- El codificador GIF se sacó a pedido de Lucas. Está en el historial del repo `pwm`, donde nació este sitio, si vuelve a hacer falta
