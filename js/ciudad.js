// Rey de Roma – pantalla (dibuja todo y responde a los clics).
// Las reglas están en js/ciudad-reglas.js.

const CLAVE_GUARDADO = "imperium_ciudad";
let loteElegido = null;
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
      d.colonias = d.colonias || [];
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
  html += `<span title="Apoyo popular (0 a 100). Cambia cuánto rinden los edificios y los impuestos: ahora ${prod >= 0 ? "+" : ""}${prod}%. Con el tiempo vuelve a ${base}. Lo suben la muralla, templos y grandes obras, rechazar ataques y conquistar; lo bajan saqueos, derrotas y hambre.">${cara} <b>${ap}</b>${tendencia} <small class="${prod < 0 ? "neg" : ""}">${prod >= 0 ? "+" : ""}${prod}%</small></span>`;
  $("recursos").innerHTML = html;
}

function dibujarCiudad() {
  // Botones para pasar de una ciudad a otra (solo si fundaste alguna)
  if (!lotesDe(ciudadVista)) ciudadVista = 0;
  const nombres = ["Roma", ...estado.colonias.map((col) => col.nombre)];
  $("ciudades").innerHTML = nombres.length < 2 ? "" : nombres.map((n, i) =>
    `<button data-accion="ver-ciudad" data-ciudad="${i}" class="${i === ciudadVista ? "activa" : ""}">${i === 0 ? "👑" : "⛲"} ${n}</button>`).join("");

  // Nivel de la ciudad y botón para agrandarla
  const nivel = nivelCiudad(ciudadVista);
  const maximo = nivelMaximo(ciudadVista);
  const pn = puedeSubirNivel(ciudadVista);
  $("nivel-ciudad").innerHTML = `<span>${ciudadVista === 0 ? "👑" : "⛲"} <b>${nombreCiudad(ciudadVista)}</b> · nivel <b>${nivel}</b> de ${maximo}
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
        div.innerHTML = `<span class="icono">🚧</span><span class="nombre">${ed.nombre}</span><span class="falta-turnos">${l.falta} turno${l.falta > 1 ? "s" : ""}</span>`;
      } else {
        if (ed.fijo) div.classList.add("regia");
        div.innerHTML = `<span class="icono">${ed.icono}</span><span class="nombre">${ed.nombre}</span>`;
      }
    }
    div.addEventListener("click", () => tocarLote(i));
    c.appendChild(div);
  });

  // Avisos de ejércitos en camino
  const avisos = [];
  for (const id in estado.enemigos) {
    const e = estado.enemigos[id];
    if (e.vivo && e.marcha) {
      const n = e.marcha.llega - estado.turno;
      avisos.push(`⚠️ <b>${ENEMIGOS[id].nombre}</b> marchan hacia Roma con ~${estimar(e.marcha.fuerza)} de fuerza. Llegan ${n <= 1 ? "<b>el próximo turno</b>" : `en ${n} turnos`}. Tu defensa: ${Math.round(poderDefensa())}.`);
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
    if (prod) html += `<p>Da: <b>${prod}</b>${ed.trabajadores ? ` (con ${ed.trabajadores} trabajador${ed.trabajadores > 1 ? "es" : ""})` : ""}</p>`;
    if (l.falta > 0) html += `<p class="ayuda">En obra: faltan ${l.falta} turno(s).</p>`;
    if (!ed.fijo) html += `<button data-accion="demoler">🔨 Demoler</button>`;
    return html;
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
          <b>${ed.nombre}</b> <small>· ${ed.turnos} turno${ed.turnos > 1 ? "s" : ""}${ed.trabajadores ? ` · 👷 ${ed.trabajadores}` : ""}</small><br>
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
    <p class="ayuda">Ganarte al pueblo cuesta recursos; exprimirlo te da recursos pero baja el apoyo. Cada acción tarda unos turnos en poder repetirse.</p>
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
          <small>${partes.join(" · ") || "Gratis"} · se repite cada ${a.espera} turnos</small>
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
          <b>${u.nombre}</b> <span class="cantidad">× ${estado.ejercito[tipo]}</span><br>
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
  return html + "</div>";
}

function panelVecinos() {
  let html = estado.atacoEsteTurno ? `<p class="ayuda">Ya atacaste este turno. Tus tropas descansan.</p>` : "";
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
    return `<div class="item hecha"><div class="item-icono">🦅</div><div class="item-texto"><b>${d.nombre}</b> – conquistados<br><small>Te pagan ${trib} por turno.</small></div></div>`;
  }
  let estadoTexto;
  if (e.marcha) estadoTexto = `<span class="motivo">⚠️ Su ejército marcha hacia Roma: ¡sus zonas quedaron poco defendidas!</span>`;
  else if (e.guerra) estadoTexto = `<small class="mal">⚔️ En guerra con Roma.${e.proximo ? ` Próximo ataque: en unos ${Math.max(1, e.proximo - estado.turno)} turnos.` : ""}</small>`;
  else estadoTexto = `<small>🕊️ En paz con Roma.${e.proximo ? ` Pero te van a atacar en unos ${Math.max(1, e.proximo - estado.turno)} turnos.` : ""}</small>`;
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

function dibujarMapa() {
  const m = $("mapa");
  m.style.gridTemplateColumns = `repeat(${MAPA_ANCHO}, minmax(0, 1fr))`;
  let html = "";
  for (let y = 0; y < MAPA_ALTO; y++) {
    for (let x = 0; x < MAPA_ANCHO; x++) {
      const elegida = casillaElegida && casillaElegida.x === x && casillaElegida.y === y ? " elegida" : "";
      if (!vista(x, y)) {
        const viajando = estado.exploradores.some((ex) => ex.x === x && ex.y === y);
        const se = puedeExplorar(x, y).ok || viajando ? " explorable" : "";
        html += `<div class="casilla niebla${se}${elegida}" data-x="${x}" data-y="${y}">${viajando ? "🧭" : ""}</div>`;
        continue;
      }
      if (!esTierra(x, y)) { html += `<div class="casilla mar" data-x="${x}" data-y="${y}"></div>`; continue; }
      const dueno = duenoDe(x, y);
      const lugar = lugarEn(x, y);
      const col = coloniaEn(x, y);
      let contenido = MAPA.terrenos[terreno(x, y)].icono;
      let extra = "";
      let clases = "casilla tierra";
      if (lugar === "roma") { contenido = "👑"; extra = `<span class="rotulo mio">Roma</span>`; clases += " ciudad-mapa"; }
      else if (col) { contenido = "⛲"; extra = `<span class="rotulo mio">${estado.colonias[col - 1].nombre}</span>`; clases += " ciudad-mapa"; }
      else if (lugar) {
        const vivo = estado.enemigos[lugar].vivo;
        contenido = vivo ? ENEMIGOS[lugar].icono : "🦅";
        extra = `<span class="rotulo ${vivo ? "enemigo" : "mio"}">${ENEMIGOS[lugar].ciudad}</span>`;
        clases += " ciudad-mapa";
      }
      if (dueno && dueno !== "roma" && estado.enemigos[dueno].guerra && alcanzable(x, y)) clases += " atacable";
      // Línea oscura donde cambia el dueño (la frontera)
      const borde = [[0, -1, "top"], [1, 0, "right"], [0, 1, "bottom"], [-1, 0, "left"]]
        .filter(([dx, dy]) => vista(x + dx, y + dy) && esTierra(x + dx, y + dy) && duenoDe(x + dx, y + dy) !== dueno)
        .map(([, , lado]) => `border-${lado}:2px solid #3b2f22`).join(";");
      html += `<div class="${clases}${elegida}" style="background:${colorDe(dueno)};${borde}" data-x="${x}" data-y="${y}">${contenido}${extra}</div>`;
    }
  }
  m.innerHTML = html;
  $("mapa-info").innerHTML = infoCasilla();
}

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
    if (viaje) return `<h3>🧭 Zona desconocida</h3><p>Tu explorador vuelve en ${viaje.vuelve - estado.turno} turno(s).</p>`;
    const p = puedeExplorar(x, y);
    const t = turnosViaje(x, y);
    return `<h3>❓ Zona desconocida</h3>
      <p>Un habitante libre va a explorar y vuelve en <b>${t} turno${t > 1 ? "s" : ""}</b>. Mientras viaja, no trabaja.</p>
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
    return `<h3>⛲ ${estado.colonias[col - 1].nombre}</h3><p>Una ciudad fundada por Roma: puede tener todos los edificios que tiene Roma. Comparte con Roma los recursos y los habitantes.</p>
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
      <button data-accion="fundar" ${p.ok && !estado.terminado ? "" : "disabled"}>🏘️ Fundar ${FUNDACION.nombres[estado.colonias.length] || "ciudad"}</button>`}`;
  }
  // Zona de otro pueblo
  const d = ENEMIGOS[dueno];
  const p = puedeAtacarZona(x, y);
  const capital = lugar === dueno;
  const titulo = capital ? `${d.icono} ${d.ciudad}, capital de los ${d.nombre.toLowerCase()}` : `${ter.icono} ${ter.nombre} de los ${d.nombre.toLowerCase()}`;
  const bonus = MAPA.bonusTerreno[terreno(x, y)];
  const detalle = capital
    ? `Si la tomás, los ${d.nombre.toLowerCase()} se rinden y <b>todo su territorio</b> pasa a ser tuyo.`
    : `La defiende parte de su ejército${bonus ? ` (${ter.nombre.toLowerCase()}: +${bonus * 100}% de defensa)` : ""}. Si la ganás, pasa a ser tuya y te llevás algo de botín.`;
  const enGuerra = estado.enemigos[dueno].guerra;
  return `<h3>${titulo}</h3>
    <p>${detalle}<br><small>Defensa: ~${estimar(defensaZona(x, y))}</small></p>
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
  const ciencia = `<p class="ayuda">Tenés <b>${Math.floor(estado.rec.ciencia)} 💡</b> (${signo(balance().ciencia)} por turno).
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
    if (estado.ejercito[u] === 0) continue;
    filas += `<label class="fila-envio">${UNIDADES[u].icono} ${UNIDADES[u].nombre} (tenés ${estado.ejercito[u]})
      <input type="number" min="0" max="${estado.ejercito[u]}" value="${estado.ejercito[u]}" data-envio="${u}"></label>`;
  }
  abrirModal(`
    <h2>${d.icono} Atacar ${nombre}</h2>
    <p>¿Cuántos soldados mandás? Los que se quedan siguen defendiendo Roma.</p>
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
  const mio = poderAtaque(envio);
  const suyo = defensaZona(x, y, envio.catapulta || 0);
  let consejo;
  if (mio > suyo * 1.3) consejo = `<span class="bien">Tenés clara ventaja.</span>`;
  else if (mio > suyo * 0.9) consejo = `<span>Pelea pareja: puede salir para cualquier lado.</span>`;
  else consejo = `<span class="mal">Muy arriesgado: ellos son más fuertes.</span>`;
  $("comparacion").innerHTML = `Tu ataque: <b>${Math.round(mio)}</b> contra su defensa: <b>~${estimar(suyo)}</b><br>${consejo}`;
}

function mostrarFin() {
  abrirModal(`<h2>¡Ave, ${PERIODOS[periodoActual()].titulo}! 🏆</h2><p>Sometiste a todos los pueblos vecinos en ${estado.turno} años. Roma domina Italia.</p>
    <button data-accion="nueva">Jugar de nuevo</button>`);
}

// ---------- Clics ----------

function tocarLote(i) {
  loteElegido = loteElegido === i ? null : i;
  pestania = "construir";
  dibujarTodo();
}

function trasAccion() {
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
    case "ver-ciudad": ciudadVista = +d.ciudad; loteElegido = null; cambiarVista("ciudad"); break;
    case "demoler": {
      // Cartel propio del juego (las ventanitas del navegador pueden estar bloqueadas)
      const ed = EDIFICIOS[lotesDe(ciudadVista)[loteElegido].tipo];
      abrirModal(`<h2>🔨 ¿Demoler ${ed.icono} ${ed.nombre}?</h2><p>No se devuelve lo que costó. Los que trabajaban ahí quedan libres.</p>
        <div class="fila centrado"><button data-accion="demoler-si">🔨 Sí, demoler</button><button data-accion="cerrar" class="claro">Cancelar</button></div>`);
      return;
    }
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
    case "gobierno": hacerAccion(d.id); break;
    case "preparar": if (casillaElegida) prepararAtaque(casillaElegida.x, casillaElegida.y); return;
    case "atacar": {
      const r = atacarZona(+d.x, +d.y, leerEnvio());
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
