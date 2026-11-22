// Rey de Roma – pantalla (dibuja todo y responde a los clics).
// Las reglas están en js/ciudad-reglas.js.

const CLAVE_GUARDADO = "imperium_ciudad";
let loteElegido = null;
let pestania = "construir";
let vistaActual = "ciudad";     // "ciudad" o "mapa"
let casillaElegida = null;      // { x, y } en el mapa
let tecElegida = null;          // tecnología tocada en el árbol

const $ = (id) => document.getElementById(id);

function guardar() { localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(estado)); }

function cargar() {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE_GUARDADO));
    if (d && d.lotes && d.lotes.length === INICIO.lotes) { prepararMapa(d); return d; }
  } catch (e) { /* partida rota: se empieza de cero */ }
  return null;
}

// "15 🌲 10 💰"
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
  html += `<span title="Defensa de Roma">🛡️ <b>${Math.round(poderDefensa())}</b></span>`;
  html += `<span title="Saqueos sufridos">🔥 <b>${estado.saqueos}</b>/${MAX_SAQUEOS}</span>`;
  $("recursos").innerHTML = html;
}

function dibujarCiudad() {
  const c = $("ciudad");
  c.innerHTML = "";
  estado.lotes.forEach((l, i) => {
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
        if (l.tipo === "regia") div.classList.add("regia");
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
  const fn = { construir: panelConstruir, tecnologias: panelTecnologias, ejercito: panelEjercito, vecinos: panelVecinos }[pestania];
  $("contenido").innerHTML = fn();
}

function panelConstruir() {
  if (loteElegido === null) return `<p class="ayuda">Tocá un terreno de la ciudad para construir o ver un edificio.</p>`;
  const l = estado.lotes[loteElegido];
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
    const p = puedeConstruir(tipo);
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

function panelTecnologias() {
  let html = `<p>Tenés <b>${Math.floor(estado.rec.ciencia)} 💡</b> de conocimiento (${signo(balance().ciencia)} por turno).</p>
    ${estado.meta ? `<p>🎯 Meta: <b>${TECNOLOGIAS[estado.meta].nombre}</b> <small>(se investiga sola cuando te alcance)</small></p>` : ""}
    <button data-accion="ver-arbol" class="ancho">🌳 Ver el árbol de tecnologías</button><div class="lista">`;
  for (const id in TECNOLOGIAS) {
    const t = TECNOLOGIAS[id];
    const p = puedeInvestigar(id);
    const hecha = tiene(id);
    html += `
      <div class="item ${hecha ? "hecha" : ""}">
        <div class="item-icono">${hecha ? "✅" : t.icono}</div>
        <div class="item-texto">
          <b>${t.nombre}</b> ${hecha ? "" : `<small>· ${t.costo} 💡</small>`}<br>
          <small>${t.desc}</small>
          ${!hecha && !p.ok ? `<br><small class="motivo">${p.motivo}</small>` : ""}
        </div>
        ${hecha ? "" : `<button data-accion="investigar" data-tech="${id}" ${p.ok ? "" : "disabled"}>Investigar</button>`}
      </div>`;
  }
  return html + "</div>";
}

function panelEjercito() {
  let html = `<p>🛡️ Defensa de Roma: <b>${Math.round(poderDefensa())}</b>
    <small>(soldados + habitantes${cuenta("muralla") ? ` + muralla +${bonusMuralla() * 100}%` : ""}${tiene("disciplina") ? " + disciplina" : ""})</small></p>
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
          <small>Cuesta: ${textoCosto(u.costo)}</small>
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
  html += `<div class="lista">`;
  let ocultos = 0;
  for (const id in ENEMIGOS) {
    if (descubierto(id)) html += tarjetaEnemigo(id);
    else ocultos++;
  }
  if (ocultos) {
    html += `<div class="item bloqueado"><div class="item-icono">❓</div><div class="item-texto">
      <b>${ocultos} pueblo${ocultos > 1 ? "s" : ""} sin descubrir</b><br>
      <small>Abrí el 🗺️ Mapa y mandá exploradores para encontrarlos.</small></div></div>`;
  }
  return html + "</div>";
}

// Ficha de un pueblo vecino (se usa en la pestaña Vecinos y en el mapa)
function tarjetaEnemigo(id) {
  const d = ENEMIGOS[id];
  const e = estado.enemigos[id];
  if (!e.vivo) {
    const trib = Object.entries(d.tributo).map(([r, v]) => `+${v} ${RECURSOS[r].icono}`).join(" ");
    return `<div class="item hecha"><div class="item-icono">🦅</div><div class="item-texto"><b>${d.nombre}</b> – conquistados<br><small>Te pagan ${trib} por turno.</small></div></div>`;
  }
  const estadoTexto = e.marcha
    ? `<span class="motivo">⚠️ Su ejército marcha hacia Roma: ¡su ciudad quedó poco defendida!</span>`
    : `<small>Próximo ataque: en unos ${Math.max(1, e.proximo - estado.turno)} turnos.</small>`;
  return `
    <div class="item">
      <div class="item-icono">${d.icono}</div>
      <div class="item-texto">
        <b>${d.nombre}</b> <small>· ${d.ciudad}</small><br>
        <small>${d.desc}</small><br>
        <small>Ejército: ~${estimar(e.fuerza)} · Defensa de su ciudad: ~${estimar(defensaEnemiga(id))}${d.muro ? ` (murallas +${d.muro * 100}%)` : ""}</small><br>
        ${estadoTexto}
      </div>
      <button data-accion="preparar" data-enemigo="${id}" ${estado.atacoEsteTurno || soldados() === 0 ? "disabled" : ""}>Atacar</button>
    </div>`;
}

// ---------- Mapa ----------

function dibujarMapa() {
  const m = $("mapa");
  m.style.gridTemplateColumns = `repeat(${MAPA_ANCHO}, 1fr)`;
  let html = "";
  for (let y = 0; y < MAPA_ALTO; y++) {
    for (let x = 0; x < MAPA_ANCHO; x++) {
      const elegida = casillaElegida && casillaElegida.x === x && casillaElegida.y === y ? " elegida" : "";
      const viajando = estado.exploradores.some((ex) => ex.x === x && ex.y === y);
      if (!vista(x, y)) {
        const se = puedeExplorar(x, y).ok || viajando ? " explorable" : "";
        html += `<div class="casilla niebla${se}${elegida}" data-x="${x}" data-y="${y}">${viajando ? "🧭" : ""}</div>`;
        continue;
      }
      const t = terreno(x, y);
      const lugar = lugarEn(x, y);
      let contenido = MAPA.terrenos[t].icono;
      let extra = "";
      if (lugar === "roma") { contenido = "👑"; extra = `<span class="rotulo">Roma</span>`; }
      else if (lugar) {
        const vivo = estado.enemigos[lugar].vivo;
        contenido = vivo ? ENEMIGOS[lugar].icono : "🦅";
        extra = `<span class="rotulo ${vivo ? "enemigo" : "mio"}">${ENEMIGOS[lugar].ciudad}</span>`;
      }
      html += `<div class="casilla t-${t === "~" ? "mar" : t === "." ? "llano" : t}${lugar ? " ciudad-mapa" : ""}${elegida}" data-x="${x}" data-y="${y}">${contenido}${extra}</div>`;
    }
  }
  m.innerHTML = html;
  $("mapa-info").innerHTML = infoCasilla();
}

function infoCasilla() {
  const enViaje = estado.exploradores.length;
  const pie = `<p class="ayuda">🧭 Exploradores de viaje: ${enViaje} · 👥 Habitantes libres: ${libres()}</p>`;
  if (!casillaElegida) {
    return `<p class="ayuda">Tocá una zona oscura pegada a lo que ya conocés para mandar un explorador. Necesitás un habitante libre.</p>${pie}`;
  }
  const { x, y } = casillaElegida;
  if (!vista(x, y)) {
    const viaje = estado.exploradores.find((ex) => ex.x === x && ex.y === y);
    if (viaje) return `<h3>🧭 Zona desconocida</h3><p>Tu explorador vuelve en ${viaje.vuelve - estado.turno} turno(s).</p>${pie}`;
    const p = puedeExplorar(x, y);
    const t = turnosViaje(x, y);
    return `<h3>❓ Zona desconocida</h3>
      <p>Un habitante libre va a explorar y vuelve en <b>${t} turno${t > 1 ? "s" : ""}</b>. Mientras viaja, no trabaja.</p>
      ${p.ok ? "" : `<p class="motivo">${p.motivo}</p>`}
      <button data-accion="explorar" ${p.ok ? "" : "disabled"}>🧭 Explorar</button>${pie}`;
  }
  const lugar = lugarEn(x, y);
  if (lugar === "roma") return `<h3>👑 Roma</h3><p>Tu ciudad. Desde acá salen tus exploradores y tus ejércitos.</p>${pie}`;
  if (lugar) return `<div class="lista">${tarjetaEnemigo(lugar)}</div>${pie}`;
  const ter = MAPA.terrenos[terreno(x, y)];
  return `<h3>${ter.icono} ${ter.nombre}</h3><p class="ayuda">Acá no vive nadie.</p>${pie}`;
}

// ---------- Árbol de tecnologías ----------

const ARBOL = { anchoCol: 200, anchoNodo: 168, altoNodo: 70, altoFila: 88, arriba: 34 };

// Calcula dónde va cada tecnología: columna según la época y fila
// ordenada para que las flechas se crucen lo menos posible.
function disposicionArbol() {
  const columnas = [];
  for (const id in TECNOLOGIAS) {
    const c = columnaTec(id);
    (columnas[c] = columnas[c] || []).push(id);
  }
  const maxFilas = Math.max(...columnas.map((c) => c.length));
  const fila = {};
  columnas.forEach((ids, c) => {
    if (c > 0) {
      // Cada una cerca de la altura promedio de las que requiere
      const prom = (id) => {
        const r = TECNOLOGIAS[id].requiere;
        return r.reduce((s, x) => s + fila[x], 0) / r.length;
      };
      ids.sort((a, b) => prom(a) - prom(b));
    }
    const corrida = (maxFilas - ids.length) / 2;
    ids.forEach((id, i) => (fila[id] = corrida + i));
  });
  const pos = {};
  for (const id in fila) {
    pos[id] = { x: columnaTec(id) * ARBOL.anchoCol + 16, y: ARBOL.arriba + fila[id] * ARBOL.altoFila };
  }
  return { pos, columnas: columnas.length, alto: ARBOL.arriba + maxFilas * ARBOL.altoFila };
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
  if ((TECNOLOGIAS[id].requiere || []).every(tiene)) return puedeInvestigar(id).ok ? "alcanzable" : "disponible";
  return "bloqueada";
}

function dibujarArbol() {
  const { pos, columnas, alto } = disposicionArbol();
  const camino = estado.meta ? faltanPara(estado.meta) : [];
  const ancho = columnas * ARBOL.anchoCol;

  let eras = "";
  for (let c = 0; c < columnas; c++) {
    eras += `<div class="era" style="left:${c * ARBOL.anchoCol}px;width:${ARBOL.anchoCol}px">${ERAS_TEC[c] || "Época " + (c + 1)}</div>`;
  }

  let lineas = "";
  for (const id in TECNOLOGIAS) {
    for (const r of TECNOLOGIAS[id].requiere || []) {
      const a = pos[r], b = pos[id];
      const x1 = a.x + ARBOL.anchoNodo, y1 = a.y + ARBOL.altoNodo / 2;
      const x2 = b.x, y2 = b.y + ARBOL.altoNodo / 2;
      const medio = (x1 + x2) / 2;
      const clase = tiene(id) ? "hecha" : camino.includes(id) ? "camino" : tiene(r) ? "abierta" : "";
      lineas += `<path class="${clase}" d="M${x1},${y1} C${medio},${y1} ${medio},${y2} ${x2},${y2}" />`;
    }
  }

  let nodos = "";
  for (const id in TECNOLOGIAS) {
    const t = TECNOLOGIAS[id];
    const est = estadoTec(id);
    const enCamino = camino.includes(id);
    const clases = ["nodo-tec", est, enCamino ? "en-camino" : "", id === estado.meta ? "meta" : "", id === tecElegida ? "elegida" : ""].join(" ");
    const iconos = destraba(id).map((d) => d.icono).join("");
    nodos += `
      <div class="${clases}" data-tech="${id}" style="left:${pos[id].x}px;top:${pos[id].y}px;width:${ARBOL.anchoNodo}px;height:${ARBOL.altoNodo}px">
        <div class="nodo-icono">${est === "hecha" ? "✅" : t.icono}</div>
        <div class="nodo-texto">
          <b>${t.nombre}</b>
          <small>${est === "hecha" ? "Investigada" : t.costo + " 💡"}${id === estado.meta ? " · 🎯 meta" : ""}</small>
          ${iconos ? `<span class="nodo-destraba">${iconos}</span>` : ""}
        </div>
      </div>`;
  }

  $("arbol").innerHTML = `
    <div class="arbol-lienzo" style="width:${ancho}px;height:${alto}px">
      ${eras}
      <svg width="${ancho}" height="${alto}">${lineas}</svg>
      ${nodos}
    </div>`;
  $("arbol-info").innerHTML = infoTec();
}

function infoTec() {
  const ciencia = `<p class="ayuda">Tenés <b>${Math.floor(estado.rec.ciencia)} 💡</b> (${signo(balance().ciencia)} por turno).
    ${estado.meta ? `🎯 Meta: <b>${TECNOLOGIAS[estado.meta].nombre}</b>.` : "Sin meta elegida."}</p>`;
  if (!tecElegida) {
    return `<p class="ayuda">Tocá una tecnología para ver qué da. Podés investigarla ya o ponerla como <b>🎯 meta</b>:
      las del camino se investigan solas apenas te alcance el conocimiento.</p>${ciencia}`;
  }
  const t = TECNOLOGIAS[tecElegida];
  const est = estadoTec(tecElegida);
  const cosas = destraba(tecElegida);
  let html = `<h3>${t.icono} ${t.nombre} <small>· ${ERAS_TEC[columnaTec(tecElegida)] || ""}</small></h3><p>${t.desc}</p>`;
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

function prepararAtaque(id) {
  const d = ENEMIGOS[id];
  let filas = "";
  for (const u in UNIDADES) {
    if (estado.ejercito[u] === 0) continue;
    filas += `<label class="fila-envio">${UNIDADES[u].icono} ${UNIDADES[u].nombre} (tenés ${estado.ejercito[u]})
      <input type="number" min="0" max="${estado.ejercito[u]}" value="${estado.ejercito[u]}" data-envio="${u}"></label>`;
  }
  abrirModal(`
    <h2>${d.icono} Atacar ${d.ciudad}</h2>
    <p>¿Cuántos soldados mandás? Los que se quedan siguen defendiendo Roma.</p>
    ${filas}
    <p id="comparacion"></p>
    <div class="fila centrado">
      <button data-accion="atacar" data-enemigo="${id}">⚔️ ¡A la carga!</button>
      <button data-accion="cerrar" class="claro">Cancelar</button>
    </div>`);
  actualizarComparacion(id);
  document.querySelectorAll("[data-envio]").forEach((inp) => inp.addEventListener("input", () => actualizarComparacion(id)));
}

function leerEnvio() {
  const envio = {};
  document.querySelectorAll("[data-envio]").forEach((inp) => {
    envio[inp.dataset.envio] = Math.max(0, Math.min(+inp.max, Math.floor(+inp.value || 0)));
  });
  return envio;
}

function actualizarComparacion(id) {
  const envio = leerEnvio();
  const mio = poderAtaque(envio);
  const suyo = defensaEnemiga(id, envio.catapulta || 0);
  let consejo;
  if (mio > suyo * 1.3) consejo = `<span class="bien">Tenés clara ventaja.</span>`;
  else if (mio > suyo * 0.9) consejo = `<span>Pelea pareja: puede salir para cualquier lado.</span>`;
  else consejo = `<span class="mal">Muy arriesgado: ellos son más fuertes.</span>`;
  $("comparacion").innerHTML = `Tu ataque: <b>${Math.round(mio)}</b> contra su defensa: <b>~${estimar(suyo)}</b><br>${consejo}`;
}

function mostrarFin() {
  if (estado.resultado === "victoria") {
    abrirModal(`<h2>¡Ave, Rey de Roma! 🏆</h2><p>Sometiste a todos los pueblos vecinos en ${estado.turno} años. Roma domina Italia.</p>
      <button data-accion="nueva">Jugar de nuevo</button>`);
  } else {
    abrirModal(`<h2>Tu reinado terminó 💀</h2><p>Roma fue saqueada ${MAX_SAQUEOS} veces. El pueblo te echó del trono en el año ${estado.turno}.</p>
      <button data-accion="nueva">Jugar de nuevo</button>`);
  }
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
    case "construir": construir(loteElegido, d.tipo); break;
    case "demoler":
      if (!confirm("¿Demoler este edificio? No se devuelve lo que costó.")) return;
      demoler(loteElegido); break;
    case "investigar": investigar(d.tech); break;
    case "meta": elegirMeta(d.tech || null); break;
    case "ver-arbol": cambiarVista("arbol"); return;
    case "entrenar": entrenar(d.unidad, +d.n); break;
    case "preparar": prepararAtaque(d.enemigo); return;
    case "atacar": {
      const r = atacarEnemigo(d.enemigo, leerEnvio());
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
  if (confirm("¿Empezar una partida nueva? Se pierde la actual.")) empezarDeNuevo();
});

function empezarDeNuevo() {
  estado = partidaNueva();
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
