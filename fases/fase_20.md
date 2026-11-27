# Fase 20 — Ciudades, paz, Ruta de la Seda y ciudades independientes

## Fecha
27 de noviembre de 2026

## Commit(s)
- `0998edf` Pueblos con varias ciudades y botón para firmar la paz
- `010487a` India y China muy caras en poder político; entre Persia y China solo rutas comerciales
- `1ac521e` Bactra da oro cada año por la Ruta de la Seda
- `f3f0f3c` Ciudades independientes: Massalia, Rodas, Bizancio, Tiro y otras
- Este resumen va en un commit propio.

## Qué se hizo
- **Varias ciudades por pueblo:** cada pueblo tiene entre 2 y 4 ciudades además de su capital, con nombres históricos (por ejemplo, la Liga latina tiene Tibur y Lavinium). Se ven en el mapa con 🏰.
  - Tomar una cuesta 20 ⚖️. Te da la ciudad, las zonas de alrededor y botín, y podés construir en ella.
  - Si tomás la capital, el pueblo se rinde y te da todas sus ciudades.
  - Los otros pueblos no pueden quitarse ciudades entre ellos.
  - Las ubica el programa `herramientas/ubicar_ciudades.py`. Hay que volver a correrlo si se rearma el mapa.
- **Firmar la paz:** botón 🕊️ Paz, en la pestaña Vecinos y en el mapa. Cuesta 40 ⚖️, o 12 ⚖️ si ya le tomaste más de la mitad de sus ciudades (contando la capital). Te quedás con lo ganado y hay 10 años de tregua.
- **India y China:** quedarse con sus tierras cuesta 10 veces más poder político (100 por zona, 200 por ciudad, 1200 la capital).
- **Ruta de la Seda:** la tierra de nadie de Asia, entre Persia, la India y China, ya no se puede ocupar ni cruzar con el ejército. A la India y a China solo se llega por mar.
  - En el mapa se ve color arena, con una ruta punteada y paradas de caravanas (Maracanda, Kashgar, Dunhuang).
  - Si Bactra (ciudad persa) es tuya, la ruta da +15 💰 por año.
- **Ciudades independientes (🛡️):** Massalia, Emporion, Gades, Cirene, Rodas, Bizancio, Sinope, Tiro y Panticapea.
  - Nunca atacan primero, no pelean con los otros pueblos y no hace falta conquistarlas para ganar.
  - Se pueden conquistar o pueden unirse por la fama, y después pagan tributo.
  - Aparecen también en las partidas guardadas de antes.
- De paso: el mensaje de declarar la guerra ya no dice "los liga latina".
- Todo se probó en el navegador interno, con partidas de prueba.

## Estado al cerrar
- Todo está subido a GitHub (GitHub Pages).
- No se jugó una partida entera con los cambios nuevos.
- Siguen sin guardar en git las imágenes sueltas de `herramientas/` (`liga-latina.png`, `mapa-hexagonos.png`, `mapa-italia-zoom.png`).

## Pendiente / próximos pasos
- Jugar una partida y ajustar los números: costo de la paz (40 y 12), tregua (10 años), defensa y costo de las ciudades, oro de la Ruta de la Seda, fuerza de las ciudades independientes. Están en `data/ciudad.js` (`PAZ`, `CIUDADES_PUEBLO`, `RUTAS_COMERCIALES` y "Ciudades independientes").
- Quizás hacer más barata la paz con las ciudades independientes (hoy cuesta 40, igual que con un pueblo).
- Rodas quedó en la costa de Anatolia porque el mapa no tiene esa isla.
- En los reinos lejanos (Persia, India, China, Kush, Damot) las ciudades no siempre están en su lugar real, porque el mapa está muy deformado.
- Decidir si se guardan o se borran las imágenes sueltas de `herramientas/`.
- Lo que quedó de fases anteriores: ver si la Liga latina sigue siendo un rival parejo; tierra de nadie cerca de Roma; más detalle en Europa e Italia; un terreno de desierto; relaciones con los pueblos lejanos; nombres para las partidas guardadas; que el General defienda Roma; mostrar dónde se encontraron los mapas antiguos.
