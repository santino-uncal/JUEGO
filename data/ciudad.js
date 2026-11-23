// Datos del modo "Rey de Roma": edificios, tecnologías, tropas, pueblos vecinos y eventos.
// Se pueden editar libremente (precios, producción, fuerza de los enemigos) sin tocar el código.

// icono: un emoji, o un dibujo de la carpeta img/ (para lo que no tiene un emoji claro)
const RECURSOS = {
  comida:  { nombre: "Comida",       icono: "🌾" },
  madera:  { nombre: "Madera",       icono: '<img class="ico" src="img/troncos.svg" alt="madera">' },
  piedra:  { nombre: "Piedra",       icono: '<img class="ico" src="img/piedra.svg" alt="piedra">' },
  oro:     { nombre: "Oro",          icono: "💰" },
  ciencia: { nombre: "Conocimiento", icono: "💡" },
};

// Con qué empezás
const INICIO = {
  recursos: { comida: 20, madera: 50, piedra: 0, oro: 20, ciencia: 0 },
  habitantes: 6,
  lotes: 20,          // terrenos de la ciudad (5 columnas x 4 filas)
  loteRegia: 7,       // dónde está el palacio
};

// costo: lo que se paga al empezar la obra
// turnos: cuánto tarda la obra
// trabajadores: habitantes que quedan ocupados trabajando ahí
// produce: lo que da cada turno (si tiene a toda su gente)
// capacidad: lugar para vivir que suma
// requiere: tecnología necesaria
// unico: solo se puede tener uno
const EDIFICIOS = {
  regia:      { nombre: "Regia", icono: "👑", desc: "El palacio del rey. Corazón de Roma.",
                produce: { comida: 3, oro: 2, ciencia: 3 }, capacidad: 10, unico: true, fijo: true },
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
                costo: { piedra: 30, oro: 20 }, turnos: 3, trabajadores: 1, produce: { oro: 2, ciencia: 2 }, requiere: "albanileria" },
  cuartel:    { nombre: "Cuartel", icono: "⚔️", desc: "Permite entrenar soldados.",
                costo: { madera: 25, oro: 10 }, turnos: 2, unico: true },
  muralla:    { nombre: "Muralla", icono: "🧱", desc: "Tus defensores pelean +50% mejor.",
                costo: { madera: 20, piedra: 40 }, turnos: 3, unico: true, requiere: "albanileria" },
  herreria:   { nombre: "Herrería", icono: "⚒️", desc: "Forja armas de hierro para legionarios.",
                costo: { madera: 20, piedra: 20 }, turnos: 2, trabajadores: 1, unico: true, requiere: "hierro" },
  establo:    { nombre: "Establo", icono: "🐴", desc: "Cría caballos para la caballería.",
                costo: { madera: 30, piedra: 10 }, turnos: 2, trabajadores: 1, unico: true, requiere: "equitacion" },
  taller:     { nombre: "Taller de asedio", icono: "🔧", desc: "Construye catapultas.",
                costo: { madera: 30, piedra: 30 }, turnos: 2, trabajadores: 1, unico: true, requiere: "ingenieria" },
  acueducto:  { nombre: "Acueducto", icono: "🌉", desc: "Trae agua: mucha más gente y algo de comida.",
                costo: { piedra: 50, oro: 20 }, turnos: 3, capacidad: 12, produce: { comida: 2 }, requiere: "ingenieria" },
  puerto:     { nombre: "Puerto", icono: "⚓", desc: "Barcos de pesca y de comercio.",
                costo: { madera: 30, piedra: 10 }, turnos: 2, trabajadores: 2, produce: { comida: 3, oro: 4 }, requiere: "navegacion" },
  anfiteatro: { nombre: "Anfiteatro", icono: "🏟️", desc: "Juegos y espectáculos: más gente quiere vivir en Roma.",
                costo: { piedra: 60, oro: 30 }, turnos: 3, trabajadores: 1, unico: true, produce: { oro: 3 }, capacidad: 8, requiere: "arquitectura" },
  foro:       { nombre: "Foro", icono: "🏤", desc: "Plaza de la política, los juicios y los negocios.",
                costo: { piedra: 40, oro: 30 }, turnos: 3, trabajadores: 2, unico: true, produce: { oro: 5, ciencia: 3 }, requiere: "senado" },
};

// Tecnologías: se pagan con conocimiento 💡
// requiere: tecnologías que hay que tener antes.
// efecto (opcional), se suman entre todas las que tengas:
//   mejora:      { edificio: { recurso: n } }  cada edificio de ese tipo produce n más
//   capacidad:   { edificio: n }               cada edificio de ese tipo da n más de lugar para vivir
//   impuestos:   0.5   +50% del oro que pagan los habitantes
//   ataque / defensa: 0.25   tu ejército pelea +25% mejor al atacar / al defender Roma
//   muralla:     0.5   la muralla protege +50% más
//   crecimiento: 1     llega 1 habitante más por turno (si hay comida y lugar)
//   tributo:     1     los pueblos conquistados pagan +100% de tributo
//   descuentoTropas: 0.25   los soldados cuestan 25% menos
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
  agricultura: { nombre: "Agricultura",  icono: "🌱", periodo: "monarquia", fila: 0.5, costo: 15, desc: "Arado de hierro: cada granja da +2 de comida.",
                 efecto: { mejora: { granja: { comida: 2 } } } },
  mineria:     { nombre: "Minería",      icono: "⛰️", periodo: "monarquia", fila: 2, costo: 15, desc: "Desbloquea la Cantera." },
  alfareria:   { nombre: "Alfarería",    icono: "🏺", periodo: "monarquia", fila: 4, costo: 15, desc: "Vasijas para guardar y vender: desbloquea el Mercado y cada casa da +2 de lugar.",
                 efecto: { capacidad: { casa: 2 } } },
  escritura:   { nombre: "Escritura",    icono: "✍️", periodo: "monarquia", fila: 7, costo: 15, desc: "Desbloquea la Biblioteca." },

  // Primeros reyes
  equitacion:  { nombre: "Equitación",   icono: "🐴", periodo: "monarquia", fila: 0, costo: 70, desc: "Desbloquea Establo y Caballería.", requiere: ["agricultura"] },
  riego:       { nombre: "Riego",        icono: "💧", periodo: "monarquia", fila: 1, costo: 45, desc: "Canales desde el Tíber: cada granja da +2 de comida más.", requiere: ["agricultura"],
                 efecto: { mejora: { granja: { comida: 2 } } } },
  bronce:      { nombre: "Bronce",       icono: "🔱", periodo: "monarquia", fila: 2.5, costo: 20, desc: "Desbloquea Lanceros.", requiere: ["mineria"] },
  albanileria: { nombre: "Albañilería",  icono: "🧱", periodo: "monarquia", fila: 4, costo: 20, desc: "Desbloquea Templo y Muralla.", requiere: ["alfareria"] },
  matematicas: { nombre: "Matemáticas",  icono: "📐", periodo: "monarquia", fila: 6, costo: 60, desc: "Cada biblioteca da +2 de conocimiento.", requiere: ["escritura"],
                 efecto: { mejora: { biblioteca: { ciencia: 2 } } } },
  filosofia:   { nombre: "Filosofía",    icono: "🦉", periodo: "monarquia", fila: 7, costo: 50, desc: "Los sabios debaten en la Regia: +2 de conocimiento por turno.", requiere: ["escritura"],
                 efecto: { mejora: { regia: { ciencia: 2 } } } },

  // Reyes etruscos
  hierro:      { nombre: "Hierro",       icono: "⚒️", periodo: "monarquia", fila: 2, costo: 70, desc: "Desbloquea Herrería y Legionarios.", requiere: ["equitacion", "bronce"] },
  arqueria:    { nombre: "Arquería",     icono: "🏹", periodo: "monarquia", fila: 3, costo: 40, desc: "Desbloquea Arqueros.", requiere: ["bronce"] },
  construccion:{ nombre: "Construcción", icono: "🔨", periodo: "monarquia", fila: 5, costo: 40, desc: "Vigas y tejas: cada casa da +3 de lugar y cada aserradero +2 de madera.", requiere: ["albanileria", "matematicas"],
                 efecto: { capacidad: { casa: 3 }, mejora: { aserradero: { madera: 2 } } } },

  // Fin de la monarquía
  democracia:  { nombre: "Democracia",   icono: "🗳️", periodo: "monarquia", fila: 4, costo: 120, desc: "El pueblo quiere elegir a sus gobernantes. Te permite proclamar la República.",
                 requiere: ["hierro", "filosofia"] },

  // ===== República =====
  // Primeros cónsules
  vias:        { nombre: "Vías romanas", icono: "🛣️", periodo: "republica", fila: 0.5, costo: 100, desc: "Caminos de piedra: llega 1 habitante más por turno.", requiere: ["equitacion", "alfareria"],
                 efecto: { crecimiento: 1 } },
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
  fortificacion:{ nombre: "Fortificaciones", icono: "🏰", periodo: "republica", fila: 5, costo: 130, desc: "La muralla protege el doble: +100% en vez de +50%.", requiere: ["ingenieria"],
                 efecto: { muralla: 0.5 } },
  arquitectura:{ nombre: "Arquitectura", icono: "📏", periodo: "republica", fila: 6, costo: 140, desc: "Arcos y bóvedas: desbloquea el Anfiteatro y cada cantera da +2 de piedra.", requiere: ["ingenieria"],
                 efecto: { mejora: { cantera: { piedra: 2 } } } },
  calendario:  { nombre: "Calendario",   icono: "🗓️", periodo: "republica", fila: 7, costo: 130, desc: "Saber cuándo sembrar: cada granja +1 de comida y la Regia +2 de conocimiento.", requiere: ["astronomia"],
                 efecto: { mejora: { granja: { comida: 1 }, regia: { ciencia: 2 } } } },
  senado:      { nombre: "Senado",       icono: "👴", periodo: "republica", fila: 8.5, costo: 150, desc: "Los ancianos aconsejan a los cónsules: desbloquea el Foro.", requiere: ["derecho"] },

  // Expansión
  administracion:{ nombre: "Administración", icono: "📋", periodo: "republica", fila: 0, costo: 150, desc: "Gobernadores en cada pueblo: los conquistados pagan el doble de tributo.", requiere: ["moneda"],
                 efecto: { tributo: 1 } },
  rutas:       { nombre: "Rutas marítimas", icono: "🚢", periodo: "republica", fila: 1, costo: 140, desc: "Comercio por mar: cada puerto da +3 de oro.", requiere: ["navegacion"],
                 efecto: { mejora: { puerto: { oro: 3 } } } },
  legion:      { nombre: "Legión profesional", icono: "💪", periodo: "republica", fila: 2.5, costo: 160, desc: "Soldados con sueldo fijo: entrenar tropas cuesta 25% menos.", requiere: ["tacticas"],
                 efecto: { descuentoTropas: 0.25 } },
  pretoriana:  { nombre: "Guardia pretoriana", icono: "⚜️", periodo: "republica", fila: 3.5, costo: 170, desc: "Desbloquea Pretorianos, la élite del ejército.", requiere: ["tacticas"] },

  // Fin de la república
  principado:  { nombre: "Principado",   icono: "🌿", periodo: "republica", fila: 5.5, costo: 220, desc: "Un general victorioso junta todo el poder en sus manos. Te permite proclamar el Imperio.",
                 requiere: ["legion", "senado"] },

  // ===== Imperio =====
  pax:         { nombre: "Pax Romana",   icono: "🕊️", periodo: "imperio", costo: 250, desc: "Paz en los caminos: llegan 2 habitantes más por turno y los tributos suben +50%.", requiere: ["administracion", "rutas"],
                 efecto: { crecimiento: 2, tributo: 0.5 } },
  urbanismo:   { nombre: "Urbanismo",    icono: "🏘️", periodo: "imperio", costo: 220, desc: "Ciudades bien planeadas: cada casa da +4 de lugar y cada acueducto +8.", requiere: ["fortificacion", "arquitectura"],
                 efecto: { capacidad: { casa: 4, acueducto: 8 } } },
  academia:    { nombre: "Academia",     icono: "🎓", periodo: "imperio", costo: 230, desc: "Escuelas de sabios: cada biblioteca da +3 de conocimiento y el Foro +3.", requiere: ["calendario", "senado"],
                 efecto: { mejora: { biblioteca: { ciencia: 3 }, foro: { ciencia: 3 } } } },
  imperial:    { nombre: "Ejército imperial", icono: "🚩", periodo: "imperio", costo: 260, desc: "Las legiones más temidas del mundo: todo tu ejército pelea +25% mejor.", requiere: ["legion", "pretoriana"],
                 efecto: { ataque: 0.25, defensa: 0.25 } },
};

// Los tres períodos de Roma. En el árbol solo se ve el período en el que estás.
// eras: nombre de cada columna del árbol en ese período.
// requisitos para pasar a este período desde el anterior:
//   tecnologia:  la tecnología que hay que investigar (la última del período anterior)
//   conquistas:  cuántos pueblos vecinos tenés que haber conquistado
//   costo:       lo que se paga al proclamarlo
// efecto: bonus que da el período desde que llegás (igual que en las tecnologías).
const PERIODOS = [
  { id: "monarquia", nombre: "Monarquía", icono: "👑", titulo: "Rey de Roma",
    eras: ["Fundación", "Primeros reyes", "Reyes etruscos", "Fin de la monarquía"],
    desc: "Roma es gobernada por un rey." },
  { id: "republica", nombre: "República", icono: "🏛️", titulo: "Cónsul de Roma",
    eras: ["Primeros cónsules", "Guerras púnicas", "Expansión", "Fin de la república"],
    desc: "El pueblo echa al último rey y Roma la gobiernan cónsules elegidos y el Senado.",
    requisitos: { tecnologia: "democracia" },
    efecto: { impuestos: 0.25 }, bonus: "+25% de oro de los impuestos." },
  { id: "imperio", nombre: "Imperio", icono: "🦅", titulo: "Emperador de Roma",
    eras: ["Los césares"],
    desc: "Un general victorioso se corona emperador. Roma domina el Mediterráneo.",
    requisitos: { tecnologia: "principado", conquistas: 2 },
    efecto: { ataque: 0.1, defensa: 0.1, tributo: 0.5 }, bonus: "Tu ejército pelea +10% mejor y los tributos suben +50%." },
];

// Tropas. ataque: fuerza al atacar. defensa: fuerza al defender Roma.
// Cada soldado ocupa 1 lugar de vivienda y come 1 de comida por turno.
const UNIDADES = {
  milicia:     { nombre: "Milicia",     icono: "🗡️", ataque: 1, defensa: 2, costo: { oro: 8, comida: 5 },               edificio: "cuartel" },
  lanceros:    { nombre: "Lanceros",    icono: "🔱", ataque: 2, defensa: 4, costo: { oro: 12, madera: 8 },              edificio: "cuartel",  requiere: "bronce" },
  arqueros:    { nombre: "Arqueros",    icono: "🏹", ataque: 4, defensa: 3, costo: { oro: 15, madera: 12 },             edificio: "cuartel",  requiere: "arqueria" },
  legionarios: { nombre: "Legionarios", icono: "🛡️", ataque: 6, defensa: 6, costo: { oro: 25, piedra: 8 },              edificio: "herreria", requiere: "hierro" },
  caballeria:  { nombre: "Caballería",  icono: "🐎", ataque: 9, defensa: 3, costo: { oro: 35, comida: 15 },             edificio: "establo",  requiere: "equitacion" },
  catapulta:   { nombre: "Catapulta",   icono: "☄️", ataque: 12, defensa: 1, costo: { oro: 45, madera: 25, piedra: 15 }, edificio: "taller",   requiere: "ingenieria",
                 desc: "Además, cada catapulta rompe parte de las murallas enemigas." },
  pretorianos: { nombre: "Pretorianos", icono: "💂", ataque: 10, defensa: 10, costo: { oro: 50, piedra: 10 },          edificio: "cuartel",  requiere: "pretoriana" },
};

// Pueblos vecinos.
// x, y: dónde está su ciudad en el mapa (columna y fila, empezando en 0).
// fuerza: tamaño de su ejército al empezar. crece: cuánto suma por turno.
// muro: bonus de sus murallas al defenderse (0.5 = +50%).
// primerAtaque: turno en que llegan por primera vez a Roma. cada: turnos entre ataques.
// botin: lo que ganás al conquistarlos. tributo: lo que te pagan cada turno después.
const ENEMIGOS = {
  sabinos:  { nombre: "Sabinos",  ciudad: "Cures",    icono: "🐑", x: 8, y: 3, fuerza: 5,  crece: 0.9, muro: 0,
              primerAtaque: 10, cada: 9, botin: { comida: 40, oro: 30 }, tributo: { comida: 3, oro: 2 },
              desc: "Pastores de las montañas. Son pocos, pero atrevidos." },
  etruscos: { nombre: "Etruscos", ciudad: "Veyes",    icono: "🏺", x: 4, y: 3, fuerza: 12, crece: 1.2, muro: 0.5,
              primerAtaque: 18, cada: 8, botin: { oro: 80, piedra: 40 }, tributo: { oro: 5, piedra: 2 },
              desc: "Ricos y sabios, con una ciudad amurallada." },
  samnitas: { nombre: "Samnitas", ciudad: "Bovianum", icono: "🐺", x: 9, y: 7, fuerza: 18, crece: 1.8, muro: 0.25,
              primerAtaque: 26, cada: 7, botin: { oro: 100, madera: 60 }, tributo: { oro: 5, madera: 4 },
              desc: "Guerreros duros de los Apeninos." },
  galos:    { nombre: "Galos senones", ciudad: "Sena Gallica", icono: "🐗", x: 5, y: 0, fuerza: 25, crece: 2.4, muro: 0,
              primerAtaque: 34, cada: 6, botin: { oro: 150, comida: 80 }, tributo: { oro: 8, comida: 4 },
              desc: "Bárbaros feroces del norte. Saquean todo a su paso." },
};

// Cuántas veces pueden saquear Roma antes de que caiga tu reinado
const MAX_SAQUEOS = 3;

// Botón "Incitar inmigración": pagás oro y llega gente nueva (una vez por turno, si hay lugar)
const INMIGRACION = { costo: { oro: 20 }, habitantes: 3 };

// Eventos al azar al empezar cada turno.
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

// Mapa de la zona (Italia, simplificada). Cada letra es una casilla:
//   ~ mar   . llanura   f bosque   h colinas   m montaña
// Al empezar solo ves las casillas pegadas a Roma; el resto se descubre explorando.
const MAPA = {
  filas: [
    "mmmm..ff..mmm",
    "~mh..ff...h~~",
    "~~hf..hmm..~~",
    "~~.f..hmh..~~",
    "~~~..f.mm.h~~",
    "~~~~...hm..~~",
    "~~~~~..mh...~",
    "~~~~~~.hm...~",
    "~~~~~~~.hf..~",
  ],
  roma: { x: 6, y: 5 },
  terrenos: {
    "~": { nombre: "Mar",      icono: "🌊" },
    ".": { nombre: "Llanura",  icono: "" },
    "f": { nombre: "Bosque",   icono: "🌲" },
    "h": { nombre: "Colinas",  icono: "⛰️" },
    "m": { nombre: "Montañas", icono: "🏔️" },
  },
};

// Explorar: un habitante libre sale de viaje y vuelve con lo que vio.
// Tarda 1 turno por cada 2 casillas de distancia a Roma.
// probHallazgo: chance de que traiga algo de lo que encontró en el camino.
const EXPLORACION = {
  probHallazgo: 0.3,
  hallazgos: [
    { texto: "encontró un bosque con frutos", efecto: { comida: 15 } },
    { texto: "volvió con troncos de un bosque caído", efecto: { madera: 15 } },
    { texto: "encontró unas ruinas con monedas viejas", efecto: { oro: 20 } },
    { texto: "aprendió costumbres de pastores del camino", efecto: { ciencia: 10 } },
  ],
};
