// Tutorial del Modo TEG: los carteles que aparecen al empezar cada partida (los muestra js/tutorial.js).
// Cada paso puede:
//   resaltar: qué parte de la pantalla se marca (un selector CSS, por ejemplo "#btn-turno")
//   elegir:   true = se elige tu capital, para que se vean los botones de mover y reclutar
//   solo / conAmigos: true = el paso aparece solo cuando jugás solo / con amigos
const PASOS_TUTORIAL_TEG = [
  {
    titulo: "🗺️ ¡Bienvenido al Modo TEG!",
    texto: "Es el año 264 a.C. Sos <b>Roma</b> y el Senado te encarga conquistar el Mediterráneo, provincia por provincia. Te muestro cómo se juega en unos pocos pasos.",
    solo: true,
  },
  {
    titulo: "🗺️ ¡Bienvenido al Modo TEG!",
    texto: "Es el año 264 a.C. Cada uno maneja un pueblo y juegan por turnos. Los pueblos que nadie eligió los maneja la computadora. Te muestro cómo se juega en unos pocos pasos.",
    conAmigos: true,
  },
  {
    titulo: "🌍 El mapa",
    texto: "Cada círculo es una provincia y su color dice de qué pueblo es. El número del medio son las <b>legiones</b> que hay ahí. Las líneas unen provincias vecinas (las punteadas cruzan el mar). La ★ marca las capitales.",
    resaltar: "#mapa-contenedor",
  },
  {
    titulo: "🔍 Mirar una provincia",
    texto: "Tocá cualquier provincia y acá ves de quién es, cuántas legiones tiene, cuánto oro da por turno y con quién limita.",
    resaltar: "#info",
    elegir: true,
  },
  {
    titulo: "⚔️ Mover y atacar",
    texto: "Cuando tocás una provincia tuya, con esta barrita elegís cuántas legiones mandar. Después tocá una vecina <b>resaltada</b>: si es tuya, las tropas se mueven; si es enemiga, hay <b>batalla</b> con dados. Siempre queda al menos 1 legión cuidando.",
    resaltar: "#acciones",
    elegir: true,
  },
  {
    titulo: "💰 Reclutar",
    texto: "Con oro reclutás legiones nuevas en la provincia que elegiste: 10 💰 cada una. Las tropas que se mueven o se reclutan descansan hasta el turno siguiente.",
    resaltar: "#acciones .fila",
    elegir: true,
  },
  {
    titulo: "📊 Cómo vas",
    texto: "Acá arriba ves el turno, tu oro (y cuánto cobrás por turno) y cuántas provincias tenés del total.",
    resaltar: "header .stats",
  },
  {
    titulo: "👥 La sala",
    texto: "Acá ves a los jugadores y a quién le toca. Solo podés dar órdenes en tu turno.",
    resaltar: "#jugadores",
    conAmigos: true,
  },
  {
    titulo: "➜ Terminar turno",
    texto: "Cuando termines, apretá acá: cobrás el oro de tus provincias y los demás pueblos hacen su jugada. Todo queda anotado en la <b>Crónica</b>. Los primeros 2 turnos los enemigos solo se arman: ¡aprovechá para organizarte!",
    resaltar: "#btn-turno",
  },
  {
    titulo: "🏆 ¡A jugar!",
    texto: "Las capitales se defienden mejor, y Roma todavía más. Ganás si conquistás todas las provincias; perdés si cae Roma. Si te olvidás de algo, abajo de todo está <b>¿Cómo se juega?</b>, y ahí podés volver a ver este tutorial.",
    solo: true,
  },
  {
    titulo: "🏆 ¡A jugar!",
    texto: "Las capitales se defienden mejor. Quedás afuera si perdés todas tus provincias; gana el último que queda. Si te olvidás de algo, abajo de todo está <b>¿Cómo se juega?</b>, y ahí podés volver a ver este tutorial.",
    conAmigos: true,
  },
];
