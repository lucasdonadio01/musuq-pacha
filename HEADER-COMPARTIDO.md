# Header principal

El encabezado del home es el componente común de todas las páginas: `index.html`, `archivo.html`, `simbolos/index.html` y `arboles.html`.

- `js/header-plantilla.js`: marca, navegación, controles, íconos Google originales y formulario de accesibilidad. Esta es la única plantilla; no copiarla en cada HTML.
- `js/header.js`: rutas relativas a la raíz del sitio, sección activa, menú móvil y sesión demo compartida. La sesión usa la clave existente `musuq-sesion-demo-v1`; `musuq:sesion` actualiza la interfaz del mapa sin recargar.
- `css/header.css`: estética y medidas. `--site-header-height` refleja el alto real, también con texto ampliado. Archivo, generador y controles del mapa usan esta variable.
- `js/sonido.js` y `js/accesibilidad.js`: preferencias comunes. El generador conserva su pista Shasta, gestionada por el mismo servicio, sin reproducir una segunda música.

## Orden de carga

Crear `<header id="header" data-seccion="archivo">` (o `territorio`, `simbolos`). Solo el home lleva `data-home="true"`. Cargar Motor y Pueblos antes del header para el avatar; luego plantilla, header, accesibilidad y sonido, antes de los scripts de la experiencia. Cargar `header.css` después de los estilos de cada página. No se usa fetch, framework ni dependencia externa: el micrositio sigue funcionando desde archivos locales.

La sesión sigue siendo una demostración, no autenticación real. Los controles propios de cada experiencia (volver, giro, zoom, pintura) permanecen fuera del header.
