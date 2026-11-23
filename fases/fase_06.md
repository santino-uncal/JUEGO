# Fase 06 — Ciudades con todo lo de Roma y niveles para agrandarlas

## Fecha
23 de noviembre de 2026

## Commit(s)
- `38f7667` Niveles de ciudad para agrandarlas y edificios únicos por ciudad
- `b4f546f` Una sola opción de juego en la vista previa

## Qué se hizo
- **Cada ciudad tiene todo lo que tiene Roma**: los edificios únicos (Cuartel, Muralla, Herrería, Establo, Taller, Anfiteatro, Foro) ahora son uno **por ciudad**, no uno para todo el reino.
  - Solo la muralla de Roma ayuda a defender (los enemigos solo atacan Roma). Las de otras ciudades suben el apoyo igual.
  - La ⛲ Plaza ahora también da +1 💡.
- **Niveles de ciudad**: arriba de cada ciudad se ve su nivel y el botón **⬆️ Agrandar**, que suma una fila de 5 terrenos.
  - Roma empieza con 20 terrenos y llega a nivel 6 (45 terrenos). Las fundadas empiezan con 10 y llegan a nivel 4 (25).
  - Nivel 2 cuesta 40 madera, 20 piedra y 30 💰; cada nivel siguiente, 50% más. Además pide habitantes en el reino: 10 por nivel (20 para nivel 2, 30 para nivel 3…).
  - Todo está en `NIVELES`, en `data/ciudad.js`.
  - El nivel sale de cuántos terrenos tiene la ciudad, así que las partidas guardadas de antes siguen andando.
- Explicación nueva en "¿Cómo se juega?".
- **Vista previa**: `.claude/launch.json` tiene una sola opción, "juego", en el puerto 8123. Si ese puerto está ocupado, el servidor usa el que le asigne la app.

## Estado al cerrar
- Probado en el navegador: agrandar Roma, fundar Ostia, un Cuartel en cada ciudad, subir Ostia hasta el máximo, guardar y cargar. Sin errores.
- No se probó qué pasa con la vista previa cuando el puerto 8123 está ocupado.
- Los precios de los niveles no se probaron en una partida real.

## Pendiente / próximos pasos
- Jugar partidas reales y ajustar precios de niveles y de fundar ciudades.
- Pensar si cada ciudad debería tener sus propios habitantes o recursos, y si las ciudades fundadas pueden ser atacadas.
- Lo que quedó de antes: derrota por revuelta con apoyo 0, ordenar el árbol del Imperio, qué pasa al llegar al Imperio.
