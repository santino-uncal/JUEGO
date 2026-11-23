# Fase 07 — Mapa de Italia con pueblos, guerras y poder político

## Fecha
23 de noviembre de 2026

## Commit(s)
- `2e67467` Costos de tecnologías de la monarquía por columna (20/45/70/100)
- `37c586b` Hierro cuesta 70
- `1854222` Hierro vuelve a costar 85
- `98f88c1` Mapa de Italia con territorio de cada pueblo y guerras para conquistar zonas
- `6bc236b` Vuelve la niebla: el mapa de Italia se descubre explorando
- `f1834c0` Poder político: hace falta para quedarse con zonas conquistadas

## Qué se hizo
- **Costos de las tecnologías de la monarquía** según la columna del árbol:
  - 20: Agricultura, Minería, Alfarería, Escritura
  - 45: Riego, Bronce, Albañilería, Matemáticas, Filosofía
  - 70: Equitación, Construcción, Senado
  - 85: Hierro
  - 100: Democracia
- **Mapa nuevo de toda Italia** (26 × 30 casillas), sacado de la imagen de pueblos que mandó el usuario. Está en `MAPA` (`filas` = terreno, `duenos` = de quién es cada casilla), en `data/ciudad.js`.
  - Hay 9 pueblos, cada uno con su color y su capital: umbros, etruscos, samnitas, celtas, mesapios y apulios, italiotas, sardos, griegos y cartagineses.
  - Roma (naranja) empieza con su franja de territorio. Córcega es tierra de nadie.
  - Los sabinos y los galos senones del mapa viejo ya no están. Los umbros son ahora el primer pueblo que ataca.
- **Guerras por zonas**:
  - Le declarás la guerra a un pueblo y atacás sus zonas pegadas a tu territorio, una por turno.
  - Ganar una zona te la da y te llevás un 20% del botín. Tomar la capital rinde al pueblo entero.
  - El terreno ayuda al que defiende.
  - Para llegar a las islas y a las costas lejanas hace falta ⛵ Navegación.
  - Umbros, etruscos, samnitas y celtas te declaran la guerra solos. Los demás viven en paz hasta que vos se la declares.
  - Las ciudades nuevas se fundan en zonas propias.
- **Niebla y exploración**:
  - Al empezar solo ves tu territorio y lo que está pegado.
  - Los exploradores descubren zonas nuevas; tardan 1 turno cada 2 casillas desde tu territorio.
  - Solo podés declararle la guerra a pueblos que ya descubriste, y solo podés atacar zonas que ves.
- **⚖️ Poder político** (recurso nuevo):
  - Empezás con 20. Lo dan la Regia (+2), las plazas (+1), los templos (+1) y el Foro (+4).
  - Quedarte con una zona cuesta 10. La capital cuesta 15, más 2 por cada otra zona que tenga ese pueblo.
  - Se paga solo si ganás la batalla.
  - Los números están en `MAPA.poder`.
- Las partidas guardadas de antes se adaptan solas: les arma el mapa nuevo, muda las ciudades fundadas y les da 20 de poder.
- Se actualizó la ayuda "¿Cómo se juega?".

## Estado al cerrar
- Probado en el navegador:
  - declarar la guerra, ganar una zona y tomar Veyes (Etruria pasa entera a Roma)
  - mandar un explorador y que vuelva
  - que bloquee los pueblos sin descubrir y las islas sin Navegación
  - que el poder político alcance o no alcance
- Ningún error en la consola. La partida del usuario quedó como estaba.
- Los números (fuerza de los pueblos, costos de poder, botín por zona) no se probaron en una partida real.

## Pendiente / próximos pasos
- Jugar partidas reales y ajustar la dificultad: fuerza de cada pueblo, costo de las capitales, cuánto poder político entra por turno.
- Ideas: hacer la paz con un pueblo, que los enemigos puedan recuperar zonas, que las zonas conquistadas den algo por turno.
- Lo que quedó de antes: precios de niveles de ciudad, derrota por revuelta con apoyo 0, ordenar el árbol del Imperio, qué pasa al llegar al Imperio.
