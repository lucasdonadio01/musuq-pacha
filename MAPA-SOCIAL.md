# Mapa · interfaz social de demostración

## Dirección visual

Extensión de las referencias del usuario: mapa como superficie principal, header persistente, búsqueda a izquierda, ficha oscura con recortes pixel, comentarios arriba a derecha y filtros abajo. Space Grotesk es una decisión de identidad explícita. Paleta: header #202020, naranja #F66227, violeta #9E6FF8, negro #1a1a1a. Íconos Google Material oficiales; sin librería nueva ni backend.

## Comportamiento implementado

- `js/mapa-social.js` / `css/mapa-social.css`: buscador y recomendaciones, ficha, avatar, comentarios de ejemplo, filtros, adaptación móvil.
- Sesión **demo**, no autenticación. `musuq-sesion-demo-v1` en localStorage guarda únicamente activa/inactiva; funciona en memoria cuando el almacenamiento está bloqueado. Qom, Querandí y Omaguaca figuran desbloqueados; el resto es explorable con etiqueta bloqueado. Cerrar sesión no elimina símbolos del tablero.
- Los comentarios y sus contadores son ejemplos identificados, sin publicación, envío ni formulario. Avatares generados por el mismo `Motor` del micrositio.
- Proyección de avatares DOM desde la cámara activa; perspectiva CSS leve, no geometría 3D. No duplicar ni recrear la escena.
- API `MUSUQ_MAPA_UI`: zonas, estado, proyectarZona, filtrar, salir. Eventos `musuq:mapa-listo`, `musuq:estado`; selección mediante `musuq:seleccionar` existente.
- `bosques.filtrar()` afecta tanto visibilidad como hit testing. `habitat.filtrar()` controla ambas escenas de fauna y evita clics invisibles.
- Fauna: en Querandí el filtro acerca al hábitat ya existente. No hay animales cargados para todos los pueblos.
- Construcciones: filtro disponible con estado vacío explícito; no se inventaron edificios sin documentación.
- Tres sprites de flora de Querandí y fichas con fuentes: `js/flora-querandi.js`, `css/flora-querandi.css`, `assets/flora/*.png`. Ver `FLORA-QUERANDI.md` para procedencia, limitaciones y prompts completos. La disposición sobre el mapa es ilustrativa, no distribución botánica medida.
- Rueda/teclado en paneles no disparan back del mapa. Se preserva la transición de cámara al archivo y su `pueblo`.

## Verificación

Chrome aislado de escritorio y móvil: inicio/cierre demo, persistencia, búsqueda de bloqueados, recomendaciones exactas, comentarios scrolleables, cinco filtros, carga PNG, fichas de flora, enlaces al archivo, header accesible. Comprobar además el aspecto en el dispositivo de presentación del proyecto.

## Límites deliberados

No hay cuenta real, desbloqueos de servidor, publicaciones públicas ni likes reales. No se hizo push. Los nombres botánicos inciertos se muestran como tales; consultar la ficha antes de presentar las ilustraciones como reconstrucciones históricas.
