// Imperium – lógica del modo TEG (solo o con amigos)
const CLAVE_GUARDADO = "imperium_partida";     // partida de un jugador
const CLAVE_SALA = "imperium_sala";            // partida online (la guarda el anfitrión)
const CLAVE_DATOS = "imperium_mis_datos";      // último nombre y código usados
const COSTO_LEGION = 10;
const SVG_NS = "http://www.w3.org/2000/svg";

let estado = null;        // toda la partida
let seleccion = null;     // id de la provincia elegida (solo en esta pantalla)
let seguirAtaque = null;  // si conquisto esta provincia, queda elegida
let ultimoGolpe = 0;      // para animar cada batalla una sola vez
let modo = "solo";        // "solo" | "anfitrion" | "invitado"
let miFaccion = "roma";
let sala = null;          // anfitrión: datos de la sala de espera
let codigoSala = null;
const vecinos = {};       // id -> lista de ids vecinos

// ---------- Preparación ----------

for (const id in PROVINCIAS) vecinos[id] = [];
for (const [a, b] of RUTAS) { vecinos[a].push(b); vecinos[b].push(a); }

// La capital de cada pueblo es su provincia con ★
const CAPITAL = {};
for (const id in PROVINCIAS) if (PROVINCIAS[id].fortaleza) CAPITAL[PROVINCIAS[id].duenio] = id;

// jugadores: [{ faccion, nombre, id, conectado }] (en el orden de FACCIONES)
function partidaNueva(jugadores) {
  const provs = {};
  for (const id in PROVINCIAS) {
    const p = PROVINCIAS[id];
    provs[id] = { duenio: p.duenio, tropas: p.tropas, cansadas: 0 };
  }
  const oro = {};
  for (const f in FACCIONES) oro[f] = 0;
  for (const j of jugadores) oro[j.faccion] = 20;
  return { turno: 1, turnoDe: 0, jugadores, oro, provs, log: [], golpes: { n: 0, ids: [] }, fin: null };
}

const esOnline = () => modo !== "solo";
const multi = () => estado && estado.jugadores.length > 1;

function guardar() {
  if (modo === "solo") localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(estado));
  if (modo === "anfitrion") localStorage.setItem(CLAVE_SALA, JSON.stringify({ codigo: codigoSala, estado }));
}

function cargarSolo() {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE_GUARDADO));
    if (!d || !d.provs || Object.keys(d.provs).length !== Object.keys(PROVINCIAS).length) return null;
    // Partidas guardadas antes de que existiera el modo con amigos
    if (typeof d.oro === "number") {
      d.oro = { ...(d.oroIA || {}), roma: d.oro };
      delete d.oroIA;
    }
    if (!d.jugadores) d.jugadores = [{ faccion: "roma", nombre: "Vos", conectado: true }];
    d.turnoDe = d.turnoDe || 0;
    d.golpes = d.golpes || { n: 0, ids: [] };
    if (d.terminado && !d.fin) d.fin = { ganador: d.provs.roma.duenio === "roma" ? "roma" : null };
    delete d.terminado;
    return d;
  } catch (e) { return null; }
}

function salaGuardada() {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE_SALA));
    if (d && d.codigo && d.estado && !d.estado.fin) return d;
  } catch (e) { /* nada */ }
  return null;
}

// ---------- Utilidades ----------

const $ = (id) => document.getElementById(id);
const dado = () => 1 + Math.floor(Math.random() * 6);
const provinciasDe = (f) => Object.keys(estado.provs).filter((id) => estado.provs[id].duenio === f);
const ingresoDe = (f) => provinciasDe(f).reduce((s, id) => s + PROVINCIAS[id].oro, 0);
const esHumano = (f) => estado.jugadores.some((j) => j.faccion === f);
const jugadorDe = (f) => estado.jugadores.find((j) => j.faccion === f);
const jugadorActual = () => estado.jugadores[estado.turnoDe];
const vivo = (f) => provinciasDe(f).length > 0;
const esMia = (id) => estado.provs[id].duenio === miFaccion;
const esMiTurno = () => !estado.fin && jugadorActual() && jugadorActual().faccion === miFaccion;
const movibles = (id) => {
  const p = estado.provs[id];
  return Math.max(0, Math.min(p.tropas - 1, p.tropas - p.cansadas));
};
const escapar = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// "Galos (Juan)" en partidas con amigos
function quien(f) {
  const j = jugadorDe(f);
  return j && multi() ? `${FACCIONES[f].nombre} (${escapar(j.nombre)})` : FACCIONES[f].nombre;
}

// bien / mal: pueblos para los que la noticia es buena o mala (se pinta verde o rojo)
function anotar(texto, clase = "", bien = [], mal = []) {
  estado.log.unshift({ texto, clase, bien, mal });
  estado.log = estado.log.slice(0, 60);
}

// ---------- Dibujo del mapa ----------

function crear(tag, attrs, padre) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  if (padre) padre.appendChild(el);
  return el;
}

function dibujarMapa() {
  const svg = $("mapa");
  svg.innerHTML = "";

  // Tierra: manchas que se funden formando "continentes"
  const defs = crear("defs", {}, svg);
  const filtro = crear("filter", { id: "fundir" }, defs);
  crear("feGaussianBlur", { in: "SourceGraphic", stdDeviation: "14", result: "b" }, filtro);
  crear("feColorMatrix", { in: "b", mode: "matrix", values: "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -12" }, filtro);
  const tierra = crear("g", { filter: "url(#fundir)", fill: "#e9dcb5" }, svg);
  for (const id in PROVINCIAS) {
    const p = PROVINCIAS[id];
    crear("circle", { cx: p.x, cy: p.y, r: 58 }, tierra);
  }
  for (const [a, b, mar] of RUTAS) {
    if (mar) continue;
    const pa = PROVINCIAS[a], pb = PROVINCIAS[b];
    crear("line", { x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y, stroke: "#e9dcb5", "stroke-width": 50 }, tierra);
  }

  for (const [a, b, mar] of RUTAS) {
    const pa = PROVINCIAS[a], pb = PROVINCIAS[b];
    crear("line", { x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y, class: mar ? "ruta mar" : "ruta" }, svg);
  }

  for (const id in PROVINCIAS) {
    const p = PROVINCIAS[id];
    const g = crear("g", { class: "prov", id: "prov-" + id }, svg);
    crear("circle", { class: "halo", cx: p.x, cy: p.y, r: 42 }, g);
    crear("circle", { class: "anillo", cx: p.x, cy: p.y, r: 33 }, g);
    crear("circle", { class: "ficha", cx: p.x, cy: p.y, r: 24 }, g);
    crear("text", { class: "num", x: p.x, y: p.y }, g);
    const nombre = crear("text", { class: "nombre", x: p.x, y: p.y + 44 }, g);
    nombre.textContent = p.nombre;
    if (p.fortaleza) {
      const est = crear("text", { class: "estrella", x: p.x + 22, y: p.y - 18 }, g);
      est.textContent = "★";
    }
    g.addEventListener("click", () => tocarProvincia(id));
  }
}

function actualizarMapa() {
  const objetivos = seleccion && esMia(seleccion) && esMiTurno() && movibles(seleccion) > 0 ? vecinos[seleccion] : [];
  for (const id in PROVINCIAS) {
    const p = estado.provs[id];
    const g = $("prov-" + id);
    const color = FACCIONES[p.duenio].color;
    g.querySelector(".halo").setAttribute("fill", color);
    g.querySelector(".ficha").setAttribute("fill", color);
    g.querySelector(".num").textContent = p.tropas;
    g.classList.toggle("seleccionada", id === seleccion);
    g.classList.toggle("objetivo", objetivos.includes(id));
  }
}

// ---------- Interfaz ----------

function actualizarTodo() {
  if (!estado) return;
  if (seguirAtaque && estado.provs[seguirAtaque] && esMia(seguirAtaque)) seleccion = seguirAtaque;
  seguirAtaque = null;

  $("turno").textContent = estado.turno;
  $("oro").textContent = estado.oro[miFaccion] || 0;
  $("ingreso").textContent = `(+${ingresoDe(miFaccion)}/turno)`;
  $("cant-prov").textContent = provinciasDe(miFaccion).length;
  $("total-prov").textContent = Object.keys(PROVINCIAS).length;

  actualizarMapa();
  actualizarPanel();
  actualizarJugadores();

  $("log").innerHTML = estado.log.map((l) => {
    const clase = l.clase || ((l.bien || []).includes(miFaccion) ? "bien" : (l.mal || []).includes(miFaccion) ? "mal" : "");
    return `<li class="${clase}">${l.texto}</li>`;
  }).join("");

  // Animar las batallas nuevas
  if (estado.golpes && estado.golpes.n !== ultimoGolpe) {
    ultimoGolpe = estado.golpes.n;
    for (const id of estado.golpes.ids) animarGolpe(id);
  }

  // Botón de terminar turno y aviso de a quién le toca
  const btn = $("btn-turno");
  btn.disabled = !esMiTurno();
  btn.textContent = esMiTurno() || !multi() ? "Terminar turno ➜" : `Turno de ${FACCIONES[jugadorActual().faccion].nombre}…`;
  document.title = esMiTurno() && multi() ? "🔔 ¡Te toca! – Imperium" : "Imperium – Modo TEG";

  if (estado.fin) mostrarFin(); else $("cartel").classList.add("oculto");
}

function actualizarJugadores() {
  const caja = $("jugadores");
  if (!multi()) { caja.classList.add("oculto"); return; }
  caja.classList.remove("oculto");
  $("codigo-chico").textContent = codigoSala || "";
  $("lista-jugadores").innerHTML = estado.jugadores.map((j, i) => {
    const f = FACCIONES[j.faccion];
    const muerto = !vivo(j.faccion);
    const toca = i === estado.turnoDe && !estado.fin;
    return `<li class="${toca ? "toca" : ""} ${muerto ? "muerto" : ""}">
      <span class="punto" style="background:${f.color}"></span>
      <b>${f.nombre}</b> ${escapar(j.nombre)}${j.faccion === miFaccion ? " (vos)" : ""}
      <span class="derecha">${muerto ? "☠️" : provinciasDe(j.faccion).length + " 🗺️"}
      ${j.conectado ? "" : '<span title="Se desconectó">📵</span>'}${toca ? " 🎲" : ""}</span></li>`;
  }).join("");
  const actual = jugadorActual();
  $("aviso-turno").innerHTML = estado.fin ? "Partida terminada."
    : esMiTurno() ? "<b>¡Te toca a vos!</b>"
    : !vivo(miFaccion) ? "Te eliminaron, pero podés seguir mirando."
    : `Esperando a <b>${quien(actual.faccion)}</b>…`;
}

function actualizarPanel() {
  const info = $("info");
  const acciones = $("acciones");
  if (!seleccion) {
    const f = FACCIONES[miFaccion];
    info.innerHTML = `<p class="ayuda">Tocá una provincia tuya (<span style="color:${f.color}">${f.nombre}</span>) para dar órdenes.</p>`;
    acciones.classList.add("oculto");
    return;
  }
  const datos = PROVINCIAS[seleccion];
  const p = estado.provs[seleccion];
  const f = FACCIONES[p.duenio];
  const listaVecinos = vecinos[seleccion].map((v) => PROVINCIAS[v].nombre).join(", ");
  info.innerHTML = `
    <h2><span class="punto" style="background:${f.color}"></span>${datos.nombre}${datos.fortaleza ? " ★" : ""}</h2>
    <p>Dueño: <b>${quien(p.duenio)}</b></p>
    <p>Legiones: <b>${p.tropas}</b>${esMia(seleccion) && p.cansadas ? ` (${Math.min(p.cansadas, p.tropas)} descansando)` : ""}</p>
    <p>Oro por turno: <b>${datos.oro}</b></p>
    <p class="ayuda">Limita con: ${listaVecinos}</p>`;

  if (esMia(seleccion) && esMiTurno()) {
    acciones.classList.remove("oculto");
    const max = movibles(seleccion);
    const rango = $("cantidad");
    rango.max = Math.max(1, max);
    rango.disabled = max === 0;
    if (+rango.value > max || rango.dataset.prov !== seleccion) rango.value = max || 1;
    rango.dataset.prov = seleccion;
    $("cant-valor").textContent = max === 0 ? "0 (no hay tropas libres)" : rango.value;
    $("btn-reclutar").disabled = estado.oro[miFaccion] < COSTO_LEGION;
    $("btn-reclutar5").disabled = estado.oro[miFaccion] < COSTO_LEGION * 5;
  } else {
    acciones.classList.add("oculto");
  }
}

function tocarProvincia(id) {
  if (!estado || estado.fin) return;

  // Si hay una provincia mía elegida y toco una vecina: mover o atacar
  if (esMiTurno() && seleccion && esMia(seleccion) && vecinos[seleccion].includes(id) && movibles(seleccion) > 0) {
    const cant = Math.min(+$("cantidad").value, movibles(seleccion));
    const origen = seleccion;
    if (esMia(id)) seleccion = id; else seguirAtaque = id; // si conquisto, queda elegida
    hacer({ tipo: "orden", origen, destino: id, cant });
    return;
  }
  seleccion = seleccion === id ? null : id;
  actualizarTodo();
}

// Todas las acciones del jugador pasan por acá: si soy invitado se mandan al anfitrión
function hacer(accion) {
  if (modo === "invitado") {
    Red.alAnfitrion({ tipo: "accion", accion }); // se redibuja cuando llega la respuesta
    return;
  }
  ejecutar(accion, miFaccion);
  despuesDeCambio();
}

// El anfitrión (o el juego solo) guarda, avisa a todos y redibuja
function despuesDeCambio() {
  guardar();
  if (modo === "anfitrion") Red.aTodos({ tipo: "estado", estado });
  actualizarTodo();
}

// ---------- Acciones (solo las corre el anfitrión o el juego solo) ----------

function ejecutar(accion, f) {
  if (estado.fin || !jugadorActual() || jugadorActual().faccion !== f) return;
  estado.golpes = { n: estado.golpes.n, ids: [] };

  if (accion.tipo === "orden") {
    const { origen, destino } = accion;
    const o = estado.provs[origen], d = estado.provs[destino];
    if (!o || !d || o.duenio !== f || !vecinos[origen].includes(destino)) return;
    const cant = Math.floor(Math.min(accion.cant, movibles(origen)));
    if (!(cant > 0)) return;
    if (d.duenio === f) mover(origen, destino, cant); else atacar(origen, destino, cant);
    revisarFin();
  } else if (accion.tipo === "reclutar") {
    reclutar(f, accion.prov, accion.cant);
  } else if (accion.tipo === "fin") {
    siguienteJugador();
  }
}

function mover(origen, destino, cant) {
  const o = estado.provs[origen], d = estado.provs[destino];
  o.tropas -= cant;
  d.tropas += cant;
  d.cansadas += cant;
  const de = PROVINCIAS[origen].nombre, a = PROVINCIAS[destino].nombre;
  anotar(multi() ? `${quien(o.duenio)} mueve ${cant} legión(es) de ${de} a ${a}.` : `Movés ${cant} legión(es) de ${de} a ${a}.`);
}

// Batalla: se tiran dados de a uno; el que saca menos pierde una legión.
// El defensor gana los empates. Las capitales dan +1 al defensor y Roma +2.
function bonusDefensa(id) {
  if (id === "roma" && estado.provs.roma.duenio === "roma") return 2;
  return PROVINCIAS[id].fortaleza ? 1 : 0;
}

function batalla(atacantes, defensores, bonus) {
  while (atacantes > 0 && defensores > 0) {
    const a = dado() + (atacantes >= defensores * 2 ? 1 : 0);
    const d = dado() + bonus;
    if (a > d) defensores--; else atacantes--;
  }
  return { atacantes, defensores };
}

function atacar(origen, destino, cant) {
  const o = estado.provs[origen], d = estado.provs[destino];
  const nombreO = PROVINCIAS[origen].nombre, nombreD = PROVINCIAS[destino].nombre;
  const fa = o.duenio, fd = d.duenio;
  const atacanteHumano = esHumano(fa), defensorHumano = esHumano(fd);

  o.tropas -= cant;
  const r = batalla(cant, d.tropas, bonusDefensa(destino));
  estado.golpes.n++;
  estado.golpes.ids.push(destino);

  if (r.defensores === 0) {
    d.duenio = fa;
    d.tropas = r.atacantes;
    d.cansadas = r.atacantes;
    if (!multi() && atacanteHumano) anotar(`⚔️ ¡Victoria! Conquistaste ${nombreD} (quedan ${r.atacantes} legiones).`, "", [fa]);
    else anotar(`⚔️ ${quien(fa)} conquista ${nombreD} desde ${nombreO}.`, "", [fa], [fd]);
    if (!vivo(fd)) {
      anotar(`☠️ ¡${quien(fd)} fue eliminado!`, "", defensorHumano ? [] : estado.jugadores.map((j) => j.faccion), [fd]);
    }
  } else {
    d.tropas = r.defensores;
    if (!multi() && atacanteHumano) anotar(`🛡️ Derrota en ${nombreD}. ${FACCIONES[fd].nombre} resiste con ${r.defensores} legiones.`, "", [], [fa]);
    else if (!multi() && defensorHumano) anotar(`🛡️ Rechazaste a ${FACCIONES[fa].nombre} en ${nombreD}.`, "", [fd]);
    else if (atacanteHumano || defensorHumano) anotar(`🛡️ ${quien(fd)} rechaza a ${quien(fa)} en ${nombreD}.`, "", [fd], [fa]);
  }
}

function reclutar(f, prov, cantidad) {
  const p = estado.provs[prov];
  cantidad = Math.floor(cantidad);
  if (!p || p.duenio !== f || !(cantidad > 0)) return;
  const costo = cantidad * COSTO_LEGION;
  if (estado.oro[f] < costo) return;
  estado.oro[f] -= costo;
  p.tropas += cantidad;
  p.cansadas += cantidad;
  anotar(multi() ? `${quien(f)} recluta ${cantidad} legión(es) en ${PROVINCIAS[prov].nombre}.`
    : `Reclutás ${cantidad} legión(es) en ${PROVINCIAS[prov].nombre}.`);
}

function animarGolpe(id) {
  const g = $("prov-" + id);
  if (!g) return;
  g.classList.remove("atacada");
  void g.getBBox();
  g.classList.add("atacada");
}

// ---------- Turnos ----------

// Un jugador puede jugar si le quedan provincias y está conectado
const puedeJugar = (j) => vivo(j.faccion) && (j.conectado || modo === "solo");

function siguienteJugador() {
  for (let pasos = 0; pasos < estado.jugadores.length; pasos++) {
    estado.turnoDe++;
    if (estado.turnoDe >= estado.jugadores.length) {
      estado.turnoDe = 0;
      finDeRonda();
      if (estado.fin) return;
    }
    if (puedeJugar(jugadorActual())) {
      if (multi()) anotar(`🎲 Le toca a ${quien(jugadorActual().faccion)}.`, "turno");
      return;
    }
  }
}

// Cuando jugaron todos: actúan los pueblos de la máquina y empieza otro turno
function finDeRonda() {
  turnoIA();
  if (revisarFin()) return;

  estado.turno++;
  for (const id in estado.provs) estado.provs[id].cansadas = 0;
  if (multi()) anotar(`— Turno ${estado.turno}: cada pueblo cobra el oro de sus provincias —`, "turno");

  for (const j of estado.jugadores) {
    const f = j.faccion;
    if (!vivo(f)) continue;
    const ingreso = ingresoDe(f);
    estado.oro[f] += ingreso;
    if (!multi()) anotar(`— Turno ${estado.turno}: cobrás ${ingreso} de oro —`, "turno");

    if (Math.random() < 0.3) {
      const ev = EVENTOS[Math.floor(Math.random() * EVENTOS.length)];
      if (ev.tipo === "oro") estado.oro[f] = Math.max(0, estado.oro[f] + ev.valor);
      if (ev.tipo === "tropas") {
        // a la capital si todavía es suya; si no, a su provincia más grande
        const mias = provinciasDe(f);
        const destino = mias.includes(CAPITAL[f]) ? CAPITAL[f] : mias.sort((a, b) => estado.provs[b].tropas - estado.provs[a].tropas)[0];
        estado.provs[destino].tropas += ev.valor;
      }
      anotar(`📜 ${multi() ? quien(f) + ": " : ""}${ev.texto}`, "", ev.valor > 0 ? [f] : [], ev.valor < 0 ? [f] : []);
    }
  }
}

function turnoIA() {
  for (const f in FACCIONES) {
    if (esHumano(f)) continue;
    const mias = provinciasDe(f);
    if (mias.length === 0) continue;

    // Cobra oro (un poco menos que un jugador) y recluta en sus fronteras
    estado.oro[f] = (estado.oro[f] || 0) + Math.round(ingresoDe(f) * 0.5);
    const fronteras = mias.filter((id) => vecinos[id].some((v) => estado.provs[v].duenio !== f));
    const destinos = fronteras.length ? fronteras : mias;
    while (estado.oro[f] >= COSTO_LEGION) {
      estado.oro[f] -= COSTO_LEGION;
      destinos.sort((a, b) => amenaza(b, f) - amenaza(a, f));
      estado.provs[destinos[0]].tropas++;
    }

    // Los primeros 2 turnos los enemigos solo se arman (tiempo para organizarse)
    if (estado.turno < 3) continue;

    // Ataca si tiene clara ventaja (se vuelve más agresivo con los turnos)
    const ventaja = Math.max(1.4, 2.2 - estado.turno * 0.04);
    for (const id of mias) {
      const p = estado.provs[id];
      if (p.duenio !== f || p.tropas < 3) continue;
      const blancos = vecinos[id]
        .filter((v) => estado.provs[v].duenio !== f)
        .sort((a, b) => estado.provs[a].tropas - estado.provs[b].tropas);
      if (!blancos.length) continue;
      const blanco = blancos[0];
      if (p.tropas - 1 > estado.provs[blanco].tropas * ventaja) atacar(id, blanco, p.tropas - 1);
    }
  }
}

function amenaza(id, f) {
  const enemigos = vecinos[id]
    .filter((v) => estado.provs[v].duenio !== f)
    .reduce((s, v) => s + estado.provs[v].tropas, 0);
  return enemigos - estado.provs[id].tropas;
}

// ---------- Fin de partida ----------

function revisarFin() {
  if (estado.fin) return true;
  const total = Object.keys(PROVINCIAS).length;
  if (!multi()) {
    if (estado.provs.roma.duenio !== "roma") estado.fin = { ganador: null, por: estado.provs.roma.duenio };
    else if (provinciasDe("roma").length === total) estado.fin = { ganador: "roma" };
  } else {
    // Con amigos: quedás afuera cuando perdés todas tus provincias. Gana el último que queda.
    const vivos = estado.jugadores.filter((j) => vivo(j.faccion));
    if (vivos.length === 1) estado.fin = { ganador: vivos[0].faccion };
    else if (vivos.length === 0) estado.fin = { ganador: null };
  }
  if (estado.fin) estado.fin.turno = estado.turno;
  return !!estado.fin;
}

let finVisto = false;
function mostrarFin() {
  if (finVisto) return;
  const fin = estado.fin;
  let titulo, texto;
  if (!multi()) {
    if (fin.ganador) { titulo = "¡Ave, César! 🏆"; texto = `Conquistaste todo el Mediterráneo en ${fin.turno} turnos.`; }
    else { titulo = "Roma ha caído 💀"; texto = `Los ${FACCIONES[fin.por].nombre.toLowerCase()} tomaron la ciudad en el turno ${fin.turno}.`; }
    $("cartel-btn").textContent = "Jugar de nuevo";
  } else {
    if (fin.ganador === miFaccion) { titulo = "¡Ganaste! 🏆"; texto = `Fuiste el último pueblo en pie, en el turno ${fin.turno}.`; }
    else if (fin.ganador) { titulo = `Ganó ${FACCIONES[fin.ganador].nombre} 🏆`; texto = `${jugadorDe(fin.ganador).nombre} derrotó a todos en el turno ${fin.turno}.`; }
    else { titulo = "Ganaron las máquinas 💀"; texto = "Los pueblos que manejaba la computadora eliminaron a todos los jugadores."; }
    $("cartel-btn").textContent = "Ver el mapa";
  }
  $("cartel-titulo").textContent = titulo;
  $("cartel-texto").textContent = texto;
  $("cartel").classList.remove("oculto");
}

$("cartel-btn").addEventListener("click", () => {
  finVisto = true;
  $("cartel").classList.add("oculto");
  if (modo === "solo") empezarSolo(true);
  else if (modo === "anfitrion") localStorage.removeItem(CLAVE_SALA);
});

// ---------- Jugar solo ----------

function empezarSolo(nueva) {
  modo = "solo";
  miFaccion = "roma";
  finVisto = false;
  estado = nueva ? null : cargarSolo();
  if (!estado || estado.fin) {
    estado = partidaNueva([{ faccion: "roma", nombre: "Vos", conectado: true }]);
    anotar("Año 264 a.C. El Senado te encarga expandir la República. ¡Conquistá el Mediterráneo!", "turno");
  }
  seleccion = null;
  ultimoGolpe = estado.golpes.n;
  mostrarPantalla("juego");
  guardar();
  actualizarTodo();
}

// ---------- Pantallas: inicio, sala de espera y juego ----------

function mostrarPantalla(cual) {
  $("inicio").classList.toggle("oculto", cual !== "inicio");
  $("sala").classList.toggle("oculto", cual !== "sala");
  $("btn-nueva").classList.toggle("oculto", cual !== "juego" || modo !== "solo");
}

function misDatos() {
  try { return JSON.parse(localStorage.getItem(CLAVE_DATOS)) || {}; } catch (e) { return {}; }
}
function nombreElegido() {
  const n = $("mi-nombre").value.trim().slice(0, 16);
  if (!n) { avisoInicio("Escribí tu nombre primero."); $("mi-nombre").focus(); return null; }
  localStorage.setItem(CLAVE_DATOS, JSON.stringify({ ...misDatos(), nombre: n }));
  return n;
}
function avisoInicio(texto) { $("aviso-inicio").textContent = texto; }

function prepararInicio() {
  const datos = misDatos();
  $("mi-nombre").value = datos.nombre || "";
  const deLink = new URLSearchParams(location.search).get("sala");
  $("codigo-unirse").value = (deLink || datos.codigo || "").toUpperCase();
  const guardada = salaGuardada();
  $("btn-retomar").classList.toggle("oculto", !guardada);
  if (guardada) $("btn-retomar").textContent = `🔁 Retomar mi sala ${guardada.codigo} (turno ${guardada.estado.turno})`;
  $("btn-solo").textContent = cargarSolo() && !cargarSolo().fin ? "🧍 Seguir mi partida solo" : "🧍 Jugar solo";
  if (deLink) $("codigo-unirse").focus();
  mostrarPantalla("inicio");
}

// ----- Anfitrión -----

function crearSala(retomar) {
  const nombre = nombreElegido();
  if (!nombre) return;
  modo = "anfitrion";
  finVisto = false;
  const guardada = retomar ? salaGuardada() : null;
  codigoSala = guardada ? guardada.codigo : Red.codigoNuevo();
  avisoInicio(guardada ? "Abriendo la sala de nuevo…" : "Creando la sala…");
  bloquearInicio(true);

  Red.crearSala(codigoSala, {
    alListo: () => {
      bloquearInicio(false);
      avisoInicio("");
      if (guardada) {
        estado = guardada.estado;
        // Todos quedan desconectados hasta que vuelvan a entrar con su nombre
        for (const j of estado.jugadores) j.conectado = false;
        const yo = estado.jugadores.find((j) => j.anfitrion);
        if (yo) { yo.conectado = true; yo.id = Red.miId(); miFaccion = yo.faccion; }
        if (!puedeJugar(jugadorActual())) siguienteJugador();
        ultimoGolpe = estado.golpes.n;
        mostrarPantalla("juego");
        despuesDeCambio();
      } else {
        sala = { codigo: codigoSala, jugadores: [{ id: Red.miId(), nombre, faccion: "roma", conectado: true, anfitrion: true }] };
        mostrarSala();
      }
    },
    alEntrar: () => {},
    alMensaje: mensajeDeInvitado,
    alSalir: invitadoSeFue,
    alError: (t) => { bloquearInicio(false); avisoInicio(t); },
  });
}

function mensajeDeInvitado(id, msg) {
  if (!msg || typeof msg !== "object") return;

  if (msg.tipo === "hola") {
    const nombre = String(msg.nombre || "Amigo").trim().slice(0, 16) || "Amigo";
    if (estado) {
      // Partida empezada: solo puede volver alguien que ya estaba, con el mismo nombre
      const j = estado.jugadores.find((x) => x.nombre.toLowerCase() === nombre.toLowerCase() && !x.anfitrion);
      if (!j) {
        Red.enviar(id, { tipo: "error", texto: "La partida ya empezó. Si ya estabas jugando, entrá con el mismo nombre que usaste." });
        Red.echar(id);
        return;
      }
      if (j.id && j.id !== id) Red.echar(j.id); // si tenía una conexión vieja (recargó la página), se cierra
      j.id = id;
      j.conectado = true;
      anotar(`🔌 ${quien(j.faccion)} volvió a la partida.`, "turno");
      if (!puedeJugar(jugadorActual())) siguienteJugador();
      despuesDeCambio();
      return;
    }
    if (sala.jugadores.length >= Object.keys(FACCIONES).length) {
      Red.enviar(id, { tipo: "error", texto: "La sala está llena." });
      Red.echar(id);
      return;
    }
    let final = nombre, n = 2;
    while (sala.jugadores.some((j) => j.nombre.toLowerCase() === final.toLowerCase())) final = `${nombre} ${n++}`;
    const libre = Object.keys(FACCIONES).find((f) => !sala.jugadores.some((j) => j.faccion === f));
    sala.jugadores.push({ id, nombre: final, faccion: libre, conectado: true });
    mostrarSala();
    return;
  }

  if (msg.tipo === "elegir") { elegirFaccion(id, msg.faccion); return; }

  if (msg.tipo === "accion" && estado) {
    const j = estado.jugadores.find((x) => x.id === id);
    if (j && msg.accion && typeof msg.accion === "object") {
      ejecutar(msg.accion, j.faccion);
      despuesDeCambio();
    }
  }
}

function invitadoSeFue(id) {
  if (estado) {
    const j = estado.jugadores.find((x) => x.id === id);
    if (!j || !j.conectado) return;
    j.conectado = false;
    anotar(`📵 ${quien(j.faccion)} se desconectó. Se saltea su turno hasta que vuelva.`, "turno");
    if (jugadorActual() === j && !estado.fin) siguienteJugador();
    despuesDeCambio();
  } else if (sala) {
    sala.jugadores = sala.jugadores.filter((j) => j.id !== id);
    mostrarSala();
  }
}

function elegirFaccion(id, f) {
  if (!sala || estado || !FACCIONES[f]) return;
  if (sala.jugadores.some((j) => j.faccion === f && j.id !== id)) return; // ya la tiene otro
  const j = sala.jugadores.find((x) => x.id === id);
  if (j) j.faccion = f;
  mostrarSala();
}

function empezarOnline() {
  if (!sala || sala.jugadores.length < 2) return;
  // Juegan en el orden del mapa (Roma primero, después galos, germanos…)
  const orden = Object.keys(FACCIONES);
  const jugadores = sala.jugadores
    .map((j) => ({ faccion: j.faccion, nombre: j.nombre, id: j.id, conectado: true, anfitrion: !!j.anfitrion }))
    .sort((a, b) => orden.indexOf(a.faccion) - orden.indexOf(b.faccion));
  estado = partidaNueva(jugadores);
  miFaccion = jugadores.find((j) => j.anfitrion).faccion;
  const maquinas = orden.filter((f) => !jugadores.some((j) => j.faccion === f)).map((f) => FACCIONES[f].nombre);
  anotar(`Año 264 a.C. Empieza la guerra por el Mediterráneo entre ${jugadores.length} jugadores.` +
    (maquinas.length ? ` La computadora maneja a: ${maquinas.join(", ")}.` : ""), "turno");
  anotar(`🎲 Le toca a ${quien(jugadorActual().faccion)}.`, "turno");
  sala = null;
  ultimoGolpe = 0;
  mostrarPantalla("juego");
  despuesDeCambio();
}

// ----- Invitado -----

function unirse() {
  const nombre = nombreElegido();
  if (!nombre) return;
  const codigo = $("codigo-unirse").value.trim().toUpperCase();
  if (codigo.length !== 5) { avisoInicio("El código tiene 5 letras o números."); return; }
  localStorage.setItem(CLAVE_DATOS, JSON.stringify({ nombre, codigo }));
  modo = "invitado";
  codigoSala = codigo;
  avisoInicio("Conectando…");
  bloquearInicio(true);

  Red.unirse(codigo, {
    alAbrir: () => { avisoInicio("Entrando a la sala…"); Red.alAnfitrion({ tipo: "hola", nombre }); },
    alMensaje: mensajeDelAnfitrion,
    alCerrar: () => {
      $("conexion-perdida").classList.remove("oculto");
      document.title = "📵 Sin conexión – Imperium";
    },
    alError: (t) => { bloquearInicio(false); avisoInicio(t); modo = "solo"; },
  });
}

function mensajeDelAnfitrion(msg) {
  if (!msg || typeof msg !== "object") return;
  if (msg.tipo === "error") { bloquearInicio(false); avisoInicio(msg.texto); modo = "solo"; return; }
  if (msg.tipo === "sala") {
    sala = msg.sala;
    mostrarSala();
  }
  if (msg.tipo === "estado") {
    const primera = !estado;
    estado = msg.estado;
    const yo = estado.jugadores.find((j) => j.id === Red.miId());
    if (yo) miFaccion = yo.faccion;
    if (primera) { ultimoGolpe = estado.golpes.n; sala = null; mostrarPantalla("juego"); }
    if (seleccion && !esMiTurno()) seleccion = null;
    actualizarTodo();
  }
}

// ----- Sala de espera -----

function mostrarSala() {
  mostrarPantalla("sala");
  if (modo === "anfitrion") Red.aTodos({ tipo: "sala", sala });
  const yoId = Red.miId();
  const yo = sala.jugadores.find((j) => j.id === yoId);
  $("codigo-grande").textContent = sala.codigo;
  $("lista-sala").innerHTML = sala.jugadores.map((j) => {
    const f = FACCIONES[j.faccion];
    return `<li><span class="punto" style="background:${f.color}"></span>
      <b>${escapar(j.nombre)}</b>${j.id === yoId ? " (vos)" : ""}${j.anfitrion ? " 👑" : ""} — ${f.nombre}</li>`;
  }).join("");
  $("elegir-faccion").innerHTML = Object.keys(FACCIONES).map((f) => {
    const duenio = sala.jugadores.find((j) => j.faccion === f);
    const mio = yo && yo.faccion === f;
    return `<button data-f="${f}" class="faccion ${mio ? "elegida" : ""}" style="--color:${FACCIONES[f].color}"
      ${duenio && !mio ? "disabled" : ""}>${FACCIONES[f].nombre}${duenio && !mio ? `<small>${escapar(duenio.nombre)}</small>` : ""}</button>`;
  }).join("");
  const anfitrion = modo === "anfitrion";
  $("btn-empezar").classList.toggle("oculto", !anfitrion);
  $("btn-empezar").disabled = sala.jugadores.length < 2;
  $("espera-sala").textContent = anfitrion
    ? (sala.jugadores.length < 2 ? "Pasales el código a tus amigos y esperá que entren." : "Cuando estén todos, tocá Empezar.")
    : "Esperando que el anfitrión empiece la partida…";
}

$("elegir-faccion").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-f]");
  if (!b || b.disabled) return;
  if (modo === "anfitrion") elegirFaccion(Red.miId(), b.dataset.f);
  else Red.alAnfitrion({ tipo: "elegir", faccion: b.dataset.f });
});

function linkSala() {
  return location.origin + location.pathname + "?sala=" + codigoSala;
}

$("btn-copiar").addEventListener("click", async () => {
  const texto = `¡Vení a jugar Imperium conmigo! Entrá acá: ${linkSala()} (código ${codigoSala})`;
  try { await navigator.clipboard.writeText(texto); $("btn-copiar").textContent = "✔ Copiado"; }
  catch (e) { prompt("Copiá este mensaje y mandáselo a tus amigos:", texto); }
  setTimeout(() => { $("btn-copiar").textContent = "📋 Copiar invitación"; }, 2000);
});

function bloquearInicio(si) {
  for (const b of document.querySelectorAll("#inicio button")) b.disabled = si;
}

// ---------- Arranque ----------

$("cantidad").addEventListener("input", (e) => { $("cant-valor").textContent = e.target.value; });
$("btn-reclutar").addEventListener("click", () => seleccion && hacer({ tipo: "reclutar", prov: seleccion, cant: 1 }));
$("btn-reclutar5").addEventListener("click", () => seleccion && hacer({ tipo: "reclutar", prov: seleccion, cant: 5 }));
$("btn-turno").addEventListener("click", () => { if (esMiTurno()) { seleccion = null; hacer({ tipo: "fin" }); } });
$("btn-nueva").addEventListener("click", () => { if (confirm("¿Empezar una partida nueva? Se pierde la actual.")) empezarSolo(true); });
$("btn-solo").addEventListener("click", () => empezarSolo(false));
$("btn-crear").addEventListener("click", () => crearSala(false));
$("btn-retomar").addEventListener("click", () => crearSala(true));
$("btn-unirse").addEventListener("click", unirse);
$("codigo-unirse").addEventListener("keydown", (e) => { if (e.key === "Enter") unirse(); });
$("btn-empezar").addEventListener("click", empezarOnline);
$("btn-reconectar").addEventListener("click", () => location.reload());

dibujarMapa();
prepararInicio();
