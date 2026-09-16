# HOME y Símbolos de la comunidad · 16/09/2026

## Referencia y alcance
Figma GD2CfjtdvtZAZVxsYDf7ba → tp2 1331:879 → HOME 2044:623. Se implementan hero, CTA/tablero y estética del micrositio. Las secciones de eventos y descargas del resto del frame no se agregan porque no están conectadas ni fueron pedidas en este alcance. El mapa vivo y su navegación se conservan.

Colores confirmados: header #202020, naranja #F66227, violeta #9E6FF8, fondo #1a1a1a. Space Grotesk. SVG pixel pantall.svg aportado por Lucas y dos iconos exportados del frame de Figma. No modificar el archivo de Figma.

## Recorrido
Home → Participar → Símbolos de la comunidad → Empezar → Generar/pintar → Compartir → Sumar al tablero o copiar enlace. Header y regreso al home disponibles siempre. Por pedido explícito de Lucas, el ranking reproduce los cinco puestos, autor y likes de la maqueta de Figma; no son votos ni participantes verificados en un servicio público.

## Funcionamiento real
- `js/comunidad.js`: datos validados, grilla y nombre; persistencia local (máximo 40) y enlace portable con datos en el fragmento. No se suben imágenes ni datos a un servidor.
- `js/home-comunidad.js`: ranking fijo 1°–5°, likes 421/383/356/216/124 y @miaumiaumichi, con símbolos e íconos originales exportados de Figma. Las publicaciones locales están separadas debajo y actualizan con storage/pageshow, sin reemplazar el ranking.
- `css/ranking-home.css`: título 64 px, rótulo/puestos/likes 24 px, bajadas 14 px y usuario 12 px; Space Grotesk y Archivo locales. Ajuste responsive a 40 px para el título en móvil. Referencia: HOME 2044:623 → 2189:588.
- Navegación común: TERRITORIO, ARCHIVO, EVENTOS y JUEGO. Los últimos dos son etiquetas deshabilitadas hasta implementar sus secciones. El generador se abre desde Participar o el footer, no desde el header.
- `simbolos/js/app.js`: reemplaza el flujo principal de descarga por diálogo nativo para compartir. La vista previa refleja las celdas pintadas, no solo la semilla.
- En file:// funciona el editor; compartir enlace necesita HTTP(S). En 127.0.0.1 se advierte que el enlace solo funciona en esa computadora. En web publicada el enlace usa la ubicación publicada del sitio.
- El tablero es de este navegador y origen; no se sincroniza entre dispositivos ni entre localhost y GitHub Pages. Si falla localStorage, se informa y sigue disponible el enlace.
- Conservar patrones, seis colores documentados, herramienta de pintura, simetría y motor original.

## Pendiente para una comunidad pública
Backend de publicaciones y votos, identidad de autores, consentimiento, moderación, reglas del concurso y recompensas. La copia promocional y las cifras del ranking son la maqueta solicitada, no prueban estas funciones. El título “Ranking semanal” permanece fijo; “Tus símbolos, acá” corresponde solo al tablero local separado.

## Verificación
Pruebas aisladas en Chrome: 1440×900 y 390×844, CTA, editor, publicar local, persistencia, abrir enlace en un contexto sin datos previos, ancho móvil, entrar/salir del mapa y errores JavaScript. Generador comprobado visualmente en el navegador del usuario. Sin push automático.
