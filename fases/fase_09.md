# Fase 09 — Modo TEG con amigos (salas con código) y publicación

## Fecha
24 de noviembre de 2026

## Commit(s)
- `cd4d7b3` Modo TEG: jugar con amigos usando un código de sala

## Qué se hizo
- **Pantalla de inicio del Modo TEG** con dos opciones: jugar solo o jugar con amigos.
- **Salas con código**:
  - Uno pone su nombre y crea una sala. Le aparece un código de 5 letras (sin O, 0, I ni 1 para no confundirse).
  - El botón "📋 Copiar invitación" copia un mensaje con un link (`teg.html?sala=CÓDIGO`) que deja el código ya puesto.
  - Los amigos entran con su nombre y el código.
  - En la sala de espera cada uno elige su pueblo. Los que nadie elige los maneja la computadora.
  - El anfitrión toca "Empezar". Pueden jugar de 2 a 7 personas.
- **Cómo se juega online**:
  - Por turnos, en el orden del mapa: Roma, galos, germanos, hispanos, Cartago, griegos y egipcios. Cuando terminan todos, actúa la computadora y se cobra el oro.
  - Quedás afuera si perdés todas tus provincias. Gana el último jugador que queda.
  - El panel muestra a los jugadores, a quién le toca y quién se desconectó. La pestaña dice "🔔 ¡Te toca!" cuando es tu turno.
  - La crónica se pinta en verde o en rojo según a quién le conviene cada noticia.
  - Los eventos al azar le tocan a cada jugador. Las legiones de regalo van a su capital, por eso los textos ahora dicen "en la capital" y no "en Roma".
- **Conexión** (`js/red.js`):
  - Usa PeerJS (se carga de unpkg), que conecta los navegadores directo entre sí. No hace falta un servidor propio.
  - La computadora del anfitrión lleva la partida y les manda a todos cómo va. Las jugadas de los invitados se revisan ahí; por ejemplo, nadie puede jugar fuera de su turno.
  - Cada 3 segundos todos avisan que siguen conectados (un "latido"). Si alguien no da señales en 12 segundos, se lo da por desconectado y se saltea su turno.
  - Un invitado puede volver a entrar con el mismo código y el mismo nombre.
  - El anfitrión guarda la partida en su navegador. Si cierra la página, al volver le aparece "🔁 Retomar mi sala".
- **Modo solo**: sigue igual. Las partidas guardadas de antes se adaptan solas al formato nuevo.
- **Publicado en GitHub Pages**: https://santino-uncal.github.io/JUEGO/

## Estado al cerrar
- Probado en el navegador con dos pestañas, en la compu y en la página publicada:
  - crear una sala, unirse y elegir pueblo
  - jugar los turnos
  - desconectarse, volver a entrar y retomar la sala
  - jugar solo
- No se probó entre dos computadoras de casas distintas. Algunas redes muy cerradas (de trabajo o de facultad) pueden bloquear la conexión.
- La página publicada no se actualiza sola: cada cambio hay que subirlo (`git push`).

## Pendiente / próximos pasos
- Probar una partida real con amigos desde otras casas.
- Ideas para el modo online:
  - chat dentro de la partida
  - un sonido cuando te toca
  - que el anfitrión pueda echar a alguien o pasarle su pueblo a la computadora
  - límite de tiempo por turno
- Revisar el equilibrio entre los pueblos cuando juegan personas: Roma arranca con 2 provincias y Cartago con 4.
- Lo que quedó de la fase 08 (modo Rey de Roma): ajustar la dificultad de Europa, conquistar la tierra de nadie, la paz, etc.
