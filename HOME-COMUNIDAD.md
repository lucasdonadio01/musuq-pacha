# HOME y Símbolos de la comunidad · 16/09/2026

## Referencia y alcance
Figma GD2CfjtdvtZAZVxsYDf7ba → tp2 1331:879 → HOME 2044:623. Se implementan hero, CTA/tablero y estética del micrositio. Las secciones de eventos y descargas del resto del frame no se agregan porque no están conectadas ni fueron pedidas en este alcance. El mapa vivo y su navegación se conservan.

Colores confirmados: header #202020, naranja #F66227, violeta #9E6FF8, fondo #1a1a1a. Space Grotesk. SVG pixel pantall.svg aportado por Lucas y dos iconos exportados del frame de Figma. No modificar el archivo de Figma.

## Recorrido
Home → Participar → Símbolos de la comunidad → Empezar → Generar/pintar → Compartir → Sumar al tablero o copiar enlace. Header y regreso al home disponibles siempre. El tablero inicial muestra cinco ejemplos, nunca participantes ni votos ficticios.

## Funcionamiento real
- `js/comunidad.js`: datos validados, grilla y nombre; persistencia local (máximo 40) y enlace portable con datos en el fragmento. No se suben imágenes ni datos a un servidor.
- `js/home-comunidad.js`: ejemplos con Motor compartido y publicaciones locales de la más reciente a la primera; actualiza con storage/pageshow.
- `simbolos/js/app.js`: reemplaza el flujo principal de descarga por diálogo nativo para compartir. La vista previa refleja las celdas pintadas, no solo la semilla.
- En file:// funciona el editor; compartir enlace necesita HTTP(S). En 127.0.0.1 se advierte que el enlace solo funciona en esa computadora. En web publicada el enlace usa la ubicación publicada del sitio.
- El tablero es de este navegador y origen; no se sincroniza entre dispositivos ni entre localhost y GitHub Pages. Si falla localStorage, se informa y sigue disponible el enlace.
- Conservar patrones, seis colores documentados, herramienta de pintura, simetría y motor original.

## Pendiente para una comunidad pública
Backend de publicaciones y votos, identidad de autores, consentimiento, moderación, reglas del concurso y recompensas. No simularlo con cuentas o números inventados. El título “Ranking semanal · Vista previa” identifica el estado inicial; cuando hay creaciones locales, cambia a “Tus símbolos, acá”.

## Verificación
Pruebas aisladas en Chrome: 1440×900 y 390×844, CTA, editor, publicar local, persistencia, abrir enlace en un contexto sin datos previos, ancho móvil, entrar/salir del mapa y errores JavaScript. Generador comprobado visualmente en el navegador del usuario. Sin push automático.
