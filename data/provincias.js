// Datos del mapa: facciones, provincias, rutas y eventos.
// Se pueden editar libremente sin tocar el código del juego.

const FACCIONES = {
  roma:     { nombre: "Roma",      color: "#c0392b", jugador: true },
  galos:    { nombre: "Galos",     color: "#3a9d5d" },
  germanos: { nombre: "Germanos",  color: "#8d6e63" },
  hispanos: { nombre: "Hispanos",  color: "#e08e2b" },
  cartago:  { nombre: "Cartago",   color: "#8e44ad" },
  griegos:  { nombre: "Griegos",   color: "#2e86de" },
  egipcios: { nombre: "Egipcios",  color: "#c9a10c" },
};

// x, y: posición en el mapa (lienzo de 1000 x 560)
// oro: cuánto oro da por turno
// tropas: legiones al empezar
// fortaleza: true = capital fortificada (bonus al defender)
const PROVINCIAS = {
  roma:           { nombre: "Roma",              x: 520, y: 270, duenio: "roma",     oro: 8, tropas: 6, fortaleza: true },
  campania:       { nombre: "Campania",          x: 575, y: 345, duenio: "roma",     oro: 5, tropas: 3 },
  cisalpina:      { nombre: "Galia Cisalpina",   x: 470, y: 190, duenio: "galos",    oro: 5, tropas: 3 },
  narbonense:     { nombre: "Galia Narbonense",  x: 345, y: 215, duenio: "galos",    oro: 5, tropas: 3 },
  galia_central:  { nombre: "Galia Central",     x: 320, y: 115, duenio: "galos",    oro: 4, tropas: 4, fortaleza: true },
  germania:       { nombre: "Germania",          x: 470, y: 65,  duenio: "germanos", oro: 3, tropas: 5, fortaleza: true },
  recia:          { nombre: "Recia",             x: 590, y: 120, duenio: "germanos", oro: 3, tropas: 3 },
  hispania_norte: { nombre: "Hispania Norte",    x: 190, y: 200, duenio: "hispanos", oro: 4, tropas: 3, fortaleza: true },
  hispania_sur:   { nombre: "Hispania Sur",      x: 160, y: 335, duenio: "hispanos", oro: 6, tropas: 3 },
  cerdena:        { nombre: "Cerdeña",           x: 410, y: 320, duenio: "cartago",  oro: 3, tropas: 2 },
  sicilia:        { nombre: "Sicilia",           x: 540, y: 425, duenio: "cartago",  oro: 6, tropas: 3 },
  cartago:        { nombre: "Cartago",           x: 440, y: 475, duenio: "cartago",  oro: 8, tropas: 5, fortaleza: true },
  numidia:        { nombre: "Numidia",           x: 290, y: 470, duenio: "cartago",  oro: 4, tropas: 2 },
  iliria:         { nombre: "Iliria",            x: 660, y: 200, duenio: "griegos",  oro: 3, tropas: 2 },
  macedonia:      { nombre: "Macedonia",         x: 750, y: 245, duenio: "griegos",  oro: 5, tropas: 4, fortaleza: true },
  grecia:         { nombre: "Grecia",            x: 725, y: 340, duenio: "griegos",  oro: 7, tropas: 3 },
  asia:           { nombre: "Asia Menor",        x: 865, y: 260, duenio: "griegos",  oro: 6, tropas: 3 },
  siria:          { nombre: "Siria",             x: 930, y: 375, duenio: "egipcios", oro: 5, tropas: 3 },
  egipto:         { nombre: "Egipto",            x: 860, y: 485, duenio: "egipcios", oro: 9, tropas: 5, fortaleza: true },
  cirenaica:      { nombre: "Cirenaica",         x: 680, y: 485, duenio: "egipcios", oro: 3, tropas: 2 },
};

// Rutas entre provincias. mar: true = se cruza en barco (línea punteada).
const RUTAS = [
  ["roma", "campania"], ["roma", "cisalpina"], ["roma", "cerdena", true],
  ["campania", "sicilia", true],
  ["cisalpina", "narbonense"], ["cisalpina", "recia"], ["cisalpina", "iliria"],
  ["narbonense", "galia_central"], ["narbonense", "hispania_norte"], ["narbonense", "cerdena", true],
  ["galia_central", "germania"], ["galia_central", "hispania_norte"],
  ["germania", "recia"],
  ["recia", "iliria"],
  ["iliria", "macedonia"],
  ["macedonia", "grecia"], ["macedonia", "asia", true],
  ["grecia", "sicilia", true], ["grecia", "cirenaica", true],
  ["asia", "siria"],
  ["siria", "egipto"],
  ["egipto", "cirenaica"],
  ["cirenaica", "cartago"],
  ["sicilia", "cartago", true],
  ["cerdena", "cartago", true],
  ["cartago", "numidia"],
  ["numidia", "hispania_sur", true],
  ["hispania_norte", "hispania_sur"],
];

// Eventos al azar al empezar cada turno.
// tipo: "oro" (suma/resta oro) o "tropas" (suma legiones en Roma)
const EVENTOS = [
  { texto: "Cosecha abundante en los campos: +15 de oro.", tipo: "oro", valor: 15 },
  { texto: "Un senador rico dona a la República: +10 de oro.", tipo: "oro", valor: 10 },
  { texto: "Los piratas asaltan barcos mercantes: -10 de oro.", tipo: "oro", valor: -10 },
  { texto: "Juegos en el Circo: el pueblo se alista. +2 legiones en Roma.", tipo: "tropas", valor: 2 },
  { texto: "Veteranos vuelven a las armas: +1 legión en Roma.", tipo: "tropas", valor: 1 },
  { texto: "Incendio en el mercado: -8 de oro.", tipo: "oro", valor: -8 },
  { texto: "Nuevas minas de plata: +20 de oro.", tipo: "oro", valor: 20 },
];
