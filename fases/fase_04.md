# Fase 04 — Apoyo popular, acciones de gobierno y árbol nuevo de la Monarquía

## Fecha
23 de noviembre de 2026

## Commit(s)
- `55eebfb` Apoyo popular que cambia la productividad; los saqueos ya no hacen perder
- `d82b6a4` Sacar la pestaña Tecnologías del panel: queda solo el árbol
- `69f2816` Árbol de la Monarquía como el nuevo dibujo: Senado pasa a la Monarquía y Arquería a la República
- `6dc792c` Mover el árbol de tecnologías arrastrando con el mouse
- `1e699a5` Pestaña de Acciones para ganar o perder apoyo popular

## Qué se hizo
- **Apoyo popular 😊** (de 0 a 100, arranca en 50):
  - Cambia cuánto rinden los edificios y los impuestos: con 0 rinden 70% y con 100 rinden 130%. Los tributos no cambian.
  - Lo suben: Muralla (+15), Anfiteatro (+10), Templo, Acueducto y Foro (+5 cada uno), la tecnología Fortificaciones (+10), rechazar un ataque (+10) y conquistar un pueblo (+15).
  - Lo bajan: un saqueo (−25), perder un ataque (−10) y cada turno sin comida (−3).
  - Cada turno el apoyo se acerca 2 puntos a su "nivel normal", que es 50 más lo que suman los edificios en pie y las tecnologías.
  - En la barra de arriba aparece con una carita, una flechita que dice si sube o baja, y el % de producción.
  - Todos los números están en `APOYO`, en `data/ciudad.js`.
- **Saqueos**: ya no se pierde la partida a los 3 saqueos. Siguen robando, matando gente y quemando un edificio, y además bajan el apoyo. Las partidas guardadas que habían terminado así vuelven a estar abiertas.
- **Pestaña 🎭 Acciones** (en `ACCIONES`, dentro de `data/ciudad.js`):
  - Suben el apoyo pagando recursos: Repartir pan, Fiesta en las calles, Ofrenda a Júpiter (necesita Templo), Discurso en el Foro (necesita Foro) y Juegos de gladiadores (necesita Anfiteatro).
  - Dan recursos y bajan el apoyo: Impuesto especial, Requisar cosechas y Trabajos forzados.
  - Cada acción tarda unos turnos en poder repetirse.
- Se sacó la pestaña "💡 Tecnologías" del panel: todo se hace desde el árbol 🌳.
- **Árbol de la Monarquía ordenado como el dibujo nuevo**, ahora con 5 columnas (se agregó "Reyes sabinos"):
  - Equitación sale de Riego.
  - Senado pasó a la Monarquía: sale de Filosofía, cuesta 70 💡 y deja construir el Foro.
  - Democracia pide Hierro, Construcción y Senado.
  - Arquería pasó a la República: sale de Bronce y cuesta 90 💡. Principado ahora pide Legión profesional y Derecho romano.
- **El árbol se mueve arrastrando con el mouse**, y no vuelve al principio al tocar una tecnología.

## Estado al cerrar
- Todo probado en el navegador, sin errores.
- La única forma de terminar la partida es ganando: no hay forma de perder.
- Los números del apoyo y de las acciones no se probaron en una partida real.

## Pendiente / próximos pasos
- Pensar si vuelve a haber derrota, por ejemplo una revuelta si el apoyo llega a 0.
- Jugar partidas reales y ajustar el apoyo, las acciones y la dificultad en general.
- Ordenar a mano el árbol del Imperium y quizás sumarle tecnologías.
- Pensar qué pasa al llegar al Imperio: más enemigos o nuevas metas.
