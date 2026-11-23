# Fase 05 — Demoler arreglado y fundar ciudades nuevas

## Fecha
23 de noviembre de 2026

## Commit(s)
- `776b887` Demoler con cartel propio del juego y fundar ciudades nuevas desde el mapa

## Qué se hizo
- **Demoler arreglado**: el botón usaba la ventanita de confirmación del navegador, y el panel de vista previa de la app la bloquea (contesta "Cancelar" sola). Ahora el juego muestra su propio cartel "¿Demoler…?" con **Sí, demoler** / **Cancelar**. Lo mismo con "Nueva partida".
- **Fundar ciudades** (modo Rey de Roma):
  - En el 🗺️ Mapa, al tocar una casilla explorada aparece el botón **🏘️ Fundar** con el precio.
  - No se puede en mar ni montaña, ni pegado a otra ciudad (Roma, pueblos vecinos u otra fundada): tiene que haber al menos una casilla en el medio.
  - La primera cuesta 40 🌾, 60 de madera y 40 💰, y pide 4 habitantes libres. Cada ciudad siguiente cuesta 50% más que la primera.
  - Cada ciudad trae 10 terrenos y una **⛲ Plaza** (+2 🌾, +1 💰, lugar para 5).
  - Los recursos y los habitantes se comparten entre todas las ciudades. Los edificios únicos (Cuartel, Muralla…) siguen siendo uno solo en total.
  - Botones arriba de la ciudad (👑 Roma, ⛲ Ostia…) para pasar de una a otra; desde el mapa también hay "Ver la ciudad".
  - Los enemigos solo atacan y saquean Roma.
  - Hay 8 nombres (Ostia, Tibur, Antium, Ardea, Lavinium, Praeneste, Tusculum, Gabii). Todo está en `FUNDACION`, en `data/ciudad.js`.
  - Las partidas guardadas de antes siguen andando (arrancan sin ciudades fundadas).
- Se agregó la explicación en "¿Cómo se juega?".

## Estado al cerrar
- Probado en el navegador: demoler, fundar Ostia, construir ahí y pasar turno, sin errores.
- Para probar se borró la partida guardada del panel de vista previa (`localhost:8123`); quedó una partida nueva.
- Los precios de fundar no se probaron en una partida real.

## Pendiente / próximos pasos
- Jugar partidas reales y ajustar el precio de las ciudades y lo que da la Plaza.
- Pensar si las ciudades fundadas pueden ser atacadas o tener su propia muralla.
- Pensar si cada ciudad debería tener sus propios habitantes o recursos.
- Lo que quedó de antes: derrota por revuelta con apoyo 0, ordenar el árbol del Imperio, qué pasa al llegar al Imperio.
- `.claude/launch.json` fija el puerto 8123 en el comando; si ese puerto ya está ocupado, la vista previa abre otro que no funciona.
