// Imperium – lógica del juego
const CLAVE_GUARDADO = "imperium_partida";
const COSTO_LEGION = 10;
const SVG_NS = "http://www.w3.org/2000/svg";

let estado = null;        // toda la partida (se guarda en el navegador)
let seleccion = null;     // id de la provincia elegida
const vecinos = {};       // id -> lista de ids vecinos

// ---------- Preparación ----------

for (const id in PROVINCIAS) vecinos[id] = [];
for (const [a, b] of RUTAS) { vecinos[a].push(b); vecinos[b].push(a); }

function partidaNueva() {
  const provs = {};
  for (const id in PROVINCIAS) {
    const p = PROVINCIAS[id];
    provs[id] = { duenio: p.duenio, tropas: p.tropas, cansadas: 0 };
  }
  const oroIA = {};
  for (const f in FACCIONES) if (!FACCIONES[f].jugador) oroIA[f] = 0;
  return { turno: 1, oro: 20, provs, oroIA, log: [], terminado: false };
}

function guardar() { localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(estado)); }

function cargar() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE_GUARDADO));
    if (datos && datos.provs && Object.keys(datos.provs).length === Object.keys(PROVINCIAS).length) return datos;
  } catch (e) { /* partida rota: se empieza de cero */ }
  return null;
}

// ---------- Utilidades ----------

const $ = (id) => document.getElementById(id);
const dado = () => 1 + Math.floor(Math.random() * 6);
const esMia = (id) => estado.provs[id].duenio === "roma";
const provinciasDe = (f) => Object.keys(estado.provs).filter((id) => estado.provs[id].duenio === f);
const ingresoDe = (f) => provinciasDe(f).reduce((s, id) => s + PROVINCIAS[id].oro, 0);
const movibles = (id) => {
  const p = estado.provs[id];
  return Math.max(0, Math.min(p.tropas - 1, p.tropas - p.cansadas));
};

function anotar(texto, clase = "") {
  estado.log.unshift({ texto, clase });
  estado.log = estado.log.slice(0, 40);
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
  // Rutas terrestres unen la tierra
  for (const [a, b, mar] of RUTAS) {
    if (mar) continue;
    const pa = PROVINCIAS[a], pb = PROVINCIAS[b];
    crear("line", { x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y, stroke: "#e9dcb5", "stroke-width": 50 }, tierra);
  }

  // Caminos
  for (const [a, b, mar] of RUTAS) {
    const pa = PROVINCIAS[a], pb = PROVINCIAS[b];
    crear("line", { x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y, class: mar ? "ruta mar" : "ruta" }, svg);
  }

  // Provincias
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
  const objetivos = seleccion && movibles(seleccion) > 0 ? vecinos[seleccion] : [];
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
  const mias = provinciasDe("roma");
  $("turno").textContent = estado.turno;
  $("oro").textContent = estado.oro;
  $("ingreso").textContent = `(+${ingresoDe("roma")}/turno)`;
  $("cant-prov").textContent = mias.length;
  $("total-prov").textContent = Object.keys(PROVINCIAS).length;

  actualizarMapa();
  actualizarPanel();

  $("log").innerHTML = estado.log
    .map((l) => `<li class="${l.clase}">${l.texto}</li>`)
    .join("");
}

function actualizarPanel() {
  const info = $("info");
  const acciones = $("acciones");
  if (!seleccion) {
    info.innerHTML = `<p class="ayuda">Tocá una provincia tuya (roja) para dar órdenes.</p>`;
    acciones.classList.add("oculto");
    return;
  }
  const datos = PROVINCIAS[seleccion];
  const p = estado.provs[seleccion];
  const f = FACCIONES[p.duenio];
  const listaVecinos = vecinos[seleccion].map((v) => PROVINCIAS[v].nombre).join(", ");
  info.innerHTML = `
    <h2><span class="punto" style="background:${f.color}"></span>${datos.nombre}${datos.fortaleza ? " ★" : ""}</h2>
    <p>Dueño: <b>${f.nombre}</b></p>
    <p>Legiones: <b>${p.tropas}</b>${esMia(seleccion) && p.cansadas ? ` (${Math.min(p.cansadas, p.tropas)} descansando)` : ""}</p>
    <p>Oro por turno: <b>${datos.oro}</b></p>
    <p class="ayuda">Limita con: ${listaVecinos}</p>`;

  if (esMia(seleccion) && !estado.terminado) {
    acciones.classList.remove("oculto");
    const max = movibles(seleccion);
    const rango = $("cantidad");
    rango.max = Math.max(1, max);
    rango.disabled = max === 0;
    if (+rango.value > max || rango.dataset.prov !== seleccion) rango.value = max || 1;
    rango.dataset.prov = seleccion;
    $("cant-valor").textContent = max === 0 ? "0 (no hay tropas libres)" : rango.value;
    $("btn-reclutar").disabled = estado.oro < COSTO_LEGION;
    $("btn-reclutar5").disabled = estado.oro < COSTO_LEGION * 5;
  } else {
    acciones.classList.add("oculto");
  }
}

function tocarProvincia(id) {
  if (estado.terminado) return;

  // Si hay una provincia mía elegida y toco una vecina: mover o atacar
  if (seleccion && esMia(seleccion) && vecinos[seleccion].includes(id) && movibles(seleccion) > 0) {
    const cant = Math.min(+$("cantidad").value, movibles(seleccion));
    if (esMia(id)) mover(seleccion, id, cant);
    else atacar(seleccion, id, cant);
    guardar();
    revisarFin();
    actualizarTodo();
    return;
  }
  seleccion = seleccion === id ? null : id;
  actualizarTodo();
}

// ---------- Acciones ----------

function mover(origen, destino, cant) {
  const o = estado.provs[origen], d = estado.provs[destino];
  o.tropas -= cant;
  d.tropas += cant;
  d.cansadas += cant;
  anotar(`Movés ${cant} legión(es) de ${PROVINCIAS[origen].nombre} a ${PROVINCIAS[destino].nombre}.`);
  seleccion = destino;
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

function atacar(origen, destino, cant, esIA = false) {
  const o = estado.provs[origen], d = estado.provs[destino];
  const nombreO = PROVINCIAS[origen].nombre, nombreD = PROVINCIAS[destino].nombre;
  const atacante = FACCIONES[o.duenio].nombre, defensor = FACCIONES[d.duenio].nombre;
  const defensorEraRoma = d.duenio === "roma";

  o.tropas -= cant;
  const r = batalla(cant, d.tropas, bonusDefensa(destino));
  animarGolpe(destino);

  if (r.defensores === 0) {
    const perdedor = d.duenio;
    d.duenio = o.duenio;
    d.tropas = r.atacantes;
    d.cansadas = r.atacantes;
    if (!esIA) {
      anotar(`⚔️ ¡Victoria! Conquistaste ${nombreD} (quedan ${r.atacantes} legiones).`, "bien");
      seleccion = destino;
    } else {
      anotar(`⚔️ ${atacante} conquista ${nombreD} desde ${nombreO}.`, defensorEraRoma ? "mal" : "");
    }
    if (perdedor !== "roma" && provinciasDe(perdedor).length === 0) {
      anotar(`☠️ ¡${FACCIONES[perdedor].nombre} fue eliminado!`, "bien");
    }
  } else {
    d.tropas = r.defensores;
    if (!esIA) anotar(`🛡️ Derrota en ${nombreD}. ${defensor} resiste con ${r.defensores} legiones.`, "mal");
    else if (defensorEraRoma) anotar(`🛡️ Rechazaste a ${atacante} en ${nombreD}.`, "bien");
  }
}

function reclutar(cantidad) {
  if (!seleccion || !esMia(seleccion)) return;
  const costo = cantidad * COSTO_LEGION;
  if (estado.oro < costo) return;
  estado.oro -= costo;
  const p = estado.provs[seleccion];
  p.tropas += cantidad;
  p.cansadas += cantidad;
  anotar(`Reclutás ${cantidad} legión(es) en ${PROVINCIAS[seleccion].nombre}.`);
  guardar();
  actualizarTodo();
}

function animarGolpe(id) {
  const g = $("prov-" + id);
  g.classList.remove("atacada");
  void g.getBBox();
  g.classList.add("atacada");
}

// ---------- Turno de los enemigos ----------

function turnoIA() {
  for (const f in estado.oroIA) {
    const mias = provinciasDe(f);
    if (mias.length === 0) continue;

    // Cobra oro (un poco menos que vos) y recluta en sus fronteras
    estado.oroIA[f] += Math.round(ingresoDe(f) * 0.5);
    const fronteras = mias.filter((id) => vecinos[id].some((v) => estado.provs[v].duenio !== f));
    const destinos = fronteras.length ? fronteras : mias;
    while (estado.oroIA[f] >= COSTO_LEGION) {
      estado.oroIA[f] -= COSTO_LEGION;
      // refuerza la frontera más amenazada (más enemigos cerca, menos tropas propias)
      destinos.sort((a, b) => amenaza(b, f) - amenaza(a, f));
      estado.provs[destinos[0]].tropas++;
    }

    // Los primeros 2 turnos los enemigos solo se arman (tiempo para organizarte)
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
      if (p.tropas - 1 > estado.provs[blanco].tropas * ventaja) {
        atacar(id, blanco, p.tropas - 1, true);
      }
    }
  }
}

function amenaza(id, f) {
  const enemigos = vecinos[id]
    .filter((v) => estado.provs[v].duenio !== f)
    .reduce((s, v) => s + estado.provs[v].tropas, 0);
  return enemigos - estado.provs[id].tropas;
}

function terminarTurno() {
  if (estado.terminado) return;
  seleccion = null;
  turnoIA();
  if (revisarFin()) { guardar(); actualizarTodo(); return; }

  estado.turno++;
  for (const id in estado.provs) estado.provs[id].cansadas = 0;
  const ingreso = ingresoDe("roma");
  estado.oro += ingreso;
  anotar(`— Turno ${estado.turno}: cobrás ${ingreso} de oro —`, "turno");

  if (Math.random() < 0.3) {
    const ev = EVENTOS[Math.floor(Math.random() * EVENTOS.length)];
    if (ev.tipo === "oro") estado.oro = Math.max(0, estado.oro + ev.valor);
    if (ev.tipo === "tropas") estado.provs.roma.tropas += ev.valor;
    anotar("📜 " + ev.texto, ev.valor > 0 ? "bien" : "mal");
  }
  guardar();
  actualizarTodo();
}

// ---------- Fin de partida ----------

function revisarFin() {
  if (estado.terminado) return true;
  const total = Object.keys(PROVINCIAS).length;
  if (estado.provs.roma.duenio !== "roma") {
    estado.terminado = true;
    mostrarCartel("Roma ha caído 💀", `Los ${FACCIONES[estado.provs.roma.duenio].nombre.toLowerCase()} tomaron la ciudad en el turno ${estado.turno}.`);
    return true;
  }
  if (provinciasDe("roma").length === total) {
    estado.terminado = true;
    mostrarCartel("¡Ave, César! 🏆", `Conquistaste todo el Mediterráneo en ${estado.turno} turnos.`);
    return true;
  }
  return false;
}

function mostrarCartel(titulo, texto) {
  $("cartel-titulo").textContent = titulo;
  $("cartel-texto").textContent = texto;
  $("cartel").classList.remove("oculto");
}

function empezarDeNuevo() {
  estado = partidaNueva();
  seleccion = null;
  anotar("Año 264 a.C. El Senado te encarga expandir la República. ¡Conquistá el Mediterráneo!", "turno");
  $("cartel").classList.add("oculto");
  guardar();
  actualizarTodo();
}

// ---------- Arranque ----------

$("cantidad").addEventListener("input", (e) => { $("cant-valor").textContent = e.target.value; });
$("btn-reclutar").addEventListener("click", () => reclutar(1));
$("btn-reclutar5").addEventListener("click", () => reclutar(5));
$("btn-turno").addEventListener("click", terminarTurno);
$("btn-nueva").addEventListener("click", () => { if (confirm("¿Empezar una partida nueva? Se pierde la actual.")) empezarDeNuevo(); });
$("cartel-btn").addEventListener("click", empezarDeNuevo);

dibujarMapa();
estado = cargar();
if (estado) {
  actualizarTodo();
  if (estado.terminado) { estado.terminado = false; revisarFin(); }
} else {
  empezarDeNuevo();
}
