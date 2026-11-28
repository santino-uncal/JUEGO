// Tutorial de Rey de Roma: los carteles que aparecen al empezar cada partida (los muestra js/tutorial.js).
// Cada paso puede:
//   resaltar: qué parte de la pantalla se marca (un selector CSS, por ejemplo "#recursos")
//   vista:    qué se muestra a la izquierda ("ciudad", "mapa" o "arbol")
//   pestania: qué pestaña del panel se abre ("construir", "acciones", "ejercito" o "vecinos")
const PASOS_TUTORIAL_CIUDAD = [
  {
    titulo: "👑 ¡Bienvenido, rey de Roma!",
    texto: "Es el año 753 a.C. Rómulo te deja una colina y un puñado de gente. Tu misión: hacer crecer Roma hasta dominar el Mediterráneo. Te muestro lo básico en unos pocos pasos.",
    vista: "ciudad",
  },
  {
    titulo: "📦 Tus recursos",
    texto: "Acá arriba ves todo lo que tenés: 🌾 comida, madera, piedra, 💰 oro, 💡 conocimiento y ⚖️ poder político. También tus habitantes, tu ejército, el 😊 apoyo popular y la 🌟 fama. Al lado de cada uno, cuánto ganás por año.",
    resaltar: "#recursos",
  },
  {
    titulo: "🏛️ Tu ciudad",
    texto: "Estos son los terrenos de Roma. Tocá uno vacío para construir. Para arrancar conviene hacer <b>granjas</b> (comida) y <b>casas</b> (lugar para que llegue más gente).",
    resaltar: "#ciudad",
    vista: "ciudad",
  },
  {
    titulo: "🏗️ Qué construir",
    texto: "Cuando tocás un terreno vacío, acá aparece la lista de edificios. Con <b>Disponibles</b> ves solo lo que podés hacer ya, y con el 🔍 buscador encontrás algo por su nombre. Casi todos los edificios necesitan <b>habitantes libres</b> que trabajen ahí.",
    resaltar: "#panel .pestanias",
    pestania: "construir",
  },
  {
    titulo: "📣 Más gente",
    texto: "Si te falta gente, con este botón pagás oro y llegan habitantes nuevos (una vez por año, si hay lugar en las casas).",
    resaltar: "#btn-inmigracion",
  },
  {
    titulo: "🗺️ El mapa",
    texto: "Al principio solo conocés lo que está cerca de Roma. Mandá <b>exploradores</b> a las zonas oscuras para descubrir el resto. Acá también vas a ver a los pueblos vecinos y sus ciudades.",
    resaltar: "#vista-mapa",
    vista: "mapa",
  },
  {
    titulo: "🌳 Tecnologías",
    texto: "Con el 💡 conocimiento investigás tecnologías que desbloquean edificios y tropas. Elegí una lejana como <b>🎯 meta</b> y se investiga sola todo el camino. Con 🗳️ <b>Democracia</b> podés pasar a la República.",
    resaltar: "#vista-arbol",
    vista: "arbol",
  },
  {
    titulo: "⚔️ Ejército y vecinos",
    texto: "En <b>⚔️ Ejército</b> entrenás soldados (primero necesitás un Cuartel). En <b>🗺️ Vecinos</b> ves a cada pueblo, le declarás la guerra o firmás la paz. ¡Ojo! Algunos te van a atacar solos: te avisan 2 años antes.",
    resaltar: "#panel .pestanias",
    vista: "ciudad",
    pestania: "vecinos",
  },
  {
    titulo: "😊 Contento al pueblo",
    texto: "En <b>🎭 Acciones</b> podés ganarte al pueblo (repartir pan, fiestas) o exprimirlo a cambio de recursos. Si el apoyo baja a 10, el pueblo se rebela y perdés.",
    resaltar: "#panel .pestanias",
    pestania: "acciones",
  },
  {
    titulo: "➜ Siguiente año",
    texto: "Cuando termines de hacer cosas, pasá al año siguiente: se cobran los recursos, avanzan las obras y pasan cosas. Todo queda anotado en la <b>Crónica</b>, acá abajo.",
    resaltar: "#btn-turno",
    pestania: "construir",
  },
  {
    titulo: "🏆 ¡A jugar!",
    texto: "Ganás si conquistás a todos los pueblos del Mediterráneo. Si te olvidás de algo, abajo de todo está <b>¿Cómo se juega?</b>, y ahí podés volver a ver este tutorial.",
    vista: "ciudad",
  },
];
