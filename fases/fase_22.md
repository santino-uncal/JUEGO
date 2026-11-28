# Fase 22 — Filtros y buscador, mapa desde el menú, olas en las costas y tutoriales

## Fecha
27 de noviembre de 2026

## Commit(s)
- `72f9d28` Filtros Todos/Disponibles y buscador en Construir y Acciones
- `9b1195b` Filtros y buscador también en la pestaña Ejército
- `ea131bb` Filtros y buscador también en la pestaña Vecinos
- `91ea55d` Botón en el menú para ver el mapa del mundo antes de jugar
- `b73e0a1` Democracia ya no necesita Construcción
- `dad0f0b` Mapa: olas, espuma y agua clarita en las costas
- `a5a0fdb` Tutorial paso a paso al empezar cada partida de Rey de Roma
- `d497fe3` Tutorial también para el Modo TEG (solo y con amigos)
- Este resumen va en un commit propio.

## Qué se hizo
- **Filtros y buscador en las 4 pestañas del panel** (Construir, Acciones, Ejército y Vecinos):
  - Botones **Todos / Disponibles**. "Disponibles" muestra lo que se puede hacer en este momento. En Vecinos son los pueblos con los que estás en guerra o a los que les podés declarar la guerra.
  - **Buscador** que filtra mientras escribís. No distingue tildes ni mayúsculas y busca en el nombre y la descripción (en Vecinos, también en las ciudades).
  - Cada pestaña recuerda su filtro y lo que escribiste, aunque pase el año.
- **Ver el mapa antes de jugar:** en el menú principal hay un botón "🗺️ Ver el mapa del mundo".
  - Abre `ciudad.html?ver=mapa`: el mapa de Rey de Roma con todo descubierto, sin paneles ni botones de acción, solo para mirar.
  - No guarda nada ni toca la partida que tengas.
- **Democracia** ahora pide solo Hierro y Senado (antes también Construcción). Construcción se puede investigar después; la siguen pidiendo Ingeniería y Navegación.
- **Costas del mapa:**
  - El agua pegada a la tierra es de un celeste más claro (se nota hasta con el mapa entero a la vista).
  - Hay una línea blanca de espuma en la orilla.
  - De cerca aparecen olitas azules paralelas a la costa: una por casilla, más otra suave más adentro.
  - Se midió la velocidad del mapa antes y después del cambio y da igual.
- **Tutoriales** (un cartel abajo de la pantalla, con borde dorado en lo que se explica, botones Siguiente / Atrás / Saltear y flechas del teclado):
  - **Rey de Roma**, 11 pasos: aparece al empezar cada partida nueva y cambia sola de vista o de pestaña según el paso.
  - **Modo TEG**, 8 pasos solo y 9 con amigos (se suma la sala de jugadores): en los pasos de mover y reclutar se elige sola tu capital, así se ven esos botones.
  - En los dos modos se vuelve a ver con "🎓 Ver el tutorial", en "¿Cómo se juega?". No aparece al seguir una partida ya empezada.
  - El código del tutorial es uno solo, `js/tutorial.js`, y los textos están en `data/tutorial-ciudad.js` y `data/tutorial-teg.js`.
  - Los estilos del tutorial y de `button.claro` pasaron a `css/estilo.css`, que es compartido.
- Se respondió una pregunta: la Crónica se guarda con la partida, pero solo las últimas 60 anotaciones.
- Todo se probó en el navegador interno.

## Estado al cerrar
- Los 8 commits de esta fase (y este resumen) todavía **no están subidos** a GitHub.
- Siguen sin guardar en git las imágenes sueltas de `herramientas/`.
- El tutorial del TEG con amigos no se probó con dos computadoras de verdad. Solo se revisó que aparecieran los 9 pasos correctos.

## Pendiente / próximos pasos
- Subir los cambios a GitHub.
- Probar el tutorial del TEG en una partida real con amigos.
- Decidir si la Crónica guarda más de 60 anotaciones (por ejemplo, 500, con una forma de desplegarla entera).
- El mapa con el zoom en 10 tarda unos 55-70 ms en dibujarse, porque ahí empiezan los hexágonos de verdad. Pasaba desde antes, pero se podría mejorar.
- Lo que quedó de la fase 21: el costo de Colonización, ocupar varias casillas de una vez, la estrella en las ciudades independientes y los números de paz, ciudades y Ruta de la Seda.
