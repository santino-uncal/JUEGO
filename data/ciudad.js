// Datos del modo "Rey de Roma": edificios, tecnologías, tropas, pueblos vecinos y eventos.
// Se pueden editar libremente (precios, producción, fuerza de los enemigos) sin tocar el código.

const RECURSOS = {
  comida:  { nombre: "Comida",       icono: "🌾" },
  madera:  { nombre: "Madera",       icono: "🌲" },
  piedra:  { nombre: "Piedra",       icono: "⛰️" },
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
                costo: { madera: 20 }, turnos: 2, trabajadores: 2, produce: { piedra: 3 }, requiere: "albanileria" },
  biblioteca: { nombre: "Biblioteca", icono: "📚", desc: "Los sabios estudian y descubren cosas nuevas.",
                costo: { madera: 20, piedra: 10, oro: 10 }, turnos: 2, trabajadores: 1, produce: { ciencia: 4 }, requiere: "escritura" },
  mercado:    { nombre: "Mercado", icono: "🏪", desc: "El comercio llena las arcas.",
                costo: { madera: 20, piedra: 20 }, turnos: 2, trabajadores: 2, produce: { oro: 6 }, requiere: "comercio" },
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
};

// Tecnologías: se pagan con conocimiento 💡
const TECNOLOGIAS = {
  agricultura: { nombre: "Agricultura",     icono: "🌱", costo: 15,  desc: "Arado de hierro: cada granja da +2 de comida." },
  albanileria: { nombre: "Albañilería",     icono: "🧱", costo: 20,  desc: "Desbloquea Cantera, Templo y Muralla." },
  bronce:      { nombre: "Bronce",          icono: "🔱", costo: 20,  desc: "Desbloquea Lanceros." },
  escritura:   { nombre: "Escritura",       icono: "✍️", costo: 15,  desc: "Desbloquea la Biblioteca." },
  arqueria:    { nombre: "Arquería",        icono: "🏹", costo: 40,  desc: "Desbloquea Arqueros.", requiere: ["bronce"] },
  comercio:    { nombre: "Comercio",        icono: "⚖️", costo: 50,  desc: "Desbloquea el Mercado.", requiere: ["escritura"] },
  matematicas: { nombre: "Matemáticas",     icono: "📐", costo: 60,  desc: "Cada biblioteca da +2 de conocimiento.", requiere: ["escritura"] },
  hierro:      { nombre: "Hierro",          icono: "⚒️", costo: 70,  desc: "Desbloquea Herrería y Legionarios.", requiere: ["bronce"] },
  equitacion:  { nombre: "Equitación",      icono: "🐴", costo: 70,  desc: "Desbloquea Establo y Caballería.", requiere: ["agricultura"] },
  derecho:     { nombre: "Derecho romano",  icono: "📜", costo: 90,  desc: "Impuestos ordenados: +50% de oro de los habitantes.", requiere: ["comercio"] },
  ingenieria:  { nombre: "Ingeniería",      icono: "🏗️", costo: 100, desc: "Desbloquea Acueducto, Taller y Catapultas.", requiere: ["matematicas", "albanileria"] },
  disciplina:  { nombre: "Disciplina",      icono: "🦅", costo: 120, desc: "Todo tu ejército pelea +25% mejor.", requiere: ["hierro"] },
  fortificacion:{ nombre: "Fortificaciones", icono: "🏰", costo: 100, desc: "La muralla da +100% en vez de +50%.", requiere: ["ingenieria"] },
};

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
};

// Pueblos vecinos.
// fuerza: tamaño de su ejército al empezar. crece: cuánto suma por turno.
// muro: bonus de sus murallas al defenderse (0.5 = +50%).
// primerAtaque: turno en que llegan por primera vez a Roma. cada: turnos entre ataques.
// botin: lo que ganás al conquistarlos. tributo: lo que te pagan cada turno después.
const ENEMIGOS = {
  sabinos:  { nombre: "Sabinos",  ciudad: "Cures",    icono: "🐑", fuerza: 5,  crece: 0.9, muro: 0,
              primerAtaque: 10, cada: 9, botin: { comida: 40, oro: 30 }, tributo: { comida: 3, oro: 2 },
              desc: "Pastores de las montañas. Son pocos, pero atrevidos." },
  etruscos: { nombre: "Etruscos", ciudad: "Veyes",    icono: "🏺", fuerza: 12, crece: 1.2, muro: 0.5,
              primerAtaque: 18, cada: 8, botin: { oro: 80, piedra: 40 }, tributo: { oro: 5, piedra: 2 },
              desc: "Ricos y sabios, con una ciudad amurallada." },
  samnitas: { nombre: "Samnitas", ciudad: "Bovianum", icono: "🐺", fuerza: 18, crece: 1.8, muro: 0.25,
              primerAtaque: 26, cada: 7, botin: { oro: 100, madera: 60 }, tributo: { oro: 5, madera: 4 },
              desc: "Guerreros duros de los Apeninos." },
  galos:    { nombre: "Galos senones", ciudad: "Sena Gallica", icono: "🐗", fuerza: 25, crece: 2.4, muro: 0,
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
