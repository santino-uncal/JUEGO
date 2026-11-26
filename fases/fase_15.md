# Fase 15 — Mapa del mundo antiguo, victoria en el Mediterráneo, partidas guardadas y mapas de los conquistados

## Fecha
26 de noviembre de 2026

## Commit(s)
- `8cddf7c` Mapa nuevo del mundo antiguo: de Hispania hasta China, con 10 pueblos nuevos
- `cb45e6c` Para ganar alcanza con conquistar a los pueblos del Mediterráneo
- `7af69fd` Al ganar podés seguir jugando o guardar la partida y volver a ella después de empezar otra
- `d12daaf` Al conquistar un pueblo te quedás con sus mapas y ves lo que tenía descubierto
- `b741ec6` Mapa: el norte de África (Cartago, númidas y bereberes) queda como en la imagen
- `a0debd1` Mapa: los númidas con bordes redondeados, como en la imagen

## Qué se hizo
### Mapa nuevo 🌍
- **De dónde sale:** de la imagen que mandó el usuario, que va de Hispania hasta China.
  - La imagen está guardada en `herramientas/mapa-mundo.png`.
  - El programa que la convierte es `herramientas/generar_mapa.py`. Se corre con `py herramientas/generar_mapa.py` y escribe `data/mapa-mundo.js`, que reemplaza a `data/mapa-europa.js` (borrado).
- **Tamaño:** 1033 × 614 hexágonos (1,25 hexágonos por píxel), unas 10 veces más casillas que el mapa de Europa.
- **Cómo se arma:**
  - Cada color de la imagen es un pueblo.
  - Las letras escritas en la imagen se borran y se rellenan con el color de al lado.
  - Donde las letras tapaban todo, la zona se dibujó a mano (`PARCHES`):
    - el sur de Italia y Sicilia;
    - el norte de África: Túnez, la costa de Cartago, los númidas (con bordes redondeados) y los bereberes.
  - **Terreno:** la imagen no trae, así que se inventa:
    - cordilleras dibujadas a mano: Alpes, Apeninos, Pirineos, Cáucaso, Himalaya, etc.;
    - mesetas altas (Tíbet y Pamir);
    - ruido para que bosques y colinas queden en manchas;
    - zonas secas (Sahara, Arabia, estepas) casi sin bosque.
- **Pueblos nuevos (10):**
  - celtas de Britania (`britanos`);
  - germanos, dacios, tracios, númidas y bereberes;
  - Reino de Kush y Reino de Damot;
  - Confederación india (`indios`) y Dinastía Zhou (`zhou`).
- **Cambios en los pueblos que ya estaban:**
  - Los "Celtas" del norte de Italia ahora se llaman **Galos cisalpinos** (el id sigue siendo `celtas`).
  - Los colores son los de la imagen, salvo dos:
    - los samnitas siguen azules, porque el celeste de la imagen se confundía con el mar;
    - Roma pasa a ser **roja**, porque el naranja es de los persas.
  - Roma arranca con 67 zonas en el Lacio, sobre la costa.
- **Para que ande rápido con tantas casillas:**
  - **De lejos (escala < 10):** el mapa se pinta como una imagen de 2 píxeles por casilla, con las filas corridas como los hexágonos.
  - **Partida guardada:** se guarda comprimida (`comprimir` / `descomprimir`: cada valor con cuántas veces se repite).
  - **Dibujar el mapa:** se descartan rápido las casillas que no están pegadas a nada visto, y `direcciones()` ya no crea listas nuevas en cada llamada.
- **Partidas viejas:** `MAPA.version` es 7, así que las partidas guardadas se rearman solas con el mapa nuevo.

### Victoria en el Mediterráneo 🏆
- Los pueblos lejanos llevan `lejano: true`: celtas de Britania, germanos, dacios, Kush, Damot, India y China.
- Para ganar hay que conquistar a los otros 18 pueblos.
- En Vecinos, cada pueblo lejano avisa que no hace falta conquistarlo.
- El cartel de victoria dice "Roma domina el *Mare Nostrum*".

### Seguir jugando y partidas guardadas 📚
- **Al ganar** hay dos botones:
  - **Seguir jugando:** queda anotado el año en `estado.gano` y la victoria no vuelve a avisar.
  - **Guardarla y empezar otra.**
- **"Nueva partida"** también ofrece guardar la actual.
- **Dónde se guardan:** en `imperium_ciudad_guardadas`, hasta 10 partidas.
- **Botón 📚 Partidas** (arriba): aparece solo si hay alguna guardada.
  - **▶️ Jugar:** la partida actual pasa a la lista, así no se pierde.
  - **🗑️ Borrar:** pregunta antes.
- Las partidas perdidas no se guardan.

### Mapas de los conquistados 🗺️
- Al conquistar un pueblo (tomando su capital o porque se une por la fama) se ve todo lo que está hasta cierta distancia de su territorio (`heredarMapas`).
- La distancia es 10 por defecto (`EXPLORACION.conquista`). Algunos pueblos tienen la suya (`conoce`):
  - cartagineses: 30;
  - Liga griega: 25;
  - persas: 20;
  - India y China: 15.
- La crónica avisa cuántas zonas nuevas conocés y qué pueblos descubriste.

### Textos
- La ayuda dice que el mapa va de Hispania hasta China y que Roma es roja.
- El botón 🌍 dice "Ver todo el mapa".

## Estado al cerrar
- **Probado en el navegador, sin errores:**
  - dibujar el mapa, el zoom y la velocidad;
  - 30 años simulados;
  - guardar y cargar comprimido;
  - pasar una partida del mapa viejo al nuevo;
  - ganar, seguir jugando, guardar y volver a una partida guardada, borrar;
  - conquistar Cartago y heredar sus mapas.
- **Publicado en GitHub Pages** (https://santino-uncal.github.io/JUEGO/) con todo lo de esta fase. Ese push subió también las fases 10 a 14, que no se habían subido.
- **La partida del usuario no se tocó.** Se va a pasar sola al mapa nuevo la próxima vez que la abra: conserva los pueblos conquistados y las ciudades, pero vuelve a empezar lo explorado y las zonas sueltas.
- No se jugó una partida real de punta a punta con el mapa nuevo.

## Pendiente / próximos pasos
- Jugar una partida real y ajustar la dificultad:
  - los pueblos italianos ahora tienen más zonas;
  - las capitales grandes cuestan 120 de poder político;
  - la fuerza de los pueblos nuevos.
- **Revisar otras zonas donde la imagen tenía nombres escritos:** Liga griega en el Egeo, Celtíberos, Lusitanos, Imperio Persa. Si se ven raras, agregarles un parche en `generar_mapa.py`.
- **Ideas:**
  - un terreno de desierto para el Sahara y Arabia;
  - que los pueblos lejanos tengan alguna relación con Roma (comercio, embajadas);
  - poner nombre a las partidas guardadas.
- **Lo que quedó de fases anteriores:**
  - que el General ayude a defender Roma;
  - mostrar en el mapa dónde se encontraron los mapas antiguos.
