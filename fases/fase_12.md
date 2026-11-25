# Fase 12 — Arreglos de guerra, años, Coliseo, fama y barcos

## Fecha
25 de noviembre de 2026

## Commit(s)
- `84c59bb` Tropas cansadas por soldado, enemigos atacan ciudades y zonas, Roma puede caer y el Imperio pide toda la República
- `70710af` El botón dice "Siguiente año" y los textos hablan de años en vez de turnos
- `77ccdd0` Los edificios se pueden cambiar de lugar arrastrándolos o con el botón Mover
- `644b91b` Coliseo (gran obra de Roma) y fama: atrae gente, oro y pueblos que se unen sin pelear
- `a1ee4f9` Trirremes: barcos que se hacen en el Puerto y llevan soldados para atacar por mar

## Qué se hizo
### Arreglos
- **Tropas cansadas:** ahora se cansa cada soldado por separado (`estado.cansadas`). Los que pelean descansan hasta el año siguiente; con los que se quedaron se puede atacar otra zona el mismo año.
- **Los enemigos ya no atacan solo Roma:** cada marcha elige un objetivo (`elegirObjetivo`). Puede ser Roma, una ciudad fundada (casi siempre la más cercana a su capital) o una zona tuya pegada a su territorio para recuperarla. Si ganan en una ciudad fundada la saquean; si ganan en una zona, se la quedan. La muralla de cada ciudad la defiende a ella. Los números están en `ATAQUES_ENEMIGOS` (`data/ciudad.js`).
- **Se puede perder pasando años:** si llegan a Roma con el doble (o más) de fuerza que tu defensa, la toman y perdés (`resultado: "conquista"`). Apretando solo "Siguiente año" se pierde cerca del año 18.
- **Imperio:** además de Principado y 2 conquistas, hay que investigar todas las tecnologías de la República (`requisitos.tecnologias: "todas"`).

### Propuestas nuevas
- **"Siguiente año":** el botón y todos los textos hablan de años en vez de turnos.
- **Mover edificios:** se arrastran con el mouse o se usa el botón ↔️ Mover y se toca el terreno nuevo. Es gratis (`moverLote`).
- **Coliseo 🏟️:** gran obra (`maravilla: true`). Se desbloquea con Pan y circo, va solo en Roma y hay una sola. Da +20 de apoyo y +15 de fama. El Anfiteatro pasó a usar el ícono 🎭.
- **Fama 🌟 (0 a 100):** la suben las conquistas, los ataques rechazados, las grandes obras, las ciudades nuevas y los períodos; la bajan los saqueos y las derrotas.
  - Da +1 habitante por año cada 25 de fama y +1 de oro por año cada 10.
  - Desde 50 de fama, un pueblo en paz y conocido, con ejército más chico que tu fama, puede unirse a Roma sin pelear (como mucho uno por año).
  - Los números están en `FAMA`.
- **Trirremes 🚢:** se hacen en la pestaña Ejército; piden Navegación y un Puerto. Para atacar zonas a las que solo se llega por mar hacen falta barcos.
  - Cada barco lleva 5 soldados y navega una vez por año.
  - Si perdés la batalla, se hunde la mitad de los que fueron.
  - Los números están en `BARCOS`.
- La ayuda "¿Cómo se juega?" se actualizó con todo esto.

## Estado al cerrar
- Todo probado en el navegador con partidas armadas a mano y simulaciones; no hubo errores en la consola.
- Cambio para partidas guardadas: para atacar por mar ya no alcanza con Navegación; hace falta un Puerto y barcos.

## Pendiente / próximos pasos
- **Año que "solo pasa en la ciudad en la que estás":** no se pudo reproducir. Las obras de Roma y de las ciudades fundadas avanzan juntas al pasar el año. Falta que el usuario cuente qué vio exactamente.
- Jugar una partida larga para equilibrar:
  - la fama (con 100 se unieron 11 pueblos en 20 años);
  - la derrota por ataque aplastante;
  - el precio de los barcos.
- Los enemigos todavía no tienen flota propia: no hay batallas en el mar.
