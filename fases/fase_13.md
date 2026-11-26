# Fase 13 — Cambios en tecnologías, unidad General y mapas antiguos

## Fecha
25 y 26 de noviembre de 2026

## Commit(s)
- `3e3ad42` Riego baja los trabajadores de la granja, Hierro mejora el ejército con Herrería y nueva tecnología y unidad General
- `8e8a5ca` Mapas antiguos escondidos: al descubrirlos te muestran una zona lejana sin explorar

## Qué se hizo
### Tecnologías
- **Agricultura:** cada granja da +2 de comida. Ya lo hacía; solo se cambió el texto.
- **Riego:** ahora cada granja necesita 1 trabajador en vez de 2, y ya no da comida extra.
  - Hay un efecto nuevo, `trabajadores: { edificio: n }`, que se calcula con `trabajadoresDe(tipo)` y nunca baja de 1.
  - También vale para las granjas que ya estaban construidas.
- **General (tecnología nueva):** está en la Monarquía, en la columna "Reyes etruscos". Pide Equitación y Bronce y cuesta 85 💡.
- **Hierro:** da +15% de ataque y defensa, pero solo si tenés una Herrería terminada.
  - Para eso las tecnologías tienen un campo nuevo, `necesita: "edificio"`; lo usa `efecto()`.
  - Hierro ya no desbloquea los Legionarios: ahora salen con **Legión profesional** y se siguen entrenando en la Herrería.

### Unidad General ⭐
- Se entrena en el Cuartel. Cuesta 40 💰 y 10 🌾, y tiene ataque 3 y defensa 3.
- Se puede tener uno solo (`maximo: 1`).
- Si va a la batalla, todo el ejército pelea mejor según el terreno: llanura +20%, bosque +20% y montaña +25%.
  - El bonus está en `bonusTerreno`; lo calcula `bonusGeneral()`.
  - Se aplica al atacar una zona y al defender zonas tuyas. No se aplica al defender Roma ni otras ciudades.
- Las partidas guardadas reciben la tropa nueva con 0 soldados.

### Mapas antiguos 📜
- En cada partida se esconden 12 mapas en tierra, a entre 4 y 30 casillas de Roma (`esconderMapas`).
- Cuando la casilla de un mapa queda a la vista, se encuentra al pasar el año (`buscarMapas`).
- Cada mapa revela una zona sin explorar a hasta 20 casillas, con radio 3, y avisa si descubriste pueblos nuevos.
- Los números están en `EXPLORACION.mapas` (`data/ciudad.js`). Las partidas guardadas reciben sus mapas al cargarse.

## Estado al cerrar
- Probado en el navegador, sin errores en la consola:
  - cuentas de trabajadores, efectos y ataque con y sin General;
  - árbol de tecnologías con la tecnología General;
  - encuentro simulado de un mapa (reveló 37 casillas y 2 pueblos).
- No se jugó todavía una partida larga con los cambios.

## Pendiente / próximos pasos
- Equilibrar jugando:
  - Riego ahora da menos comida pero libera gente;
  - el precio y los bonus del General;
  - el +15% de Hierro;
  - cuántos mapas hay y qué tan lejos muestran.
- Pendientes de antes:
  - el "año que solo pasa en la ciudad en la que estás" (falta que el usuario cuente qué vio);
  - los enemigos no tienen flota.
- Idea: que el General también ayude a defender Roma, o mostrar en el mapa dónde se encontraron los mapas.
