# Fase 10 — Mapa del mundo pasado a PNG

## Fecha
24 de noviembre de 2026

## Commit(s)
- Solo este resumen. El código del juego no cambió.

## Qué se hizo
- Se pasó a PNG el mapa del mundo sin fronteras (`World_map_blank_without_borders.svg`, en Descargas). Se hizo con Chrome en segundo plano, sin instalar nada.
  - `World_map_blank_without_borders.png`: 4379 × 2435 px, igual que el SVG.
  - `World_map_blank_without_borders_x2.png`: 8758 × 4870 px, el doble. Se dibujó otra vez desde el SVG, así que no se ve borroso.
- Los dos tienen el fondo transparente (el mar) y los continentes en gris.
- Los archivos quedaron en Descargas y no se agregaron al repo.

## Estado al cerrar
- El juego sigue como en la fase 09.
- El PNG grande se abrió en Paint para editarlo.

## Pendiente / próximos pasos
- Si se usa el mapa editado en el juego, copiarlo a la carpeta del proyecto (por ejemplo, `img/`).
- Paint no maneja la transparencia: si se guarda desde Paint, el mar queda blanco.
