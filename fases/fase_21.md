# Fase 21 — Estrella en las capitales y tecnología Colonización

## Fecha
27 de noviembre de 2026

## Commit(s)
- `c454511` Estrella arriba del castillo de cada capital en el mapa
- `d5d3efe` Para ocupar tierra de nadie hay que investigar Colonización
- Este resumen va en un commit propio.

## Qué se hizo
- **Foto del mapa completo:** se sacó una imagen del mapa entero, sin la niebla, desde el navegador interno. Quedó en `herramientas/mapa-completo.png` (5000 × 2574 píxeles, sin guardar en git).
- **Estrella en las capitales:** en el mapa, Roma y la capital de cada pueblo que sigue en pie tienen una ⭐ arriba del castillo.
  - No la llevan las otras ciudades de cada pueblo ni las ciudades 🛡️ independientes.
  - Cuando conquistás un pueblo, su capital pasa a ser tuya (🦅) y deja de tener la estrella.
- **Tecnología nueva, 🚩 Colonización** (Monarquía, 60 💡, pide 🧭 Cartografía):
  - Sin ella no se puede ocupar tierra de nadie. El botón "🚩 Ocupar zona" aparece apagado y avisa qué hay que investigar.
  - Con ella, ocupar funciona igual que antes: la zona tiene que estar pegada a tu territorio (o llegar por mar con barco) y cuesta 5 ⚖️ y 15 🌾.
  - Se actualizó la ayuda de "¿Cómo se juega?".
  - En las partidas guardadas de antes también hay que investigarla. Las zonas ya ocupadas siguen siendo tuyas.
- Todo se probó en el navegador interno, con una partida de prueba.

## Estado al cerrar
- Los 2 commits de esta fase (y este resumen) todavía **no están subidos** a GitHub.
- Siguen sin guardar en git las imágenes sueltas de `herramientas/` (`liga-latina.png`, `mapa-completo.png`, `mapa-hexagonos.png`, `mapa-italia-zoom.png`).

## Pendiente / próximos pasos
- Subir los cambios a GitHub.
- Ver si el costo de Colonización (60 💡) y su lugar en el árbol quedan bien jugando una partida.
- Quizás que ocupar tierra de nadie tome varias casillas de una vez: hoy es de a una casilla y el mapa tiene muchísimas.
- Decidir si las ciudades independientes también llevan estrella.
- Lo que quedó de la fase 20: ajustar los números de paz, ciudades y Ruta de la Seda; paz más barata con las ciudades independientes; decidir qué hacer con las imágenes sueltas de `herramientas/`; y los pendientes de fases anteriores.
