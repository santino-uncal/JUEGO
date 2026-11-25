# Fase 11 — Imperio más largo, derrota por descontento y arqueros con Bronce

## Fecha
25 de noviembre de 2026

## Commit(s)
- `ca8e79a` El Imperio suma 11 tecnologías, las Termas y los Auxiliares
- `30b5a2e` Si el apoyo llega a 10, el pueblo se rebela y perdés
- `c768328` Los arqueros se desbloquean con Bronce; Arquería da +10% de ataque

## Qué se hizo
- Se miraron los árboles de tecnologías de Monarquía, República e Imperio (dibujados en el chat a partir de `data/ciudad.js`).
- **Imperio:** pasó de 4 a 15 tecnologías, en 4 eras: Los césares, Alto Imperio, Gloria de Roma y Roma eterna.
  - Nuevas: Censo, Comercio imperial, Tropas auxiliares, Limes, Termas, Hormigón romano, Medicina, Ciudadanía, Pan y circo, Gran biblioteca y Roma eterna (la última, cuesta 500).
  - Edificio nuevo: **Termas** (oro, lugar para vivir y +8 de apoyo).
  - Tropa nueva: **Auxiliares** (ataque 5, defensa 5, se entrenan en el Cuartel).
  - Todas tienen `fila` fija para que el árbol se vea ordenado.
  - Los íconos 🪖 y 🪨 no se ven en Windows 10; se usaron 🔰 y 🌋.
- **Derrota por descontento:** si el apoyo llega a 10 o menos (en cualquier momento del turno), el pueblo se rebela y perdés. Con 20 o menos, la crónica avisa cada turno.
  - Los números están en `APOYO.derrocado` y `APOYO.aviso` (`data/ciudad.js`).
  - Se sumó a la ayuda "¿Cómo se juega?" y al cartelito del apoyo.
- **Arqueros:** ahora se desbloquean con Bronce (Monarquía). La tecnología Arquería pasó a dar +10% de ataque.

## Estado al cerrar
- Todo probado en el navegador: el árbol del Imperio se dibuja bien, la derrota por descontento aparece y "Jugar de nuevo" funciona, y los arqueros piden Bronce.
- No se jugó una partida completa para medir el equilibrio.

## Pendiente / próximos pasos
- Jugar una partida larga para ver si los precios del Imperio y el límite de 10 de apoyo están bien equilibrados.
- Roma eterna no hace ganar la partida; se podría pensar en una victoria por llegar a ella.
