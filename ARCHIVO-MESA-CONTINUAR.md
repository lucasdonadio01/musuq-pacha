# Archivo · Mesa Three.js

Actualizado 16/09/2026. Ruta local: `http://127.0.0.1:8768/archivo.html?pueblo=14&v=mesa-contextos-1`.

### Descripciones de categoría

`js/archivo-contextos.js` se carga después de `archivo-objetos.js`. Reemplaza las introducciones editoriales por textos breves sustantivos y añade `fuentesContexto` (nombre y URL), que se muestran justo debajo de la descripción. Fuentes: publicación de la comunidad Telomian Condic/UNC (2025), tesauro FFyL–UBA y Camino et al. (2018) en CONICET Digital. Los enlaces de PDF comunitario usan página física del visor; el rótulo muestra la página impresa. Separar estas fuentes generales de las fuentes de cada imagen. No extrapolar la investigación de La Noria a todos los pueblos o períodos; no extrapolar las descripciones querandíes a otros pueblos. El fallback HTML también muestra textos y fuentes.

## Estado implementado

- Una escena Three.js r128 local y cámara continua: mesa → montón abierto → imagen levantada.
- Papeles con espesor, curvatura, grano y brillo suave, sombras y desenfoque por profundidad. Selección levantada con flotación y rotación lenta automáticas; botón Google Material 360 y arrastre para inclinar.
- Cuadrados instanciados de 18 unidades, onda radial de elevación sin partículas. La onda propaga el color de la categoría; la mesa parte del color Querandí del mapa (`#e9bd76`). Oscurecimiento de 22% al seleccionar, más desenfoque/dim en inspección.
- Rueda hacia adelante acerca. Hacia atrás aleja y, al superar el límite de inspección, vuelve a categoría; otro gesto vuelve a la mesa y reagrupa los papeles. Bloqueo breve evita que la inercia salte dos niveles. Paneo ±145 y alejamiento limitado a la vista inicial.
- Todas las imágenes expuestas reciben raycasting, también detrás de la seleccionada. Se puede cambiar de categoría desde cualquier estado. Categorías siempre visibles: sobre la mesa en inicio, seleccionada arriba centrada y las demás abajo. Rótulos HTML proyectados para impedir que los tapen las hojas.
- Sin botones Categorías, Centrar mesa, Restablecer ni instrucción de arrastre. Botones negros con píxeles que cambian de posición al pulsar. Todos los iconos son SVG Material Icons de Google, servidos localmente.
- Historial por hash, Esc, navegación por teclado, sonido compartido con el mapa, ficha a derecha en escritorio e inferior en móvil. Movimiento reducido desactiva ondas, inclinación, oscilación, giro y transiciones. Fallback HTML si falta Three.js/WebGL.

## Archivos activos

- `archivo.html`, `css/archivo-mesa.css`, `js/archivo-mesa.js`.
- `js/archivo-coleccion.js`: Sociedad QUw001–006.
- `js/archivo-objetos.js`: nueve imágenes nuevas; cargar después de la colección.
- `assets/archivo/documentos/`: seis imágenes históricas de Sociedad.
- `assets/archivo/objetos/`: fotografías e ilustraciones publicadas; sólo las rutas del suplemento se muestran.

Los scripts viejos, facsímiles de texto y las imágenes AI se conservan, pero no están cargados. No se borraron los originales. Se mantiene el micrositio `simbolos/`.

## Criterio editorial y fuentes

16 imágenes activas en 8 categorías. El usuario acepta ilustraciones históricas publicadas cuando no existen fotografías. No usar generación para representar evidencia histórica. La revisión cultural vigente está en `ARCHIVO-RELACION-CULTURAL.md`.

- Sociedad: seis representaciones históricas. Carendies1599 se vincula explícitamente a Querandí; las otras cinco son contexto regional «pampas», sin atribución querandí demostrada.
- Viviendas: Carendies1599 por las construcciones visibles. Se reutiliza esta fuente con un recorte distinto y se advierte la mirada colonial, no una reconstrucción arqueológica exacta.
- Creencias: tala sagrado como primera lámina y luna relacionada con la Troha; vínculos atribuidos a publicaciones comunitarias de 2023 y 2025, enlazadas por separado.
- Muerte: suelo de La Noria, como memoria territorial. NO identifica tumbas, ritos funerarios ni restos humanos. Sigue faltando documentación específicamente funeraria.
- Personajes: retrato histórico de Schmidl, identificado como cronista europeo, nunca como persona querandí. Sigue faltando documentación visual específica de referentes querandíes.
- Naturaleza: arco y utensilios de madera extraídos de la publicación comunitaria, con explicación de la carpintería. Fauna: venado vinculado con la alimentación documentada en La Noria. El tero ya no se muestra; no se documentó un vínculo cultural específico en esta revisión.
- Patrones: fragmento arqueológico de La Noria y fotografía de cerámicas en una publicación comunitaria contemporánea; esta última no se atribuye a un hallazgo prehispánico.

Cada ficha muestra fuente, crédito, licencia y límites de atribución. `fuenteRelacion` aparece como enlace de contexto comunitario. Las cerámicas de la publicación UNC son CC BY-NC-SA4.0: revisar compatibilidad antes de cualquier eventual uso comercial. No usar QUx014 (Perú/Bolivia), QUx020 (Catamarca) ni QUx021 (Fuerte Quemado) como evidencia querandí.

## Precauciones y continuidad

1. Ampliar selección específica con objetos, ilustraciones publicadas y registros contextualizados; no multiplicar recortes para aparentar nuevas piezas. Faltan más imágenes en varias categorías.
2. El render target usa `UnsignedIntType`, near20/far6000. No volver a profundidad16bit/near1: provoca cruces entre capas delgadas.
3. Las baldosas se tocan; las juntas son shader antialias. No reintroducir huecos geométricos finos que producen rayas por aliasing. Papeles acompañan la onda para evitar intersecciones.
4. Antes de extender a otros pueblos, definir paleta y curaduría propias. Actualmente sólo Querandí tiene contenido; los demás no heredan estos documentos.
5. Probar GPU de menor potencia antes de subir resolución o documentos. No hacer upscale generativo que invente detalle arqueológico.

## Verificación de esta iteración

Sintaxis JS;15 rutas locales, créditos y fuentes; fallback sin Three con8 categorías. Probado escritorio1440×1000 y móvil390×844: selección de imagen trasera,360, rueda de acercamiento y retroceso por niveles, cambio de categoría desde detalle, título siempre visible y foco de teclado al abrir ficha. Sin errores/warnings en consola. Comprobar mapa y símbolos antes de publicar. Sin commit ni push en esta iteración.
# Entrada desde el mapa (viaje-1)

Solo el enlace `#ver-archivo` de la ficha del mapa inicia el viaje: cámara real con acercamiento 5×, velo del color del territorio y navegación a `archivo.html?pueblo=ID`. El menú «EL ARCHIVO» y el enlace de la portada abren directamente la mesa.

`js/archivo-transicion.js` y `css/archivo-transicion.css` se cargan en el head de ambas páginas. Un token de sessionStorage de un solo uso (20 segundos, validado por pueblo) y `desde=mapa` habilitan la llegada; el parámetro se elimina al consumirlo. Recargar, entrar directo o abrir en nueva pestaña no reproduce la secuencia. Movimiento reducido omite el viaje. Escape cancela la salida; pageshow restaura la cámara al volver con Atrás.

En `js/mapa.js`, `viajeArchivo` interpola posición y zoom de la cámara activa. En `js/archivo-mesa.js`, la llegada dura 1,9 s: la cámara se abre sobre el suelo, los papeles se despliegan por montón y los rótulos aparecen escalonados. La interacción de la mesa queda bloqueada solo durante la llegada; fallback y límite de carga liberan el velo si falla WebGL.
