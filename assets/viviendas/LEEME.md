# Viviendas de Querandí · modelos de diseño

Modeladas en Blender a partir de las seis referencias proporcionadas por el usuario.
El nombre **Maloka** sigue el nombre indicado en el brief; estos modelos visuales
no constituyen una identificación o una reconstrucción arqueológica certificada.

- `maloka.glb`: bóveda de paja en bloques de 20 cm, estructura interior de madera,
  frente y fondo de barro con puerta y dos ventanas abiertas, piedras y esteras.
- `carpa-pieles.glb`: pieles en bloques de 18 cm, postes de madera, entrada abierta,
  amarres y piedras de sujeción; piso y estera interior.

Ambos son geometría 3D hueca, con superficies interiores y una cámara de perspectiva
nombrada `CAM · … interior`. Escala de autoría en metros; GLB con eje Y arriba.
En el mapa, cada bloque mide aproximadamente 0,05 unidades frente a las 0,625 del suelo.

Las ubicaciones del mapa reproducen los dos claros señalados en la captura del brief:
maloka en (-3.4375, 16.5625) y carpa en (-4.0625, 14.0625), coordenadas X/Z.
Se muestran en zoom 1 de Querandí, con Ver todo o Construcciones.

El archivo editable `.blend`, las cámaras y los renders están fuera del repositorio
web, en `C:/Users/CHIA/figma/viviendas-querandi/`.

El lector `js/GLTFLoader.js` es el original de Three.js r128 (MIT), compatible con
la versión existente del mapa: https://github.com/mrdoob/three.js/blob/r128/examples/js/loaders/GLTFLoader.js
