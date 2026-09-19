# HOME y Símbolos de la comunidad · 19/09/2026

## Referencia y alcance
Figma GD2CfjtdvtZAZVxsYDf7ba → tp2 1331:879 → HOME 2044:623. Se implementan hero, CTA/tablero y estética del micrositio. El mapa vivo y su navegación se conservan.

Colores confirmados: header #202020, naranja #F66227, violeta #9E6FF8, lima #E4FE44, fondo #1a1a1a. Space Grotesk. SVG pixel pantall.svg aportado por Lucas y dos iconos exportados del frame de Figma. No modificar el archivo de Figma.

## Recorrido
Home → Participar → Símbolos de la comunidad → Empezar → Componer con piezas → Compartir → Sumar al tablero o copiar enlace. Header y regreso al home disponibles siempre.

Orden de la home:
1. Territorio.
2. Archivo: «Explorá el Archivo interactivo & colaborativo», con bajada.
3. Encuentro: CTA del evento en La Rural (`css/home-encuentro.css`, `js/home-encuentro.js`), según el frame «04 · EL ENCUENTRO» de Figma (`2314:1076`).
   - Galería de 4 fotos con flechas, puntos y deslizamiento táctil.
   - «Quiero ir» lleva a `eventos.html#inscripcion`, que abre la inscripción; «Ver Actividades» lleva a `eventos.html#actividades`.
4. Comunidad.

La comunidad tiene dos partes:
1. **Mejores símbolos** (rótulo “Ranking semanal”): los cinco puestos de la semana que terminó.
2. **Próximos símbolos**: los que entran al ranking de la próxima semana. Se muestran sólo los patrones, sin textos en la tarjeta. Al tocar uno se abre el visor con el título, el usuario y la región de los patrones usados.

Por pedido explícito de Lucas, el ranking y los próximos símbolos son una maqueta: no hay votos ni participantes verificados en un servicio público.

## Funcionamiento real
- `js/comunidad.js`: datos validados, grilla y nombre; persistencia local (máximo 40) y enlace portable con datos en el fragmento. No se suben imágenes ni datos a un servidor.
- `js/home-comunidad.js`:
  - Ranking fijo 1°–5°: @pampa.viva, @rio.abierto, @trama.norte, @sur.creativo y @raiz.andina, con 421/383/356/216/124 likes. Los símbolos del ranking están en `assets/ranking/` y se animan con `js/patron-vivo.js`.
  - Los likes piden sesión iniciada y se guardan en este navegador (`musuq-ranking-likes-v1`).
  - Próximos símbolos: primero los que guardó quien navega (`Comunidad.leer()`, firmados como @tomi.rivas) y después los de otros usuarios (`ProximosSimbolos`). Se actualiza con storage y pageshow.
- `js/proximos-simbolos.js`: doce símbolos de usuarios ficticios (tres pueblos, cuatro de cada uno). Se arman al cargar con las piezas documentadas del taller (`simbolos/js/patrones.js` y `simbolos/js/composicion.js`, que ahora también carga la home): una pieza al centro y anillos de cuatro copias rotadas, así cada símbolo es simétrico y sólo usa celdas de piezas del catálogo. Cada receta define pueblo, título, usuario, fondo, pieza central, anillos y, si hace falta, una paleta propia (como la que puede elegir un usuario en el taller).
  - Para sumar uno, agregar una línea a `recetas`. Cada anillo es `[pieza, x, y, giro]`: la posición es la de la copia de arriba (o de la esquina superior izquierda) y `giro` es la rotación inicial.
  - Evitar en los anillos piezas asimétricas (`qu-doble`, `qo-trama`) y, en las esquinas, barras como `om-banda` o `qo-linea`. Rotadas cuatro veces forman un molinete que puede leerse como una esvástica.
  - Controlar el contraste de las piezas contra el fondo (por ejemplo, lima o crema sobre fondo claro no se ven).
- `js/visor-simbolo.js` y `css/visor-simbolo.css`: visor 3D de sólo lectura con Volver y Descargar. Si recibe `autor`, muestra debajo el título, el usuario y “Patrones de {pueblo} · {región}”. El ranking no lo pasa, así que su visor queda sin ese bloque.
- `css/ranking-home.css`:
  - Título 64 px (40 px en móvil); rótulo, puestos y likes 24 px; bajadas 14 px y usuario 12 px. Referencia: HOME 2044:623 → 2189:588.
  - La grilla de próximos va a 6 columnas en escritorio, 4 hasta 1000 px y 3 hasta 600 px.
- Navegación común (`css/header.css`, `js/header.js`): TERRITORIO, ARCHIVO, EVENTOS y JUEGO, a 14 px. EVENTOS lleva a `eventos.html`. El generador se abre desde Participar o el footer, no desde el header.
  - En la home ninguna sección queda marcada. TERRITORIO se pone naranja sólo al entrar al mapa (`body.en-mapa`, evento `musuq:modo`) y vuelve a violeta al salir.
  - En archivo.html, eventos.html y juego.html se marca su sección.
- En file:// funciona el editor; compartir enlace necesita HTTP(S). En 127.0.0.1 se advierte que el enlace sólo funciona en esa computadora.
- El tablero es de este navegador y origen; no se sincroniza entre dispositivos ni entre localhost y GitHub Pages.

## Pendiente para una comunidad pública
Backend de publicaciones y votos, identidad de autores, consentimiento, moderación, reglas del concurso, cierre semanal (pasar los próximos al ranking) y recompensas. Las cifras, usuarios y símbolos de ejemplo son la maqueta solicitada y no prueban estas funciones.

## Verificación (19/09/2026)
Probado en Chrome a 1280×800 y 375×812:
- 12 próximos símbolos válidos para `Comunidad.validar`, sin desborde horizontal;
- el visor muestra título, usuario y región, sin superponerse con los botones;
- un símbolo guardado localmente aparece primero como @tomi.rivas;
- al cerrar, el foco vuelve a la tarjeta;
- el visor del ranking sigue sin detalle;
- sin errores de consola;
- `simbolos/tests/composicion.test.cjs` en OK.
