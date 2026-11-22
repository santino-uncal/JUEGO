# Fase 01 — Primera versión de Imperium (modo TEG)

## Fecha
21 al 22 de noviembre de 2026

## Commit(s)
- `151c3be` Primera versión jugable de Imperium: conquista del Mediterráneo

## Qué se hizo
- Se creó el proyecto con git: web estática en HTML/CSS/JS, sin frameworks.
- Se armó el juego **Imperium**, de estrategia por turnos en el Mediterráneo antiguo:
  - Mapa con 20 provincias y 7 facciones: Roma (el jugador), galos, germanos, hispanos, Cartago, griegos y egipcios.
  - Las provincias se unen por rutas de tierra o de mar (las de mar son punteadas).
  - Se pueden mover legiones, atacar con batallas a dados y reclutar (10 de oro cada legión).
  - Las tropas que se mueven o se reclutan descansan hasta el turno siguiente.
  - Las capitales (★) suman +1 a la defensa; Roma suma +2.
  - Los enemigos tienen su propia lógica: cobran oro, refuerzan sus fronteras y atacan si tienen ventaja. Los primeros 2 turnos solo se arman.
  - Cada turno puede pasar un evento al azar (piratas, cosechas, donaciones del Senado, etc.).
  - Se gana conquistando todo y se pierde si cae Roma. La partida se guarda sola en el navegador.
- Se ajustó la dificultad con 40 partidas simuladas: un jugador prudente gana 8 de cada 10, en unos 30 o 40 turnos.
- Archivos:
  - `data/provincias.js`: datos del mapa y eventos.
  - `js/juego.js`: reglas del juego.
  - `css/estilo.css`: aspecto visual.
  - `.claude/launch.json`: servidor local para probar el juego.

## Estado al cerrar
- El juego funciona y se puede jugar entero.
- El usuario decidió que este juego sea el **"modo TEG"** y que va a haber otro modo, que todavía tiene que describir.

## Pendiente / próximos pasos
- Que el usuario explique cómo es el modo nuevo (objetivo, controles, cómo se gana, cómo se ve).
- Pantalla de inicio para elegir entre "Modo TEG" y el modo nuevo.
- Revisar si al abrir `index.html` con doble clic el juego se ve bien en Chrome. Si no, adaptarlo.
- Posibles mejoras al modo TEG: sonidos, animaciones y más mecánicas.
- Publicar en GitHub Pages cuando el usuario quiera.
