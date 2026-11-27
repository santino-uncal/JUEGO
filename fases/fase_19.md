# Fase 19 — Roma más grande y en el centro

## Fecha
27 de noviembre de 2026

## Commit(s)
- `1ae4df7` Mapa: Roma arranca con 3 casillas más al norte y al este
- `4033154` Mapa: la ciudad de Roma queda en el centro de su territorio
- Este resumen va en un commit propio.

## Qué se hizo
- Roma arranca con 7 casillas en vez de 4. Las 3 nuevas (dos arriba y una a la derecha) eran de la Liga latina.
- La ciudad de Roma pasó de la casilla 196,208 a la 196,207. Así queda en el centro de su territorio, rodeada por sus 6 casillas. Antes estaba en un bosque y ahora está en una llanura.
- Se subió la versión del mapa a 12: las partidas guardadas se rearman solas con el mapa nuevo.
- El cambio también quedó en `herramientas/generar_mapa.py`, para que no se pierda si se vuelve a generar el mapa.
- Se revisó en el juego (pestaña Mapa) y se ve como en la captura que mandaste.

## Estado al cerrar
- Los cambios están en commits pero **no se subieron a GitHub**: la página publicada todavía muestra a Roma con 4 casillas.
- Quedan sin guardar en git tres imágenes en `herramientas/` (`liga-latina.png`, `mapa-hexagonos.png`, `mapa-italia-zoom.png`).
- No se jugó una partida nueva completa con este arranque.

## Pendiente / próximos pasos
- Hacer `git push` para publicar los cambios en GitHub Pages.
- Jugar el arranque: ver si la Liga latina, que ahora tiene menos tierra, sigue siendo un rival parejo.
- Decidir si se guardan o se borran las imágenes sueltas de `herramientas/`.
- Lo que quedó de fases anteriores:
  - tierra de nadie cerca de Roma para usar "Ocupar zona" temprano;
  - más detalle en Europa e Italia;
  - un terreno de desierto;
  - relaciones con los pueblos lejanos;
  - nombres para las partidas guardadas;
  - que el General defienda Roma;
  - mostrar en el mapa dónde se encontraron los mapas antiguos.
