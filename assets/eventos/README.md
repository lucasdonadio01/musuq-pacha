# Catálogo Eventos · imágenes por capas

Fuentes visuales: cinco imágenes proporcionadas por el usuario en `Downloads/ventos`.
Son ilustraciones de referencia del prototipo, no nuevas evidencias documentales.
Los originales se preservan. Los archivos `*-sujeto.png` son recortes con transparencia
generados con la herramienta integrada de imágenes, modo **edición / extracción de fondo**.
Pueden presentar pequeñas diferencias de trazo respecto de los originales. Al abrir una
tarjeta se muestra el original sin modificar; los recortes desaparecen con los píxeles.

## Archivos

| Original aportado | Fondo local | Recorte generado |
| --- | --- | --- |
| QUERANDI.png | querandi.png | querandi-sujeto.png |
| Tehuelches.png | tehuelches.png | tehuelches-sujeto.png |
| OMAGUACA-viltipoco.PNG | omaguaca.png | omaguaca-sujeto.png |
| charruas.webp | charruas.webp | charruas-sujeto.png |
| Qom, abipón, mocoví, pilagá.png | qom.png | qom-sujeto.png |

## Prompts utilizados

Base de los cinco pedidos:

> Use case: background-extraction. This is an edit target supplied by the user, not inspiration. Create a transparent PNG foreground cutout for a website parallax collage. Extract the specified illustrated subjects, remove all scenery and paper/background to genuine alpha transparency. Preserve their exact original positions, scale, poses, proportions, facial features, clothing, tools, colors, linework and print texture. Keep the EXACT input canvas aspect ratio and framing with transparent empty space; do not center or resize the subjects, do not redraw or enhance, do not invent anything, no words or pixels. The output must align perfectly over the original.

Selección por imagen:

- Querandí: ambos hombres de pie, con sus herramientas; excluir carpas y fondo.
- Tehuelches: jinete y caballo centrales y lanza levantada; excluir otros jinetes, animales y pastos.
- Omaguaca: retrato completo, plumas, pelo, cara y hombros; conservar el gris claro opaco dentro del retrato.
- Charrúas: jinete de la izquierda, lanza y caballo, más figura de pie a la derecha, ropa y cuerdas; excluir paisaje y plantas.
- Qom: tres figuras grandes del primer plano, tocados, lanzas, ropa y pies; conservar el beige interior, excluir figuras del fondo.

## Diseño

Figma `GD2CfjtdvtZAZVxsYDf7ba`, ARCHIVO .1 (`2298:852`) y ARCHIVO .2 (`2298:379`).
Proporción base 268 × 588 px, expansión al doble de ancho en escritorio.
Se adaptan entre 200 y 268 px al viewport. Introducción y catálogo en 3 + 5 columnas
de la grilla global; títulos Space Grotesk. Movimiento automático por capas más
respuesta al puntero, detenido fuera de pantalla y con movimiento reducido.
Por pedido del usuario, las cinco tarjetas llevan al archivo Querandí como recorrido
del prototipo, desde cualquier punto de la tarjeta.

Íconos oficiales Google Material Design Icons (Apache 2.0), guardados localmente:

- `arrow-back-ios-new.svg`: https://github.com/google/material-design-icons/blob/master/src/navigation/arrow_back_ios_new/materialicons/24px.svg
- `arrow-outward.svg`: https://github.com/google/material-design-icons/blob/master/symbols/web/arrow_outward/materialsymbolsoutlined/arrow_outward_24px.svg
- Licencia: https://github.com/google/material-design-icons/blob/master/LICENSE

La flecha de avance invierte `arrow_back_ios_new`; la flecha de archivo rota
`arrow_outward` 90 grados hacia abajo.
