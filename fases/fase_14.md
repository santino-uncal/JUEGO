# Fase 14 — Cartografía, ciudades conquistadas, terrenos que producen, barcos de guerra y guerras entre pueblos

## Fecha
26 de noviembre de 2026

## Commit(s)
- `a0fd670` Cartografía: tecnología que mejora a los exploradores (más rápidos, ven más y traen más cosas)
- `3313c16` Las ciudades conquistadas pasan a ser tuyas y se puede construir en ellas
- `65e86fc` Íconos nuevos: castillo para las capitales enemigas y templo para las ciudades que fundás
- `d5c115c` Bosques y montañas cerca de cada ciudad hacen rendir más a aserraderos y canteras
- `801447d` Los bosques cerca de la ciudad también dan comida a las granjas
- `d21398f` Las colinas cerca de la ciudad también ayudan a las canteras
- `1a219ff` Barcos de guerra: tecnología Flota de guerra y Quinquerremes que atacan y defienden en la costa
- `90a1e0f` Los pueblos se invaden entre sí y te conquistan zonas más seguido

## Qué se hizo
### Cartografía 🧭 (tecnología nueva)
- Está en la Monarquía, columna "Primeros reyes", debajo de Filosofía. Pide Escritura y cuesta 40 💡.
- Los exploradores avanzan 6 casillas por año en vez de 4.
- Descubren un radio más grande: 3 en vez de 2.
- La chance de que traigan algo sube del 30% al 50%.
- Efecto nuevo `exploracion: { velocidad, radio, hallazgo }`, que se calcula con `mejoraExploracion()`.

### Ciudades conquistadas 🦅
- Al tomar la capital de un pueblo, o cuando se une a Roma por la fama, esa ciudad pasa a ser tuya (`sumarCiudadConquistada`).
- Se guarda dentro de `estado.colonias` con `conquistada: id`.
- Viene con 10 terrenos, una Plaza, Casas y una Granja (`CONQUISTA` en `data/ciudad.js`).
- Se edita igual que las fundadas: construir, mover, demoler y agrandar de nivel.
- Se abre desde el botón de ciudades, desde el mapa o desde Vecinos ("Ver …").
- No cuenta para el límite de ciudades fundadas: se usa `fundadas()` en vez de `colonias.length`.
- Las partidas guardadas que ya tenían pueblos conquistados reciben su ciudad al cargarse.

### Íconos de ciudades
- `ICONOS_CIUDAD` en `data/ciudad.js`:
  - Roma 👑;
  - fundadas 🏛️ (antes ⛲);
  - conquistadas 🦅;
  - capitales enemigas 🏰 (antes, el animal de cada pueblo).
- En Vecinos cada pueblo conserva su ícono propio.

### Terrenos que producen (`ALREDEDORES`)
- Se cuentan las casillas hasta 2 de distancia de cada ciudad:
  - **Granja:** +1 🌾 por bosque, hasta +3.
  - **Aserradero:** +1 madera por bosque, hasta +4.
  - **Cantera:** +1 piedra por montaña y +0,5 por colina, hasta +4.
- `balance()` ahora recorre ciudad por ciudad para sumar `extraAlrededor()`.
- Dónde se ve:
  - en la barra de la ciudad ("cerca: 🌲 · 🏔️ · ⛰️");
  - en el panel de cada edificio y en la lista de qué construir;
  - en el mapa, al elegir dónde fundar.
- Las colinas tienen `simbolo: "⛰️"` solo para los textos; en el mapa no se dibujan.

### Barcos de guerra 🛳️
- **Tecnología "Flota de guerra":** República, columna "Expansión". Pide Navegación y cuesta 140 💡.
  - Para hacerle lugar, Legión y Guardia pretoriana bajaron una fila.
- **Quinquerreme** (`BARCOS_GUERRA`): se hace en el Puerto y no ocupa habitantes.
  - **Ataque:** cuando atacás una zona costera van todas las listas, y cada una suma 8.
  - **Protección:** cada una cuida 2 trirremes para que no se hundan si perdés. Si perdés, se hunde un cuarto de las quinquerremes.
  - **Defensa:** cada una suma 6 al defender ciudades o zonas costeras (Roma incluida).
  - **Descanso:** las que pelean descansan hasta el año siguiente (`estado.flota`, `estado.flotaUsada`).
- Las trirremes ahora se describen como barcos para llevar soldados.

### Otros pueblos más activos
- **Guerras entre pueblos** (`guerrasEntrePueblos`, `GUERRAS_PUEBLOS`):
  - Cada año, cada pueblo tiene un 4% de chance de invadir a un vecino con frontera; casi siempre elige al más débil.
  - Si gana, le saca de 1 a 3 zonas de la frontera. Nunca se toma la capital del otro.
  - Se avisa en la Crónica si conocés a alguno de los dos pueblos.
- **Más conquistas sobre vos:**
  - Van por una zona tuya el 50% de las veces (antes 35%).
  - Si te la ganan, avanzan y se quedan con una zona tuya más pegada (`zonasExtra`).
- La Liga griega se nombra en singular (`singular: true`), con los ayudantes `pueblo()` y `verbo()`.

## Estado al cerrar
- Todo se probó en el navegador sin errores en la consola. Las pruebas se hicieron en memoria y la partida guardada del usuario se restauró igual.
- Se simularon:
  - una conquista y abrir la ciudad conquistada;
  - las cuentas de producción por terreno;
  - un ataque con barcos de guerra;
  - 40 años de guerras entre pueblos;
  - 15 años completos de juego.
- No se jugó una partida larga real con todo junto.

## Pendiente / próximos pasos
- Equilibrar jugando:
  - cuánto ayudan los terrenos;
  - el costo y la fuerza de las quinquerremes;
  - cuántas guerras hay entre pueblos;
  - lo agresivos que se volvieron los enemigos con tus zonas.
- Ideas:
  - que los enemigos también tengan flota y ataquen por mar;
  - que un pueblo pueda absorber a otro por completo;
  - que una ciudad tuya saqueada pueda ser tomada;
  - mostrar en el mapa las guerras en curso.
- Pendientes de antes:
  - el "año que solo pasa en la ciudad en la que estás" (falta que el usuario cuente qué vio);
  - que el General ayude a defender Roma.
