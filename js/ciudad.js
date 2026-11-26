// Rey de Roma – pantalla (dibuja todo y responde a los clics).
// Las reglas están en js/ciudad-reglas.js.

const CLAVE_GUARDADO = "imperium_ciudad";
let loteElegido = null;
let moviendo = null;            // terreno cuyo edificio se está mudando con el botón "Mover"
let ciudadVista = 0;           // ciudad que se está mirando: 0 = Roma, 1... = las fundadas
let pestania = "construir";
let vistaActual = "ciudad";     // "ciudad" o "mapa"
let casillaElegida = null;      // { x, y } en el mapa
let tecElegida = null;          // tecnología tocada en el árbol

const $ = (id) => document.getElementById(id);

function guardar() { localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(estado)); }

function cargar() {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE_GUARDADO));
    if (d && d.lotes && d.lotes.length >= INICIO.lotes) {
      for (const id in d.techs) if (!TECNOLOGIAS[id]) delete d.techs[id];
      if (d.meta && !TECNOLOGIAS[d.meta]) d.meta = null;
      if (d.apoyo === undefined) d.apoyo = APOYO.inicio;
      if (d.rec.poder === undefined) d.rec.poder = INICIO.recursos.poder;
      d.colonias = d.colonias || [];
      for (const u in UNIDADES) d.ejercito[u] = d.ejercito[u] || 0;   // tropas nuevas (p. ej. el General)
      // Ya no se pierde por saqueos: las partidas que habían terminado así siguen
      if (d.resultado === "derrota") { d.terminado = false; d.resultado = null; }
      prepararMapa(d);
      return d;
    }
  } catch (e) { /* partida rota: se empieza de cero */ }
  return null;
}

// "15 madera 10 💰" (con sus íconos)
function textoCosto(costo) {
  return Object.entries(costo).map(([r, v]) => {
    const falta = (estado.rec[r] || 0) < v;
    return `<span class="${falta ? "falta" : ""}">${v} ${RECURSOS[r].icono}</span>`;
  }).join(" ");
}

function textoProduce(ed) {
  const partes = [];
  if (ed.produce) for (const r in ed.produce) partes.push(`+${ed.produce[r]} ${RECURSOS[r].icono}`);
  if (ed.capacidad) partes.push(`+${ed.capacidad} 🏠 lugar`);
  const tipo = Object.keys(EDIFICIOS).find((k) => EDIFICIOS[k] === ed);
  if (APOYO.edificios[tipo]) partes.push(`+${APOYO.edificios[tipo]} 😊 apoyo`);
  return partes.join(" · ");
}

const signo = (n) => (n > 0 ? "+" + n : "" + n);

// ---------- Dibujo ----------

function dibujarRecursos() {
  const b = balance();
  let html = `<span>📅 Año <b>${estado.turno}</b></span>`;
  for (const r in RECURSOS) {
    const clase = b[r] < 0 ? "neg" : "";
    html += `<span title="${RECURSOS[r].nombre}">${RECURSOS[r].icono} <b>${Math.floor(estado.rec[r])}</b> <small class="${clase}">${signo(b[r])}</small></span>`;
  }
  const cap = capacidad();
  html += `<span title="Habitantes / lugar para vivir. Libres: los que no trabajan en ningún edificio.">👥 <b>${estado.habitantes + soldados()}</b>/${cap} <small>(${libres()} libres)</small></span>`;
  html += `<span title="Tu ejército: ${soldados()} soldados. Fuerza de ataque si salen todos: ${Math.round(poderAtaque(estado.ejercito))}">⚔️ <b>${soldados()}</b> <small>ataque ${Math.round(poderAtaque(estado.ejercito))}</small></span>`;
  html += `<span title="Defensa de Roma">🛡️ <b>${Math.round(poderDefensa())}</b></span>`;
  const ap = apoyo();
  const cara = ap >= 75 ? "😄" : ap >= 50 ? "🙂" : ap >= 25 ? "😟" : "😠";
  const prod = Math.round((productividad() - 1) * 100);
  const base = apoyoBase();
  const tendencia = base > ap ? " ↑" : base < ap ? " ↓" : "";
  html += `<span title="Apoyo popular (0 a 100). Cambia cuánto rinden los edificios y los impuestos: ahora ${prod >= 0 ? "+" : ""}${prod}%. Con el tiempo vuelve a ${base}. Lo suben la muralla, templos y grandes obras, rechazar ataques y conquistar; lo bajan saqueos, derrotas y hambre. ¡Si llega a ${APOYO.derrocado}, el pueblo se rebela y perdés!">${cara} <b>${ap}</b>${tendencia} <small class="${prod < 0 ? "neg" : ""}">${prod >= 0 ? "+" : ""}${prod}%</small></span>`;
  const fa = fama();
  const extraGente = Math.floor(fa / FAMA.habitantesCada), extraOro = Math.floor(fa / FAMA.oroCada);
  html += `<span title="Fama de Roma (0 a 100): qué tan conocida es en el mundo. La suben las conquistas, rechazar ataques, las grandes obras (¡el Coliseo!) y los nuevos períodos; la bajan los saqueos y las derrotas. Ahora atrae +${extraGente} habitante(s) y +${extraOro} de oro por año.${fa >= FAMA.alianza ? " ¡Ya hay pueblos en paz que pueden unirse a Roma sin pelear!" : ` Con ${FAMA.alianza} de fama, los pueblos en paz que conocés pueden unirse a Roma sin pelear.`}">🌟 <b>${fa}</b></span>`;
  $("recursos").innerHTML = html;
}

function dibujarCiudad() {
  // Botones para pasar de una ciudad a otra (solo si fundaste alguna)
  if (!lotesDe(ciudadVista)) ciudadVista = 0;
  const nombres = ["Roma", ...estado.colonias.map((col) => col.nombre)];
  $("ciudades").innerHTML = nombres.length < 2 ? "" : nombres.map((n, i) =>
    `<button data-accion="ver-ciudad" data-ciudad="${i}" class="${i === ciudadVista ? "activa" : ""}">${iconoCiudad(i)} ${n}</button>`).join("");

  // Nivel de la ciudad y botón para agrandarla
  const nivel = nivelCiudad(ciudadVista);
  const maximo = nivelMaximo(ciudadVista);
  const pn = puedeSubirNivel(ciudadVista);
  $("nivel-ciudad").innerHTML = `<span>${iconoCiudad(ciudadVista)} <b>${nombreCiudad(ciudadVista)}</b> · nivel <b>${nivel}</b> de ${maximo}
      · ${lotesDe(ciudadVista).length} terrenos</span>` +
    (nivel >= maximo ? `<small>Llegó a su tamaño máximo.</small>` :
      `<button data-accion="subir-nivel" ${pn.ok && !estado.terminado ? "" : "disabled"}>⬆️ Agrandar a nivel ${nivel + 1}
        <small>(+${NIVELES.terrenos} terrenos · ${textoCosto(costoNivel(ciudadVista))} · 👥 ${genteParaNivel(nivel + 1)})</small></button>` +
      (pn.ok ? "" : `<small class="motivo">${pn.motivo}</small>`));

  const c = $("ciudad");
  c.innerHTML = "";
  lotesDe(ciudadVista).forEach((l, i) => {
    const div = document.createElement("div");
    div.className = "lote";
    if (i === loteElegido) div.classList.add("elegido");
    if (!l) {
      div.classList.add("vacio");
      div.innerHTML = `<span class="icono">＋</span><span class="nombre">Terreno</span>`;
    } else {
      const ed = EDIFICIOS[l.tipo];
      if (l.falta > 0) {
        div.classList.add("obra");
        div.innerHTML = `<span class="icono">🚧</span><span class="nombre">${ed.nombre}</span><span class="falta-turnos">${l.falta} año${l.falta > 1 ? "s" : ""}</span>`;
      } else {
        if (ed.fijo) div.classList.add("regia");
        div.innerHTML = `<span class="icono">${ed.icono}</span><span class="nombre">${ed.nombre}</span>`;
      }
    }
    if (moviendo === i) div.classList.add("moviendo");
    div.addEventListener("click", () => tocarLote(i));
    // Arrastrar un edificio a otro terreno (con el mouse)
    if (l && !estado.terminado) {
      div.draggable = true;
      div.addEventListener("dragstart", (ev) => { ev.dataTransfer.setData("text/plain", String(i)); div.classList.add("moviendo"); });
      div.addEventListener("dragend", () => div.classList.remove("moviendo"));
    }
    div.addEventListener("dragover", (ev) => { ev.preventDefault(); div.classList.add("destino"); });
    div.addEventListener("dragleave", () => div.classList.remove("destino"));
    div.addEventListener("drop", (ev) => {
      ev.preventDefault();
      const de = +ev.dataTransfer.getData("text/plain");
      if (moverLote(ciudadVista, de, i)) { loteElegido = i; moviendo = null; trasAccion(); }
      else div.classList.remove("destino");
    });
    c.appendChild(div);
  });

  // Avisos de ejércitos en camino
  const avisos = [];
  for (const id in estado.enemigos) {
    const e = estado.enemigos[id];
    if (e.vivo && e.marcha) {
      const n = e.marcha.llega - estado.turno;
      avisos.push(`⚠️ <b>${ENEMIGOS[id].nombre}</b> marchan hacia <b>${nombreObjetivo(e.marcha)}</b> con ~${estimar(e.marcha.fuerza)} de fuerza. Llegan ${n <= 1 ? "<b>el próximo año</b>" : `en ${n} años`}. Tu defensa ahí: ${Math.round(defensaObjetivo(e.marcha))}.`);
    }
  }
  if (eficiencia() < 1) avisos.push(`👷 Faltan habitantes: tus edificios trabajan al ${Math.round(eficiencia() * 100)}%. Construí casas o demolé algo.`);
  if (balance().comida < 0) avisos.push(`🍂 Estás gastando más comida de la que producís. ¡Construí granjas!`);
  $("alertas").innerHTML = avisos.map((a) => `<div class="alerta">${a}</div>`).join("");
}

function dibujarPanel() {
  document.querySelectorAll(".pestanias button").forEach((b) => b.classList.toggle("activa", b.dataset.pestania === pestania));
  const fn = { construir: panelConstruir, acciones: panelAcciones, ejercito: panelEjercito, vecinos: panelVecinos }[pestania];
  $("contenido").innerHTML = fn();
}

function panelConstruir() {
  if (loteElegido === null) return `<p class="ayuda">Tocá un terreno de la ciudad para construir o ver un edificio.</p>`;
  const l = lotesDe(ciudadVista)[loteElegido];
  if (l) {
    const ed = EDIFICIOS[l.tipo];
    let html = `<h3>${ed.icono} ${ed.nombre}</h3><p>${ed.desc}</p>`;
    const prod = textoProduce(ed);
    if (prod) html += `<p>Da: <b>${prod}</b>${ed.trabajadores ? ` (con ${trabajadoresDe(l.tipo)} trabajador${trabajadoresDe(l.tipo) > 1 ? "es" : ""})` : ""}</p>`;
    if (l.falta > 0) html += `<p class="ayuda">En obra: faltan ${l.falta} año(s).</p>`;
    if (moviendo !== null) {
      html += `<p class="ayuda">↔️ Tocá el terreno al que lo querés llevar. Si ahí hay otro edificio, cambian de lugar.</p>
        <button data-accion="mover-cancelar" class="claro">Cancelar</button>`;
      return html;
    }
    html += `<div class="fila"><button data-accion="mover" title="También podés arrastrarlo con el mouse">↔️ Mover</button>`;
    if (!ed.fijo) html += ` <button data-accion="demoler">🔨 Demoler</button>`;
    return html + `</div>`;
  }
  let html = `<h3>¿Qué construís acá?</h3><div class="lista">`;
  for (const tipo in EDIFICIOS) {
    const ed = EDIFICIOS[tipo];
    if (ed.fijo) continue;
    const p = puedeConstruir(tipo, ciudadVista);
    const bloqueado = ed.requiere && !tiene(ed.requiere);
    html += `
      <div class="item ${bloqueado ? "bloqueado" : ""}">
        <div class="item-icono">${bloqueado ? "🔒" : ed.icono}</div>
        <div class="item-texto">
          <b>${ed.nombre}</b> <small>· ${ed.turnos} año${ed.turnos > 1 ? "s" : ""}${ed.trabajadores ? ` · 👷 ${trabajadoresDe(tipo)}` : ""}</small><br>
          <small>${ed.desc}${textoProduce(ed) ? " <b>" + textoProduce(ed) + "</b>" : ""}</small><br>
          <small>Cuesta: ${textoCosto(ed.costo)}</small>
          ${p.ok ? "" : `<br><small class="motivo">${p.motivo}</small>`}
        </div>
        <button data-accion="construir" data-tipo="${tipo}" ${p.ok ? "" : "disabled"}>Construir</button>
      </div>`;
  }
  return html + "</div>";
}

function panelAcciones() {
  const ap = apoyo();
  let html = `<p>😊 Apoyo popular: <b>${ap}</b> de 100 · todo rinde <b>${Math.round(productividad() * 100)}%</b></p>
    <p class="ayuda">Ganarte al pueblo cuesta recursos; exprimirlo te da recursos pero baja el apoyo. Cada acción tarda unos años en poder repetirse.</p>
    <div class="lista">`;
  for (const id in ACCIONES) {
    const a = ACCIONES[id];
    const p = puedeAccion(id);
    const bloqueado = a.requiere && cuenta(a.requiere) === 0;
    const gana = Object.entries(ganaAccion(id)).map(([r, v]) => `+${v} ${RECURSOS[r].icono}`).join(" ");
    const partes = [];
    if (a.costo) partes.push(`Cuesta: ${textoCosto(a.costo)}`);
    if (gana) partes.push(`Da: ${gana}`);
    html += `
      <div class="item ${bloqueado ? "bloqueado" : ""}">
        <div class="item-icono">${bloqueado ? "🔒" : a.icono}</div>
        <div class="item-texto">
          <b>${a.nombre}</b> <small class="${a.apoyo >= 0 ? "bien" : "mal"}">${a.apoyo >= 0 ? "+" : ""}${a.apoyo} 😊</small><br>
          <small>${a.desc}</small><br>
          <small>${partes.join(" · ") || "Gratis"} · se repite cada ${a.espera} años</small>
          ${p.ok ? "" : `<br><small class="motivo">${p.motivo}</small>`}
        </div>
        <button data-accion="gobierno" data-id="${id}" ${p.ok && !estado.terminado ? "" : "disabled"}>Hacer</button>
      </div>`;
  }
  return html + "</div>";
}

function panelEjercito() {
  let html = `<p>🛡️ Defensa de Roma: <b>${Math.round(poderDefensa())}</b>
    <small>(soldados + habitantes${bonusMuralla() ? ` + muralla +${bonusMuralla() * 100}%` : ""}${efecto("defensa") ? ` + tecnologías +${Math.round(efecto("defensa") * 100)}%` : ""})</small></p>
    <p>👥 Habitantes libres para alistar: <b>${libres()}</b></p><div class="lista">`;
  for (const tipo in UNIDADES) {
    const u = UNIDADES[tipo];
    const p1 = puedeEntrenar(tipo, 1);
    const p5 = puedeEntrenar(tipo, 5);
    const bloqueado = (u.requiere && !tiene(u.requiere));
    html += `
      <div class="item ${bloqueado ? "bloqueado" : ""}">
        <div class="item-icono">${bloqueado ? "🔒" : u.icono}</div>
        <div class="item-texto">
          <b>${u.nombre}</b> <span class="cantidad">× ${estado.ejercito[tipo]}</span>${listos(tipo) < estado.ejercito[tipo] ? ` <small>(${estado.ejercito[tipo] - listos(tipo)} descansando)</small>` : ""}<br>
          <small>⚔️ Ataque ${u.ataque} · 🛡️ Defensa ${u.defensa}${u.desc ? " · " + u.desc : ""}</small><br>
          <small>Cuesta: ${textoCosto(costoUnidad(tipo))}</small>
          ${p1.ok ? "" : `<br><small class="motivo">${p1.motivo}</small>`}
        </div>
        <div class="botones">
          <button data-accion="entrenar" data-unidad="${tipo}" data-n="1" ${p1.ok ? "" : "disabled"}>+1</button>
          <button data-accion="entrenar" data-unidad="${tipo}" data-n="5" ${p5.ok ? "" : "disabled"}>+5</button>
        </div>
      </div>`;
  }
  // Barcos
  const b1 = puedeConstruirBarco(1), b5 = puedeConstruirBarco(5);
  const sinBarcos = !tiene(MAPA.tecMar);
  html += `
      <div class="item ${sinBarcos ? "bloqueado" : ""}">
        <div class="item-icono">${sinBarcos ? "🔒" : BARCOS.icono}</div>
        <div class="item-texto">
          <b>${BARCOS.plural}</b> <span class="cantidad">× ${barcos()}</span>${barcosListos() < barcos() ? ` <small>(${barcos() - barcosListos()} ya navegaron este año)</small>` : ""}<br>
          <small>${BARCOS.desc} Cada uno lleva ${BARCOS.lleva} soldados para atacar zonas a las que solo se llega por mar. Si perdés, se hunde la mitad.</small><br>
          <small>Cuesta: ${textoCosto(BARCOS.costo)}</small>
          ${b1.ok ? "" : `<br><small class="motivo">${b1.motivo}</small>`}
        </div>
        <div class="botones">
          <button data-accion="barco" data-n="1" ${b1.ok ? "" : "disabled"}>+1</button>
          <button data-accion="barco" data-n="5" ${b5.ok ? "" : "disabled"}>+5</button>
        </div>
      </div>`;
  return html + "</div>";
}

function panelVecinos() {
  const cansados = soldados() - soldadosListos();
  let html = cansados ? `<p class="ayuda">😴 ${cansados} soldado${cansados > 1 ? "s" : ""} ya pelearon este año y descansan. ${soldadosListos() ? `Te quedan ${soldadosListos()} listos para atacar.` : "El año que viene vuelven a estar listos."}</p>` : "";
  html += `<p class="ayuda">Cada pueblo tiene su territorio en el 🗺️ Mapa. Declarale la guerra y después tocá en el mapa una zona suya pegada a la tuya para atacarla. Si tomás su capital, se rinde entero.</p>`;
  const conocidos = Object.keys(ENEMIGOS).filter(descubierto);
  const ocultos = Object.keys(ENEMIGOS).length - conocidos.length;
  html += `<div class="lista">${conocidos.map(tarjetaEnemigo).join("")}`;
  if (ocultos) {
    html += `<div class="item bloqueado"><div class="item-icono">❓</div><div class="item-texto">
      <b>${ocultos} pueblo${ocultos > 1 ? "s" : ""} sin descubrir</b><br>
      <small>Abrí el 🗺️ Mapa y mandá exploradores para encontrarlos.</small></div></div>`;
  }
  return html + "</div>";
}

// Ficha de un pueblo (se usa en la pestaña Vecinos y en el mapa)
function tarjetaEnemigo(id) {
  const d = ENEMIGOS[id];
  const e = estado.enemigos[id];
  const muestra = `<span class="muestra" style="background:${d.color}"></span>`;
  if (!e.vivo) {
    const trib = Object.entries(d.tributo).map(([r, v]) => `+${v} ${RECURSOS[r].icono}`).join(" ");
    const col = coloniaEn(d.x, d.y);
    return `<div class="item hecha"><div class="item-icono">🦅</div><div class="item-texto"><b>${d.nombre}</b> – conquistados<br><small>Te pagan ${trib} por año.</small></div>
      ${col ? `<button data-accion="ver-ciudad" data-ciudad="${col}">🏛️ Ver ${d.ciudad}</button>` : ""}</div>`;
  }
  let estadoTexto;
  if (e.marcha) estadoTexto = `<span class="motivo">⚠️ Su ejército marcha hacia ${nombreObjetivo(e.marcha)}: ¡sus zonas quedaron poco defendidas!</span>`;
  else if (e.guerra) estadoTexto = `<small class="mal">⚔️ En guerra con Roma.${e.proximo ? ` Próximo ataque: en unos ${Math.max(1, e.proximo - estado.turno)} años.` : ""}</small>`;
  else estadoTexto = `<small>🕊️ En paz con Roma.${e.proximo ? ` Pero te van a atacar en unos ${Math.max(1, e.proximo - estado.turno)} años.` : ""}</small>`;
  const boton = e.guerra
    ? `<button data-accion="ver-mapa" data-enemigo="${id}">🗺️ Ver</button>`
    : `<button data-accion="guerra" data-enemigo="${id}" ${estado.terminado ? "disabled" : ""}>⚔️ Declarar guerra</button>`;
  return `
    <div class="item">
      <div class="item-icono">${d.icono}</div>
      <div class="item-texto">
        <b>${muestra} ${d.nombre}</b> <small>· capital: ${d.ciudad} · ${zonasDe(id)} zonas</small><br>
        <small>${d.desc}</small><br>
        <small>Ejército: ~${estimar(e.fuerza)} · Defensa de su capital: ~${estimar(defensaEnemiga(id))}${d.muro ? ` (murallas +${d.muro * 100}%)` : ""}</small><br>
        ${estadoTexto}
      </div>
      ${boton}
    </div>`;
}

// ---------- Mapa ----------

const colorDe = (dueno) => (dueno === "roma" ? MAPA.colorRoma : dueno ? ENEMIGOS[dueno].color : MAPA.colorNadie);

// El mapa se dibuja en un <canvas> y se puede acercar y alejar (rueda del mouse, pellizco o botones ＋ －)
// y mover arrastrando. "camara" dice qué parte se ve: escala = píxeles por casilla, ox/oy = corrimiento.
let camara = null;
let capaMapa = null;    // lo que hay que pintar en cada casilla (se recalcula cuando cambia la partida)
const ESCALA_MAX = 48;

// Geometría de los hexágonos (con punta arriba). Con escala e: cada hexágono mide e de ancho,
// las filas están a FILA_HEX * e una de otra y las filas impares se corren medio hexágono.
const FILA_HEX = Math.sqrt(3) / 2;
const RADIO_HEX = 1 / Math.sqrt(3);
const anchoMapa = (e) => (MAPA_ANCHO + 0.5) * e;
const altoMapa = (e) => ((MAPA_ALTO - 1) * FILA_HEX + 2 * RADIO_HEX) * e;
// Centro de un hexágono en la pantalla
const centroHexX = (x, y) => camara.ox + (x + 0.5 + (y & 1) * 0.5) * camara.escala;
const centroHexY = (y) => camara.oy + (RADIO_HEX + y * FILA_HEX) * camara.escala;

function escalaMin() {
  const cv = $("mapa");
  return Math.min(cv.clientWidth / anchoMapa(1), cv.clientHeight / altoMapa(1));
}

// Mueve la cámara para que la casilla (x, y) quede en el medio
function centrarMapa(x, y, escala) {
  const cv = $("mapa");
  if (!camara) camara = { escala: 14, ox: 0, oy: 0 };
  if (escala) camara.escala = escala;
  camara.ox = cv.clientWidth / 2 - (x + 0.5 + (y & 1) * 0.5) * camara.escala;
  camara.oy = cv.clientHeight / 2 - (RADIO_HEX + y * FILA_HEX) * camara.escala;
  limitarCamara();
}

// Que no se pueda alejar de más ni perder el mapa de vista
function limitarCamara() {
  const cv = $("mapa");
  const w = cv.clientWidth, h = cv.clientHeight;
  camara.escala = Math.min(ESCALA_MAX, Math.max(escalaMin(), camara.escala));
  const ancho = anchoMapa(camara.escala), alto = altoMapa(camara.escala);
  camara.ox = ancho <= w ? (w - ancho) / 2 : Math.min(0, Math.max(w - ancho, camara.ox));
  camara.oy = alto <= h ? (h - alto) / 2 : Math.min(0, Math.max(h - alto, camara.oy));
}

// Qué hexágono hay en un punto de la pantalla (el de centro más cercano)
function casillaEnPantalla(px, py) {
  const e = camara.escala;
  const fila = Math.floor((py - camara.oy) / e / FILA_HEX);
  let mejor = null, dmin = Infinity;
  for (let y = fila - 1; y <= fila + 1; y++) {
    const col = Math.round((px - camara.ox) / e - 0.5 - (y & 1) * 0.5);
    for (let x = col - 1; x <= col + 1; x++) {
      if (!dentro(x, y)) continue;
      const d = (centroHexX(x, y) - px) ** 2 + (centroHexY(y) - py) ** 2;
      if (d < dmin) { dmin = d; mejor = { x, y }; }
    }
  }
  return mejor;
}

// Acerca (factor > 1) o aleja (factor < 1) dejando quieto el punto (px, py) de la pantalla
function zoomMapa(factor, px, py) {
  const cv = $("mapa");
  if (px === undefined) { px = cv.clientWidth / 2; py = cv.clientHeight / 2; }
  const antes = camara.escala;
  camara.escala = Math.min(ESCALA_MAX, Math.max(escalaMin(), antes * factor));
  const f = camara.escala / antes;
  camara.ox = px - (px - camara.ox) * f;
  camara.oy = py - (py - camara.oy) * f;
  limitarCamara();
  pintarMapa();
}

// Calcula qué color y qué marcas lleva cada casilla. Se llama cada vez que cambia la partida.
function dibujarMapa() {
  const n = MAPA_ANCHO * MAPA_ALTO;
  const capa = { color: new Array(n), atacables: [], explorables: [], viajes: [], lugares: [] };
  for (let y = 0; y < MAPA_ALTO; y++) {
    for (let x = 0; x < MAPA_ANCHO; x++) {
      const i = y * MAPA_ANCHO + x;
      if (!vista(x, y)) {
        const viajando = estado.exploradores.some((ex) => ex.x === x && ex.y === y);
        if (viajando) capa.viajes.push(i);
        if (viajando || puedeExplorar(x, y).ok) { capa.color[i] = "#4a3d2e"; capa.explorables.push(i); }
        else capa.color[i] = "#2a231b";
        continue;
      }
      if (!esTierra(x, y)) { capa.color[i] = "#9fd3ea"; continue; }
      const dueno = duenoDe(x, y);
      capa.color[i] = colorDe(dueno);
      if (dueno && dueno !== "roma" && estado.enemigos[dueno].guerra && alcanzable(x, y)) capa.atacables.push(i);
    }
  }
  // Ciudades: Roma, las fundadas y las capitales que ya viste
  capa.lugares.push({ x: MAPA.roma.x, y: MAPA.roma.y, icono: ICONOS_CIUDAD.roma, nombre: "Roma", mio: true });
  estado.colonias.forEach((c) => { if (!c.conquistada) capa.lugares.push({ x: c.x, y: c.y, icono: ICONOS_CIUDAD.fundada, nombre: c.nombre, mio: true }); });
  for (const id in ENEMIGOS) {
    const d = ENEMIGOS[id];
    if (!vista(d.x, d.y)) continue;
    const vivo = estado.enemigos[id].vivo;
    capa.lugares.push({ x: d.x, y: d.y, icono: ICONOS_CIUDAD[vivo ? "enemiga" : "conquistada"], nombre: d.ciudad, mio: !vivo });
  }
  capaMapa = capa;
  pintarMapa();
  $("mapa-info").innerHTML = infoCasilla();
}

// Pinta en pantalla la parte del mapa que se ve (se llama al mover o acercar, sin recalcular nada)
function pintarMapa() {
  const cv = $("mapa");
  if (!capaMapa || !cv.clientWidth) return;   // el mapa está oculto
  const dpr = window.devicePixelRatio || 1;
  const w = cv.clientWidth, h = cv.clientHeight;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
  }
  if (!camara) centrarMapa(MAPA.roma.x, MAPA.roma.y, 14);
  limitarCamara();
  const ctx = cv.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#2a231b";
  ctx.fillRect(0, 0, w, h);
  const e = camara.escala;
  const y0 = Math.max(0, Math.floor(-camara.oy / e / FILA_HEX) - 1);
  const y1 = Math.min(MAPA_ALTO - 1, Math.ceil((h - camara.oy) / e / FILA_HEX) + 1);
  const x0 = Math.max(0, Math.floor(-camara.ox / e) - 1);
  const x1 = Math.min(MAPA_ANCHO - 1, Math.ceil((w - camara.ox) / e) + 1);
  const enPantalla = (i) => { const x = i % MAPA_ANCHO, y = Math.floor(i / MAPA_ANCHO); return x >= x0 && x <= x1 && y >= y0 && y <= y1; };

  // Las 6 puntas del hexágono, empezando arriba y girando como el reloj
  const r = RADIO_HEX * e;
  const puntas = [-90, -30, 30, 90, 150, 210].map((g) => [Math.cos(g * Math.PI / 180), Math.sin(g * Math.PI / 180)]);
  const hexagono = (path, x, y, agrandar = 1) => {
    const cx = centroHexX(x, y), cy = centroHexY(y), rr = r * agrandar;
    path.moveTo(cx + puntas[0][0] * rr, cy + puntas[0][1] * rr);
    for (let k = 1; k < 6; k++) path.lineTo(cx + puntas[k][0] * rr, cy + puntas[k][1] * rr);
    path.closePath();
  };
  // Muy de lejos los hexágonos son tan chiquitos que alcanza con cuadraditos (es más rápido)
  const lejos = e < 4;
  const forma = (path, x, y) => (lejos
    ? path.rect(centroHexX(x, y) - e / 2, centroHexY(y) - e * 0.5, e + 0.5, e * FILA_HEX + 0.8)
    : hexagono(path, x, y, 1.04));

  // Colores de cada casilla (se juntan las del mismo color para pintar más rápido)
  const porColor = new Map();
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const c = capaMapa.color[y * MAPA_ANCHO + x];
      if (!porColor.has(c)) porColor.set(c, new Path2D());
      forma(porColor.get(c), x, y);
    }
  }
  for (const [c, path] of porColor) { ctx.fillStyle = c; ctx.fill(path); }

  // Íconos del terreno (solo bien de cerca)
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  if (e >= 22) {
    ctx.font = `${Math.round(e * 0.5)}px sans-serif`;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (!vista(x, y) || !esTierra(x, y)) continue;
        const ic = MAPA.terrenos[terreno(x, y)].icono;
        if (ic) ctx.fillText(ic, centroHexX(x, y), centroHexY(y));
      }
    }
  }

  // Fronteras: una línea oscura en el lado del hexágono donde cambia el dueño.
  // Se miran 3 vecinos (derecha, abajo a la derecha, abajo a la izquierda) para no dibujar cada lado dos veces.
  // Lado compartido con cada uno: entre las puntas 1-2, 2-3 y 3-4.
  if (!lejos) {
    const borde = new Path2D();
    for (let y = y0; y <= y1; y++) {
      const dirs = direcciones(y);
      for (let x = x0; x <= x1; x++) {
        if (!vista(x, y) || !esTierra(x, y)) continue;
        const d = duenoDe(x, y);
        const cx = centroHexX(x, y), cy = centroHexY(y);
        for (let k = 0; k < 3; k++) {
          const vx = x + dirs[k][0], vy = y + dirs[k][1];
          if (!vista(vx, vy) || !esTierra(vx, vy) || duenoDe(vx, vy) === d) continue;
          borde.moveTo(cx + puntas[k + 1][0] * r, cy + puntas[k + 1][1] * r);
          borde.lineTo(cx + puntas[k + 2][0] * r, cy + puntas[k + 2][1] * r);
        }
      }
    }
    ctx.strokeStyle = "#3b2f22";
    ctx.lineWidth = Math.max(1, e / 8);
    ctx.stroke(borde);
  }

  // Zonas que se pueden explorar: borde dorado
  if (e >= 5) {
    const path = new Path2D();
    for (const i of capaMapa.explorables) if (enPantalla(i)) hexagono(path, i % MAPA_ANCHO, Math.floor(i / MAPA_ANCHO), 0.85);
    ctx.strokeStyle = "#d4a017";
    ctx.lineWidth = Math.max(1, e / 10);
    ctx.stroke(path);
  }

  // Zonas que podés atacar: titilan
  const brillo = (Math.sin(Date.now() / 220) + 1) / 2;
  const atac = new Path2D();
  for (const i of capaMapa.atacables) if (enPantalla(i)) forma(atac, i % MAPA_ANCHO, Math.floor(i / MAPA_ANCHO));
  ctx.fillStyle = `rgba(255,255,255,${0.15 + 0.35 * brillo})`;
  ctx.fill(atac);

  // Exploradores de viaje
  ctx.font = `${Math.max(10, Math.round(e * 0.7))}px sans-serif`;
  for (const i of capaMapa.viajes) {
    if (enPantalla(i)) ctx.fillText("🧭", centroHexX(i % MAPA_ANCHO, Math.floor(i / MAPA_ANCHO)), centroHexY(Math.floor(i / MAPA_ANCHO)));
  }

  // Ciudades con su nombre
  const tam = Math.max(e < 5 ? 10 : 12, Math.min(30, e * 0.9));
  for (const l of capaMapa.lugares) {
    const cx = centroHexX(l.x, l.y), cy = centroHexY(l.y);
    if (cx < -60 || cy < -30 || cx > w + 60 || cy > h + 30) continue;
    ctx.font = `${tam}px sans-serif`;
    ctx.fillText(l.icono, cx, cy);
    if (e < 5 && !(l.mio && l.nombre === "Roma")) continue;   // muy de lejos los nombres se pisan
    ctx.font = "bold 11px sans-serif";
    const tw = ctx.measureText(l.nombre).width + 8;
    const ty = cy + tam / 2 + 8;
    ctx.fillStyle = l.mio ? "#22783a" : "#b02a2a";
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(cx - tw / 2, ty - 7, tw, 14, 4) : ctx.rect(cx - tw / 2, ty - 7, tw, 14);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(l.nombre, cx, ty + 1);
  }

  // Casilla elegida
  if (casillaElegida) {
    const path = new Path2D();
    const agrandar = e < 8 ? 8 / e : 1;
    hexagono(path, casillaElegida.x, casillaElegida.y, agrandar);
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 3;
    ctx.stroke(path);
  }
}

// Las zonas atacables titilan: se repinta solo mientras el mapa está a la vista y hay algo que titile
setInterval(() => {
  if (vistaActual === "mapa" && capaMapa && capaMapa.atacables.length && !document.hidden) pintarMapa();
}, 120);
window.addEventListener("resize", () => { if (vistaActual === "mapa") pintarMapa(); });

// ----- Mover y acercar el mapa con el mouse o los dedos -----
(function () {
  const cv = $("mapa");
  const dedos = new Map();     // punteros apretados: id → {x, y}
  let movido = false, inicio = null, pellizco = null;
  const local = (ev) => { const r = cv.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; };

  cv.addEventListener("pointerdown", (ev) => {
    cv.setPointerCapture(ev.pointerId);
    dedos.set(ev.pointerId, local(ev));
    if (dedos.size === 1) { movido = false; inicio = local(ev); }
    pellizco = null;
  });
  cv.addEventListener("pointermove", (ev) => {
    if (!dedos.has(ev.pointerId)) return;
    const antes = dedos.get(ev.pointerId);
    const ahora = local(ev);
    dedos.set(ev.pointerId, ahora);
    if (dedos.size === 1) {
      if (!movido && Math.abs(ahora.x - inicio.x) + Math.abs(ahora.y - inicio.y) < 6) return;
      movido = true;
      camara.ox += ahora.x - antes.x;
      camara.oy += ahora.y - antes.y;
      limitarCamara();
      pintarMapa();
    } else if (dedos.size === 2) {
      movido = true;
      const [a, b] = [...dedos.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const medio = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      if (pellizco) {
        camara.ox += medio.x - pellizco.medio.x;
        camara.oy += medio.y - pellizco.medio.y;
        zoomMapa(dist / pellizco.dist, medio.x, medio.y);
      }
      pellizco = { dist, medio };
    }
  });
  const soltar = (ev) => {
    if (!dedos.has(ev.pointerId)) return;
    dedos.delete(ev.pointerId);
    pellizco = null;
    if (dedos.size || movido || ev.type === "pointercancel") return;
    // Fue un toque sin mover: elegir la casilla
    const p = local(ev);
    const c = casillaEnPantalla(p.x, p.y);
    if (!c) return;
    const { x, y } = c;
    const misma = casillaElegida && casillaElegida.x === x && casillaElegida.y === y;
    casillaElegida = misma ? null : { x, y };
    pintarMapa();
    $("mapa-info").innerHTML = infoCasilla();
  };
  cv.addEventListener("pointerup", soltar);
  cv.addEventListener("pointercancel", soltar);
  cv.addEventListener("wheel", (ev) => {
    ev.preventDefault();
    const p = local(ev);
    zoomMapa(ev.deltaY < 0 ? 1.2 : 1 / 1.2, p.x, p.y);
  }, { passive: false });
  document.querySelectorAll("[data-zoom]").forEach((b) => b.addEventListener("click", () => {
    const z = +b.dataset.zoom;
    if (z === 0) { centrarMapa(MAPA.roma.x, MAPA.roma.y, 14); pintarMapa(); }
    else if (z === 2) { camara.escala = escalaMin(); limitarCamara(); pintarMapa(); }
    else zoomMapa(z > 0 ? 1.5 : 1 / 1.5);
  }));
})();

function infoCasilla() {
  const pie = `<p class="ayuda">🧭 Exploradores de viaje: ${estado.exploradores.length} · 👥 Habitantes libres: ${libres()}</p>`;
  return infoZona() + pie;
}

function infoZona() {
  if (!casillaElegida) {
    return `<p class="ayuda">Tocá una zona del mapa para ver de quién es. En naranja, el territorio de Roma.
      Las zonas oscuras con borde dorado se pueden explorar: un habitante libre va y vuelve contando lo que vio.
      Las zonas que titilan son de pueblos en guerra con vos y las podés atacar.</p>`;
  }
  const { x, y } = casillaElegida;
  if (!vista(x, y)) {
    const viaje = estado.exploradores.find((ex) => ex.x === x && ex.y === y);
    if (viaje) return `<h3>🧭 Zona desconocida</h3><p>Tu explorador vuelve en ${viaje.vuelve - estado.turno} año(s).</p>`;
    const p = puedeExplorar(x, y);
    const t = turnosViaje(x, y);
    return `<h3>❓ Zona desconocida</h3>
      <p>Un habitante libre va a explorar y vuelve en <b>${t} año${t > 1 ? "s" : ""}</b>. Mientras viaja, no trabaja.</p>
      ${p.ok ? "" : `<p class="motivo">${p.motivo}</p>`}
      <button data-accion="explorar" ${p.ok && !estado.terminado ? "" : "disabled"}>🧭 Explorar</button>`;
  }
  if (!esTierra(x, y)) return `<h3>🌊 Mar</h3>`;
  const ter = MAPA.terrenos[terreno(x, y)];
  const dueno = duenoDe(x, y);
  const lugar = lugarEn(x, y);
  if (lugar === "roma") return `<h3>👑 Roma</h3><p>Tu ciudad. Desde acá salen tus ejércitos.</p>`;
  const col = coloniaEn(x, y);
  if (col) {
    const conq = estado.colonias[col - 1].conquistada;
    return `<h3>${iconoCiudad(col)} ${estado.colonias[col - 1].nombre}</h3><p>${conq ? `Antigua capital de los ${ENEMIGOS[conq].nombre.toLowerCase()}, ahora es de Roma` : "Una ciudad fundada por Roma"}: puede tener todos los edificios que tiene Roma. Comparte con Roma los recursos y los habitantes.</p>
      <button data-accion="ver-ciudad" data-ciudad="${col}">🏛️ Ver la ciudad</button>`;
  }
  if (!dueno) return `<h3>${ter.nombre}</h3><p class="ayuda">Tierra de nadie: acá no vive ningún pueblo.</p>`;
  if (dueno === "roma") {
    const p = puedeFundar(x, y);
    const prohibido = FUNDACION.prohibidos.includes(terreno(x, y));
    return `<h3>${ter.icono} ${ter.nombre} · territorio romano</h3>
      ${prohibido ? `<p class="ayuda">No se puede fundar una ciudad en ${ter.nombre.toLowerCase()}.</p>` : `<p>🏘️ Podés fundar una ciudad nueva: ${FUNDACION.lotes} terrenos más para construir.<br>
      <small>Cuesta: ${textoCosto(costoFundar())} y necesita ${FUNDACION.colonos} 👥 habitantes libres.</small></p>
      ${p.ok ? "" : `<p class="motivo"><small>${p.motivo}</small></p>`}
      <button data-accion="fundar" ${p.ok && !estado.terminado ? "" : "disabled"}>🏘️ Fundar ${FUNDACION.nombres[fundadas()] || "ciudad"}</button>`}`;
  }
  // Zona de otro pueblo
  const d = ENEMIGOS[dueno];
  const p = puedeAtacarZona(x, y);
  const capital = lugar === dueno;
  const titulo = capital ? `${ICONOS_CIUDAD.enemiga} ${d.ciudad}, capital de los ${d.nombre.toLowerCase()}` : `${ter.icono} ${ter.nombre} de los ${d.nombre.toLowerCase()}`;
  const bonus = MAPA.bonusTerreno[terreno(x, y)];
  const detalle = capital
    ? `Si la tomás, los ${d.nombre.toLowerCase()} se rinden y <b>todo su territorio</b> pasa a ser tuyo.`
    : `La defiende parte de su ejército${bonus ? ` (${ter.nombre.toLowerCase()}: +${bonus * 100}% de defensa)` : ""}. Si la ganás, pasa a ser tuya y te llevás algo de botín.`;
  const enGuerra = estado.enemigos[dueno].guerra;
  return `<h3>${titulo}</h3>
    <p>${detalle}<br><small>Defensa: ~${estimar(defensaZona(x, y))} · Para quedártela: ${textoCosto(costoZona(x, y))} de poder político (se paga solo si ganás)</small></p>
    ${p.ok || !enGuerra ? "" : `<p class="motivo"><small>${p.motivo}</small></p>`}
    ${enGuerra
      ? `<button data-accion="preparar" ${p.ok && !estado.terminado ? "" : "disabled"}>⚔️ Atacar esta zona</button>`
      : `<p class="ayuda">Estás en paz con ellos. Para atacar, primero declarales la guerra.</p>
         <button data-accion="guerra" data-enemigo="${dueno}" ${estado.terminado ? "disabled" : ""}>⚔️ Declarar guerra</button>`}`;
}

// ---------- Árbol de tecnologías ----------

const ARBOL = { anchoCol: 200, anchoNodo: 168, altoNodo: 64, altoFila: 78, arriba: 34 };

// Período que se está mirando en el árbol (null = el período actual)
let periodoVisto = null;
const periodoEnArbol = () => (periodoVisto === null ? periodoActual() : Math.min(periodoVisto, periodoActual()));

// Tecnologías de un período
const tecsDe = (per) => Object.keys(TECNOLOGIAS).filter((id) => periodoTec(id) === per);

// Flechas dentro de un período: [de, a]
function flechasArbol(per) {
  const f = [];
  for (const id of tecsDe(per)) {
    for (const r of TECNOLOGIAS[id].requiere || []) if (periodoTec(r) === per) f.push([r, id]);
  }
  return f;
}

// Cuántas flechas se cruzan con este orden (fila de cada tecnología)
function crucesArbol(fila, f) {
  let n = 0;
  for (let i = 0; i < f.length; i++) {
    for (let j = i + 1; j < f.length; j++) {
      const [a, b] = f[i], [c, d] = f[j];
      if (columnaTec(a) !== columnaTec(c) || columnaTec(b) !== columnaTec(d)) continue;
      if ((fila[a] - fila[c]) * (fila[b] - fila[d]) < 0) n++;
    }
  }
  return n;
}

const disposicionesGuardadas = {};

// Calcula dónde va cada tecnología de un período: columna según lo que requiere
// y fila elegida para que las ramas no se crucen. Prueba varias veces acomodando
// cada tecnología a la altura promedio de sus vecinas y se queda con el mejor orden.
function disposicionArbol(per) {
  if (disposicionesGuardadas[per]) return disposicionesGuardadas[per];
  const flechas = flechasArbol(per);
  const columnas = [];
  for (const id of tecsDe(per)) {
    const c = columnaTec(id);
    (columnas[c] = columnas[c] || []).push(id);
  }
  const maxFilas = Math.max(...columnas.map((c) => c.length));
  const padres = {}, hijos = {};
  for (const [r, id] of flechas) {
    (padres[id] = padres[id] || []).push(r);
    (hijos[r] = hijos[r] || []).push(id);
  }

  const fila = {};
  const ubicar = (ids) => {
    const corrida = (maxFilas - ids.length) / 2;
    ids.forEach((id, i) => (fila[id] = corrida + i));
  };
  const promedio = (id, vecinas) =>
    vecinas && vecinas.length ? vecinas.reduce((s, x) => s + fila[x], 0) / vecinas.length : fila[id];
  const ordenar = (ids, vecinasDe) => {
    const valor = {};
    ids.forEach((id) => (valor[id] = promedio(id, vecinasDe[id])));
    ids.sort((a, b) => valor[a] - valor[b]);   // si empatan, queda el orden de los datos
    ubicar(ids);
  };

  columnas.forEach(ubicar);
  let mejor = { ...fila }, menosCruces = crucesArbol(fila, flechas);
  for (let vuelta = 0; vuelta < 8 && menosCruces > 0; vuelta++) {
    for (let c = 1; c < columnas.length; c++) ordenar(columnas[c], padres);
    const n = crucesArbol(fila, flechas);
    if (n < menosCruces) { menosCruces = n; mejor = { ...fila }; }
    for (let c = columnas.length - 2; c >= 0; c--) ordenar(columnas[c], hijos);
  }

  // Si el período tiene filas fijas en los datos, se usan esas
  let filas = maxFilas;
  if (tecsDe(per).every((id) => TECNOLOGIAS[id].fila !== undefined)) {
    mejor = {};
    for (const id of tecsDe(per)) mejor[id] = TECNOLOGIAS[id].fila;
    filas = 1 + Math.max(...Object.values(mejor));
    menosCruces = crucesArbol(mejor, flechas);
  }

  const pos = {};
  for (const id in mejor) {
    pos[id] = { x: columnaTec(id) * ARBOL.anchoCol + 16, y: ARBOL.arriba + mejor[id] * ARBOL.altoFila };
  }
  disposicionesGuardadas[per] = { pos, flechas, columnas: columnas.length, alto: ARBOL.arriba + filas * ARBOL.altoFila, cruces: menosCruces };
  return disposicionesGuardadas[per];
}

// Qué edificios y tropas destraba una tecnología
function destraba(id) {
  const cosas = [];
  for (const t in EDIFICIOS) if (EDIFICIOS[t].requiere === id) cosas.push(EDIFICIOS[t]);
  for (const t in UNIDADES) if (UNIDADES[t].requiere === id) cosas.push(UNIDADES[t]);
  return cosas;
}

function estadoTec(id) {
  if (tiene(id)) return "hecha";
  if (periodoTec(id) > periodoActual()) return "futuro";
  if ((TECNOLOGIAS[id].requiere || []).every(tiene)) return puedeInvestigar(id).ok ? "alcanzable" : "disponible";
  return "bloqueada";
}

function dibujarArbol() {
  const per = periodoEnArbol();
  const { pos, flechas, columnas, alto } = disposicionArbol(per);
  const camino = estado.meta ? faltanPara(estado.meta) : [];
  const ancho = columnas * ARBOL.anchoCol;
  const cierre = tecCierre(per);
  if (tecElegida && periodoTec(tecElegida) !== per) tecElegida = null;

  // Botones de los períodos: se pueden mirar los anteriores; los que vienen están cerrados
  let botones = "";
  PERIODOS.forEach((p, i) => {
    const futuro = i > periodoActual();
    botones += `<button data-accion="ver-periodo" data-periodo="${i}" class="${i === per ? "activa" : ""}" ${futuro ? "disabled" : ""}
      title="${futuro ? "Todavía no llegaste a este período" : ""}">${futuro ? "🔒" : p.icono} ${p.nombre}${i === periodoActual() ? " <small>(ahora)</small>" : ""}</button>`;
  });

  let eras = "";
  for (let c = 0; c < columnas; c++) {
    eras += `<div class="era" style="left:${c * ARBOL.anchoCol}px;width:${ARBOL.anchoCol}px">${PERIODOS[per].eras[c] || ""}</div>`;
  }

  let lineas = "";
  for (const [r, id] of flechas) {
    const a = pos[r], b = pos[id];
    const x1 = a.x + ARBOL.anchoNodo, y1 = a.y + ARBOL.altoNodo / 2;
    const x2 = b.x, y2 = b.y + ARBOL.altoNodo / 2;
    const medio = (x1 + x2) / 2;
    const clase = tiene(id) ? "hecha" : camino.includes(id) ? "camino" : tiene(r) ? "abierta" : "";
    lineas += `<path class="${clase}" d="M${x1},${y1} C${medio},${y1} ${medio},${y2} ${x2},${y2}" />`;
  }

  let nodos = "";
  for (const id of tecsDe(per)) {
    const t = TECNOLOGIAS[id];
    const est = estadoTec(id);
    const enCamino = camino.includes(id);
    const clases = ["nodo-tec", est, enCamino ? "en-camino" : "", id === estado.meta ? "meta" : "",
      id === tecElegida ? "elegida" : "", id === cierre ? "cierre" : ""].join(" ");
    const iconos = destraba(id).map((d) => d.icono).join("");
    const extra = id === cierre ? `<span class="nodo-destraba">➡ ${PERIODOS[per + 1].icono} ${PERIODOS[per + 1].nombre}</span>` : iconos ? `<span class="nodo-destraba">${iconos}</span>` : "";
    nodos += `
      <div class="${clases}" data-tech="${id}" style="left:${pos[id].x}px;top:${pos[id].y}px;width:${ARBOL.anchoNodo}px;height:${ARBOL.altoNodo}px">
        <div class="nodo-icono">${est === "hecha" ? "✅" : t.icono}</div>
        <div class="nodo-texto">
          <b>${t.nombre}</b>
          <small>${est === "hecha" ? "Investigada" : t.costo + " 💡"}${id === estado.meta ? " · 🎯 meta" : ""}</small>
          ${extra}
        </div>
      </div>`;
  }

  // Al redibujar, el árbol se queda donde lo habías dejado
  const viejo = document.querySelector(".arbol-scroll");
  const corrido = viejo && viejo.dataset.periodo === String(per) ? viejo.scrollLeft : 0;
  $("arbol").innerHTML = `
    <nav class="periodos">${botones}</nav>
    ${per < periodoActual() ? `<p class="ayuda centrado">Estás mirando un período que ya pasó.</p>` : ""}
    <div class="arbol-scroll" data-periodo="${per}">
      <div class="arbol-lienzo" style="width:${ancho}px;height:${alto}px">
        ${eras}
        <svg width="${ancho}" height="${alto}">${lineas}</svg>
        ${nodos}
      </div>
    </div>`;
  document.querySelector(".arbol-scroll").scrollLeft = corrido;
  $("arbol-info").innerHTML = infoTec();
}

function infoTec() {
  const ciencia = `<p class="ayuda">Tenés <b>${Math.floor(estado.rec.ciencia)} 💡</b> (${signo(balance().ciencia)} por año).
    ${estado.meta ? `🎯 Meta: <b>${TECNOLOGIAS[estado.meta].nombre}</b>.` : "Sin meta elegida."}</p>`;
  if (!tecElegida) {
    return `${tarjetaPeriodo()}<p class="ayuda">Tocá una tecnología para ver qué da. Podés investigarla ya o ponerla como <b>🎯 meta</b>:
      las del camino se investigan solas apenas te alcance el conocimiento.</p>${ciencia}`;
  }
  const t = TECNOLOGIAS[tecElegida];
  const est = estadoTec(tecElegida);
  const cosas = destraba(tecElegida);
  const per = PERIODOS[periodoTec(tecElegida)];
  let html = `<h3>${t.icono} ${t.nombre} <small>· ${per.icono} ${per.nombre}, ${per.eras[columnaTec(tecElegida)] || ""}</small></h3><p>${t.desc}</p>`;
  if (cosas.length) html += `<p>Destraba: ${cosas.map((c) => `${c.icono} ${c.nombre}`).join(", ")}</p>`;
  if (t.requiere) html += `<p><small>Requiere: ${t.requiere.map((r) => `${tiene(r) ? "✅" : "❌"} ${TECNOLOGIAS[r].nombre}`).join(" · ")}</small></p>`;
  if (est === "hecha") return html + `<p class="bien">✅ Ya la tenés.</p>` + ciencia;

  const camino = faltanPara(tecElegida);
  const total = camino.reduce((s, id) => s + TECNOLOGIAS[id].costo, 0);
  if (camino.length > 1) {
    html += `<p><small>Para llegar hay que investigar ${camino.length} tecnologías: ${camino.map((id) => TECNOLOGIAS[id].nombre).join(" → ")}. En total: <b>${total} 💡</b>.</small></p>`;
  }
  const p = puedeInvestigar(tecElegida);
  const esMeta = estado.meta === tecElegida;
  html += `<div class="fila">
    <button data-accion="investigar" data-tech="${tecElegida}" ${p.ok ? "" : "disabled"}>💡 Investigar ya (${t.costo} 💡)</button>
    ${esMeta ? `<button data-accion="meta" data-tech="" class="claro">Quitar meta</button>`
             : `<button data-accion="meta" data-tech="${tecElegida}">🎯 Poner como meta</button>`}
  </div>`;
  if (!p.ok) html += `<p class="motivo"><small>${p.motivo}</small></p>`;
  return html + ciencia;
}

// Período actual y qué falta para pasar al siguiente
function tarjetaPeriodo() {
  const act = PERIODOS[periodoActual()];
  const sig = PERIODOS[periodoActual() + 1];
  let html = `<div class="tarjeta-periodo"><b>${act.icono} ${act.nombre}</b> <small>· sos ${act.titulo}</small>`;
  if (!sig) return html + `<br><small>Llegaste al último período. ¡Roma es un imperio!</small></div>`;
  const reqs = requisitosPeriodo();
  html += `<p>Para pasar a ${articulo(periodoActual() + 1)} <b>${sig.icono} ${sig.nombre}</b> necesitás:</p><ul class="requisitos">`;
  html += reqs.map((r) => `<li>${r.ok ? "✅" : "⬜"} ${r.texto}</li>`).join("");
  html += `</ul>${sig.bonus ? `<p><small>Además te da: ${sig.bonus}</small></p>` : ""}
    <button data-accion="avanzar-periodo" class="ancho" ${puedeAvanzarPeriodo() && !estado.terminado ? "" : "disabled"}>${sig.icono} Proclamar ${articulo(periodoActual() + 1)} ${sig.nombre}</button></div>`;
  return html;
}

function cambiarVista(v) {
  vistaActual = v;
  document.querySelectorAll(".vistas button").forEach((b) => b.classList.toggle("activa", b.dataset.vista === v));
  $("vista-ciudad").classList.toggle("oculto", v !== "ciudad");
  $("vista-mapa").classList.toggle("oculto", v !== "mapa");
  $("vista-arbol").classList.toggle("oculto", v !== "arbol");
  if (v === "mapa") pintarMapa();
}

function dibujarLog() {
  $("log").innerHTML = estado.log.map((l) => `<li class="${l.clase}">${l.texto}</li>`).join("");
}

function dibujarTodo() {
  const per = PERIODOS[periodoActual()];
  $("titulo").textContent = `${per.icono} ${per.titulo}`;
  document.title = `Imperium – ${per.titulo}`;
  dibujarRecursos();
  dibujarCiudad();
  dibujarMapa();
  dibujarArbol();
  cambiarVista(vistaActual);
  dibujarPanel();
  dibujarLog();
  $("btn-turno").disabled = estado.terminado;

  // Botón de inmigración: muestra el precio y, si no se puede, por qué
  const inm = puedeInmigracion();
  const boton = $("btn-inmigracion");
  boton.disabled = estado.terminado || !inm.ok;
  boton.innerHTML = `📣 Incitar inmigración <small>(${INMIGRACION.costo.oro} 💰 → +${INMIGRACION.habitantes} 👥)</small>` +
    (inm.ok ? "" : `<br><small>${inm.motivo}</small>`);
}

$("btn-inmigracion").addEventListener("click", () => {
  incitarInmigracion();
  trasAccion();
});

// ---------- Ventanas (ataque y fin de partida) ----------

function abrirModal(html) {
  $("modal-caja").innerHTML = html;
  $("modal").classList.remove("oculto");
}
const cerrarModal = () => $("modal").classList.add("oculto");

function prepararAtaque(x, y) {
  const id = duenoDe(x, y);
  const d = ENEMIGOS[id];
  const nombre = esCapital(x, y) === id ? d.ciudad : `una zona de los ${d.nombre.toLowerCase()}`;
  let filas = "";
  for (const u in UNIDADES) {
    if (listos(u) === 0) continue;
    const descansan = estado.ejercito[u] - listos(u);
    filas += `<label class="fila-envio">${UNIDADES[u].icono} ${UNIDADES[u].nombre} (listos ${listos(u)}${descansan ? `, ${descansan} descansando` : ""})
      <input type="number" min="0" max="${listos(u)}" value="${listos(u)}" data-envio="${u}"></label>`;
  }
  abrirModal(`
    <h2>${d.icono} Atacar ${nombre}</h2>
    <p>¿Cuántos soldados mandás? Los que se quedan siguen defendiendo Roma y pueden atacar otra zona este mismo año. Los que pelean descansan hasta el año que viene.</p>
    <p><small>Si ganás, pagás ${textoCosto(costoZona(x, y))} de poder político para quedarte con ${esCapital(x, y) === id ? "todo su territorio" : "la zona"}.</small></p>
    ${porMar(x, y) ? `<p>${BARCOS.icono} <b>Por mar:</b> tenés ${barcosListos()} barco${barcosListos() === 1 ? "" : "s"} listo${barcosListos() === 1 ? "" : "s"}, que llevan hasta <b>${barcosListos() * BARCOS.lleva}</b> soldados.</p>` : ""}
    ${filas}
    <p id="comparacion"></p>
    <div class="fila centrado">
      <button data-accion="atacar" data-x="${x}" data-y="${y}">⚔️ ¡A la carga!</button>
      <button data-accion="cerrar" class="claro">Cancelar</button>
    </div>`);
  actualizarComparacion(x, y);
  document.querySelectorAll("[data-envio]").forEach((inp) => inp.addEventListener("input", () => actualizarComparacion(x, y)));
}

function leerEnvio() {
  const envio = {};
  document.querySelectorAll("[data-envio]").forEach((inp) => {
    envio[inp.dataset.envio] = Math.max(0, Math.min(+inp.max, Math.floor(+inp.value || 0)));
  });
  return envio;
}

function actualizarComparacion(x, y) {
  const envio = leerEnvio();
  const mio = poderAtaque(envio, x, y);
  const suyo = defensaZona(x, y, envio.catapulta || 0);
  let consejo;
  if (mio > suyo * 1.3) consejo = `<span class="bien">Tenés clara ventaja.</span>`;
  else if (mio > suyo * 0.9) consejo = `<span>Pelea pareja: puede salir para cualquier lado.</span>`;
  else consejo = `<span class="mal">Muy arriesgado: ellos son más fuertes.</span>`;
  let total = 0;
  for (const u in envio) total += envio[u];
  const lugar = porMar(x, y) ? barcosListos() * BARCOS.lleva : Infinity;
  if (total > lugar) consejo = `<span class="mal">No entran en los barcos: podés mandar hasta ${lugar} soldados.</span>`;
  const boton = document.querySelector('#modal [data-accion="atacar"]');
  if (boton) boton.disabled = total === 0 || total > lugar;
  $("comparacion").innerHTML = `Tu ataque: <b>${Math.round(mio)}</b> contra su defensa: <b>~${estimar(suyo)}</b>${porMar(x, y) ? ` · ${BARCOS.icono} usás ${Math.ceil(total / BARCOS.lleva)}` : ""}<br>${consejo}`;
}

function mostrarFin() {
  if (estado.resultado === "conquista") {
    const d = ENEMIGOS[estado.conquistadoPor];
    abrirModal(`<h2>¡Roma ha caído! 💀</h2><p>Los ${d ? d.nombre.toLowerCase() : "enemigos"} llegaron con un ejército mucho más grande que tus defensas, arrasaron con todo y tomaron Roma después de ${estado.turno} años.</p>
    <p><small>Para que no pase: entrená soldados, construí una muralla y mirá los avisos de ejércitos en camino.</small></p>
    <button data-accion="nueva">Jugar de nuevo</button>`);
    return;
  }
  if (estado.resultado === "descontento") {
    abrirModal(`<h2>¡Revuelta en Roma! 🔥</h2><p>El apoyo del pueblo se desplomó (llegó a ${APOYO.derrocado} o menos). Hartos de tu gobierno, asaltaron el palacio y te echaron del trono después de ${estado.turno} años.</p>
    <button data-accion="nueva">Jugar de nuevo</button>`);
    return;
  }
  abrirModal(`<h2>¡Ave, ${PERIODOS[periodoActual()].titulo}! 🏆</h2><p>Sometiste a todos los pueblos vecinos en ${estado.turno} años. Roma domina Europa.</p>
    <button data-accion="nueva">Jugar de nuevo</button>`);
}

// ---------- Clics ----------

function tocarLote(i) {
  if (moviendo !== null) {
    // Segundo toque del botón "Mover": se lleva el edificio a este terreno
    if (moverLote(ciudadVista, moviendo, i)) loteElegido = i;
    moviendo = null;
    pestania = "construir";
    trasAccion();
    return;
  }
  loteElegido = loteElegido === i ? null : i;
  pestania = "construir";
  dibujarTodo();
}

function trasAccion() {
  revisarFin();   // por ejemplo, una acción o una derrota que deja el apoyo por el piso
  guardar();
  dibujarTodo();
  if (estado.terminado) mostrarFin();
}

// ---------- Arrastrar el árbol con el mouse ----------
// Apretás en cualquier parte del árbol y movés: se corre de costado (y la página para arriba o abajo).
// Si moviste el mouse, al soltar no cuenta como clic en una tecnología.
let arrastre = null;
$("arbol").addEventListener("pointerdown", (ev) => {
  const caja = ev.target.closest(".arbol-scroll");
  if (!caja || ev.button !== 0 || ev.pointerType === "touch") return;
  arrastre = { caja, x: ev.clientX, y: ev.clientY, movido: false };
  ev.preventDefault();   // que no se seleccione texto
});
window.addEventListener("pointermove", (ev) => {
  if (!arrastre) return;
  const dx = ev.clientX - arrastre.x, dy = ev.clientY - arrastre.y;
  if (!arrastre.movido && Math.abs(dx) + Math.abs(dy) < 5) return;
  arrastre.movido = true;
  arrastre.caja.classList.add("arrastrando");
  arrastre.caja.scrollLeft -= dx;
  window.scrollBy(0, -dy);
  arrastre.x = ev.clientX;
  arrastre.y = ev.clientY;
});
window.addEventListener("pointerup", () => {
  if (!arrastre) return;
  arrastre.caja.classList.remove("arrastrando");
  if (arrastre.movido) {
    // el clic que llega justo después de soltar se ignora
    const tragar = (e) => { e.stopPropagation(); e.preventDefault(); };
    window.addEventListener("click", tragar, { capture: true, once: true });
    setTimeout(() => window.removeEventListener("click", tragar, { capture: true }), 100);
  }
  arrastre = null;
});

document.addEventListener("click", (ev) => {
  // Casilla del mapa
  const cas = ev.target.closest(".casilla");
  if (cas) {
    const x = +cas.dataset.x, y = +cas.dataset.y;
    const misma = casillaElegida && casillaElegida.x === x && casillaElegida.y === y;
    casillaElegida = misma ? null : { x, y };
    dibujarMapa();
    return;
  }
  // Tecnología del árbol
  const nodo = ev.target.closest(".nodo-tec");
  if (nodo) {
    tecElegida = tecElegida === nodo.dataset.tech ? null : nodo.dataset.tech;
    dibujarArbol();
    return;
  }
  const btn = ev.target.closest("button[data-accion], button[data-pestania], button[data-vista]");
  if (!btn) return;
  if (btn.dataset.pestania) { pestania = btn.dataset.pestania; dibujarPanel(); return; }
  if (btn.dataset.vista) { cambiarVista(btn.dataset.vista); return; }
  const d = btn.dataset;
  switch (d.accion) {
    case "explorar": if (casillaElegida) explorar(casillaElegida.x, casillaElegida.y); break;
    case "guerra": declararGuerra(d.enemigo); break;
    case "ver-mapa": {
      const e = ENEMIGOS[d.enemigo];
      casillaElegida = { x: e.x, y: e.y };
      cambiarVista("mapa");
      centrarMapa(e.x, e.y, Math.max(camara ? camara.escala : 0, 12));
      dibujarMapa();
      return;
    }
    case "construir": construir(ciudadVista, loteElegido, d.tipo); break;
    case "fundar": {
      if (!casillaElegida) break;
      const n = fundarCiudad(casillaElegida.x, casillaElegida.y);
      if (n) { ciudadVista = n; loteElegido = null; cambiarVista("ciudad"); }
      break;
    }
    case "subir-nivel": subirNivel(ciudadVista); break;
    case "ver-ciudad": ciudadVista = +d.ciudad; loteElegido = null; moviendo = null; cambiarVista("ciudad"); break;
    case "demoler": {
      // Cartel propio del juego (las ventanitas del navegador pueden estar bloqueadas)
      const ed = EDIFICIOS[lotesDe(ciudadVista)[loteElegido].tipo];
      abrirModal(`<h2>🔨 ¿Demoler ${ed.icono} ${ed.nombre}?</h2><p>No se devuelve lo que costó. Los que trabajaban ahí quedan libres.</p>
        <div class="fila centrado"><button data-accion="demoler-si">🔨 Sí, demoler</button><button data-accion="cerrar" class="claro">Cancelar</button></div>`);
      return;
    }
    case "mover": moviendo = loteElegido; dibujarTodo(); return;
    case "mover-cancelar": moviendo = null; dibujarTodo(); return;
    case "demoler-si": demoler(ciudadVista, loteElegido); loteElegido = null; cerrarModal(); break;
    case "investigar": investigar(d.tech); break;
    case "meta": elegirMeta(d.tech || null); break;
    case "ver-arbol": periodoVisto = null; cambiarVista("arbol"); return;
    case "ver-periodo": periodoVisto = +d.periodo === periodoActual() ? null : +d.periodo; tecElegida = null; dibujarArbol(); return;
    case "avanzar-periodo": {
      if (!avanzarPeriodo()) break;
      periodoVisto = null;
      tecElegida = null;
      const per = PERIODOS[periodoActual()];
      trasAccion();
      abrirModal(`<h2>${per.icono} ¡Comienza ${articulo(periodoActual())} ${per.nombre}!</h2><p>${per.desc}</p>
        <p>Ahora sos <b>${per.titulo}</b>. ${per.bonus || ""}</p><p>Ya podés investigar las tecnologías de este período.</p>
        <button data-accion="cerrar">¡Ave!</button>`);
      return;
    }
    case "entrenar": entrenar(d.unidad, +d.n); break;
    case "barco": construirBarco(+d.n); break;
    case "gobierno": hacerAccion(d.id); break;
    case "preparar": if (casillaElegida) prepararAtaque(casillaElegida.x, casillaElegida.y); return;
    case "atacar": {
      const r = atacarZona(+d.x, +d.y, leerEnvio());
      revisarFin();
      cerrarModal();
      if (r && !estado.terminado) {
        abrirModal(`<h2>${r.gano ? "🏆 ¡Victoria!" : "💀 Derrota"}</h2><p>${estado.log[0].texto}</p><button data-accion="cerrar">Seguir</button>`);
      }
      break;
    }
    case "cerrar": cerrarModal(); return;
    case "nueva": empezarDeNuevo(); return;
  }
  trasAccion();
});

$("btn-turno").addEventListener("click", () => {
  terminarTurno();
  trasAccion();
});

$("btn-nueva").addEventListener("click", () => {
  abrirModal(`<h2>¿Empezar una partida nueva?</h2><p>Se pierde la actual.</p>
    <div class="fila centrado"><button data-accion="nueva">Sí, empezar de nuevo</button><button data-accion="cerrar" class="claro">Cancelar</button></div>`);
});

function empezarDeNuevo() {
  estado = partidaNueva();
  ciudadVista = 0;
  loteElegido = null;
  pestania = "construir";
  anotar("Año 753 a.C. Rómulo te deja una colina y un puñado de gente. ¡Hacé grande a Roma!", "turno");
  cerrarModal();
  guardar();
  dibujarTodo();
}

// ---------- Arranque ----------

estado = cargar();
if (estado) {
  dibujarTodo();
  if (estado.terminado) mostrarFin();
} else {
  empezarDeNuevo();
}
