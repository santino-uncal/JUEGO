// Datos del modo "Rey de Roma": edificios, tecnologías, tropas, pueblos vecinos y eventos.
// Se pueden editar libremente (precios, producción, fuerza de los enemigos) sin tocar el código.

// icono: un emoji, o un dibujo de la carpeta img/ (para lo que no tiene un emoji claro)
const RECURSOS = {
  comida:  { nombre: "Comida",       icono: "🌾" },
  madera:  { nombre: "Madera",       icono: '<img class="ico" src="img/troncos.svg" alt="madera">' },
  piedra:  { nombre: "Piedra",       icono: '<img class="ico" src="img/piedra.svg" alt="piedra">' },
  oro:     { nombre: "Oro",          icono: "💰" },
  ciencia: { nombre: "Conocimiento", icono: "💡" },
  poder:   { nombre: "Poder político", icono: "⚖️" },
};

// Con qué empezás
const INICIO = {
  recursos: { comida: 20, madera: 50, piedra: 0, oro: 20, ciencia: 0, poder: 20 },
  habitantes: 6,
  lotes: 20,          // terrenos de la ciudad (5 columnas x 4 filas)
  loteRegia: 7,       // dónde está el palacio
};

// costo: lo que se paga al empezar la obra
// turnos: cuánto tarda la obra
// trabajadores: habitantes que quedan ocupados trabajando ahí
// produce: lo que da cada año (si tiene a toda su gente)
// capacidad: lugar para vivir que suma
// requiere: tecnología necesaria
// unico: solo se puede tener uno por ciudad
// maravilla: gran obra que solo se construye en Roma y hay una sola en todo el reino
const EDIFICIOS = {
  regia:      { nombre: "Regia", icono: "👑", desc: "El palacio del rey. Corazón de Roma.",
                produce: { comida: 3, oro: 2, ciencia: 3, poder: 2 }, capacidad: 10, unico: true, fijo: true },
  plaza:      { nombre: "Plaza", icono: "⛲", desc: "El centro de una ciudad que fundaste o conquistaste.",
                produce: { comida: 2, oro: 1, ciencia: 1, poder: 1 }, capacidad: 5, fijo: true },
  casa:       { nombre: "Casas", icono: "🏠", desc: "Lugar para que viva más gente.",
                costo: { madera: 15 }, turnos: 1, capacidad: 5 },
  granja:     { nombre: "Granja", icono: "🌾", desc: "Produce comida para el pueblo y el ejército.",
                costo: { madera: 10 }, turnos: 1, trabajadores: 2, produce: { comida: 4 } },
  aserradero: { nombre: "Aserradero", icono: "🌳", desc: "Corta madera del bosque.",
                costo: { madera: 5, oro: 5 }, turnos: 1, trabajadores: 2, produce: { madera: 5 } },
  cantera:    { nombre: "Cantera", icono: "⛏️", desc: "Saca piedra de las colinas.",
                costo: { madera: 20 }, turnos: 2, trabajadores: 2, produce: { piedra: 3 }, requiere: "mineria" },
  biblioteca: { nombre: "Biblioteca", icono: "📚", desc: "Los sabios estudian y descubren cosas nuevas.",
                costo: { madera: 20, piedra: 10, oro: 10 }, turnos: 2, trabajadores: 1, produce: { ciencia: 4 }, requiere: "escritura" },
  mercado:    { nombre: "Mercado", icono: "🏪", desc: "El comercio llena las arcas.",
                costo: { madera: 20, piedra: 20 }, turnos: 2, trabajadores: 2, produce: { oro: 6 }, requiere: "alfareria" },
  templo:     { nombre: "Templo", icono: "🏛️", desc: "Templo a Júpiter: ofrendas y sabiduría.",
                costo: { piedra: 30, oro: 20 }, turnos: 3, trabajadores: 1, produce: { oro: 2, ciencia: 2, poder: 1 }, requiere: "albanileria" },
  cuartel:    { nombre: "Cuartel", icono: "⚔️", desc: "Permite entrenar soldados.",
                costo: { madera: 25, oro: 10 }, turnos: 2, unico: true },
  muralla:    { nombre: "Muralla", icono: "🧱", desc: "Tus defensores pelean +50% mejor.",
                costo: { madera: 20, piedra: 40 }, turnos: 3, unico: true, requiere: "albanileria" },
                // (solo la muralla de Roma ayuda a defender, porque los enemigos atacan Roma)
  herreria:   { nombre: "Herrería", icono: "⚒️", desc: "Forja armas de hierro: con la tecnología Hierro, todo tu ejército pelea mejor. Entrena legionarios.",
                costo: { madera: 20, piedra: 20 }, turnos: 2, trabajadores: 1, unico: true, requiere: "hierro" },
  establo:    { nombre: "Establo", icono: "🐴", desc: "Cría caballos para la caballería.",
                costo: { madera: 30, piedra: 10 }, turnos: 2, trabajadores: 1, unico: true, requiere: "equitacion" },
  taller:     { nombre: "Taller de asedio", icono: "🔧", desc: "Construye catapultas.",
                costo: { madera: 30, piedra: 30 }, turnos: 2, trabajadores: 1, unico: true, requiere: "ingenieria" },
  acueducto:  { nombre: "Acueducto", icono: "🌉", desc: "Trae agua: mucha más gente y algo de comida.",
                costo: { piedra: 50, oro: 20 }, turnos: 3, capacidad: 12, produce: { comida: 2 }, requiere: "ingenieria" },
  puerto:     { nombre: "Puerto", icono: "⚓", desc: "Barcos de pesca y de comercio.",
                costo: { madera: 30, piedra: 10 }, turnos: 2, trabajadores: 2, produce: { comida: 3, oro: 4 }, requiere: "navegacion" },
  anfiteatro: { nombre: "Anfiteatro", icono: "🎭", desc: "Juegos y espectáculos: más gente quiere vivir en Roma.",
                costo: { piedra: 60, oro: 30 }, turnos: 3, trabajadores: 1, unico: true, produce: { oro: 3 }, capacidad: 8, requiere: "arquitectura" },
  foro:       { nombre: "Foro", icono: "🏤", desc: "Plaza de la política, los juicios y los negocios.",
                costo: { piedra: 40, oro: 30 }, turnos: 3, trabajadores: 2, unico: true, produce: { oro: 5, ciencia: 3, poder: 4 }, requiere: "senado" },
  termas:     { nombre: "Termas", icono: "🛁", desc: "Baños públicos: la gente se relaja, charla y está contenta.",
                costo: { piedra: 50, oro: 30 }, turnos: 3, trabajadores: 1, unico: true, produce: { oro: 2 }, capacidad: 4, requiere: "termas" },
  coliseo:    { nombre: "Coliseo", icono: "🏟️", desc: "El anfiteatro más grande del mundo: 50.000 romanos mirando gladiadores. Solo en Roma, uno en todo el reino.",
                costo: { piedra: 250, madera: 80, oro: 200 }, turnos: 6, trabajadores: 3, produce: { oro: 8, poder: 4 }, capacidad: 10,
                requiere: "panem", maravilla: true },
};

// Tecnologías: se pagan con conocimiento 💡
// requiere: tecnologías que hay que tener antes.
// efecto (opcional), se suman entre todas las que tengas:
//   mejora:      { edificio: { recurso: n } }  cada edificio de ese tipo produce n más
//   capacidad:   { edificio: n }               cada edificio de ese tipo da n más de lugar para vivir
//   impuestos:   0.5   +50% del oro que pagan los habitantes
//   ataque / defensa: 0.25   tu ejército pelea +25% mejor al atacar / al defender Roma
//   muralla:     0.5   la muralla protege +50% más
//   crecimiento: 1     llega 1 habitante más por año (si hay comida y lugar)
//   tributo:     1     los pueblos conquistados pagan +100% de tributo
//   descuentoTropas: 0.25   los soldados cuestan 25% menos
//   exploracion: { velocidad: n, radio: n, hallazgo: n }  los exploradores avanzan n casillas más por año,
//                descubren n casillas más alrededor y tienen más chance de traer algo (0.2 = +20%)
//   trabajadores: { edificio: n }  cada edificio de ese tipo necesita n trabajadores más (n negativo = menos)
// necesita (opcional): edificio que hay que tener terminado para que el efecto funcione
//
// periodo: a qué período de Roma pertenece ("monarquia", "republica" o "imperio").
//   En el árbol solo se ve el período en el que estás, y sus tecnologías no se
//   pueden investigar antes de llegar a él.
//
// El árbol se dibuja solo: dentro de su período, cada tecnología va una columna
// después de la más avanzada que requiere (las de períodos anteriores no cuentan).
// Para que las ramas no se crucen, conviene que lo que requiere esté en la
// columna anterior y mantener el orden de arriba a abajo
// (acá están agrupadas por columna y ordenadas como se ven en el árbol).
const TECNOLOGIAS = {
  // ===== Monarquía =====
  // fila: altura fija en el árbol (0 = arriba). Si un período no la tiene, se acomoda solo.
  // Fundación
  agricultura: { nombre: "Agricultura",  icono: "🌱", periodo: "monarquia", fila: 0, costo: 20, desc: "Arados y semillas mejores: cada granja da +2 de comida.",
                 efecto: { mejora: { granja: { comida: 2 } } } },
  mineria:     { nombre: "Minería",      icono: "⛰️", periodo: "monarquia", fila: 1.2, costo: 20, desc: "Desbloquea la Cantera." },
  alfareria:   { nombre: "Alfarería",    icono: "🏺", periodo: "monarquia", fila: 3, costo: 20, desc: "Vasijas para guardar y vender: desbloquea el Mercado y cada casa da +2 de lugar.",
                 efecto: { capacidad: { casa: 2 } } },
  escritura:   { nombre: "Escritura",    icono: "✍️", periodo: "monarquia", fila: 6.5, costo: 20, desc: "Desbloquea la Biblioteca." },

  // Primeros reyes
  riego:       { nombre: "Riego",        icono: "💧", periodo: "monarquia", fila: 0, costo: 45, desc: "Canales desde el Tíber: cada granja necesita 1 trabajador en vez de 2.", requiere: ["agricultura"],
                 efecto: { trabajadores: { granja: -1 } } },
  bronce:      { nombre: "Bronce",       icono: "🔱", periodo: "monarquia", fila: 1.2, costo: 45, desc: "Desbloquea Lanceros y Arqueros.", requiere: ["mineria"] },
  albanileria: { nombre: "Albañilería",  icono: "🧱", periodo: "monarquia", fila: 3, costo: 45, desc: "Desbloquea Templo y Muralla.", requiere: ["alfareria"] },
  matematicas: { nombre: "Matemáticas",  icono: "📐", periodo: "monarquia", fila: 5, costo: 45, desc: "Cada biblioteca da +2 de conocimiento.", requiere: ["escritura"],
                 efecto: { mejora: { biblioteca: { ciencia: 2 } } } },
  filosofia:   { nombre: "Filosofía",    icono: "🦉", periodo: "monarquia", fila: 6.5, costo: 45, desc: "Los sabios debaten en la Regia: +2 de conocimiento por año.", requiere: ["escritura"],
                 efecto: { mejora: { regia: { ciencia: 2 } } } },
  cartografia: { nombre: "Cartografía",  icono: "🧭", periodo: "monarquia", fila: 8, costo: 40, desc: "Mapas y brújulas para los viajeros: tus exploradores viajan más rápido (6 casillas por año en vez de 4), descubren una zona más grande y traen cosas más seguido.", requiere: ["escritura"],
                 efecto: { exploracion: { velocidad: 2, radio: 1, hallazgo: 0.2 } } },

  // Reyes sabinos
  equitacion:  { nombre: "Equitación",   icono: "🐴", periodo: "monarquia", fila: 0, costo: 70, desc: "Desbloquea Establo y Caballería.", requiere: ["riego"] },
  construccion:{ nombre: "Construcción", icono: "🔨", periodo: "monarquia", fila: 4, costo: 70, desc: "Vigas y tejas: cada casa da +3 de lugar y cada aserradero +2 de madera.", requiere: ["albanileria", "matematicas"],
                 efecto: { capacidad: { casa: 3 }, mejora: { aserradero: { madera: 2 } } } },
  senado:      { nombre: "Senado",       icono: "👴", periodo: "monarquia", fila: 5.8, costo: 70, desc: "Los ancianos aconsejan al rey: desbloquea el Foro.", requiere: ["filosofia"] },

  // Reyes etruscos
  hierro:      { nombre: "Hierro",       icono: "⚒️", periodo: "monarquia", fila: 0.8, costo: 85, desc: "Desbloquea la Herrería. Si tenés una Herrería terminada, todo tu ejército ataca y defiende +15% mejor.", requiere: ["equitacion", "bronce"],
                 efecto: { ataque: 0.15, defensa: 0.15 }, necesita: "herreria" },
  general:     { nombre: "General",      icono: "⭐", periodo: "monarquia", fila: 2, costo: 85, desc: "Desbloquea la unidad General: guía al ejército y pelea mejor en llanuras, bosques y montañas.", requiere: ["equitacion", "bronce"] },

  // Fin de la monarquía
  democracia:  { nombre: "Democracia",   icono: "🗳️", periodo: "monarquia", fila: 4, costo: 100, desc: "El pueblo quiere elegir a sus gobernantes. Te permite proclamar la República.",
                 requiere: ["hierro", "construccion", "senado"] },

  // ===== República =====
  // Primeros cónsules
  vias:        { nombre: "Vías romanas", icono: "🛣️", periodo: "republica", fila: 0.5, costo: 100, desc: "Caminos de piedra: llega 1 habitante más por año.", requiere: ["equitacion", "alfareria"],
                 efecto: { crecimiento: 1 } },
  arqueria:    { nombre: "Arquería",     icono: "🏹", periodo: "republica", fila: 2, costo: 90, desc: "Arqueros expertos y flechas con punta de hierro: tus tropas atacan +10% mejor.", requiere: ["bronce"],
                 efecto: { ataque: 0.1 } },
  disciplina:  { nombre: "Disciplina",   icono: "🦅", periodo: "republica", fila: 3, costo: 120, desc: "Todo tu ejército pelea +25% mejor.", requiere: ["hierro"],
                 efecto: { ataque: 0.25, defensa: 0.25 } },
  ingenieria:  { nombre: "Ingeniería",   icono: "🏗️", periodo: "republica", fila: 5.5, costo: 110, desc: "Desbloquea Acueducto, Taller y Catapultas.", requiere: ["construccion", "matematicas"] },
  astronomia:  { nombre: "Astronomía",   icono: "🔭", periodo: "republica", fila: 7, costo: 100, desc: "Los sacerdotes estudian el cielo: cada templo da +3 de conocimiento.", requiere: ["matematicas", "filosofia"],
                 efecto: { mejora: { templo: { ciencia: 3 } } } },
  derecho:     { nombre: "Derecho romano", icono: "📜", periodo: "republica", fila: 8.5, costo: 100, desc: "Impuestos ordenados: +50% de oro de los habitantes.", requiere: ["filosofia"],
                 efecto: { impuestos: 0.5 } },

  // Guerras púnicas
  moneda:      { nombre: "Acuñación",    icono: "🏦", periodo: "republica", fila: 0, costo: 110, desc: "Monedas con la cara de Roma: cada mercado da +3 de oro.", requiere: ["vias"],
                 efecto: { mejora: { mercado: { oro: 3 } } } },
  navegacion:  { nombre: "Navegación",   icono: "⛵", periodo: "republica", fila: 1, costo: 110, desc: "Desbloquea el Puerto.", requiere: ["vias", "construccion"] },
  tacticas:    { nombre: "Tácticas",     icono: "🎖️", periodo: "republica", fila: 3, costo: 120, desc: "Flanqueos y emboscadas: tus tropas atacan +15% mejor.", requiere: ["disciplina", "arqueria"],
                 efecto: { ataque: 0.15 } },
  fortificacion:{ nombre: "Fortificaciones", icono: "🏰", periodo: "republica", fila: 5, costo: 130, desc: "La muralla protege el doble: +100% en vez de +50%. El pueblo se siente seguro: +10 de apoyo.", requiere: ["ingenieria"],
                 efecto: { muralla: 0.5, apoyo: 10 } },
  arquitectura:{ nombre: "Arquitectura", icono: "📏", periodo: "republica", fila: 6, costo: 140, desc: "Arcos y bóvedas: desbloquea el Anfiteatro y cada cantera da +2 de piedra.", requiere: ["ingenieria"],
                 efecto: { mejora: { cantera: { piedra: 2 } } } },
  calendario:  { nombre: "Calendario",   icono: "🗓️", periodo: "republica", fila: 7, costo: 130, desc: "Saber cuándo sembrar: cada granja +1 de comida y la Regia +2 de conocimiento.", requiere: ["astronomia"],
                 efecto: { mejora: { granja: { comida: 1 }, regia: { ciencia: 2 } } } },

  // Expansión
  administracion:{ nombre: "Administración", icono: "📋", periodo: "republica", fila: 0, costo: 150, desc: "Gobernadores en cada pueblo: los conquistados pagan el doble de tributo.", requiere: ["moneda"],
                 efecto: { tributo: 1 } },
  rutas:       { nombre: "Rutas marítimas", icono: "🚢", periodo: "republica", fila: 1, costo: 140, desc: "Comercio por mar: cada puerto da +3 de oro.", requiere: ["navegacion"],
                 efecto: { mejora: { puerto: { oro: 3 } } } },
  flota:       { nombre: "Flota de guerra", icono: "🛳️", periodo: "republica", fila: 2, costo: 140, desc: "Barcos con espolón y puentes para abordar: desbloquea las Quinquerremes, que pelean en el mar.", requiere: ["navegacion"] },
  legion:     { nombre: "Legión profesional", icono: "💪", periodo: "republica", fila: 3, costo: 160, desc: "Soldados con sueldo fijo: desbloquea Legionarios y entrenar tropas cuesta 25% menos.", requiere: ["tacticas"],
                 efecto: { descuentoTropas: 0.25 } },
  pretoriana:  { nombre: "Guardia pretoriana", icono: "⚜️", periodo: "republica", fila: 4, costo: 170, desc: "Desbloquea Pretorianos, la élite del ejército.", requiere: ["tacticas"] },

  // Fin de la república
  principado:  { nombre: "Principado",   icono: "🌿", periodo: "republica", fila: 5.5, costo: 220, desc: "Un general victorioso junta todo el poder en sus manos. Te permite proclamar el Imperio.",
                 requiere: ["legion", "derecho"] },

  // ===== Imperio =====
  // Los césares
  pax:         { nombre: "Pax Romana",   icono: "🕊️", periodo: "imperio", fila: 0, costo: 250, desc: "Paz en los caminos: llegan 2 habitantes más por año y los tributos suben +50%.", requiere: ["administracion", "rutas"],
                 efecto: { crecimiento: 2, tributo: 0.5 } },
  censo:       { nombre: "Censo",        icono: "📊", periodo: "imperio", fila: 1, costo: 220, desc: "Contar a cada habitante del imperio: +25% de oro de los impuestos.", requiere: ["administracion", "derecho"],
                 efecto: { impuestos: 0.25 } },
  imperial:    { nombre: "Ejército imperial", icono: "🚩", periodo: "imperio", fila: 2.5, costo: 260, desc: "Las legiones más temidas del mundo: todo tu ejército pelea +25% mejor.", requiere: ["legion", "pretoriana"],
                 efecto: { ataque: 0.25, defensa: 0.25 } },
  urbanismo:   { nombre: "Urbanismo",    icono: "🏘️", periodo: "imperio", fila: 4.5, costo: 220, desc: "Ciudades bien planeadas: cada casa da +4 de lugar y cada acueducto +8.", requiere: ["fortificacion", "arquitectura"],
                 efecto: { capacidad: { casa: 4, acueducto: 8 } } },
  academia:    { nombre: "Academia",     icono: "🎓", periodo: "imperio", fila: 6, costo: 230, desc: "Escuelas de sabios: cada biblioteca da +3 de conocimiento y el Foro +3.", requiere: ["calendario", "senado"],
                 efecto: { mejora: { biblioteca: { ciencia: 3 }, foro: { ciencia: 3 } } } },

  // Alto Imperio
  comercio:    { nombre: "Comercio imperial", icono: "🐫", periodo: "imperio", fila: 0, costo: 290, desc: "Caravanas y barcos de todo el Mediterráneo: cada mercado da +3 de oro y cada puerto +2.", requiere: ["pax"],
                 efecto: { mejora: { mercado: { oro: 3 }, puerto: { oro: 2 } } } },
  auxiliares:  { nombre: "Tropas auxiliares", icono: "🔰", periodo: "imperio", fila: 2, costo: 280, desc: "Soldados de los pueblos conquistados pelean por Roma: desbloquea Auxiliares, baratos y parejos.", requiere: ["imperial"] },
  limes:       { nombre: "Limes",        icono: "🗼", periodo: "imperio", fila: 3, costo: 310, desc: "Fuertes y torres en las fronteras: defendés Roma +25% mejor y la muralla protege +25% más.", requiere: ["imperial"],
                 efecto: { defensa: 0.25, muralla: 0.25 } },
  termas:      { nombre: "Termas",       icono: "🛁", periodo: "imperio", fila: 4, costo: 280, desc: "Baños públicos con agua caliente: desbloquea las Termas.", requiere: ["urbanismo"] },
  hormigon:    { nombre: "Hormigón romano", icono: "🌋", periodo: "imperio", fila: 5, costo: 300, desc: "Cal y ceniza volcánica: cada cantera da +2 de piedra y cada acueducto +4 de lugar.", requiere: ["urbanismo"],
                 efecto: { mejora: { cantera: { piedra: 2 } }, capacidad: { acueducto: 4 } } },
  medicina:    { nombre: "Medicina",     icono: "⚕️", periodo: "imperio", fila: 6, costo: 290, desc: "Médicos griegos en Roma: llega 1 habitante más por año y cada templo da +2 de conocimiento.", requiere: ["academia"],
                 efecto: { crecimiento: 1, mejora: { templo: { ciencia: 2 } } } },

  // Gloria de Roma
  ciudadania:  { nombre: "Ciudadanía",   icono: "🤝", periodo: "imperio", fila: 0.5, costo: 360, desc: "Todos los hombres libres del imperio son romanos: tributos +50% y +10 de apoyo.", requiere: ["comercio", "censo"],
                 efecto: { tributo: 0.5, apoyo: 10 } },
  panem:       { nombre: "Pan y circo",  icono: "🎭", periodo: "imperio", fila: 4, costo: 350, desc: "Trigo gratis y juegos todo el año: +10 de apoyo, cada anfiteatro da +4 de oro y desbloquea el Coliseo.", requiere: ["termas"],
                 efecto: { apoyo: 10, mejora: { anfiteatro: { oro: 4 } } } },
  biblio:      { nombre: "Gran biblioteca", icono: "🏛️", periodo: "imperio", fila: 5.5, costo: 370, desc: "Copias de todos los libros del mundo: cada biblioteca da +3 de conocimiento y la Regia +3.", requiere: ["hormigon", "medicina"],
                 efecto: { mejora: { biblioteca: { ciencia: 3 }, regia: { ciencia: 3 } } } },

  // Roma eterna
  eterna:      { nombre: "Roma eterna",  icono: "🏆", periodo: "imperio", fila: 3, costo: 500, desc: "Roma es la capital del mundo: tu ejército pelea +15% mejor, +10 de apoyo y llega 1 habitante más por año.", requiere: ["ciudadania", "limes", "panem"],
                 efecto: { ataque: 0.15, defensa: 0.15, apoyo: 10, crecimiento: 1 } },
};

// Los tres períodos de Roma. En el árbol solo se ve el período en el que estás.
// eras: nombre de cada columna del árbol en ese período.
// requisitos para pasar a este período desde el anterior:
//   tecnologia:  la tecnología que hay que investigar (la última del período anterior)
//   tecnologias: cuántas tecnologías del período anterior hay que tener ("todas" = el árbol entero)
//   conquistas:  cuántos pueblos vecinos tenés que haber conquistado
//   costo:       lo que se paga al proclamarlo
// efecto: bonus que da el período desde que llegás (igual que en las tecnologías).
const PERIODOS = [
  { id: "monarquia", nombre: "Monarquía", icono: "👑", titulo: "Rey de Roma",
    eras: ["Fundación", "Primeros reyes", "Reyes sabinos", "Reyes etruscos", "Fin de la monarquía"],
    desc: "Roma es gobernada por un rey." },
  { id: "republica", nombre: "República", icono: "🏛️", titulo: "Cónsul de Roma",
    eras: ["Primeros cónsules", "Guerras púnicas", "Expansión", "Fin de la república"],
    desc: "El pueblo echa al último rey y Roma la gobiernan cónsules elegidos y el Senado.",
    requisitos: { tecnologia: "democracia" },
    efecto: { impuestos: 0.25 }, bonus: "+25% de oro de los impuestos." },
  { id: "imperio", nombre: "Imperio", icono: "🦅", titulo: "Emperador de Roma",
    eras: ["Los césares", "Alto Imperio", "Gloria de Roma", "Roma eterna"],
    desc: "Un general victorioso se corona emperador. Roma domina el Mediterráneo.",
    requisitos: { tecnologia: "principado", tecnologias: "todas", conquistas: 2 },
    efecto: { ataque: 0.1, defensa: 0.1, tributo: 0.5 }, bonus: "Tu ejército pelea +10% mejor y los tributos suben +50%." },
];

// Tropas. ataque: fuerza al atacar. defensa: fuerza al defender Roma.
// Cada soldado ocupa 1 lugar de vivienda y come 1 de comida por año.
const UNIDADES = {
  milicia:     { nombre: "Milicia",     icono: "🗡️", ataque: 1, defensa: 2, costo: { oro: 8, comida: 5 },               edificio: "cuartel" },
  lanceros:    { nombre: "Lanceros",    icono: "🔱", ataque: 2, defensa: 4, costo: { oro: 12, madera: 8 },              edificio: "cuartel",  requiere: "bronce" },
  arqueros:    { nombre: "Arqueros",    icono: "🏹", ataque: 4, defensa: 3, costo: { oro: 15, madera: 12 },             edificio: "cuartel",  requiere: "bronce" },
  legionarios: { nombre: "Legionarios", icono: "🛡️", ataque: 6, defensa: 6, costo: { oro: 25, piedra: 8 },              edificio: "herreria", requiere: "legion" },
  caballeria:  { nombre: "Caballería",  icono: "🐎", ataque: 9, defensa: 3, costo: { oro: 35, comida: 15 },             edificio: "establo",  requiere: "equitacion" },
  catapulta:   { nombre: "Catapulta",   icono: "☄️", ataque: 12, defensa: 1, costo: { oro: 45, madera: 25, piedra: 15 }, edificio: "taller",   requiere: "ingenieria",
                 desc: "Además, cada catapulta rompe parte de las murallas enemigas." },
  pretorianos: { nombre: "Pretorianos", icono: "💂", ataque: 10, defensa: 10, costo: { oro: 50, piedra: 10 },          edificio: "cuartel",  requiere: "pretoriana" },
  auxiliares:  { nombre: "Auxiliares",  icono: "🔰", ataque: 5, defensa: 5, costo: { oro: 16, comida: 8 },              edificio: "cuartel",  requiere: "auxiliares",
                 desc: "Soldados de los pueblos conquistados. Más baratos que los legionarios." },
  general:     { nombre: "General",     icono: "⭐", ataque: 3, defensa: 3, costo: { oro: 40, comida: 10 },            edificio: "cuartel",  requiere: "general", maximo: 1,
                 desc: "Si va a la batalla, todo el ejército pelea mejor en llanura (+20%), bosque (+20%) y montaña (+25%).",
                 // bonus para todo el ejército según el terreno donde se pelea (0.2 = +20%). Letras: ver MAPA.terrenos
                 bonusTerreno: { ".": 0.2, "f": 0.2, "m": 0.25 } },
};

// Barcos: se construyen en el Puerto y llevan soldados para atacar zonas a las que solo se llega por mar.
//   lleva:    cuántos soldados lleva cada barco
//   hundidos: qué parte de los barcos se hunde si perdés la batalla (0.5 = la mitad)
const BARCOS = {
  nombre: "Trirreme", plural: "Trirremes", icono: "🚢", edificio: "puerto",
  costo: { madera: 40, oro: 15 }, lleva: 5, hundidos: 0.5,
  desc: "Barco con tres filas de remeros para llevar soldados.",
};

// Barcos de guerra: se construyen en el Puerto (con la tecnología "requiere") y pelean en el mar.
// No llevan soldados ni ocupan habitantes.
//   ataque:   cuánto suma cada uno cuando atacás una zona en la costa (van todos los que estén listos)
//   defensa:  cuánto suma cada uno cuando defendés una ciudad o zona tuya en la costa
//   protege:  cuántas trirremes cuida cada uno para que no se hundan si perdés
//   hundidos: qué parte de ellos se hunde si perdés la batalla (0.25 = un cuarto)
const BARCOS_GUERRA = {
  nombre: "Quinquerreme", plural: "Quinquerremes", icono: "🛳️", edificio: "puerto", requiere: "flota",
  costo: { madera: 70, oro: 35, piedra: 10 }, ataque: 8, defensa: 6, protege: 2, hundidos: 0.25,
  desc: "Barco de guerra con cinco filas de remeros y un espolón de bronce para hundir a los enemigos.",
};

// Pueblos del mapa. Cada uno tiene su territorio en el mapa (ver MAPA.duenos).
//   lejano: true si queda fuera del Mediterráneo: no hace falta conquistarlo para ganar la partida
//   conoce: hasta qué distancia de su territorio tiene dibujado el mapa (se ve al conquistarlo; si no tiene, EXPLORACION.conquista)
//   singular: true si se nombra en singular ("la Liga griega" en vez de "los ...")
//   letra: con qué letra aparece su territorio en MAPA.duenos
//   color: color de su territorio en el mapa
//   ciudad, x, y: su capital (columna y fila del mapa, empezando en 0).
//         Si conquistás la capital, el pueblo entero se rinde y todo su territorio pasa a ser tuyo.
//   fuerza: tamaño de su ejército al empezar. crece: cuánto suma por año.
//   muro: bonus de las murallas de su capital al defenderse (0.5 = +50%).
//   primerAtaque: año en que te declaran la guerra y marchan sobre Roma.
//                 Si no tiene, el pueblo vive en paz hasta que vos le declares la guerra.
//   cada: años entre un ataque y el siguiente mientras están en guerra.
//   botin: lo que ganás al tomar su capital. tributo: lo que te pagan cada año después.
const ENEMIGOS = {
  // --- Italia ---
  umbros:   { nombre: "Umbros",   ciudad: "Iguvium",  icono: "🐑", letra: "U", color: "#efe4b0", x: 203, y: 196,
              fuerza: 5,  crece: 0.9, muro: 0, primerAtaque: 10, cada: 9, botin: { comida: 40, oro: 30 }, tributo: { comida: 3, oro: 2 },
              desc: "Pastores de los Apeninos. Son pocos, pero atrevidos." },
  etruscos: { nombre: "Etruscos", ciudad: "Veyes",    icono: "🏺", letra: "E", color: "#ffc90e", x: 189, y: 191,
              fuerza: 12, crece: 1.2, muro: 0.5, primerAtaque: 18, cada: 8, botin: { oro: 80, piedra: 40 }, tributo: { oro: 5, piedra: 2 },
              desc: "Ricos y sabios, con una ciudad amurallada." },
  samnitas: { nombre: "Samnitas", ciudad: "Bovianum", icono: "🐺", letra: "S", color: "#00a1e8", x: 211, y: 210,
              fuerza: 18, crece: 1.8, muro: 0.25, primerAtaque: 26, cada: 7, botin: { oro: 100, madera: 60 }, tributo: { oro: 5, madera: 4 },
              desc: "Guerreros duros de las montañas." },
  celtas:   { nombre: "Galos cisalpinos", ciudad: "Mediolanum", icono: "🐗", letra: "C", color: "#880015", x: 178, y: 174,
              fuerza: 25, crece: 2.4, muro: 0, primerAtaque: 34, cada: 6, botin: { oro: 150, comida: 80 }, tributo: { oro: 8, comida: 4 },
              desc: "Celtas feroces del valle del Po, al norte de Italia. Saquean todo a su paso." },
  mesapios: { nombre: "Mesapios", ciudad: "Uria", icono: "🐴", letra: "A", color: "#7092be", x: 222, y: 213,
              fuerza: 15, crece: 1.2, muro: 0.25, cada: 8, botin: { comida: 60, oro: 90 }, tributo: { comida: 4, oro: 3 },
              desc: "Criadores de caballos de las llanuras del este. Viven en paz si no los molestás." },
  italos:   { nombre: "Ítalos", ciudad: "Consentia", icono: "🌲", letra: "I", color: "#b5e61d", x: 223, y: 230,
              fuerza: 16, crece: 1.4, muro: 0, cada: 8, botin: { madera: 80, oro: 80 }, tributo: { madera: 4, oro: 3 },
              desc: "Pueblos de los bosques del sur de Italia. Viven en paz si no los molestás." },
  siculos:  { nombre: "Sículos", ciudad: "Henna", icono: "🌾", letra: "L", color: "#a8d61a", x: 208, y: 250,
              fuerza: 10, crece: 0.9, muro: 0.25, cada: 9, botin: { comida: 70, piedra: 40 }, tributo: { comida: 4, piedra: 2 },
              desc: "Campesinos del centro de Sicilia. Para llegar necesitás ⛵ Navegación." },
  // --- El Mediterráneo y Europa ---
  cartagineses: { nombre: "Cartagineses", conoce: 30, ciudad: "Cartago", icono: "🐘", letra: "K", color: "#a349a4", x: 183, y: 265,
              fuerza: 30, crece: 2.5, muro: 0.75, cada: 6, botin: { oro: 250, comida: 80 }, tributo: { oro: 12 },
              desc: "Mercaderes y marinos de África. Tienen Cerdeña, Córcega, la punta oeste de Sicilia y la costa de Libia. Muy poderosos." },
  liga:     { nombre: "Liga griega", conoce: 25, singular: true, ciudad: "Atenas", icono: "🦉", letra: "H", color: "#b97a57", x: 270, y: 245,
              fuerza: 40, crece: 3, muro: 0.75, cada: 7, botin: { oro: 300, ciencia: 120 }, tributo: { oro: 12, ciencia: 5 },
              desc: "Las ciudades griegas unidas: Grecia y sus colonias del sur de Italia y de Sicilia, como Siracusa. Filósofos, templos y falanges temibles." },
  persas:   { nombre: "Persas", conoce: 20, ciudad: "Sardes", icono: "🦁", letra: "P", color: "#ff7f27", x: 304, y: 235,
              fuerza: 80, crece: 5, muro: 0.5, cada: 6, botin: { oro: 500, comida: 150 }, tributo: { oro: 20, comida: 5 },
              desc: "El imperio más grande del mundo: va de Egipto y Anatolia hasta la India. Enfrentarlos es una locura... por ahora." },
  galos:    { nombre: "Galos", ciudad: "Bibracte", icono: "🪓", letra: "B", color: "#800040", x: 124, y: 158,
              fuerza: 35, crece: 3, muro: 0.25, cada: 6, botin: { comida: 150, oro: 120 }, tributo: { comida: 6, oro: 6 },
              desc: "Tribus guerreras de la Galia, con bosques enormes y muchos guerreros." },
  ilirios:  { nombre: "Ilirios", ciudad: "Escodra", icono: "🛶", letra: "Y", color: "#800080", x: 243, y: 199,
              fuerza: 20, crece: 1.8, muro: 0.25, cada: 8, botin: { madera: 100, oro: 80 }, tributo: { madera: 4, oro: 4 },
              desc: "Piratas y montañeses del otro lado del mar Adriático." },
  peonios:  { nombre: "Peonios", ciudad: "Bylazora", icono: "🏹", letra: "N", color: "#ff8080", x: 262, y: 194,
              fuerza: 20, crece: 1.6, muro: 0, cada: 8, botin: { comida: 80, oro: 80 }, tributo: { comida: 4, oro: 3 },
              desc: "Tribus de los Balcanes, al norte de Grecia." },
  celtiberos: { nombre: "Celtíberos", ciudad: "Numancia", icono: "🗡️", letra: "T", color: "#ff80ff", x: 74, y: 206,
              fuerza: 30, crece: 2.2, muro: 0.5, cada: 7, botin: { oro: 120, piedra: 80 }, tributo: { oro: 6, piedra: 3 },
              desc: "Guerreros del centro de Hispania, famosos por sus espadas." },
  lusitanos:{ nombre: "Lusitanos", ciudad: "Olisipo", icono: "🐐", letra: "Z", color: "#ffaec9", x: 36, y: 237,
              fuerza: 18, crece: 1.5, muro: 0, cada: 8, botin: { comida: 80, oro: 60 }, tributo: { comida: 4, oro: 3 },
              desc: "Pastores del oeste de Hispania, en la punta de Europa." },
  // --- Más lejos ---
  britanos: { nombre: "Celtas", lejano: true, ciudad: "Camulodunum", icono: "🍀", letra: "W", color: "#fff200", x: 96, y: 89,
              fuerza: 22, crece: 1.8, muro: 0.25, cada: 8, botin: { madera: 100, oro: 80 }, tributo: { madera: 4, oro: 4 },
              desc: "Tribus de las islas de Britania e Hibernia, con druidas y carros de guerra. Para llegar necesitás ⛵ Navegación." },
  germanos: { nombre: "Germanos", lejano: true, ciudad: "Teutoburgo", icono: "🐻", letra: "G", color: "#00ff40", x: 168, y: 115,
              fuerza: 32, crece: 2.6, muro: 0, cada: 6, botin: { madera: 150, comida: 80 }, tributo: { madera: 6, comida: 4 },
              desc: "Tribus germánicas de los bosques del norte. Muchos guerreros y muy pocas ciudades." },
  dacios:   { nombre: "Dacios", lejano: true, ciudad: "Sarmizegetusa", icono: "🐉", letra: "D", color: "#00ffff", x: 291, y: 152,
              fuerza: 24, crece: 2, muro: 0.5, cada: 7, botin: { oro: 150, piedra: 60 }, tributo: { oro: 6, piedra: 3 },
              desc: "Montañeses de los Cárpatos, ricos en oro y con fortalezas en las alturas." },
  tracios:  { nombre: "Tracios", ciudad: "Seutópolis", icono: "🐎", letra: "X", color: "#8080ff", x: 299, y: 183,
              fuerza: 24, crece: 2, muro: 0.25, cada: 7, botin: { comida: 100, oro: 100 }, tributo: { comida: 4, oro: 4 },
              desc: "Jinetes y guerreros de los Balcanes, entre el Danubio y el mar Egeo." },
  numidas:  { nombre: "Númidas", ciudad: "Cirta", icono: "🐪", letra: "M", color: "#408080", x: 112, y: 285,
              fuerza: 22, crece: 1.8, muro: 0.25, cada: 7, botin: { comida: 100, oro: 70 }, tributo: { comida: 5, oro: 3 },
              desc: "Jinetes rapidísimos del norte de África, vecinos de Cartago." },
  bereberes:{ nombre: "Bereberes", ciudad: "Garama", icono: "🏜️", letra: "Q", color: "#ffff80", x: 187, y: 310,
              fuerza: 16, crece: 1.2, muro: 0, cada: 9, botin: { oro: 80, comida: 40 }, tributo: { oro: 4, comida: 2 },
              desc: "Tribus del desierto que llevan caravanas por el Sahara." },
  kush:     { nombre: "Reino de Kush", lejano: true, singular: true, ciudad: "Napata", icono: "🏹", letra: "V", color: "#804040", x: 343, y: 411,
              fuerza: 45, crece: 3, muro: 0.5, cada: 7, botin: { oro: 300, piedra: 80 }, tributo: { oro: 12, piedra: 3 },
              desc: "Reino de arqueros y pirámides al sur de Egipto, sobre el río Nilo." },
  damot:    { nombre: "Reino de Damot", lejano: true, singular: true, ciudad: "Yeha", icono: "⛰️", letra: "F", color: "#8080c0", x: 398, y: 476,
              fuerza: 35, crece: 2.4, muro: 0.5, cada: 8, botin: { oro: 200, comida: 100 }, tributo: { oro: 8, comida: 4 },
              desc: "Reino de las montañas del Cuerno de África, con templos de piedra." },
  indios:   { nombre: "Confederación india", conoce: 15, lejano: true, singular: true, ciudad: "Pataliputra", icono: "🐅", letra: "O", color: "#0000a0", x: 737, y: 382,
              fuerza: 90, crece: 5, muro: 0.75, cada: 6, botin: { oro: 500, ciencia: 150 }, tributo: { oro: 20, ciencia: 6 },
              desc: "Los reinos de la India, a orillas del Ganges, con elefantes de guerra. Están en la otra punta del mundo." },
  zhou:     { nombre: "Dinastía Zhou", conoce: 15, lejano: true, singular: true, ciudad: "Luoyang", icono: "🐲", letra: "J", color: "#008000", x: 949, y: 281,
              fuerza: 100, crece: 6, muro: 0.75, cada: 6, botin: { oro: 600, ciencia: 200 }, tributo: { oro: 25, ciencia: 8 },
              desc: "El gran reino de China, en el fin del mundo conocido. Casi nadie en Roma sabe que existe." },
};

// Apoyo popular 😊 (de 0 a 100). Con mucho apoyo la gente trabaja con ganas y todo rinde más;
// con poco apoyo, rinde menos.
//   minimo / maximo: con 0 de apoyo los edificios e impuestos rinden "minimo" (0.7 = 70%),
//                    con 100 rinden "maximo" (1.3 = 130%). Con 50 rinden normal.
//   base: el apoyo al que vuelve Roma con el tiempo. Cada año el apoyo se acerca "vuelve" puntos a su base.
//   edificios: cuánto sube la base mientras el edificio esté en pie (y lo suman de golpe al terminarse).
//   sucesos: cuánto suma o resta cada cosa que pasa.
// Las tecnologías con efecto "apoyo" también suben la base (por ejemplo, Fortificaciones).
const APOYO = {
  inicio: 50,
  base: 50,
  vuelve: 2,
  minimo: 0.7,
  maximo: 1.3,
  derrocado: 10,      // si el apoyo llega a esto (o menos), el pueblo se rebela y perdés la partida
  aviso: 20,          // con este apoyo (o menos) la crónica te avisa que el pueblo está por rebelarse
  edificios: { muralla: 15, templo: 5, acueducto: 5, anfiteatro: 10, foro: 5, termas: 8, coliseo: 20 },
  sucesos: {
    saqueo: -25,      // te saquean Roma
    saqueoColonia: -10, // te saquean una ciudad que fundaste
    zonaPerdida: -5,  // un pueblo te quita una zona
    rechazo: 10,      // rechazás un ataque a Roma
    conquista: 15,    // conquistás un pueblo (tomás su capital)
    zona: 3,          // le ganás una zona a otro pueblo
    derrota: -10,     // perdés un ataque contra otro pueblo
    hambre: -3,       // cada año sin comida
  },
};

// Cómo atacan los pueblos enemigos.
//   probZona:     probabilidad de que vayan a conquistarte una zona pegada a su territorio (0.5 = 50%)
//   zonasExtra:   si te ganan una zona, avanzan y se quedan también con hasta esta cantidad de zonas tuyas pegadas
//   probCercana:  si van por una ciudad, probabilidad de que elijan la más cercana (si no, cualquiera)
//   ejercitoZona: qué parte de tu ejército llega a defender una zona que no es ciudad (0.5 = la mitad)
//   genteColonia: qué parte de los habitantes ayuda a defender una ciudad fundada (Roma tiene a todos)
//   aplastante:   si te ganan en Roma con el doble (o más) de fuerza, toman Roma y perdés la partida
const ATAQUES_ENEMIGOS = { probZona: 0.5, zonasExtra: 1, probCercana: 0.6, ejercitoZona: 0.5, genteColonia: 0.3, aplastante: 2 };

// Guerras entre los otros pueblos: cada año, cada pueblo puede invadir a un vecino con el que tiene frontera.
// Nunca toman la capital del otro: solo le sacan zonas (así ningún pueblo desaparece, salvo que lo conquistes vos).
//   prob:      chance por año de que un pueblo invada a un vecino (0.04 = 4%)
//   ejercito:  qué parte de su ejército manda el que invade (0.5 = la mitad)
//   defensa:   qué parte de su ejército defiende la frontera el invadido, con un bonus por pelear en casa
//   zonas:     cuántas zonas gana el vencedor (entre el primero y el segundo número)
//   perdidaGanador / perdidaPerdedor: qué parte de su ejército pierde cada uno (0.1 = 10%)
//   fuerzaPorZona: cuánto más fuerte se hace el que gana, por cada zona nueva
const GUERRAS_PUEBLOS = { prob: 0.04, ejercito: 0.5, defensa: 0.35, bonusCasa: 0.2, zonas: [1, 3],
  perdidaGanador: 0.1, perdidaPerdedor: 0.2, fuerzaPorZona: 0.5 };

// Acciones del gobierno (pestaña 🎭 Acciones): ganás o perdés apoyo.
//   costo:   lo que pagás
//   da:      lo que recibís
//   porHabitante: recursos extra por cada habitante (por ejemplo, un impuesto especial)
//   apoyo:   cuánto sube (+) o baja (-) el apoyo
//   espera:  años hasta poder repetirla
//   requiere: edificio terminado que hace falta (opcional)
const ACCIONES = {
  pan:       { nombre: "Repartir pan", icono: "🍞", desc: "Regalás trigo de los graneros a los pobres de Roma.",
               costo: { comida: 25 }, apoyo: 8, espera: 3 },
  fiesta:    { nombre: "Fiesta en las calles", icono: "🎉", desc: "Música, vino y banquetes pagados por el rey.",
               costo: { oro: 35, comida: 10 }, apoyo: 12, espera: 4 },
  ofrenda:   { nombre: "Ofrenda a Júpiter", icono: "🐂", desc: "Un gran sacrificio en el templo: el pueblo siente que los dioses están con Roma.",
               costo: { oro: 20, comida: 15 }, apoyo: 10, espera: 4, requiere: "templo" },
  discurso:  { nombre: "Discurso en el Foro", icono: "🗣️", desc: "Hablás ante el pueblo y prometés días mejores.",
               apoyo: 6, espera: 3, requiere: "foro" },
  juegos:    { nombre: "Juegos de gladiadores", icono: "🏟️", desc: "Días de espectáculos gratis en el anfiteatro.",
               costo: { oro: 60 }, apoyo: 20, espera: 5, requiere: "anfiteatro" },
  impuesto:  { nombre: "Impuesto especial", icono: "💸", desc: "Cobrás un impuesto extra de golpe: 2 de oro por habitante. A nadie le gusta.",
               porHabitante: { oro: 2 }, apoyo: -12, espera: 4 },
  requisar:  { nombre: "Requisar cosechas", icono: "🌾", desc: "Tus soldados se llevan parte de la cosecha de los campesinos.",
               da: { comida: 40 }, apoyo: -10, espera: 4 },
  forzados:  { nombre: "Trabajos forzados", icono: "⛓️", desc: "Obligás al pueblo a cortar árboles y picar piedra sin paga.",
               da: { madera: 30, piedra: 20 }, apoyo: -12, espera: 4 },
};

// Explorar: un habitante libre sale de viaje y vuelve con lo que vio.
// porTurno: casillas que avanza por año (tarda 1 año cada 4 casillas de distancia a tu territorio).
// radio: cuánto descubre alrededor de la zona a la que fue (2 = un cuadrado de 5 x 5 casillas).
// probHallazgo: chance de que traiga algo de lo que encontró en el camino.
const EXPLORACION = {
  porTurno: 4,
  radio: 2,
  probHallazgo: 0.3,
  hallazgos: [
    { texto: "encontró un bosque con frutos", efecto: { comida: 15 } },
    { texto: "volvió con troncos de un bosque caído", efecto: { madera: 15 } },
    { texto: "encontró unas ruinas con monedas viejas", efecto: { oro: 20 } },
    { texto: "aprendió costumbres de pastores del camino", efecto: { ciencia: 10 } },
  ],
  // 📜 Mapas antiguos escondidos en el mapa. Cuando descubrís el lugar donde está uno,
  // te dibuja una zona lejana que todavía no exploraste.
  //   cantidad:  cuántos hay escondidos en cada partida
  //   cerca / lejos: a qué distancia de Roma pueden estar escondidos (en casillas)
  //   alcance:   la zona que te muestra está a hasta esta distancia de donde lo encontraste
  //   radio:     cuánto descubre alrededor de esa zona (3 = un cuadrado de 7 x 7)
  mapas: { cantidad: 12, cerca: 4, lejos: 30, alcance: 20, radio: 3 },
  // 🗺️ Al conquistar un pueblo te quedás con sus mapas: ves todo lo que está a esta distancia
  // (en casillas) de su territorio. Cada pueblo puede tener su propio "conoce" en ENEMIGOS.
  conquista: 10,
};

// Fundar ciudades nuevas (desde el 🗺️ Mapa, en una casilla de tu territorio).
// Los recursos y los habitantes se comparten entre todas tus ciudades.
//   costo:     lo que cuesta la primera ciudad
//   aumento:   cada ciudad siguiente cuesta un 50% más que la primera (0.5)
//   colonos:   habitantes libres que hacen falta para fundarla
//   lotes:     terrenos de la ciudad nueva (filas de 5)
//   lotePlaza: dónde está su plaza
//   distancia: tiene que quedar al menos esta distancia de otra ciudad (2 = una casilla en el medio)
//   prohibidos: terrenos donde no se puede fundar (~ mar, m montaña)
//   nombres:   los nombres de las ciudades, en orden (también marca cuántas se pueden fundar)
const FUNDACION = {
  costo: { comida: 40, madera: 60, oro: 40 },
  aumento: 0.5,
  colonos: 4,
  lotes: 10,
  lotePlaza: 2,
  distancia: 2,
  prohibidos: ["~", "m"],
  nombres: ["Ostia", "Tibur", "Antium", "Ardea", "Lavinium", "Praeneste", "Tusculum", "Gabii"],
};

// Lo que rodea a cada ciudad en el mapa: bosques, colinas y montañas cerca hacen rendir más a algunos edificios.
//   radio: hasta qué distancia de la ciudad se cuentan las casillas (2 = dos casillas para cada lado)
//   edificios: para cada edificio, qué recurso suma, hasta cuánto como máximo, y qué terrenos lo ayudan
//              (letra de MAPA.terrenos) con cuánto suma cada casilla (0.5 = 1 cada 2 casillas)
const ALREDEDORES = {
  radio: 2,
  edificios: {
    granja:     { recurso: "comida", maximo: 3, terrenos: { f: 1 } },
    aserradero: { recurso: "madera", maximo: 4, terrenos: { f: 1 } },
    cantera:    { recurso: "piedra", maximo: 4, terrenos: { m: 1, h: 0.5 } },
  },
};

// Íconos de las ciudades en el mapa y en los botones de arriba de la ciudad
const ICONOS_CIUDAD = {
  roma: "👑",          // Roma
  fundada: "🏛️",       // las que fundás vos
  conquistada: "🦅",   // capitales de pueblos que conquistaste
  enemiga: "🏰",       // capitales de pueblos que todavía no son tuyos
};

// Ciudades conquistadas: cuando tomás la capital de un pueblo (o se une a Roma por la fama),
// esa ciudad pasa a ser tuya y podés construir en ella como en las que fundás.
//   lotes:     terrenos con los que viene (filas de 5)
//   lotePlaza: dónde está su plaza
//   edificios: lo que ya tenía construido el pueblo (terminado y listo para usar)
const CONQUISTA = {
  lotes: 10,
  lotePlaza: 2,
  edificios: ["casa", "granja"],
};

// Niveles de las ciudades: subir de nivel agranda la ciudad (más terrenos para construir).
// Todas las ciudades pueden tener todo lo que tiene Roma (también su propio Cuartel, Muralla, etc.),
// pero Roma empieza más grande y llega más lejos.
//   terrenos:  cuántos terrenos suma cada nivel (5 = una fila)
//   maximo:    nivel más alto de Roma y de las ciudades fundadas
//   costo:     lo que cuesta pasar a nivel 2
//   aumento:   cada nivel siguiente cuesta un 50% más que el anterior (0.5)
//   habitantes: cuánta gente tiene que tener tu reino por cada nivel que querés alcanzar
//              (para nivel 3 hacen falta 3 x 10 = 30 habitantes)
const NIVELES = {
  terrenos: 5,
  maximo: { roma: 6, ciudad: 4 },
  costo: { madera: 40, piedra: 20, oro: 30 },
  aumento: 0.5,
  habitantes: 10,
};

// Botón "Incitar inmigración": pagás oro y llega gente nueva (una vez por año, si hay lugar)
const INMIGRACION = { costo: { oro: 20 }, habitantes: 3 };

// Fama 🌟 (de 0 a 100): qué tan conocida es Roma en el mundo. Empieza en 0 y no baja sola.
//   habitantesCada: llega 1 habitante más por año cada tantos puntos de fama (25 → con 50 de fama, +2)
//   oroCada:        +1 de oro por año cada tantos puntos de fama (comerciantes que vienen a Roma)
//   alianza:        desde esta fama, los pueblos en paz que conocés pueden unirse a Roma solos, sin pelear.
//                   Solo se unen si su ejército es más chico que tu fama.
//   probAlianza:    probabilidad por año y por pueblo con fama 100 (con menos fama, es menos)
//   edificios:      fama que da terminar cada edificio
//   sucesos:        cuánto suma o resta cada cosa que pasa
const FAMA = {
  habitantesCada: 25,
  oroCada: 10,
  alianza: 50,
  probAlianza: 0.12,
  edificios: { templo: 1, muralla: 1, acueducto: 2, foro: 2, anfiteatro: 3, termas: 3, coliseo: 15 },
  sucesos: {
    conquista: 10,    // tomás la capital de un pueblo
    zona: 1,          // le ganás una zona a otro pueblo
    rechazo: 2,       // rechazás un ataque
    periodo: 10,      // proclamás la República o el Imperio
    ciudad: 3,        // fundás una ciudad
    derrota: -3,      // perdés un ataque
    zonaPerdida: -2,  // te quitan una zona
    saqueoColonia: -4,// te saquean una ciudad fundada
    saqueo: -10,      // te saquean Roma
  },
};

// Eventos al azar al empezar cada año.
// efecto: recursos que suman o restan. habitantes: gente que llega o se va.
const EVENTOS_CIUDAD = [
  { texto: "Cosecha abundante: +15 de comida.", efecto: { comida: 15 } },
  { texto: "Llega un sabio griego a enseñar: +12 de conocimiento.", efecto: { ciencia: 12 } },
  { texto: "Mercaderes fenicios pagan por comerciar: +15 de oro.", efecto: { oro: 15 } },
  { texto: "Una tormenta tira árboles: +15 de madera.", efecto: { madera: 15 } },
  { texto: "Bandidos asaltan los caminos: -10 de oro.", efecto: { oro: -10 } },
  { texto: "Las ratas se comen el granero: -10 de comida.", efecto: { comida: -10 } },
  { texto: "Campesinos de la zona se mudan a Roma: +3 habitantes.", habitantes: 3 },
  { texto: "Una fiebre recorre la ciudad: -2 habitantes.", habitantes: -2 },
];

// Mapa del mundo antiguo. Las casillas están en data/mapa-mundo.js (salen de la imagen del mapa):
//   MAPA_TERRENO (el terreno) y MAPA_DUENOS (de quién es cada casilla al empezar).
const MAPA = {
  version: 6,          // subirlo cuando cambia el dibujo del mapa: las partidas guardadas se rearman
  filas: MAPA_TERRENO,
  duenos: MAPA_DUENOS,
  roma: { x: 198, y: 209 },  // las filas impares del mapa están corridas medio hexágono
  colorRoma: "#d62828",
  colorNadie: "#d8d2c4",
  terrenos: {
    "~": { nombre: "Mar",      icono: "" },
    ".": { nombre: "Llanura",  icono: "" },
    "f": { nombre: "Bosque",   icono: "🌲" },
    "h": { nombre: "Colinas",  icono: "", simbolo: "⛰️" },   // simbolo: se usa en los textos (en el mapa no se dibuja)
    "m": { nombre: "Montañas", icono: "🏔️" },
  },
  // Al atacar una zona que no es la capital, la defienden estos soldados de su ejército (0.35 = 35%),
  // más un bonus según el terreno (0.5 = +50%).
  defensaZona: 0.35,
  bonusTerreno: { ".": 0, "f": 0.15, "h": 0.25, "m": 0.5 },
  // Al ganar una zona: qué parte del botín del pueblo te llevás (0.2 = 20%)
  // y cuánto pierde su ejército (0.15 = 15%).
  botinZona: 0.2,
  perdidaZona: 0.15,
  // ⚖️ Poder político que hace falta para quedarte con una zona (se paga solo si ganás la batalla).
  //   zona:     lo que cuesta cada zona común
  //   capital:  lo que cuesta la capital, más "porZona" por cada otra zona que todavía tenga ese pueblo
  //             (al tomar la capital te quedás con todo su territorio)
  //   maxCapital: lo máximo que puede costar una capital (para los pueblos enormes)
  poder: { zona: 10, capital: 15, porZona: 2, maxCapital: 120 },
  // Las islas (o cualquier costa lejos de tu territorio) solo se pueden atacar con esta tecnología
  tecMar: "navegacion",
};
