// Rey de Roma – reglas del juego (sin nada de pantalla, solo la lógica).
// Todo el estado de la partida vive en `estado`.

let estado = null;

// ---------- Partida nueva ----------

function partidaNueva() {
  const lotes = Array(INICIO.lotes).fill(null);
  lotes[INICIO.loteRegia] = { tipo: "regia", falta: 0 };
  const ejercito = {};
  for (const u in UNIDADES) ejercito[u] = 0;
  const enemigos = {};
  for (const id in ENEMIGOS) enemigos[id] = enemigoNuevo(id);
  const nueva = {
    turno: 1,
    rec: { ...INICIO.recursos },
    habitantes: INICIO.habitantes,
    lotes, techs: {}, ejercito, enemigos,
    colonias: [],
    saqueos: 0, cansadas: {}, periodo: 0, apoyo: APOYO.inicio, fama: 0,
    log: [], terminado: false, resultado: null,
  };
  prepararMapa(nueva);
  return nueva;
}

// Estado inicial de un pueblo
const enemigoNuevo = (id) => ({
  vivo: true, guerra: false, fuerza: ENEMIGOS[id].fuerza,
  proximo: ENEMIGOS[id].primerAtaque || null, cada: ENEMIGOS[id].cada, marcha: null,
});

// Agrega el mapa a una partida (también arregla las partidas guardadas con el mapa viejo)
function prepararMapa(partida) {
  // Pueblos: se borran los que ya no existen y se agregan los nuevos
  for (const id in partida.enemigos) if (!ENEMIGOS[id]) delete partida.enemigos[id];
  for (const id in ENEMIGOS) {
    const e = partida.enemigos[id] || (partida.enemigos[id] = enemigoNuevo(id));
    if (e.guerra === undefined) e.guerra = !!e.marcha || (e.proximo !== null && partida.turno >= e.proximo - 2);
  }
  if (!partida.duenos || partida.duenos.length !== MAPA_ANCHO * MAPA_ALTO || partida.versionMapa !== MAPA.version) {
    partida.versionMapa = MAPA.version;
    partida.independientes = [];
    // De quién es cada casilla al empezar (los pueblos ya conquistados pasan a ser tuyos)
    partida.duenos = [];
    for (let y = 0; y < MAPA_ALTO; y++) {
      for (let x = 0; x < MAPA_ANCHO; x++) {
        const id = duenoInicial(x, y);
        partida.duenos.push(id && id !== "roma" && !partida.enemigos[id].vivo ? "roma" : id);
      }
    }
    // Las ciudades fundadas en el mapa viejo se mudan a un lugar libre de tu territorio
    const puestas = [];
    // (las conquistadas se quedan donde está la capital de su pueblo)
    for (const c of partida.colonias || []) {
      if (c.conquistada && ENEMIGOS[c.conquistada]) {
        const lugar = lugarConquistada(c.conquistada, c.ciudad);
        if (lugar) {
          c.x = lugar.x; c.y = lugar.y;
          partida.duenos[c.y * MAPA_ANCHO + c.x] = "roma";
        }
        puestas.push(c);
        continue;
      }
      const lugar = lugarParaColonia(partida, puestas, c);
      if (lugar) { c.x = lugar.x; c.y = lugar.y; }
      puestas.push(c);
    }
  }
  ponerIndependientes(partida);
  // Los pueblos que ya conquistaste te dan su ciudad (también en partidas guardadas de antes)
  partida.colonias = partida.colonias || [];
  for (const id in ENEMIGOS) if (!partida.enemigos[id].vivo) sumarCiudadesDelPueblo(id, partida);
  // Niebla: al empezar solo conocés tu territorio y lo que está pegado a él
  if (!partida.visto || partida.visto.length !== MAPA_ANCHO * MAPA_ALTO) {
    partida.visto = Array(MAPA_ANCHO * MAPA_ALTO).fill(0);
    partida.exploradores = [];
    revelarTerritorio(partida);
    partida.mapas = null;
  }
  partida.exploradores = partida.exploradores || [];
  if (!partida.mapas) esconderMapas(partida);
}

// Las ciudades independientes se quedan con su casilla y las de alrededor (se hace una sola vez por partida,
// así también aparecen en las partidas guardadas de antes). Las casillas que ya son de Roma no se tocan.
function ponerIndependientes(partida) {
  partida.independientes = partida.independientes || [];
  for (const id in ENEMIGOS) {
    const d = ENEMIGOS[id];
    if (!d.independiente || partida.independientes.includes(id)) continue;
    const dueno = partida.enemigos[id].vivo ? id : "roma";
    partida.duenos[d.y * MAPA_ANCHO + d.x] = dueno;
    for (const c of vecinas(d.x, d.y)) {
      const i = c.y * MAPA_ANCHO + c.x;
      if (!esTierra(c.x, c.y) || partida.duenos[i] === "roma" || lugarEn(c.x, c.y) || ciudadPuebloEn(c.x, c.y)) continue;
      partida.duenos[i] = dueno;
    }
    partida.independientes.push(id);
  }
}

// ---------- Mapas antiguos ----------

// Esconde los mapas en casillas de tierra que todavía no se ven, a cierta distancia de Roma
function esconderMapas(partida) {
  const M = EXPLORACION.mapas;
  const lugares = [];
  for (let y = 0; y < MAPA_ALTO; y++)
    for (let x = 0; x < MAPA_ANCHO; x++) {
      const d = distancia(x, y, MAPA.roma.x, MAPA.roma.y);
      if (esTierra(x, y) && !partida.visto[y * MAPA_ANCHO + x] && d >= M.cerca && d <= M.lejos) lugares.push({ x, y });
    }
  partida.mapas = [];
  for (let i = 0; i < M.cantidad && lugares.length; i++) {
    partida.mapas.push(lugares.splice(Math.floor(Math.random() * lugares.length), 1)[0]);
  }
}

// Si ya se ve algún lugar con un mapa escondido, lo encontrás y te muestra una zona lejana sin explorar
function buscarMapas() {
  const M = EXPLORACION.mapas;
  const quedan = [];
  for (const m of estado.mapas || []) {
    if (!vista(m.x, m.y)) { quedan.push(m); continue; }
    const opciones = [];
    for (let y = Math.max(0, m.y - M.alcance); y <= Math.min(MAPA_ALTO - 1, m.y + M.alcance); y++)
      for (let x = Math.max(0, m.x - M.alcance - 1); x <= Math.min(MAPA_ANCHO - 1, m.x + M.alcance + 1); x++)
        if (esTierra(x, y) && !vista(x, y) && distancia(x, y, m.x, m.y) <= M.alcance) opciones.push({ x, y });
    if (!opciones.length) { anotar("📜 Encontraste un mapa antiguo, pero muestra tierras que ya conocés."); continue; }
    const destino = opciones[Math.floor(Math.random() * opciones.length)];
    const antes = Object.keys(ENEMIGOS).filter(descubierto);
    revelar(destino.x, destino.y, M.radio);
    let texto = "📜 ¡Encontraste un mapa antiguo! Te muestra una zona lejana que nadie había explorado.";
    for (const id in ENEMIGOS) {
      if (descubierto(id) && !antes.includes(id)) texto += ` ¡Descubriste las tierras de los ${ENEMIGOS[id].nombre.toLowerCase()}!`;
    }
    anotar(texto, "bien");
  }
  estado.mapas = quedan;
}

// Muestra tus zonas y las que están pegadas a ellas
function revelarTerritorio(partida = estado) {
  for (let y = 0; y < MAPA_ALTO; y++)
    for (let x = 0; x < MAPA_ANCHO; x++)
      if (partida.duenos[y * MAPA_ANCHO + x] === "roma") revelar(x, y, 1, partida);
}

function revelar(x, y, radio, partida = estado) {
  for (let dy = -radio; dy <= radio; dy++)
    for (let dx = -radio - 1; dx <= radio + 1; dx++)
      if (dentro(x + dx, y + dy) && distancia(x, y, x + dx, y + dy) <= radio) partida.visto[(y + dy) * MAPA_ANCHO + x + dx] = 1;
}

const vista = (x, y) => dentro(x, y) && estado.visto[y * MAPA_ANCHO + x];
// Un pueblo está descubierto si ya viste alguna de sus zonas
const descubierto = (id) => estado.duenos.some((d, i) => d === id && estado.visto[i]);

// ---------- Exploración ----------

// Mejora de los exploradores por tecnologías ("velocidad", "radio" o "hallazgo")
function mejoraExploracion(clave) {
  let total = 0;
  for (const id in estado.techs) {
    const e = TECNOLOGIAS[id] && TECNOLOGIAS[id].efecto && TECNOLOGIAS[id].efecto.exploracion;
    if (e && e[clave]) total += e[clave];
  }
  return total;
}

// Cuánto tarda un explorador: 1 año por cada EXPLORACION.porTurno casillas desde la zona tuya más cercana
function turnosViaje(x, y) {
  let d = Infinity;
  estado.duenos.forEach((dueno, i) => {
    if (dueno === "roma") d = Math.min(d, distancia(x, y, i % MAPA_ANCHO, Math.floor(i / MAPA_ANCHO)));
  });
  return Math.max(1, Math.ceil(d / (EXPLORACION.porTurno + mejoraExploracion("velocidad"))));
}

function puedeExplorar(x, y) {
  if (vista(x, y)) return { ok: false, motivo: "Esta zona ya la conocés." };
  if (estado.exploradores.some((e) => e.x === x && e.y === y)) return { ok: false, motivo: "Ya hay un explorador yendo para allá." };
  if (!vecinas(x, y).some((c) => vista(c.x, c.y))) return { ok: false, motivo: "Queda muy lejos: primero explorá las zonas de al lado." };
  if (libres() < 1) return { ok: false, motivo: "Necesitás un habitante libre para mandar de explorador." };
  return { ok: true };
}

function explorar(x, y) {
  if (!puedeExplorar(x, y).ok) return false;
  const t = turnosViaje(x, y);
  estado.exploradores.push({ x, y, vuelve: estado.turno + t });
  anotar(`🧭 Un explorador sale hacia lo desconocido. Vuelve en ${t} año${t > 1 ? "s" : ""}.`);
  return true;
}

// Al conquistar un pueblo te quedás con sus mapas: se ve todo lo que está cerca de su territorio
// (el que tiene ahora y el que tenía al empezar). Devuelve el texto para la crónica.
function heredarMapas(id) {
  const radio = ENEMIGOS[id].conoce || EXPLORACION.conquista;
  const letra = ENEMIGOS[id].letra;
  const antes = Object.keys(ENEMIGOS).filter(descubierto);
  // Se recorre de casilla en casilla desde todo su territorio, hasta "radio" pasos
  const dist = new Int16Array(MAPA_ANCHO * MAPA_ALTO).fill(-1);
  let frente = [];
  for (let y = 0; y < MAPA_ALTO; y++)
    for (let x = 0; x < MAPA_ANCHO; x++) {
      const i = y * MAPA_ANCHO + x;
      if (estado.duenos[i] === id || MAPA.duenos[y][x] === letra) { dist[i] = 0; frente.push(i); }
    }
  let nuevas = 0;
  for (let paso = 0; frente.length; paso++) {
    const sig = [];
    for (const i of frente) {
      if (!estado.visto[i]) { estado.visto[i] = 1; nuevas++; }
      if (paso === radio) continue;
      const x = i % MAPA_ANCHO, y = Math.floor(i / MAPA_ANCHO);
      for (const [dx, dy] of direcciones(y)) {
        const j = (y + dy) * MAPA_ANCHO + x + dx;
        if (dentro(x + dx, y + dy) && dist[j] < 0) { dist[j] = paso + 1; sig.push(j); }
      }
    }
    frente = sig;
  }
  if (!nuevas) return "";
  const nuevos = Object.keys(ENEMIGOS).filter((o) => descubierto(o) && !antes.includes(o));
  return ` 🗺️ Te quedás con sus mapas y conocés ${nuevas} zonas nuevas${nuevos.length ? `: ¡descubriste ${nuevos.map((o) => pueblo(o)).join(", ")}!` : "."}`;
}

// Los exploradores que terminaron su viaje vuelven y cuentan lo que vieron
function volverExploradores() {
  const quedan = [];
  for (const ex of estado.exploradores) {
    if (estado.turno < ex.vuelve) { quedan.push(ex); continue; }
    const antes = Object.keys(ENEMIGOS).filter(descubierto);
    revelar(ex.x, ex.y, EXPLORACION.radio + mejoraExploracion("radio"));
    let texto = "🧭 Vuelve un explorador y dibuja una parte nueva del mapa.";
    for (const id in ENEMIGOS) {
      if (descubierto(id) && !antes.includes(id)) texto += ` ¡Descubrió las tierras de los ${ENEMIGOS[id].nombre.toLowerCase()}!`;
    }
    if (Math.random() < EXPLORACION.probHallazgo + mejoraExploracion("hallazgo")) {
      const h = EXPLORACION.hallazgos[Math.floor(Math.random() * EXPLORACION.hallazgos.length)];
      for (const r in h.efecto) estado.rec[r] += h.efecto[r];
      const premio = Object.entries(h.efecto).map(([r, v]) => `+${v} ${RECURSOS[r].icono}`).join(" ");
      texto += ` Además ${h.texto}: ${premio}.`;
    }
    anotar(texto, "bien");
  }
  estado.exploradores = quedan;
}

function lugarParaColonia(partida, puestas, cerca) {
  let mejor = null;
  for (let y = 0; y < MAPA_ALTO; y++) {
    for (let x = 0; x < MAPA_ANCHO; x++) {
      if (partida.duenos[y * MAPA_ANCHO + x] !== "roma" || FUNDACION.prohibidos.includes(terreno(x, y))) continue;
      const otras = [MAPA.roma, ...Object.values(ENEMIGOS), ...puestas];
      if (otras.some((o) => distancia(x, y, o.x, o.y) < FUNDACION.distancia)) continue;
      const d = distancia(x, y, cerca.x, cerca.y);
      if (!mejor || d < mejor.d) mejor = { x, y, d };
    }
  }
  return mejor;
}

// ---------- Mapa ----------

const MAPA_ANCHO = MAPA.filas[0].length;
const MAPA_ALTO = MAPA.filas.length;
const terreno = (x, y) => MAPA.filas[y][x];
// Las casillas son hexágonos: las filas impares están corridas medio hexágono a la derecha.
// Distancia = cuántos pasos de hexágono en hexágono hay entre dos casillas.
const cubo = (x, y) => { const q = x - (y - (y & 1)) / 2; return [q, y, -q - y]; };
const distancia = (x1, y1, x2, y2) => {
  const a = cubo(x1, y1), b = cubo(x2, y2);
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
};
const dentro = (x, y) => x >= 0 && y >= 0 && x < MAPA_ANCHO && y < MAPA_ALTO;
const esTierra = (x, y) => dentro(x, y) && terreno(x, y) !== "~";

// Letra del mapa → "roma", el id del pueblo, o null (mar o tierra de nadie)
function duenoInicial(x, y) {
  const letra = MAPA.duenos[y][x];
  if (letra === "R") return "roma";
  return Object.keys(ENEMIGOS).find((id) => ENEMIGOS[id].letra === letra) || null;
}
const duenoDe = (x, y) => (dentro(x, y) ? estado.duenos[y * MAPA_ANCHO + x] : null);
const esMia = (x, y) => duenoDe(x, y) === "roma";
const zonasDe = (id) => estado.duenos.filter((d) => d === id).length;

// Los 6 vecinos de un hexágono: derecha, abajo a la derecha, abajo a la izquierda, izquierda, arriba a la izquierda, arriba a la derecha
const DIRS_IMPAR = [[1, 0], [1, 1], [0, 1], [-1, 0], [0, -1], [1, -1]];
const DIRS_PAR = [[1, 0], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1]];
const direcciones = (y) => (y & 1 ? DIRS_IMPAR : DIRS_PAR);
const vecinas = (x, y) => {
  const v = [];
  for (const [dx, dy] of direcciones(y)) if (dentro(x + dx, y + dy)) v.push({ x: x + dx, y: y + dy });
  return v;
};
const pegadaAMi = (x, y) => vecinas(x, y).some((c) => esMia(c.x, c.y));
const costera = (x, y) => vecinas(x, y).some((c) => !esTierra(c.x, c.y));

// Qué hay en una casilla: Roma, la capital de un pueblo o nada
function lugarEn(x, y) {
  if (x === MAPA.roma.x && y === MAPA.roma.y) return "roma";
  for (const id in ENEMIGOS) if (ENEMIGOS[id].x === x && ENEMIGOS[id].y === y) return id;
  return null;
}
const esCapital = (x, y) => { const l = lugarEn(x, y); return l && l !== "roma" ? l : null; };

// Las otras ciudades de cada pueblo (las que no son su capital)
const ciudadesExtra = (id) => ENEMIGOS[id].ciudades || [];
const CIUDADES_EN = new Map();   // casilla -> { id: de qué pueblo es, k: cuál de sus ciudades }
for (const id in ENEMIGOS) ciudadesExtra(id).forEach((c, k) => CIUDADES_EN.set(c.y * MAPA_ANCHO + c.x, { id, k }));
const ciudadPuebloEn = (x, y) => CIUDADES_EN.get(y * MAPA_ANCHO + x) || null;
// Si en esa casilla hay una ciudad (no capital) que todavía es de su pueblo: { id, k, nombre }
function ciudadEnemigaEn(x, y) {
  const c = ciudadPuebloEn(x, y);
  return c && duenoDe(x, y) === c.id ? { ...c, nombre: ciudadesExtra(c.id)[c.k].nombre } : null;
}

// Cuántas ciudades tiene un pueblo en total (con la capital) y cuántas ya le tomaste
const totalCiudades = (id) => 1 + ciudadesExtra(id).length;
const ciudadesTomadas = (id) => ciudadesExtra(id).filter((c) => duenoDe(c.x, c.y) === "roma").length;
const masDeLaMitad = (id) => ciudadesTomadas(id) > totalCiudades(id) / 2;

// ---------- Guerra y conquista de zonas ----------

function puedeDeclararGuerra(id) {
  const e = estado.enemigos[id];
  if (!e.vivo) return { ok: false, motivo: "Ya son tuyos." };
  if (e.guerra) return { ok: false, motivo: "Ya están en guerra." };
  if (!descubierto(id)) return { ok: false, motivo: "Todavía no los descubriste." };
  if (enTregua(id)) return { ok: false, motivo: `Firmaron la paz: hay tregua por ${e.tregua - estado.turno} año${e.tregua - estado.turno > 1 ? "s" : ""} más.` };
  return { ok: true };
}

function declararGuerra(id) {
  if (!puedeDeclararGuerra(id).ok) return false;
  const e = estado.enemigos[id];
  e.guerra = true;
  // Ellos también van a venir a pelear
  if (!e.proximo || e.proximo < estado.turno + 3) e.proximo = estado.turno + e.cada;
  anotar(`⚔️ ¡Roma le declara la guerra a ${pueblo(id)}! Ya podés atacar sus zonas pegadas a tu territorio.`, "mal");
  return true;
}

// ---------- Firmar la paz ----------

const enTregua = (id) => (estado.enemigos[id].tregua || 0) > estado.turno;
// Si ya le tomaste más de la mitad de sus ciudades, la paz sale mucho más barata
const costoPaz = (id) => ({ poder: masDeLaMitad(id) ? PAZ.costoGanando : PAZ.costo });

function puedeFirmarPaz(id) {
  const e = estado.enemigos[id];
  if (!e.vivo) return { ok: false, motivo: "Ya son tuyos." };
  if (!e.guerra) return { ok: false, motivo: "No están en guerra." };
  if (!alcanza(costoPaz(id))) return { ok: false, motivo: `Te falta ⚖️ poder político: la paz cuesta ${costoPaz(id).poder} y tenés ${Math.floor(estado.rec.poder)}.` };
  return { ok: true };
}

// Se termina la guerra: te quedás con lo que ganaste, su ejército vuelve a casa
// y por unos años nadie puede volver a declarar la guerra.
function firmarPaz(id) {
  if (!puedeFirmarPaz(id).ok) return false;
  const e = estado.enemigos[id];
  const ganando = masDeLaMitad(id);
  const costo = costoPaz(id);
  pagar(costo);
  e.guerra = false;
  e.marcha = null;
  e.tregua = estado.turno + PAZ.tregua;
  // Los pueblos que atacan solos vuelven a intentarlo recién después de la tregua
  e.proximo = ENEMIGOS[id].primerAtaque ? Math.max(e.proximo || 0, e.tregua + e.cada) : null;
  anotar(`🕊️ Roma firma la paz con ${pueblo(id)}${ganando ? `, que ya ${verbo(id, "perdieron", "perdió")} más de la mitad de sus ciudades y ${verbo(id, "aceptan", "acepta")} enseguida` : ""}. Pagaste ${costo.poder} ⚖️. Te quedás con todo lo que ganaste y hay tregua por ${PAZ.tregua} años.`, "bien");
  return true;
}

// ¿Se puede llegar a esa casilla? Por tierra, si está pegada a tu territorio.
// Por mar (islas o costas lejanas), si tenés un Puerto (que pide Navegación).
function alcanzable(x, y) {
  if (pegadaAMi(x, y)) return true;
  return tiene(MAPA.tecMar) && costera(x, y) && cuenta(BARCOS.edificio) > 0;
}
// Se llega solo por mar: hacen falta barcos para llevar a los soldados
const porMar = (x, y) => !pegadaAMi(x, y);

// ---------- Barcos ----------

const barcos = () => estado.barcos || 0;
const barcosListos = () => Math.max(0, barcos() - (estado.barcosUsados || 0));

function puedeConstruirBarco(n = 1) {
  if (!tiene(MAPA.tecMar)) return { ok: false, motivo: `Necesitás ⛵ ${TECNOLOGIAS[MAPA.tecMar].nombre}.` };
  if (cuenta(BARCOS.edificio) === 0) return { ok: false, motivo: `Necesitás un ${EDIFICIOS[BARCOS.edificio].nombre} terminado.` };
  if (!alcanza(multiplicar(BARCOS.costo, n))) return { ok: false, motivo: "No te alcanzan los recursos." };
  return { ok: true };
}

function construirBarco(n = 1) {
  if (!puedeConstruirBarco(n).ok) return false;
  pagar(multiplicar(BARCOS.costo, n));
  estado.barcos = barcos() + n;
  anotar(`${BARCOS.icono} Botás ${n} ${(n > 1 ? BARCOS.plural : BARCOS.nombre).toLowerCase()} al mar.`);
  return true;
}

// ---------- Barcos de guerra ----------

const flota = () => estado.flota || 0;
const flotaLista = () => Math.max(0, flota() - (estado.flotaUsada || 0));

function puedeConstruirNave(n = 1) {
  const B = BARCOS_GUERRA;
  if (!tiene(B.requiere)) return { ok: false, motivo: `Necesitás ${TECNOLOGIAS[B.requiere].icono} ${TECNOLOGIAS[B.requiere].nombre}.` };
  if (cuenta(B.edificio) === 0) return { ok: false, motivo: `Necesitás un ${EDIFICIOS[B.edificio].nombre} terminado.` };
  if (!alcanza(multiplicar(B.costo, n))) return { ok: false, motivo: "No te alcanzan los recursos." };
  return { ok: true };
}

function construirNave(n = 1) {
  if (!puedeConstruirNave(n).ok) return false;
  pagar(multiplicar(BARCOS_GUERRA.costo, n));
  estado.flota = flota() + n;
  anotar(`${BARCOS_GUERRA.icono} Botás ${n} ${(n > 1 ? BARCOS_GUERRA.plural : BARCOS_GUERRA.nombre).toLowerCase()} de guerra al mar.`);
  return true;
}

// Cuánto suman los barcos de guerra al atacar una zona (solo si está en la costa)
const ataqueNaval = (x, y) => (costera(x, y) ? flotaLista() * BARCOS_GUERRA.ataque * bonusAtaque() : 0);
// Cuánto suman al defender un lugar tuyo en la costa
const defensaNaval = (x, y) => (costera(x, y) ? flota() * BARCOS_GUERRA.defensa * bonusDefensa() : 0);

function puedeAtacarZona(x, y) {
  const id = duenoDe(x, y);
  if (!id || id === "roma") return { ok: false, motivo: "Acá no hay a quién atacar." };
  const e = estado.enemigos[id];
  if (!vista(x, y)) return { ok: false, motivo: "Primero explorá esta zona." };
  if (!e.guerra) return { ok: false, motivo: `No estás en guerra con los ${ENEMIGOS[id].nombre.toLowerCase()}.` };
  if (!alcanzable(x, y)) {
    let motivo = "Queda lejos: primero ganá las zonas que están en el medio.";
    if (costera(x, y) && !tiene(MAPA.tecMar)) motivo = `Queda lejos de tu territorio. Investigá ⛵ ${TECNOLOGIAS[MAPA.tecMar].nombre} para llegar por mar, o ganá las zonas del medio si hay camino por tierra.`;
    else if (costera(x, y)) motivo = `Para llegar por mar necesitás un ⚓ ${EDIFICIOS[BARCOS.edificio].nombre} terminado y barcos.`;
    return { ok: false, motivo };
  }
  if (porMar(x, y) && barcosListos() === 0) {
    return { ok: false, motivo: barcos() === 0
      ? `Solo se llega por mar: construí ${BARCOS.icono} ${BARCOS.plural.toLowerCase()} en la pestaña ⚔️ Ejército (cada uno lleva ${BARCOS.lleva} soldados).`
      : "Tus barcos ya navegaron este año. El año que viene vuelven a estar listos." };
  }
  if (!alcanza(costoZona(x, y))) return { ok: false, motivo: `Te falta ⚖️ poder político: quedarte con esta zona cuesta ${costoZona(x, y).poder} y tenés ${Math.floor(estado.rec.poder)}.` };
  if (soldados() === 0) return { ok: false, motivo: "No tenés soldados. Entrenalos en la pestaña ⚔️ Ejército." };
  if (soldadosListos() === 0) return { ok: false, motivo: "Todos tus soldados ya pelearon este año y descansan. El año que viene vuelven a estar listos." };
  return { ok: true };
}

// Ocupar una zona de tierra de nadie: no hay que pelear, solo llegar y pagar
function puedeOcupar(x, y) {
  if (!esTierra(x, y) || duenoDe(x, y)) return { ok: false, motivo: "Esta zona no es tierra de nadie." };
  if (esRutaComercial(x, y)) return { ok: false, motivo: `Por acá solo pasan las caravanas de la ${RUTAS_COMERCIALES.nombre}: no se puede ocupar.` };
  if (!vista(x, y)) return { ok: false, motivo: "Primero explorá esta zona." };
  if (!alcanzable(x, y)) {
    let motivo = "Queda lejos: tiene que estar pegada a tu territorio.";
    if (costera(x, y) && !tiene(MAPA.tecMar)) motivo = `Queda lejos de tu territorio. Investigá ⛵ ${TECNOLOGIAS[MAPA.tecMar].nombre} para llegar por mar, o ocupá las zonas del medio.`;
    else if (costera(x, y)) motivo = `Para llegar por mar necesitás un ⚓ ${EDIFICIOS[BARCOS.edificio].nombre} terminado y barcos.`;
    return { ok: false, motivo };
  }
  if (porMar(x, y) && barcosListos() === 0) {
    return { ok: false, motivo: barcos() === 0
      ? `Solo se llega por mar: construí ${BARCOS.icono} ${BARCOS.plural.toLowerCase()} en la pestaña ⚔️ Ejército.`
      : "Tus barcos ya navegaron este año. El año que viene vuelven a estar listos." };
  }
  if (!alcanza(MAPA.ocupar)) return { ok: false, motivo: "No te alcanzan los recursos." };
  return { ok: true };
}

function ocupar(x, y) {
  if (!puedeOcupar(x, y).ok) return false;
  if (porMar(x, y)) estado.barcosUsados = (estado.barcosUsados || 0) + 1;
  pagar(MAPA.ocupar);
  estado.duenos[y * MAPA_ANCHO + x] = "roma";
  revelar(x, y, 1);
  anotar(`🚩 Ocupaste una zona de ${MAPA.terrenos[terreno(x, y)].nombre.toLowerCase()} que no era de nadie. Ahora es territorio romano.`, "bien");
  return true;
}

// ¿Bactra (donde empieza la Ruta de la Seda) es tuya? Entonces las caravanas te dejan oro cada año
const esPuertaRuta = (x, y) => x === RUTAS_COMERCIALES.puerta.x && y === RUTAS_COMERCIALES.puerta.y;
const tenesRuta = () => duenoDe(RUTAS_COMERCIALES.puerta.x, RUTAS_COMERCIALES.puerta.y) === "roma";

// Tierra de nadie de las rutas comerciales de Asia: no se puede ocupar
function esRutaComercial(x, y) {
  const z = RUTAS_COMERCIALES.zona;
  return esTierra(x, y) && !duenoDe(x, y) && x >= z.x[0] && x <= z.x[1] && y >= z.y[0] && y <= z.y[1];
}

// ⚖️ Poder político que cuesta quedarse con una zona (los reinos con "costoPoder" cuestan varias veces más)
function costoZona(x, y) {
  const id = duenoDe(x, y);
  const veces = ENEMIGOS[id].costoPoder || 1;
  if (esCapital(x, y) === id) return { poder: veces * Math.min(MAPA.poder.maxCapital, MAPA.poder.capital + MAPA.poder.porZona * (zonasDe(id) - 1)) };
  if (ciudadEnemigaEn(x, y)) return { poder: veces * CIUDADES_PUEBLO.poder };
  return { poder: veces * MAPA.poder.zona };
}

// Defensa de una zona: la capital la defiende todo el ejército que está en casa (con murallas);
// las otras zonas, una parte del ejército más la ayuda del terreno.
function defensaZona(x, y, catapultas = 0) {
  const id = duenoDe(x, y);
  if (esCapital(x, y) === id) return defensaEnemiga(id, catapultas);
  const e = estado.enemigos[id];
  const enCasa = e.fuerza - (e.marcha ? e.marcha.fuerza : 0);
  const bonus = MAPA.bonusTerreno[terreno(x, y)] || 0;
  // Sus otras ciudades: más soldados y la mitad de sus murallas (las catapultas las bajan)
  if (ciudadEnemigaEn(x, y)) {
    const muro = Math.max(0, ENEMIGOS[id].muro / 2 - catapultas * 0.1);
    return Math.max(2, enCasa * CIUDADES_PUEBLO.defensa) * (1 + bonus + muro);
  }
  return Math.max(1, enCasa * MAPA.defensaZona) * (1 + bonus);
}

// ---------- Utilidades ----------

const azar = (min, max) => min + Math.random() * (max - min);
const tiene = (tech) => !!estado.techs[tech];
const redondeoAzar = (x) => Math.floor(x) + (Math.random() < x - Math.floor(x) ? 1 : 0);

function anotar(texto, clase = "") {
  estado.log.unshift({ texto, clase });
  estado.log = estado.log.slice(0, 60);
}

// Edificios terminados de un tipo (o en obra, si incluirObras)
// ---------- Efectos de las tecnologías ----------

// Suma un efecto simple (impuestos, ataque, crecimiento...) de todas las tecnologías que tenés
// (también suma el bonus de los períodos a los que ya llegaste)
function efecto(clave) {
  let total = 0;
  for (const id in estado.techs) {
    const e = TECNOLOGIAS[id] && TECNOLOGIAS[id].efecto;
    if (TECNOLOGIAS[id] && TECNOLOGIAS[id].necesita && cuenta(TECNOLOGIAS[id].necesita) === 0) continue;
    if (e && e[clave]) total += e[clave];
  }
  for (let i = 0; i <= periodoActual(); i++) {
    const e = PERIODOS[i].efecto;
    if (e && e[clave]) total += e[clave];
  }
  return total;
}

// Producción extra de un edificio por tecnologías
function mejoraEdificio(tipo, recurso) {
  let total = 0;
  for (const id in estado.techs) {
    const m = TECNOLOGIAS[id] && TECNOLOGIAS[id].efecto && TECNOLOGIAS[id].efecto.mejora;
    if (m && m[tipo] && m[tipo][recurso]) total += m[tipo][recurso];
  }
  return total;
}

// Lugar extra para vivir que da un edificio por tecnologías
function capacidadExtra(tipo) {
  let total = 0;
  for (const id in estado.techs) {
    const c = TECNOLOGIAS[id] && TECNOLOGIAS[id].efecto && TECNOLOGIAS[id].efecto.capacidad;
    if (c && c[tipo]) total += c[tipo];
  }
  return total;
}

// Lo que cuesta un soldado (con descuentos)
function costoUnidad(tipo) {
  const desc = Math.min(0.75, efecto("descuentoTropas"));
  const c = {};
  for (const r in UNIDADES[tipo].costo) c[r] = Math.round(UNIDADES[tipo].costo[r] * (1 - desc));
  return c;
}

function cuenta(tipo, incluirObras = false) {
  return todosLotes().filter((l) => l && l.tipo === tipo && (incluirObras || l.falta === 0)).length;
}

function soldados() {
  let n = 0;
  for (const u in estado.ejercito) n += estado.ejercito[u];
  return n;
}

// Soldados que todavía no pelearon este año (los que pelearon descansan hasta el año siguiente)
const listos = (u) => Math.max(0, estado.ejercito[u] - ((estado.cansadas || {})[u] || 0));
function soldadosListos() {
  let n = 0;
  for (const u in estado.ejercito) n += listos(u);
  return n;
}

function capacidad() {
  let c = 0;
  for (const l of todosLotes()) if (l && l.falta === 0) c += (EDIFICIOS[l.tipo].capacidad || 0) + capacidadExtra(l.tipo);
  return c;
}

// Trabajadores que necesita un edificio (algunas tecnologías, como Riego, los bajan)
function trabajadoresDe(tipo) {
  let n = EDIFICIOS[tipo].trabajadores || 0;
  if (!n) return 0;
  for (const id in estado.techs) {
    const t = TECNOLOGIAS[id] && TECNOLOGIAS[id].efecto && TECNOLOGIAS[id].efecto.trabajadores;
    if (t && t[tipo]) n += t[tipo];
  }
  return Math.max(1, n);
}

// Habitantes que necesitan todos los edificios (también los que están en obra)
function trabajosOcupados() {
  let n = 0;
  for (const l of todosLotes()) if (l) n += trabajadoresDe(l.tipo);
  return n;
}

// Habitantes que están en Roma (los exploradores andan de viaje)
const enRoma = () => Math.max(0, estado.habitantes - estado.exploradores.length);

const libres = () => Math.max(0, enRoma() - trabajosOcupados());

// Si falta gente, los edificios rinden menos
function eficiencia() {
  const t = trabajosOcupados();
  return t === 0 ? 1 : Math.min(1, enRoma() / t);
}

function alcanza(costo) {
  for (const r in costo) if ((estado.rec[r] || 0) < costo[r]) return false;
  return true;
}

function pagar(costo) {
  for (const r in costo) estado.rec[r] -= costo[r];
}

function multiplicar(costo, n) {
  const c = {};
  for (const r in costo) c[r] = costo[r] * n;
  return c;
}

// ---------- Apoyo popular ----------

const limitarApoyo = (x) => Math.max(0, Math.min(100, Math.round(x)));
// Partidas guardadas de antes del apoyo arrancan con el apoyo inicial
const apoyo = () => (estado.apoyo === undefined ? APOYO.inicio : estado.apoyo);

// El apoyo al que vuelve Roma con el tiempo: la base más lo que dan los edificios y tecnologías
function apoyoBase() {
  let b = APOYO.base + efecto("apoyo");
  for (const l of todosLotes()) if (l && l.falta === 0) b += APOYO.edificios[l.tipo] || 0;
  return limitarApoyo(b);
}

// Cuánto rinde todo según el apoyo: 1 = normal, 1.2 = +20%
const productividad = () => APOYO.minimo + (APOYO.maximo - APOYO.minimo) * apoyo() / 100;

// Suma o resta apoyo y lo cuenta en la crónica
function cambiarApoyo(n) {
  if (!n) return "";
  const antes = apoyo();
  estado.apoyo = limitarApoyo(antes + n);
  if (estado.apoyo <= APOYO.derrocado) estado.rebelion = true;   // aunque después se recupere un poco, ya se rebelaron
  const real = estado.apoyo - antes;
  return real ? ` (${real > 0 ? "+" : ""}${real} 😊 apoyo)` : "";
}

// ---------- Fama ----------

// Partidas guardadas de antes de la fama arrancan en 0
const fama = () => estado.fama || 0;

// Suma o resta fama y lo cuenta en la crónica
function cambiarFama(n) {
  if (!n) return "";
  const antes = fama();
  estado.fama = Math.max(0, Math.min(100, antes + n));
  const real = estado.fama - antes;
  return real ? ` (${real > 0 ? "+" : ""}${real} 🌟 fama)` : "";
}

// Con mucha fama, los pueblos en paz que conocés pueden pedir unirse a Roma
function alianzasPorFama() {
  if (fama() < FAMA.alianza) return;
  const prob = FAMA.probAlianza * (fama() - FAMA.alianza) / (100 - FAMA.alianza);
  for (const id in estado.enemigos) {
    const e = estado.enemigos[id];
    if (!e.vivo || e.guerra || e.marcha || !descubierto(id) || e.fuerza >= fama()) continue;
    if (Math.random() >= prob) continue;
    const datos = ENEMIGOS[id];
    e.vivo = false;
    e.proximo = null;
    const zonas = zonasDe(id);
    const mapas = heredarMapas(id);
    estado.duenos = estado.duenos.map((d) => (d === id ? "roma" : d));
    revelarTerritorio();
    sumarCiudadesDelPueblo(id);
    anotar(`🤝 ¡La fama de Roma llegó a ${datos.ciudad}! Los ${datos.nombre.toLowerCase()} se unen a Roma sin pelear: sus ${zonas} zonas pasan a ser tuyas, te pagan tributo y ya podés construir en ${datos.ciudad}.${mapas}${cambiarApoyo(APOYO.sucesos.zona)}`, "bien");
    return;   // como mucho uno por año
  }
}

// ---------- Acciones del gobierno ----------

// Lo que recibís con una acción (lo fijo más lo que depende de los habitantes)
function ganaAccion(id) {
  const a = ACCIONES[id];
  const g = { ...(a.da || {}) };
  for (const r in a.porHabitante || {}) g[r] = (g[r] || 0) + a.porHabitante[r] * estado.habitantes;
  return g;
}

// Turno a partir del cual se puede volver a hacer
const accionLista = (id) => (estado.acciones && estado.acciones[id]) || 0;

function puedeAccion(id) {
  const a = ACCIONES[id];
  if (a.requiere && cuenta(a.requiere) === 0) return { ok: false, motivo: `Necesitás ${articuloEd(a.requiere)} ${EDIFICIOS[a.requiere].nombre} terminado.` };
  const faltan = accionLista(id) - estado.turno;
  if (faltan > 0) return { ok: false, motivo: `Podés repetirla en ${faltan} año${faltan > 1 ? "s" : ""}.` };
  if (a.costo && !alcanza(a.costo)) return { ok: false, motivo: "No te alcanzan los recursos." };
  return { ok: true };
}

const articuloEd = (tipo) => (EDIFICIOS[tipo].nombre.endsWith("a") ? "una" : "un");

function hacerAccion(id) {
  if (!puedeAccion(id).ok) return false;
  const a = ACCIONES[id];
  if (a.costo) pagar(a.costo);
  const g = ganaAccion(id);
  for (const r in g) estado.rec[r] += g[r];
  estado.acciones = estado.acciones || {};
  estado.acciones[id] = estado.turno + a.espera;
  const premio = Object.entries(g).map(([r, v]) => `+${v} ${RECURSOS[r].icono}`).join(" ");
  anotar(`${a.icono} ${a.nombre}.${premio ? " " + premio + "." : ""}${cambiarApoyo(a.apoyo)}`, a.apoyo >= 0 ? "bien" : "mal");
  return true;
}

// ---------- Producción ----------

// Devuelve lo que entra y sale por año, recurso por recurso
function balance() {
  const b = { comida: 0, madera: 0, piedra: 0, oro: 0, ciencia: 0, poder: 0 };
  const efi = eficiencia() * productividad();
  for (let i = 0; i <= estado.colonias.length; i++) {
    for (const l of lotesDe(i)) {
      if (!l || l.falta > 0) continue;
      const ed = EDIFICIOS[l.tipo];
      const factor = ed.trabajadores ? efi : productividad();
      for (const r in b) {
        const valor = ((ed.produce && ed.produce[r]) || 0) + mejoraEdificio(l.tipo, r) + extraAlrededor(i, l.tipo, r);
        b[r] += valor * factor;
      }
    }
  }
  // Impuestos: cada 3 habitantes pagan 1 de oro
  b.oro += Math.floor(estado.habitantes / 3) * (1 + efecto("impuestos")) * productividad();
  // Comerciantes que atrae la fama
  b.oro += Math.floor(fama() / FAMA.oroCada);
  // Las caravanas de la Ruta de la Seda, si Bactra es tuya
  if (tenesRuta()) b.oro += RUTAS_COMERCIALES.oro;
  // Tributos de pueblos conquistados
  for (const id in estado.enemigos) {
    if (estado.enemigos[id].vivo) continue;
    const t = ENEMIGOS[id].tributo;
    for (const r in t) b[r] += t[r] * (1 + efecto("tributo"));
  }
  // Lo que come la gente: medio por habitante, uno por soldado
  b.comida -= Math.ceil(estado.habitantes / 2) + soldados();
  for (const r in b) b[r] = Math.floor(b[r]);
  return b;
}

// ---------- Construir ----------

// Dice si se puede construir y, si no, por qué
// ciudad: en cuál se quiere construir (los edificios únicos son uno por ciudad)
function puedeConstruir(tipo, ciudad = 0) {
  const ed = EDIFICIOS[tipo];
  if (ed.fijo) return { ok: false, motivo: "No se puede construir." };
  if (ed.requiere && !tiene(ed.requiere)) return { ok: false, motivo: `Necesitás investigar ${TECNOLOGIAS[ed.requiere].nombre}.` };
  if (ed.unico && (lotesDe(ciudad) || []).some((l) => l && l.tipo === tipo)) return { ok: false, motivo: `Ya hay uno en ${nombreCiudad(ciudad)}.` };
  if (ed.maravilla && cuenta(tipo, true) > 0) return { ok: false, motivo: `Ya tenés ${articuloEd(tipo) === "una" ? "la" : "el"} ${ed.nombre}: hay uno solo en todo el reino.` };
  if (ed.maravilla && ciudad !== 0) return { ok: false, motivo: "Esta gran obra solo se puede construir en Roma." };
  if (trabajadoresDe(tipo) > libres()) return { ok: false, motivo: `Necesita ${trabajadoresDe(tipo)} habitantes libres (tenés ${libres()}).` };
  if (!alcanza(ed.costo)) return { ok: false, motivo: "No te alcanzan los recursos." };
  return { ok: true };
}

// ciudad: 0 = Roma, 1 en adelante = las ciudades que fundaste
function construir(ciudad, lote, tipo) {
  const lotes = lotesDe(ciudad);
  if (!lotes || lotes[lote] || !puedeConstruir(tipo, ciudad).ok) return false;
  const ed = EDIFICIOS[tipo];
  pagar(ed.costo);
  lotes[lote] = { tipo, falta: ed.turnos };
  anotar(`🚧 Empieza la obra en ${nombreCiudad(ciudad)}: ${ed.nombre} (${ed.turnos} año${ed.turnos > 1 ? "s" : ""}).`);
  return true;
}

// Cambia de lugar dos terrenos de la misma ciudad (si uno está vacío, el edificio se muda ahí).
// Es gratis y no cambia nada del juego: solo cómo se ve la ciudad.
function moverLote(ciudad, de, a) {
  const lotes = lotesDe(ciudad);
  if (!lotes || de === a || !lotes[de] || a < 0 || a >= lotes.length) return false;
  [lotes[de], lotes[a]] = [lotes[a], lotes[de]];
  return true;
}

function demoler(ciudad, lote) {
  const lotes = lotesDe(ciudad);
  const l = lotes && lotes[lote];
  if (!l || EDIFICIOS[l.tipo].fijo) return false;
  lotes[lote] = null;
  anotar(`🔨 Demolés en ${nombreCiudad(ciudad)}: ${EDIFICIOS[l.tipo].nombre}.`);
  return true;
}

// ---------- Ciudades nuevas ----------

// Todos los terrenos de todas tus ciudades (Roma y las que fundaste)
const todosLotes = () => estado.lotes.concat(...(estado.colonias || []).map((c) => c.lotes));
// Terrenos de una ciudad: 0 = Roma, 1 en adelante = las fundadas
const lotesDe = (i) => (i === 0 ? estado.lotes : estado.colonias[i - 1] && estado.colonias[i - 1].lotes);
const nombreCiudad = (i) => (i === 0 ? "Roma" : estado.colonias[i - 1].nombre);

// Número de la ciudad fundada en esa casilla (1, 2...) o 0 si no hay ninguna
function coloniaEn(x, y) {
  return (estado.colonias || []).findIndex((c) => c.x === x && c.y === y) + 1;
}

// ---------- Lo que rodea a cada ciudad (bosques, montañas) ----------

// Dónde está una ciudad en el mapa: 0 = Roma, 1 en adelante = fundadas y conquistadas
const posCiudad = (i) => (i === 0 ? MAPA.roma : estado.colonias[i - 1]);

// Cuántas casillas de un terreno hay cerca de (x, y)
function contarAlrededor(x, y, letra, radio = ALREDEDORES.radio) {
  let n = 0;
  for (let dy = -radio; dy <= radio; dy++)
    for (let dx = -radio - 1; dx <= radio + 1; dx++)
      if (dentro(x + dx, y + dy) && distancia(x, y, x + dx, y + dy) <= radio && terreno(x + dx, y + dy) === letra) n++;
  return n;
}

// Lo que un edificio de una ciudad produce de más por lo que tiene alrededor (en un lugar del mapa)
function extraEnLugar(x, y, tipo, recurso) {
  const a = ALREDEDORES.edificios[tipo];
  if (!a || a.recurso !== recurso) return 0;
  let total = 0;
  for (const t in a.terrenos) total += contarAlrededor(x, y, t) * a.terrenos[t];
  return Math.min(a.maximo, Math.floor(total));
}
const extraAlrededor = (i, tipo, recurso) => {
  const p = posCiudad(i);
  return p ? extraEnLugar(p.x, p.y, tipo, recurso) : 0;
};

// Ícono de cada ciudad (Roma, fundada o conquistada)
const iconoCiudad = (i) => ICONOS_CIUDAD[i === 0 ? "roma" : esConquistada(i) ? "conquistada" : "fundada"];

// Cuántas ciudades fundaste vos (sin contar las conquistadas)
const fundadas = () => (estado.colonias || []).filter((c) => !c.conquistada).length;
const esConquistada = (i) => i > 0 && !!(estado.colonias[i - 1] && estado.colonias[i - 1].conquistada);

// Dónde está una ciudad de un pueblo: k = cuál de sus otras ciudades (sin k = la capital)
function lugarConquistada(id, k) {
  const d = ENEMIGOS[id];
  return k === undefined ? { nombre: d.ciudad, x: d.x, y: d.y } : ciudadesExtra(id)[k];
}

// Una ciudad que le tomás a un pueblo (su capital, o la otra número k) pasa a ser tuya y podés construir en ella
function sumarCiudadConquistada(id, partida = estado, k) {
  partida.colonias = partida.colonias || [];
  if (partida.colonias.some((c) => c.conquistada === id && c.ciudad === k)) return;
  const lugar = lugarConquistada(id, k);
  if (!lugar) return;
  const lotes = Array(CONQUISTA.lotes).fill(null);
  lotes[CONQUISTA.lotePlaza] = { tipo: "plaza", falta: 0 };
  let i = 0;
  for (const tipo of CONQUISTA.edificios) {
    while (lotes[i]) i++;
    if (i < lotes.length) lotes[i] = { tipo, falta: 0 };
  }
  const c = { nombre: lugar.nombre, x: lugar.x, y: lugar.y, lotes, conquistada: id };
  if (k !== undefined) c.ciudad = k;
  partida.colonias.push(c);
}

// Cuando un pueblo se rinde, todas sus ciudades pasan a ser tuyas
function sumarCiudadesDelPueblo(id, partida = estado) {
  sumarCiudadConquistada(id, partida);
  ciudadesExtra(id).forEach((_, k) => sumarCiudadConquistada(id, partida, k));
}

// Cada ciudad nueva cuesta más que la anterior
function costoFundar() {
  const n = fundadas();
  const c = {};
  for (const r in FUNDACION.costo) c[r] = Math.round(FUNDACION.costo[r] * (1 + FUNDACION.aumento * n));
  return c;
}

function puedeFundar(x, y) {
  if (!esMia(x, y)) return { ok: false, motivo: "Solo podés fundar ciudades en tu territorio." };
  if (FUNDACION.prohibidos.includes(terreno(x, y))) return { ok: false, motivo: `No se puede fundar una ciudad en ${MAPA.terrenos[terreno(x, y)].nombre.toLowerCase()}.` };
  if (fundadas() >= FUNDACION.nombres.length) return { ok: false, motivo: "Ya fundaste todas las ciudades posibles." };
  const otras = [MAPA.roma, ...Object.values(ENEMIGOS), ...Object.keys(ENEMIGOS).flatMap(ciudadesExtra), ...estado.colonias];
  if (otras.some((o) => distancia(x, y, o.x, o.y) < FUNDACION.distancia)) {
    return { ok: false, motivo: "Está muy pegada a otra ciudad: dejá al menos una casilla en el medio." };
  }
  if (FUNDACION.colonos > libres()) return { ok: false, motivo: `Necesitás ${FUNDACION.colonos} habitantes libres que se muden (tenés ${libres()}).` };
  if (!alcanza(costoFundar())) return { ok: false, motivo: "No te alcanzan los recursos." };
  return { ok: true };
}

function fundarCiudad(x, y) {
  if (!puedeFundar(x, y).ok) return 0;
  pagar(costoFundar());
  const nombre = FUNDACION.nombres[fundadas()];
  const lotes = Array(FUNDACION.lotes).fill(null);
  lotes[FUNDACION.lotePlaza] = { tipo: "plaza", falta: 0 };
  estado.colonias.push({ nombre, x, y, lotes });
  anotar(`🏘️ ¡${FUNDACION.colonos} familias romanas fundan ${nombre}! Ya podés construir en sus terrenos.${cambiarFama(FAMA.sucesos.ciudad)}`, "bien");
  return estado.colonias.length;
}

// ---------- Niveles de las ciudades ----------

// Con cuántos terrenos empieza una ciudad, su nivel (1, 2...) y hasta qué nivel puede llegar.
// El nivel sale de cuántos terrenos tiene: así las partidas guardadas de antes andan solas.
const lotesIniciales = (i) => (i === 0 ? INICIO.lotes : esConquistada(i) ? CONQUISTA.lotes : FUNDACION.lotes);
const nivelCiudad = (i) => 1 + Math.round((lotesDe(i).length - lotesIniciales(i)) / NIVELES.terrenos);
const nivelMaximo = (i) => (i === 0 ? NIVELES.maximo.roma : NIVELES.maximo.ciudad);
const gente = () => estado.habitantes + soldados();
const genteParaNivel = (nivel) => nivel * NIVELES.habitantes;

// Lo que cuesta pasar al nivel siguiente: cada nivel sale más caro
function costoNivel(i) {
  const factor = 1 + NIVELES.aumento * (nivelCiudad(i) - 1);
  const c = {};
  for (const r in NIVELES.costo) c[r] = Math.round(NIVELES.costo[r] * factor);
  return c;
}

function puedeSubirNivel(i) {
  if (!lotesDe(i)) return { ok: false, motivo: "Esa ciudad no existe." };
  if (nivelCiudad(i) >= nivelMaximo(i)) return { ok: false, motivo: `${nombreCiudad(i)} ya está en su nivel más alto.` };
  const falta = genteParaNivel(nivelCiudad(i) + 1);
  if (gente() < falta) return { ok: false, motivo: `Tu reino necesita ${falta} habitantes (tenés ${gente()}).` };
  if (!alcanza(costoNivel(i))) return { ok: false, motivo: "No te alcanzan los recursos." };
  return { ok: true };
}

function subirNivel(i) {
  if (!puedeSubirNivel(i).ok) return false;
  pagar(costoNivel(i));
  for (let k = 0; k < NIVELES.terrenos; k++) lotesDe(i).push(null);
  anotar(`🏗️ ¡${nombreCiudad(i)} crece y pasa a nivel ${nivelCiudad(i)}! Suma ${NIVELES.terrenos} terrenos nuevos.`, "bien");
  return true;
}

// ---------- Tecnologías ----------

function puedeInvestigar(id) {
  const t = TECNOLOGIAS[id];
  if (tiene(id)) return { ok: false, motivo: "Ya la tenés." };
  const per = periodoTec(id);
  if (per > periodoActual()) return { ok: false, motivo: `Solo se puede investigar en ${articulo(per)} ${PERIODOS[per].nombre}.` };
  const faltan = (t.requiere || []).filter((r) => !tiene(r));
  if (faltan.length) return { ok: false, motivo: "Primero: " + faltan.map((r) => TECNOLOGIAS[r].nombre).join(" y ") + "." };
  if (estado.rec.ciencia < t.costo) return { ok: false, motivo: "Te falta conocimiento." };
  return { ok: true };
}

function investigar(id) {
  if (!puedeInvestigar(id).ok) return false;
  estado.rec.ciencia -= TECNOLOGIAS[id].costo;
  estado.techs[id] = true;
  anotar(`💡 Descubrís ${TECNOLOGIAS[id].nombre}. ${TECNOLOGIAS[id].desc}`, "bien");
  if (estado.meta && tiene(estado.meta)) estado.meta = null;
  return true;
}

// Columna de cada tecnología dentro del árbol de su período: 0 si no requiere
// nada de su mismo período; si no, una más que la más avanzada de esas.
function columnaTec(id) {
  const req = (TECNOLOGIAS[id].requiere || []).filter((r) => TECNOLOGIAS[r].periodo === TECNOLOGIAS[id].periodo);
  return req.length ? 1 + Math.max(...req.map(columnaTec)) : 0;
}

// Todo lo que falta investigar para llegar a `meta` (incluida ella), en orden
function faltanPara(meta) {
  const lista = [];
  const visitar = (id) => {
    if (tiene(id) || lista.includes(id)) return;
    (TECNOLOGIAS[id].requiere || []).forEach(visitar);
    lista.push(id);
  };
  visitar(meta);
  return lista;
}

// Meta de investigación: apenas alcanza el conocimiento, se investiga sola
// la próxima tecnología del camino (la más barata que ya se pueda).
function elegirMeta(id) {
  estado.meta = id && !tiene(id) ? id : null;
  avanzarMeta();
}

function avanzarMeta() {
  while (estado.meta) {
    const meta = estado.meta;
    const listas = faltanPara(meta).filter((t) => puedeInvestigar(t).ok);
    if (!listas.length) return;
    listas.sort((a, b) => TECNOLOGIAS[a].costo - TECNOLOGIAS[b].costo);
    investigar(listas[0]);
    if (!estado.meta) anotar(`🎯 ¡Llegaste a tu meta: ${TECNOLOGIAS[meta].nombre}!`, "bien");
  }
}

// ---------- Períodos: Monarquía, República, Imperio ----------

// Partidas viejas no tienen período guardado: arrancan en la Monarquía
const periodoActual = () => estado.periodo || 0;
const articulo = (i) => (PERIODOS[i].nombre.endsWith("a") ? "la" : "el");   // "la República", "el Imperio"

// A qué período pertenece una tecnología (0 Monarquía, 1 República, 2 Imperio)
function periodoTec(id) {
  const i = PERIODOS.findIndex((p) => p.id === TECNOLOGIAS[id].periodo);
  return i < 0 ? 0 : i;
}

// La tecnología que te deja pasar al período siguiente (por ejemplo, Democracia)
function tecCierre(periodo) {
  const sig = PERIODOS[periodo + 1];
  return sig && sig.requisitos ? sig.requisitos.tecnologia : null;
}

// Lista de requisitos para pasar al próximo período: [{ texto, ok }]
function requisitosPeriodo() {
  const sig = PERIODOS[periodoActual() + 1];
  if (!sig) return [];
  const r = sig.requisitos || {};
  const lista = [];
  if (r.tecnologia) {
    lista.push({ texto: `Investigar ${TECNOLOGIAS[r.tecnologia].icono} ${TECNOLOGIAS[r.tecnologia].nombre}`, ok: tiene(r.tecnologia) });
  }
  if (r.tecnologias) {
    const delPeriodo = Object.keys(TECNOLOGIAS).filter((id) => periodoTec(id) === periodoActual());
    const n = delPeriodo.filter(tiene).length;
    const todas = r.tecnologias === "todas";
    const hacen = todas ? delPeriodo.length : r.tecnologias;
    const nombre = `${articulo(periodoActual())} ${PERIODOS[periodoActual()].nombre}`;
    lista.push({ texto: todas ? `Investigar todas las tecnologías de ${nombre} (tenés ${n} de ${hacen})` : `${hacen} tecnologías de ${nombre} (tenés ${n})`, ok: n >= hacen });
  }
  if (r.habitantes) {
    lista.push({ texto: `${r.habitantes} habitantes (tenés ${estado.habitantes})`, ok: estado.habitantes >= r.habitantes });
  }
  if (r.conquistas) {
    const n = Object.values(estado.enemigos).filter((e) => !e.vivo).length;
    lista.push({ texto: `Conquistar ${r.conquistas} pueblos vecinos (llevás ${n})`, ok: n >= r.conquistas });
  }
  if (r.costo) {
    const txt = Object.entries(r.costo).map(([k, v]) => `${v} ${RECURSOS[k].icono}`).join(" ");
    lista.push({ texto: `Pagar ${txt}`, ok: alcanza(r.costo) });
  }
  return lista;
}

function puedeAvanzarPeriodo() {
  if (!PERIODOS[periodoActual() + 1]) return false;
  return requisitosPeriodo().every((r) => r.ok);
}

function avanzarPeriodo() {
  if (!puedeAvanzarPeriodo()) return false;
  const sig = PERIODOS[periodoActual() + 1];
  if (sig.requisitos && sig.requisitos.costo) pagar(sig.requisitos.costo);
  estado.periodo = periodoActual() + 1;
  anotar(`${sig.icono} ¡Comienza ${articulo(estado.periodo)} ${sig.nombre}! ${sig.desc} Ahora sos ${sig.titulo}.${cambiarFama(FAMA.sucesos.periodo)}`, "bien");
  avanzarMeta();
  return true;
}

// ---------- Ejército ----------

function puedeEntrenar(tipo, n = 1) {
  const u = UNIDADES[tipo];
  if (u.requiere && !tiene(u.requiere)) return { ok: false, motivo: `Necesitás ${TECNOLOGIAS[u.requiere].nombre}.` };
  if (u.maximo && (estado.ejercito[tipo] || 0) + n > u.maximo) return { ok: false, motivo: `Podés tener ${u.maximo === 1 ? "uno solo" : "hasta " + u.maximo}.` };
  if (cuenta(u.edificio) === 0) return { ok: false, motivo: `Necesitás un ${EDIFICIOS[u.edificio].nombre} terminado.` };
  if (libres() < n) return { ok: false, motivo: "No hay habitantes libres para alistar." };
  if (!alcanza(multiplicar(costoUnidad(tipo), n))) return { ok: false, motivo: "No te alcanzan los recursos." };
  return { ok: true };
}

function entrenar(tipo, n = 1) {
  if (!puedeEntrenar(tipo, n).ok) return false;
  pagar(multiplicar(costoUnidad(tipo), n));
  estado.habitantes -= n;            // el habitante pasa a ser soldado
  estado.ejercito[tipo] += n;
  anotar(`Entrenás ${n} ${UNIDADES[tipo].nombre.toLowerCase()}.`);
  return true;
}

const bonusAtaque = () => 1 + efecto("ataque");
const bonusDefensa = () => 1 + efecto("defensa");

// Cada ciudad se defiende con su propia muralla (0 = Roma, 1... = las fundadas)
function bonusMuralla(ciudad = 0) {
  const lotes = lotesDe(ciudad) || [];
  if (!lotes.some((l) => l && l.tipo === "muralla" && l.falta === 0)) return 0;
  return 0.5 + efecto("muralla");
}

// Fuerza para defender una ciudad: soldados + los habitantes que agarran palos.
// Roma tiene a todos sus habitantes; las ciudades fundadas, una parte.
function poderDefensa(ciudad = 0) {
  let p = 0;
  for (const u in estado.ejercito) p += estado.ejercito[u] * UNIDADES[u].defensa;
  const vecinos = estado.habitantes * 0.3 * (ciudad === 0 ? 1 : ATAQUES_ENEMIGOS.genteColonia);
  const pos = posCiudad(ciudad) || MAPA.roma;
  p = p * bonusDefensa() + 2 + vecinos + defensaNaval(pos.x, pos.y);   // los barcos de guerra ayudan si está en la costa
  return p * (1 + bonusMuralla(ciudad));
}

// Defensa de una zona tuya que no es ciudad: va una parte del ejército, con ayuda del terreno
function poderDefensaZona(x, y) {
  let p = 0;
  for (const u in estado.ejercito) p += estado.ejercito[u] * UNIDADES[u].defensa;
  p = (p * bonusDefensa() + 1) * ATAQUES_ENEMIGOS.ejercitoZona;
  return p * (1 + (MAPA.bonusTerreno[terreno(x, y)] || 0)) * (1 + bonusGeneral(estado.ejercito, x, y)) + defensaNaval(x, y);
}

// Bonus de los generales según el terreno de la batalla (si alguno pelea ahí). Se usa el mejor.
function bonusGeneral(grupo, x, y) {
  if (x === undefined) return 0;
  let b = 0;
  for (const u in grupo) {
    const bt = UNIDADES[u] && UNIDADES[u].bonusTerreno;
    if (bt && grupo[u] > 0) b = Math.max(b, bt[terreno(x, y)] || 0);
  }
  return b;
}

// x, y (opcional): dónde es la batalla, para el bonus del general y los barcos de guerra
function poderAtaque(envio, x, y) {
  let p = 0;
  for (const u in envio) p += (envio[u] || 0) * UNIDADES[u].ataque;
  return p * bonusAtaque() * (1 + bonusGeneral(envio, x, y)) + (x === undefined ? 0 : ataqueNaval(x, y));
}

// Defensa de una ciudad enemiga (si su ejército salió a marchar, queda menos gente)
function defensaEnemiga(id, catapultas = 0) {
  const e = estado.enemigos[id];
  const enCasa = e.fuerza - (e.marcha ? e.marcha.fuerza : 0);
  const muro = Math.max(0, ENEMIGOS[id].muro - catapultas * 0.1);
  return Math.max(1, enCasa) * (1 + muro);
}

// Lo que se muestra al jugador: un número aproximado
const estimar = (x) => Math.max(5, Math.round(x / 5) * 5);

// Una batalla: cada lado tira su suerte (±15%). Gana el más fuerte.
// El ganador pierde más tropas cuanto más pareja fue la pelea.
function choque(poderA, poderB) {
  const a = poderA * azar(0.85, 1.15);
  const b = poderB * azar(0.85, 1.15);
  const ganaA = a > b;
  const parejo = ganaA ? b / a : a / b;   // entre 0 y 1
  return { ganaA, perdidaGanador: 0.6 * parejo * parejo, a, b };
}

function aplicarBajas(grupo, fraccion) {
  let muertos = 0;
  for (const u in grupo) {
    const m = Math.min(grupo[u], redondeoAzar(grupo[u] * fraccion));
    grupo[u] -= m;
    muertos += m;
  }
  return muertos;
}

// El jugador ataca una zona de otro pueblo. envio = { lanceros: 3, ... }
// Si es la capital y gana, el pueblo entero se rinde y todo su territorio pasa a ser de Roma.
function atacarZona(x, y, envio) {
  if (!puedeAtacarZona(x, y).ok) return null;
  const id = duenoDe(x, y);
  const e = estado.enemigos[id];
  const datos = ENEMIGOS[id];
  const capital = esCapital(x, y) === id;
  const otraCiudad = !capital && ciudadEnemigaEn(x, y);
  const costo = costoZona(x, y);
  const grupo = {};
  let total = 0;
  for (const u in UNIDADES) {
    grupo[u] = Math.max(0, Math.min(listos(u), Math.floor(envio[u] || 0)));
    total += grupo[u];
  }
  if (total === 0) return null;
  // Por mar: hacen falta barcos para todos los que van
  const naves = porMar(x, y) ? Math.ceil(total / BARCOS.lleva) : 0;
  if (naves > barcosListos()) return null;
  estado.barcosUsados = (estado.barcosUsados || 0) + naves;

  for (const u in grupo) estado.ejercito[u] -= grupo[u];
  const r = choque(poderAtaque(grupo, x, y), defensaZona(x, y, grupo.catapulta));
  // Si es en la costa, van todos los barcos de guerra listos (después descansan hasta el año que viene)
  const deGuerra = costera(x, y) ? flotaLista() : 0;
  estado.flotaUsada = (estado.flotaUsada || 0) + deGuerra;
  const enviados = total;
  const lugar = capital ? datos.ciudad : otraCiudad ? otraCiudad.nombre : `una zona de los ${datos.nombre.toLowerCase()}`;
  let muertos;

  if (r.ganaA) pagar(costo);
  if (r.ganaA && capital) {
    muertos = aplicarBajas(grupo, r.perdidaGanador);
    e.vivo = false;
    e.guerra = false;
    e.marcha = null;
    const zonas = zonasDe(id);
    const mapas = heredarMapas(id);
    estado.duenos = estado.duenos.map((d) => (d === id ? "roma" : d));
    revelarTerritorio();
    sumarCiudadesDelPueblo(id);
    for (const rec in datos.botin) estado.rec[rec] += datos.botin[rec];
    anotar(`🏆 ¡Conquistaste ${datos.ciudad}! Los ${datos.nombre.toLowerCase()} se rinden y sus ${zonas} zonas pasan a ser de Roma. Botín: ${textoRecursos(datos.botin)}. Ahora te pagan tributo y podés construir en ${datos.ciudad}.${mapas}${cambiarApoyo(APOYO.sucesos.conquista)}${cambiarFama(FAMA.sucesos.conquista)}`, "bien");
  } else if (r.ganaA && otraCiudad) {
    // Otra ciudad del pueblo: te quedás con ella y con las zonas suyas que la rodean
    muertos = aplicarBajas(grupo, r.perdidaGanador);
    const antes = masDeLaMitad(id);
    estado.duenos[y * MAPA_ANCHO + x] = "roma";
    let alrededor = 0;
    for (const c of vecinas(x, y)) {
      if (duenoDe(c.x, c.y) !== id || esCapital(c.x, c.y) || ciudadPuebloEn(c.x, c.y)) continue;
      estado.duenos[c.y * MAPA_ANCHO + c.x] = "roma";
      alrededor++;
    }
    revelar(x, y, 2);
    e.fuerza = Math.max(1, e.fuerza * (1 - CIUDADES_PUEBLO.perdida));
    const botin = {};
    for (const rec in datos.botin) botin[rec] = Math.round(datos.botin[rec] * CIUDADES_PUEBLO.botin);
    for (const rec in botin) estado.rec[rec] += botin[rec];
    sumarCiudadConquistada(id, estado, otraCiudad.k);
    let texto = `🏰 ¡Tomaste ${lugar}! La ciudad${alrededor ? ` y ${alrededor} zona${alrededor > 1 ? "s" : ""} de alrededor pasan` : " pasa"} a ser de Roma y ya podés construir en ella. Botín: ${textoRecursos(botin)}.`;
    texto += ` Ya le tomaste ${ciudadesTomadas(id)} de sus ${totalCiudades(id)} ciudades a ${pueblo(id)}.`;
    if (esPuertaRuta(x, y)) texto += ` 🐫 ¡Ahora controlás el comienzo de la ${RUTAS_COMERCIALES.nombre}! Las caravanas te dejan +${RUTAS_COMERCIALES.oro} 💰 por año.`;
    if (!antes && masDeLaMitad(id)) texto += ` ¡Más de la mitad! Ahora firmar la paz te cuesta solo ${PAZ.costoGanando} ⚖️ (en vez de ${PAZ.costo}).`;
    anotar(texto + cambiarApoyo(APOYO.sucesos.ciudad) + cambiarFama(FAMA.sucesos.ciudad), "bien");
  } else if (r.ganaA) {
    muertos = aplicarBajas(grupo, r.perdidaGanador);
    estado.duenos[y * MAPA_ANCHO + x] = "roma";
    revelar(x, y, 1);
    e.fuerza = Math.max(1, e.fuerza * (1 - MAPA.perdidaZona));
    const botin = {};
    for (const rec in datos.botin) botin[rec] = Math.round(datos.botin[rec] * MAPA.botinZona);
    for (const rec in botin) estado.rec[rec] += botin[rec];
    anotar(`🚩 ¡Ganaste ${lugar}! Ahora es territorio romano. Botín: ${textoRecursos(botin)}.${cambiarApoyo(APOYO.sucesos.zona)}${cambiarFama(FAMA.sucesos.zona)}`, "bien");
  } else {
    muertos = aplicarBajas(grupo, 0.75);
    e.fuerza = Math.max(1, e.fuerza * (1 - r.perdidaGanador * 0.8));
    // Los barcos de guerra cuidan a las trirremes, pero algunos se hunden
    const hundidos = Math.max(0, Math.min(naves, Math.ceil(naves * BARCOS.hundidos) - deGuerra * BARCOS_GUERRA.protege));
    if (hundidos) { estado.barcos -= hundidos; estado.barcosUsados -= hundidos; }
    const hundidasGuerra = Math.min(deGuerra, Math.floor(deGuerra * BARCOS_GUERRA.hundidos));
    if (hundidasGuerra) { estado.flota -= hundidasGuerra; estado.flotaUsada -= hundidasGuerra; }
    anotar(`💀 Derrota en ${lugar}. Volvieron ${enviados - muertos} de ${enviados} soldados.${hundidos ? ` Se hundieron ${hundidos} ${BARCOS.icono}.` : ""}${hundidasGuerra ? ` Se hundieron ${hundidasGuerra} ${BARCOS_GUERRA.icono}.` : ""}${cambiarApoyo(APOYO.sucesos.derrota)}${cambiarFama(FAMA.sucesos.derrota)}`, "mal");
  }
  // Los que vuelven quedan cansados hasta el año siguiente; los que se quedaron en casa pueden seguir atacando
  estado.cansadas = estado.cansadas || {};
  for (const u in grupo) {
    estado.ejercito[u] += grupo[u];
    estado.cansadas[u] = (estado.cansadas[u] || 0) + grupo[u];
  }
  revisarFin();
  return { gano: r.ganaA, enviados, muertos, naves };
}

const textoRecursos = (rec) => Object.entries(rec).map(([r, v]) => `${v} ${RECURSOS[r].icono}`).join(", ");

// ---------- Ataques de los enemigos ----------

// A dónde marcha un pueblo: { ciudad: 0 } = Roma, { ciudad: 2 } = la 2ª ciudad fundada,
// { x, y } = una zona tuya pegada a su territorio (para recuperarla).
function elegirObjetivo(id) {
  const datos = ENEMIGOS[id];
  const A = ATAQUES_ENEMIGOS;
  // Zonas tuyas (sin ciudad) pegadas a su territorio
  const zonas = [];
  estado.duenos.forEach((d, i) => {
    if (d !== "roma") return;
    const x = i % MAPA_ANCHO, y = Math.floor(i / MAPA_ANCHO);
    if (lugarEn(x, y) === "roma" || coloniaEn(x, y)) return;
    if (vecinas(x, y).some((c) => duenoDe(c.x, c.y) === id)) zonas.push({ x, y });
  });
  if (zonas.length && Math.random() < A.probZona) return zonas[Math.floor(Math.random() * zonas.length)];
  // Ciudades: casi siempre la más cercana a su capital; a veces cualquiera
  const ciudades = [{ ciudad: 0, ...MAPA.roma }, ...estado.colonias.map((c, i) => ({ ciudad: i + 1, x: c.x, y: c.y }))];
  ciudades.sort((a, b) => distancia(a.x, a.y, datos.x, datos.y) - distancia(b.x, b.y, datos.x, datos.y));
  const elegida = Math.random() < A.probCercana ? ciudades[0] : ciudades[Math.floor(Math.random() * ciudades.length)];
  return { ciudad: elegida.ciudad };
}

// Nombre del lugar al que marchan ("Roma", "Ostia", "una zona de tu territorio")
function nombreObjetivo(marcha) {
  const o = marcha.objetivo;
  if (!o || o.ciudad === 0) return "Roma";
  if (o.ciudad) return lotesDe(o.ciudad) ? nombreCiudad(o.ciudad) : "Roma";
  return "una zona de tu territorio";
}

// Fuerza con la que defendés el lugar al que marchan
function defensaObjetivo(marcha) {
  const o = marcha.objetivo;
  if (o && o.ciudad === undefined) return poderDefensaZona(o.x, o.y);
  return poderDefensa(o && lotesDe(o.ciudad) ? o.ciudad : 0);
}

// Un ejército enemigo llega a su objetivo
function defenderse(id) {
  const o = estado.enemigos[id].marcha.objetivo;
  if (o && o.ciudad === undefined) return defenderZona(id, o.x, o.y);
  if (o && o.ciudad && lotesDe(o.ciudad)) return defenderColonia(id, o.ciudad);
  return defenderRoma(id);
}

// ---------- Guerras entre los otros pueblos ----------

// Para cada pueblo vivo, las zonas de cada vecino que tocan su territorio: fronteras[a][b] = [índices de casillas de b]
function fronterasPueblos() {
  const f = {};
  estado.duenos.forEach((b, i) => {
    if (!b || b === "roma" || !estado.enemigos[b] || !estado.enemigos[b].vivo || ENEMIGOS[b].independiente) return;
    const x = i % MAPA_ANCHO, y = Math.floor(i / MAPA_ANCHO);
    if (lugarEn(x, y) === b || ciudadPuebloEn(x, y)) return;   // las ciudades no se pueden tomar
    for (const c of vecinas(x, y)) {
      const a = duenoDe(c.x, c.y);
      if (!a || a === "roma" || a === b || !estado.enemigos[a] || !estado.enemigos[a].vivo || ENEMIGOS[a].independiente) continue;
      f[a] = f[a] || {};
      f[a][b] = f[a][b] || [];
      if (!f[a][b].includes(i)) f[a][b].push(i);
    }
  });
  return f;
}

// Cada año, algunos pueblos invaden a un vecino y le sacan zonas
function guerrasEntrePueblos() {
  const G = GUERRAS_PUEBLOS;
  const fronteras = fronterasPueblos();
  const yaPelearon = new Set();
  for (const a in fronteras) {
    const ea = estado.enemigos[a];
    if (yaPelearon.has(a) || ea.marcha || Math.random() >= G.prob) continue;
    // Elige a quién invadir: casi siempre al vecino más débil
    const vecinos = Object.keys(fronteras[a]).filter((b) => !yaPelearon.has(b));
    if (!vecinos.length) continue;
    vecinos.sort((p, q) => estado.enemigos[p].fuerza - estado.enemigos[q].fuerza);
    const b = Math.random() < 0.7 ? vecinos[0] : vecinos[Math.floor(Math.random() * vecinos.length)];
    const eb = estado.enemigos[b];
    yaPelearon.add(a); yaPelearon.add(b);

    const enCasaB = eb.fuerza - (eb.marcha ? eb.marcha.fuerza : 0);
    const r = choque(ea.fuerza * G.ejercito, Math.max(1, enCasaB) * G.defensa * (1 + G.bonusCasa));
    const ganador = r.ganaA ? a : b, perdedor = r.ganaA ? b : a;
    const eg = estado.enemigos[ganador], ep = estado.enemigos[perdedor];
    eg.fuerza = Math.max(1, eg.fuerza * (1 - G.perdidaGanador));
    ep.fuerza = Math.max(1, ep.fuerza * (1 - G.perdidaPerdedor));
    const conocidos = descubierto(a) || descubierto(b);
    const invadio = `⚔️ ${mayuscula(pueblo(a))} ${verbo(a, "invadieron", "invadió")} a ${pueblo(b)}`;
    if (!r.ganaA) {
      if (conocidos) anotar(`${invadio}, pero ${verbo(a, "perdieron", "perdió")} la batalla.`);
      continue;
    }
    // Ganó el que invadió: se queda con algunas zonas de la frontera
    const zonas = fronteras[a][b].sort(() => Math.random() - 0.5);
    const cuantas = Math.min(zonas.length, Math.floor(azar(G.zonas[0], G.zonas[1] + 1)));
    for (let k = 0; k < cuantas; k++) estado.duenos[zonas[k]] = a;
    ea.fuerza += cuantas * G.fuerzaPorZona;
    if (conocidos) anotar(`${invadio} y ${verbo(b, "les", "le")} ${verbo(a, "quitaron", "quitó")} ${cuantas} zona${cuantas > 1 ? "s" : ""}. Mirá el 🗺️ Mapa.`);
  }
}

// "los samnitas" / "la liga griega", y el verbo que corresponde
const pueblo = (id) => `${ENEMIGOS[id].singular ? "la" : "los"} ${ENEMIGOS[id].nombre.toLowerCase()}`;
const verbo = (id, plural, singular) => (ENEMIGOS[id].singular ? singular : plural);
const mayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// Atacan una zona tuya: si ganan, se la quedan y avanzan sobre alguna zona pegada
function defenderZona(id, x, y) {
  const e = estado.enemigos[id];
  const datos = ENEMIGOS[id];
  const atacantes = e.marcha.fuerza;
  e.marcha = null;
  if (!esMia(x, y)) return;   // la zona ya no es tuya: se vuelven
  const r = choque(poderDefensaZona(x, y), atacantes);
  if (r.ganaA) {
    const muertos = aplicarBajas(estado.ejercito, r.perdidaGanador * 0.5);
    e.fuerza = Math.max(1, e.fuerza - atacantes * 0.8);
    anotar(`🛡️ ¡Los ${datos.nombre.toLowerCase()} quisieron quitarte una zona y los echaste! Perdiste ${muertos} soldado(s).${cambiarApoyo(APOYO.sucesos.rechazo / 2)}${cambiarFama(FAMA.sucesos.rechazo)}`, "bien");
  } else {
    aplicarBajas(estado.ejercito, 0.2);
    e.fuerza = Math.max(1, e.fuerza - atacantes * 0.2);
    estado.duenos[y * MAPA_ANCHO + x] = id;
    // Avanzan: se quedan también con zonas tuyas pegadas (sin ciudad)
    let extra = 0;
    for (const c of vecinas(x, y).sort(() => Math.random() - 0.5)) {
      if (extra >= ATAQUES_ENEMIGOS.zonasExtra) break;
      if (!esMia(c.x, c.y) || lugarEn(c.x, c.y) === "roma" || coloniaEn(c.x, c.y)) continue;
      estado.duenos[c.y * MAPA_ANCHO + c.x] = id;
      extra++;
    }
    anotar(`🏳️ ¡Los ${datos.nombre.toLowerCase()} te conquistaron ${extra ? `${1 + extra} zonas` : "una zona"} de tu territorio!${cambiarApoyo(APOYO.sucesos.zonaPerdida)}${cambiarFama(FAMA.sucesos.zonaPerdida)}`, "mal");
  }
}

// Atacan una ciudad que fundaste: si ganan, la saquean
function defenderColonia(id, ciudad) {
  const e = estado.enemigos[id];
  const datos = ENEMIGOS[id];
  const nombre = nombreCiudad(ciudad);
  const atacantes = e.marcha.fuerza;
  e.marcha = null;
  const r = choque(poderDefensa(ciudad), atacantes);
  if (r.ganaA) {
    const muertos = aplicarBajas(estado.ejercito, r.perdidaGanador * 0.7);
    e.fuerza = Math.max(1, e.fuerza - atacantes * 0.8);
    anotar(`🛡️ ¡${nombre} rechazó a los ${datos.nombre.toLowerCase()}! Perdiste ${muertos} soldado(s).${cambiarApoyo(APOYO.sucesos.rechazo)}${cambiarFama(FAMA.sucesos.rechazo)}`, "bien");
    return;
  }
  aplicarBajas(estado.ejercito, 0.3);
  e.fuerza = Math.max(1, e.fuerza - atacantes * 0.3);
  for (const rec of ["comida", "madera", "piedra", "oro"]) estado.rec[rec] = Math.floor(estado.rec[rec] * 0.75);
  const perdidos = Math.min(estado.habitantes - 1, Math.ceil(estado.habitantes * 0.1));
  estado.habitantes -= perdidos;
  const lotes = lotesDe(ciudad);
  const edificios = lotes.map((l, i) => (l && !EDIFICIOS[l.tipo].fijo ? i : -1)).filter((i) => i >= 0);
  let quemado = "";
  if (edificios.length) {
    const i = edificios[Math.floor(Math.random() * edificios.length)];
    quemado = ` Incendiaron: ${EDIFICIOS[lotes[i].tipo].nombre}.`;
    lotes[i] = null;
  }
  anotar(`🔥 ¡Los ${datos.nombre.toLowerCase()} saquearon ${nombre}! Se llevaron un cuarto de tus recursos y murieron ${perdidos} habitantes.${quemado}${cambiarApoyo(APOYO.sucesos.saqueoColonia)}${cambiarFama(FAMA.sucesos.saqueoColonia)}`, "mal");
}

// Un pueblo enemigo llega a las puertas de Roma
function defenderRoma(id) {
  const e = estado.enemigos[id];
  const datos = ENEMIGOS[id];
  const atacantes = e.marcha.fuerza;
  const r = choque(poderDefensa(), atacantes);
  e.marcha = null;

  if (r.ganaA) {
    const muertos = aplicarBajas(estado.ejercito, r.perdidaGanador * 0.7);
    e.fuerza = Math.max(1, e.fuerza - atacantes * 0.8);
    anotar(`🛡️ ¡Rechazaste a los ${datos.nombre.toLowerCase()}! Perdiste ${muertos} soldado(s).${cambiarApoyo(APOYO.sucesos.rechazo)}${cambiarFama(FAMA.sucesos.rechazo)}`, "bien");
  } else if (r.b >= r.a * ATAQUES_ENEMIGOS.aplastante) {
    // Los arrasaron: toman Roma y se termina la partida
    estado.terminado = true;
    estado.resultado = "conquista";
    estado.conquistadoPor = id;
    anotar(`💀 ¡Los ${datos.nombre.toLowerCase()} arrasaron con tus defensas y tomaron Roma! Tu reinado terminó.`, "mal");
  } else {
    aplicarBajas(estado.ejercito, 0.5);
    e.fuerza = Math.max(1, e.fuerza - atacantes * 0.3);
    estado.saqueos++;
    for (const rec of ["comida", "madera", "piedra", "oro"]) estado.rec[rec] = Math.floor(estado.rec[rec] / 2);
    const perdidos = Math.ceil(estado.habitantes * 0.25);
    estado.habitantes -= perdidos;
    const edificios = estado.lotes.map((l, i) => (l && !EDIFICIOS[l.tipo].fijo ? i : -1)).filter((i) => i >= 0);
    let quemado = "";
    if (edificios.length) {
      const i = edificios[Math.floor(Math.random() * edificios.length)];
      quemado = ` Incendiaron: ${EDIFICIOS[estado.lotes[i].tipo].nombre}.`;
      estado.lotes[i] = null;
    }
    anotar(`🔥 ¡Los ${datos.nombre.toLowerCase()} saquearon Roma! Te robaron la mitad de todo y murieron ${perdidos} habitantes.${quemado} El pueblo pierde la confianza en vos${cambiarApoyo(APOYO.sucesos.saqueo)}.${cambiarFama(FAMA.sucesos.saqueo)}`, "mal");
  }
}


// ---------- Inmigración ----------

const lugarLibre = () => capacidad() - estado.habitantes - soldados();

function puedeInmigracion() {
  if (estado.inmigroEsteTurno) return { ok: false, motivo: "Ya lo hiciste este año." };
  if (lugarLibre() <= 0) return { ok: false, motivo: "No hay lugar: construí casas." };
  if (!alcanza(INMIGRACION.costo)) return { ok: false, motivo: "No te alcanza el oro." };
  return { ok: true };
}

function incitarInmigracion() {
  if (!puedeInmigracion().ok) return false;
  pagar(INMIGRACION.costo);
  const llegan = Math.min(INMIGRACION.habitantes, lugarLibre());
  estado.habitantes += llegan;
  estado.inmigroEsteTurno = true;
  anotar(`📣 Tus pregoneros prometen tierras y trabajo: llegan ${llegan} habitante(s) nuevos a Roma.`, "bien");
  return true;
}

// ---------- Fin de año ----------

function terminarTurno() {
  if (estado.terminado) return;
  const b = balance();

  // 1) Producción
  for (const r in b) estado.rec[r] += b[r];
  avanzarMeta();

  // 2) Hambre
  if (estado.rec.comida < 0) {
    estado.rec.comida = 0;
    const enojo = cambiarApoyo(APOYO.sucesos.hambre);
    if (soldados() > 0) {
      const tipos = Object.keys(estado.ejercito).filter((u) => estado.ejercito[u] > 0);
      estado.ejercito[tipos[0]]--;
      anotar(`🍂 ¡No hay comida! Un soldado deserta.${enojo}`, "mal");
    } else if (estado.habitantes > 1) {
      estado.habitantes--;
      anotar(`🍂 ¡No hay comida! Un habitante se va de Roma.${enojo}`, "mal");
    } else {
      anotar(`🍂 ¡No hay comida! El pueblo pasa hambre.${enojo}`, "mal");
    }
  } else if (b.comida >= 0) {
    // 3) Crecimiento: si hay comida y lugar, llega gente
    const lugar = capacidad() - estado.habitantes - soldados();
    const llegan = Math.min(lugar, 1 + Math.floor(cuenta("casa") / 2) + efecto("crecimiento") + Math.floor(fama() / FAMA.habitantesCada));
    if (llegan > 0) estado.habitantes += llegan;
  }

  // 4) Obras (las que le gustan al pueblo suben el apoyo al terminarse)
  for (const l of todosLotes()) {
    if (l && l.falta > 0) {
      l.falta--;
      if (l.falta === 0) anotar(`✅ Terminó la obra: ${EDIFICIOS[l.tipo].nombre}.${cambiarApoyo(APOYO.edificios[l.tipo])}${cambiarFama(FAMA.edificios[l.tipo])}`, "bien");
    }
  }

  // 4b) Con el tiempo el apoyo vuelve de a poco a su nivel normal
  const base = apoyoBase();
  if (apoyo() < base) estado.apoyo = Math.min(base, apoyo() + APOYO.vuelve);
  else if (apoyo() > base) estado.apoyo = Math.max(base, apoyo() - APOYO.vuelve);

  // 5) Enemigos: crecen, marchan y atacan
  estado.turno++;
  volverExploradores();
  buscarMapas();
  for (const id in estado.enemigos) {
    const e = estado.enemigos[id];
    if (!e.vivo) continue;
    const datos = ENEMIGOS[id];
    e.fuerza += datos.crece;
    if (e.marcha && estado.turno >= e.marcha.llega) {
      defenderse(id);
      if (estado.terminado) break;
      e.cada = Math.max(5, e.cada - 1);
      e.proximo = estado.turno + e.cada + Math.floor(azar(-1, 2));
    } else if (!e.marcha && e.proximo && estado.turno >= e.proximo - 2 && !enTregua(id)) {
      if (!e.guerra) anotar(`⚔️ ¡Los ${datos.nombre.toLowerCase()} le declaran la guerra a Roma!`, "mal");
      e.guerra = true;
      e.marcha = { fuerza: Math.round(e.fuerza * 0.6), llega: e.proximo, objetivo: elegirObjetivo(id) };
      anotar(`⚠️ ¡Los ${datos.nombre.toLowerCase()} marchan hacia ${nombreObjetivo(e.marcha)}! Llegan en ${e.proximo - estado.turno} años con unos ${estimar(e.marcha.fuerza)} de fuerza.`, "mal");
      if (!vista(datos.x, datos.y)) {
        revelar(datos.x, datos.y, 1);
        anotar(`👀 Tus vigías siguen las huellas y descubren de dónde vienen: ${datos.ciudad}. Ya aparece en el mapa.`);
      }
    }
  }
  if (!estado.terminado) guerrasEntrePueblos();
  alianzasPorFama();
  estado.cansadas = {};
  estado.barcosUsados = 0;
  estado.flotaUsada = 0;
  estado.inmigroEsteTurno = false;
  if (revisarFin()) return;

  anotar(`— Año ${estado.turno} de tu reinado —`, "turno");
  if (apoyo() <= APOYO.aviso)
    anotar(`😡 ¡El pueblo está furioso! Si el apoyo baja a ${APOYO.derrocado}, se rebelan y te echan del trono.`, "mal");

  // 6) Evento al azar
  if (estado.turno > 2 && Math.random() < 0.25) {
    const ev = EVENTOS_CIUDAD[Math.floor(Math.random() * EVENTOS_CIUDAD.length)];
    if (ev.efecto) for (const r in ev.efecto) estado.rec[r] = Math.max(0, estado.rec[r] + ev.efecto[r]);
    if (ev.habitantes) {
      const lugar = capacidad() - estado.habitantes - soldados();
      estado.habitantes = Math.max(1, estado.habitantes + Math.min(ev.habitantes, lugar));
    }
    const bueno = ev.habitantes ? ev.habitantes > 0 : Object.values(ev.efecto)[0] > 0;
    anotar("📜 " + ev.texto, bueno ? "bien" : "mal");
  }
}

// ---------- Fin de partida ----------

function revisarFin() {
  if (estado.terminado) return true;
  if (estado.resultado === "conquista") { estado.terminado = true; return true; }
  if (estado.rebelion || apoyo() <= APOYO.derrocado) {
    estado.terminado = true;
    estado.resultado = "descontento";
    anotar(`🔥 ¡Revuelta en Roma! El pueblo, harto de tu gobierno, asalta el palacio y te echa del trono.`, "mal");
    return true;
  }
  // Se gana al conquistar a todos los pueblos del Mediterráneo (los lejanos y las ciudades independientes no hacen falta).
  // Si ya ganaste y elegiste seguir jugando (estado.gano = año de la victoria), no se vuelve a avisar.
  if (!estado.gano && Object.keys(ENEMIGOS).every((id) => ENEMIGOS[id].lejano || ENEMIGOS[id].independiente || !estado.enemigos[id].vivo)) {
    estado.terminado = true;
    estado.resultado = "victoria";
    return true;
  }
  return false;
}
