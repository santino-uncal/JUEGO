# Fase 08 — Mapa de Europa con zoom y hexágonos

## Fecha
24 de noviembre de 2026

## Commit(s)
- `9c0b223` Mapa de Europa con 16 pueblos y zoom (acercar, alejar y arrastrar)
- `ea4e336` Mapa de Europa nuevo con las fronteras dibujadas de cada pueblo
- `8fa8da9` Los griegos de Italia pasan a ser parte de la Liga griega
- `6287298` El mapa pasa a tener casillas hexagonales

## Qué se hizo
- **Mapa de toda Europa**, sacado de la segunda imagen que mandó el usuario (la que tiene las fronteras de cada pueblo dibujadas).
  - Son 250 × 254 hexágonos. Las casillas están en `data/mapa-europa.js` (`MAPA_TERRENO` y `MAPA_DUENOS`); se generaron con un programa de Python que lee los colores de la imagen. Ese archivo no se toca a mano.
  - **15 pueblos**:
    - Italia: umbros, etruscos, samnitas, celtas, mesapios, ítalos y sículos.
    - Afuera: cartagineses, Liga griega, persas, galos, ilirios, peonios, celtíberos y lusitanos.
  - La Liga griega incluye las colonias griegas del sur de Italia y de Sicilia (Siracusa). Su capital es Atenas.
  - Algunos pueblos comparten color, como en el mapa del usuario:
    - lusitanos y peonios
    - ítalos y sículos
  - Lo beige del mapa (Britania, Germania, Escandinavia, Rusia, África) es tierra de nadie.
  - Los latinos pasan a ser parte de Roma, que arranca con su hexágono y los de alrededor.
- **Zoom**:
  - El mapa ahora se dibuja en un `<canvas>`.
  - Se acerca y aleja con la rueda del mouse, con pellizco o con los botones ＋ －. Se mueve arrastrando.
  - Botón 👑 para volver a Roma y 🌍 para ver toda Europa.
  - De lejos no se muestran los nombres de las ciudades. De muy cerca aparecen los íconos de bosques y montañas.
- **Hexágonos**:
  - Cada casilla tiene 6 vecinas y las distancias se cuentan de hexágono en hexágono.
  - Las filas impares están corridas medio hexágono.
- **Exploración**:
  - Cada explorador descubre un radio de 2 hexágonos (`EXPLORACION.radio`).
  - Avanza 4 casillas por turno (`EXPLORACION.porTurno`).
- **Poder político**: una capital cuesta como mucho 120 (`MAPA.poder.maxCapital`), porque hay pueblos con cientos o miles de zonas.
- **Partidas viejas**: `MAPA.version` (hoy es 4) avisa cuándo cambió el dibujo del mapa. Si cambia, las partidas guardadas se rearman solas.

## Estado al cerrar
- Probado en el navegador, sin errores en la consola:
  - el zoom, arrastrar el mapa y tocar hexágonos
  - explorar
  - que las partidas guardadas se adapten al mapa nuevo
- La partida del usuario no se tocó: se rearma con el mapa nuevo la próxima vez que la abra.
- No se probó en una partida real cómo se juega contra los pueblos nuevos.
- Si el navegador muestra la versión vieja, hay que apretar Ctrl + F5.

## Pendiente / próximos pasos
- Jugar y ajustar la dificultad: fuerza de los pueblos de Europa, costo de las capitales, poder político por turno.
- Ideas:
  - poder conquistar la tierra de nadie
  - hacer la paz con un pueblo
  - que los enemigos recuperen zonas
  - que las zonas conquistadas den algo por turno
- Roma arranca con muy pocos hexágonos: ver si conviene darle más territorio al empezar.
- Lo que quedó de antes:
  - precios de los niveles de ciudad
  - derrota por revuelta con apoyo 0
  - ordenar el árbol del Imperio
  - qué pasa al llegar al Imperio
