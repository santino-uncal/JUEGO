# Fase 02 — Modo "Rey de Roma" (construir, investigar, explorar)

## Fecha
22 de noviembre de 2026

## Commit(s)
- `a1fce2a` Modo Rey de Roma: ciudad, edificios, tecnologías y ejército; menú de inicio
- `38987b3` Botón Incitar inmigración y recursos en su propia fila en pantallas angostas
- `b30b8b1` Mapa con niebla: explorar con habitantes libres para descubrir a los vecinos

## Qué se hizo
- **Menú de inicio** (`index.html`) para elegir entre los dos modos. El modo TEG de antes pasó a `teg.html`.
- **Modo nuevo "Rey de Roma"** (`ciudad.html`):
  - Empezás con el palacio (Regia 👑), 6 habitantes y 20 terrenos vacíos.
  - Recursos: comida, madera, piedra, oro y conocimiento 💡.
  - 13 edificios que se construyen en los terrenos y tardan de 1 a 3 turnos. Casi todos necesitan habitantes libres que trabajen ahí.
  - 13 tecnologías que desbloquean edificios, tropas y mejoras.
  - 6 tipos de tropa (de la milicia a la catapulta), cada una con su ataque y su defensa.
  - 4 pueblos vecinos (sabinos, etruscos, samnitas y galos) que crecen y cada tanto atacan Roma. Te avisan 2 turnos antes.
  - Si un ataque te gana, saquean Roma. Al tercer saqueo perdés. Ganás si conquistás a los cuatro pueblos, y cada uno que conquistás te paga tributo.
  - Hay eventos al azar en algunos turnos.
- **Botón "📣 Incitar inmigración"**: pagás 20 de oro y llegan 3 habitantes. Se usa una vez por turno y solo si hay lugar en las casas.
- **Botón "🗺️ Mapa"** con niebla:
  - Al empezar solo ves las casillas pegadas a Roma.
  - "🧭 Explorar" manda a un habitante libre a una zona tapada que esté pegada a lo conocido. Cuando vuelve, destapa esa zona y a veces trae algo que encontró.
  - Solo se puede atacar a los pueblos ya descubiertos. Si uno sin descubrir marcha contra Roma, su ciudad aparece en el mapa.
- **Arreglos**: cambié íconos que en Windows 10 se veían como cuadraditos. En pantallas angostas, los recursos de arriba ahora van en su propia fila.
- **Dificultad**: la ajusté con 40 partidas automáticas. Un jugador-robot torpe gana 6 de cada 10, en unos 40 turnos.
- **Archivos**:
  - `data/ciudad.js`: todos los números (precios, producción, enemigos, mapa, eventos).
  - `js/ciudad-reglas.js`: reglas.
  - `js/ciudad.js`: pantalla.
  - `css/ciudad.css`: estilos.

## Estado al cerrar
- Los dos modos funcionan y quedaron probados en el navegador.
- El usuario tiene una partida de "Rey de Roma" en curso, en el año 5, guardada en el navegador.
- El equilibrio del mapa y de la exploración todavía no se probó con partidas largas jugadas por una persona.

## Pendiente / próximos pasos
- Que el usuario juegue partidas completas y diga si la dificultad le parece bien.
- Ideas: que los ejércitos tarden en viajar según la distancia en el mapa, eventos en las zonas exploradas, sonidos y animaciones.
- Revisar que el juego se vea bien en el celular.
- Publicar en GitHub Pages cuando el usuario quiera.
