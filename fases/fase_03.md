# Fase 03 — Árbol de tecnologías y los tres períodos de Roma

## Fecha
22 de noviembre de 2026

## Commit(s)
- `84d24df` Árbol de tecnologías con épocas, flechas y meta de investigación
- `fe49f63` Árbol de tecnologías ampliado a 33 en 5 épocas, sin ramas cruzadas
- `64e69ea` Tres períodos: Monarquía, República e Imperio, cada uno con sus tecnologías
- `90209c2` El árbol muestra solo el período actual; Democracia y Principado abren el período siguiente
- `3f58a49` Cargar siempre la última versión de CSS y JS para que el navegador no mezcle archivos viejos
- `03319c7` Árbol de la Monarquía ordenado como el dibujo: Minería nueva, sin Comercio, Democracia pide Hierro y Filosofía
- `31b6cfa` Árbol de la República ordenado en cuatro ramas como el de la Monarquía
- `79733f5` Íconos dibujados de troncos y piedra, y el ejército en la barra de recursos

## Qué se hizo
- **Árbol de tecnologías** al estilo Civilization, en el botón "🌳 Tecnologías" del modo Rey de Roma:
  - Las tecnologías son cajitas unidas con flechas, separadas en épocas (columnas). Las ramas no se cruzan.
  - Al tocar una tecnología se ve qué hace, qué pide, qué destraba y cuánto cuesta llegar.
  - **Meta 🎯**: elegís una tecnología lejana y el juego investiga solo las del camino a medida que juntás conocimiento.
  - Las tecnologías ahora dan mejoras (más comida por granja, más oro de impuestos, ejército más fuerte, tropas más baratas, etc.).
- **Tres períodos**: Monarquía 👑 (Rey de Roma), República 🏛️ (Cónsul de Roma) e Imperio 🦅 (Emperador de Roma).
  - El árbol muestra solo el período en el que estás. Los anteriores se pueden mirar y los que vienen están cerrados con 🔒.
  - **Democracia** cierra la Monarquía y deja proclamar la República (+25% de oro de impuestos).
  - **Principado** cierra la República y, con 2 pueblos conquistados, deja proclamar el Imperio (+10% al ejército, +50% de tributos).
  - Edificios nuevos: Puerto, Anfiteatro y Foro. Tropa nueva: Pretorianos 💂.
- **Monarquía ordenada como el dibujo del usuario**:
  - Raíces: Agricultura, Minería (nueva), Alfarería y Escritura.
  - Democracia pide Hierro y Filosofía.
  - Comercio se sacó: el Mercado ahora sale de Alfarería y la Cantera de Minería.
- **República ordenada con el mismo estilo**: cuatro columnas (Primeros cónsules, Guerras púnicas, Expansión, Fin de la república), con Principado al final.
  - Las filas de cada tecnología están fijas en los datos (campo `fila`). El Imperio todavía se acomoda solo.
- **Arreglo "no se ve el árbol"**: el navegador mezclaba archivos viejos con nuevos. Ahora las páginas cargan siempre la última versión, sin hacer nada a mano.
- **Íconos y barra de arriba**:
  - Madera y piedra ahora son dibujos propios (`img/troncos.svg`, `img/piedra.svg`), porque los emojis 🪵 y 🪨 no se ven en Windows 10.
  - En la barra de arriba aparece el ejército: ⚔️ cantidad de soldados y su fuerza de ataque.
- Las partidas guardadas de antes siguen andando: tecnologías que ya no existen (como Comercio) se borran solas al cargar.

## Estado al cerrar
- Todo funciona y está probado en el navegador, sin errores, en Monarquía, República e Imperio.
- 37 tecnologías: 14 en la Monarquía, 17 en la República y 4 en el Imperio. Ninguna rama se cruza.
- La dificultad no se volvió a probar después de agregar tantas mejoras. Probablemente el juego quedó más fácil.

## Pendiente / próximos pasos
- Jugar partidas reales y ajustar la dificultad (costos de tecnologías, fuerza de los vecinos).
- Ordenar a mano el árbol del Imperio (por ahora tiene solo 4 tecnologías) y quizás sumarle más.
- Pensar qué pasa al llegar al Imperio: más enemigos o nuevas metas para ganar.
