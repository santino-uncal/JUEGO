# Fase 16 — Grilla de hexágonos y mapa rehecho con la imagen sin nombres

## Fecha
26 de noviembre de 2026

## Commit(s)
- `7c6609a` Mapa: grilla de hexágonos que se ve también con el zoom alejado
- `5a47598` Mapa rehecho con la imagen sin nombres: Italia y el norte de África salen limpios

## Qué se hizo
### Grilla de hexágonos ⬡
- **Antes:** los hexágonos de un mismo pueblo tenían todos el mismo color y no se distinguían. La forma solo se notaba en las fronteras y de lejos parecía una imagen común.
- **Ahora:** cada casilla tiene un borde fino y oscuro (`patronGrilla` en `js/ciudad.js`).
  - Aparece desde escala 3. Con el zoom bien alejado se ve más suave y de cerca se marca más.
  - Con todo el mapa en pantalla no se dibuja, porque cada hexágono mide menos de 1 píxel.
  - Para que ande rápido se dibuja un "molde" chico (1 casilla de ancho y 2 filas de alto) que se repite como un azulejo. El molde solo se rehace cuando cambia el zoom.
- **Imagen para mirar el mapa entero:** `herramientas/mapa-hexagonos.png` (8269 × 4259) dibuja cada hexágono con su borde. No está en git: el juego no la usa.

### Mapa rehecho con la imagen sin nombres 🗺️
- El usuario mandó el mismo mapamundi **sin los nombres escritos** y con los mismos colores. Ahora es `herramientas/mapa-mundo.png`; la vieja con nombres queda en la historia de git.
- **Cambios en `generar_mapa.py`:**
  - **`AJUSTE`:** la imagen nueva mide 833 × 424 (la vieja, 826 × 426) y está apenas corrida. Se calculó cómo encaja comparando las costas y se acomoda a las coordenadas viejas. Así siguen valiendo las capitales, las cordilleras y el tamaño del mapa (1033 × 614).
  - Ya no se borran letras negras (no hay).
  - **Colores:** los samnitas son de otro azul en la imagen nueva, `(0, 162, 232)`. El puntito rojo de Roma también cuenta como Roma.
  - **`PARCHES`:** se sacaron los del sur de Italia, Sicilia y el norte de África, porque ahora salen bien de la imagen. Quedó solo el del Lacio, para que Roma no arranque con un puntito: arranca con **45 zonas** (antes, 67).
- **Capitales que se movieron:** Cartago (181, 265) y Olisipo de los lusitanos (32, 238), ya cambiadas en `data/ciudad.js`.
- **`MAPA.version` pasa a 8:** las partidas guardadas se rearman solas con el mapa nuevo. Conservan los pueblos conquistados y las ciudades, pero pierden las zonas sueltas.

## Estado al cerrar
- **Probado en el navegador, sin errores:** la grilla en varios zoom, el mapa nuevo y pasar una partida guardada al mapa nuevo.
- **No está subido a GitHub Pages:** el usuario prefirió esperar.
- No se jugó una partida real con el mapa nuevo.

## Pendiente / próximos pasos
- Subir a GitHub Pages cuando el usuario quiera.
- **Revisar con el usuario cómo quedó Europa.** En la imagen, Italia es muy chica: los pueblos italianos tienen entre 100 y 200 zonas cada uno, y Roma 45. Si hace falta más detalle, se puede pedir una imagen de Europa con más zoom y encajarla con el mismo sistema de `AJUSTE`.
- Ver si con menos zonas en Italia cambia la dificultad.
- **Lo que quedó de fases anteriores:**
  - un terreno de desierto;
  - relaciones con los pueblos lejanos;
  - nombres para las partidas guardadas;
  - que el General defienda Roma;
  - mostrar en el mapa dónde se encontraron los mapas antiguos.
