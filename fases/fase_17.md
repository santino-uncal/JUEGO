# Fase 17 — Liga latina, Sicilia más cerca y tierra de nadie

## Fecha
27 de noviembre de 2026

## Commit(s)
- `8ffdd02` Mapa: vuelve la Liga latina, Sicilia más cerca de Italia y los sículos se unen a los ítalos
- `db5c03e` Mapa: Roma es solo su ciudad y la Liga latina tiene el resto del Lacio
- `da874a1` Se puede ocupar la tierra de nadie sin pelear

## Qué se hizo
### Liga latina 🌿
- **Antes:** el verde de los latinos en la imagen (`(34, 177, 76)`) contaba como Roma, así que Roma se quedaba con su territorio.
- **Ahora:** es un pueblo aparte (`latinos` en `data/ciudad.js`, letra `L`, capital **Alba Longa** en 200, 210). Te declara la guerra en el año 14 y arranca con 10 soldados.
- A pedido del usuario, **Roma es solo su ciudad**: la casilla de Roma y las de alrededor que no son mar, **4 zonas** en total. El resto del Lacio es de la Liga latina: **42 zonas**, al norte y al este de Roma.
  - En `generar_mapa.py` se sigue usando el parche del Lacio, pero después todo lo de Roma que no es la ciudad pasa a ser de los latinos.
- La capital de Roma se movió al puntito rojo de la imagen: `MAPA.roma` pasa a ser (196, 208).

### Sicilia 🏝️
- La isla entera se corre 4 píxeles a la derecha y 1 hacia arriba (`SICILIA` y `MOVER_SICILIA` en `generar_mapa.py`). Queda un estrecho de una casilla de mar con la punta de la bota.
- **Los sículos desaparecen:** el centro de Sicilia es de los **ítalos** (249 zonas). A los ítalos les subí la fuerza a 20, el crecimiento a 1.6, y les agregué comida al botín y al tributo.
- La letra `L`, que quedó libre, ahora es de la Liga latina.

### Ocupar tierra de nadie 🚩
- Tocando una zona gris aparece el botón **🚩 Ocupar zona**. No hay batalla.
- Cuesta `MAPA.ocupar` = 5 ⚖️ y 15 🌾. Las reglas para llegar son las mismas que para atacar: por tierra tiene que estar pegada a tu territorio, y por mar hace falta un barco listo, que queda usado ese año.
- Funciones nuevas: `puedeOcupar` y `ocupar` (en `js/ciudad-reglas.js`), y el panel de la zona en `js/ciudad.js`.
- Agregado a "¿Cómo se juega?" en `ciudad.html`.

### Otros
- `MAPA.version` pasa a 10. Las partidas guardadas se rearman solas.
- Imágenes para mirar, que no están en git: `herramientas/mapa-italia-zoom.png` y `herramientas/liga-latina.png` (el Lacio de cerca, en hexágonos).

## Estado al cerrar
- **Probado en el navegador, sin errores:** la partida guardada se pasa sola al mapa nuevo, Roma y Alba Longa se ven en el mapa, la Liga latina aparece en Vecinos y ocupar tierra de nadie funciona con un clic real. Para esta prueba se hizo una copia de la partida guardada y después se restauró.
- **No está subido a GitHub Pages.**
- No se jugó una partida nueva completa: no se sabe cómo cambia la dificultad con Roma de 4 zonas.

## Pendiente / próximos pasos
- Jugar el arranque con Roma chiquita: ver si sobra o falta lugar para fundar ciudades y si la Liga latina es muy fácil o muy difícil.
- Alrededor de Roma no hay tierra de nadie. Ver si conviene agregar algo cerca para usar "Ocupar zona" temprano.
- Subir a GitHub Pages cuando el usuario quiera.
- **Lo que quedó de fases anteriores:**
  - más detalle en Europa e Italia (una imagen con más zoom);
  - un terreno de desierto;
  - relaciones con los pueblos lejanos;
  - nombres para las partidas guardadas;
  - que el General defienda Roma;
  - mostrar en el mapa dónde se encontraron los mapas antiguos.
