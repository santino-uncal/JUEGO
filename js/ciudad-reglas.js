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
  for (const id in ENEMIGOS) {
    const e = ENEMIGOS[id];
    enemigos[id] = { vivo: true, fuerza: e.fuerza, proximo: e.primerAtaque, cada: e.cada, marcha: null };
  }
  const nueva = {
    turno: 1,
    rec: { ...INICIO.recursos },
    habitantes: INICIO.habitantes,
    lotes, techs: {}, ejercito, enemigos,
    colonias: [],
    saqueos: 0, atacoEsteTurno: false, periodo: 0, apoyo: APOYO.inicio,
    log: [], terminado: false, resultado: null,
  };
  prepararMapa(nueva);
  return nueva;
}

// Agrega el mapa a una partida (también sirve para partidas guardadas de antes del mapa)
function prepararMapa(partida) {
  if (partida.visto && partida.exploradores) return;
  partida.visto = Array(MAPA_ANCHO * MAPA_ALTO).fill(false);
  partida.exploradores = [];
  revelar(MAPA.roma.x, MAPA.roma.y, 1, partida);
}

// ---------- Mapa ----------

const MAPA_ANCHO = MAPA.filas[0].length;
const MAPA_ALTO = MAPA.filas.length;
const terreno = (x, y) => MAPA.filas[y][x];
const distancia = (x1, y1, x2, y2) => Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
const dentro = (x, y) => x >= 0 && y >= 0 && x < MAPA_ANCHO && y < MAPA_ALTO;
const vista = (x, y) => dentro(x, y) && estado.visto[y * MAPA_ANCHO + x];
const descubierto = (id) => vista(ENEMIGOS[id].x, ENEMIGOS[id].y);

function revelar(x, y, radio, partida = estado) {
  for (let dy = -radio; dy <= radio; dy++)
    for (let dx = -radio; dx <= radio; dx++)
      if (dentro(x + dx, y + dy)) partida.visto[(y + dy) * MAPA_ANCHO + x + dx] = true;
}

// Qué hay en una casilla: Roma, un pueblo vecino o nada
function lugarEn(x, y) {
  if (x === MAPA.roma.x && y === MAPA.roma.y) return "roma";
  for (const id in ENEMIGOS) if (ENEMIGOS[id].x === x && ENEMIGOS[id].y === y) return id;
  return null;
}

const turnosViaje = (x, y) => Math.max(1, Math.ceil(distancia(x, y, MAPA.roma.x, MAPA.roma.y) / 2));

function puedeExplorar(x, y) {
  if (vista(x, y)) return { ok: false, motivo: "Esta zona ya la conocés." };
  if (estado.exploradores.some((e) => e.x === x && e.y === y)) return { ok: false, motivo: "Ya hay un explorador yendo para allá." };
  let pegada = false;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (vista(x + dx, y + dy)) pegada = true;
  if (!pegada) return { ok: false, motivo: "Queda muy lejos: primero explorá las zonas de al lado." };
  if (libres() < 1) return { ok: false, motivo: "Necesitás un habitante libre para mandar de explorador." };
  return { ok: true };
}

function explorar(x, y) {
  if (!puedeExplorar(x, y).ok) return false;
  const t = turnosViaje(x, y);
  estado.exploradores.push({ x, y, vuelve: estado.turno + t });
  anotar(`🧭 Un explorador sale de Roma hacia lo desconocido. Vuelve en ${t} turno${t > 1 ? "s" : ""}.`);
  return true;
}

// Los exploradores que terminaron su viaje vuelven y cuentan lo que vieron
function volverExploradores() {
  const quedan = [];
  for (const ex of estado.exploradores) {
    if (estado.turno < ex.vuelve) { quedan.push(ex); continue; }
    const antes = Object.keys(ENEMIGOS).filter(descubierto);
    revelar(ex.x, ex.y, 1);
    let texto = "🧭 Vuelve un explorador y dibuja una parte nueva del mapa.";
    for (const id in ENEMIGOS) {
      if (descubierto(id) && !antes.includes(id)) {
        texto += ` ¡Descubrió a los ${ENEMIGOS[id].nombre.toLowerCase()} en ${ENEMIGOS[id].ciudad}!`;
      }
    }
    if (Math.random() < EXPLORACION.probHallazgo) {
      const h = EXPLORACION.hallazgos[Math.floor(Math.random() * EXPLORACION.hallazgos.length)];
      for (const r in h.efecto) estado.rec[r] += h.efecto[r];
      const premio = Object.entries(h.efecto).map(([r, v]) => `+${v} ${RECURSOS[r].icono}`).join(" ");
      texto += ` Además ${h.texto}: ${premio}.`;
    }
    anotar(texto, "bien");
  }
  estado.exploradores = quedan;
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

function capacidad() {
  let c = 0;
  for (const l of todosLotes()) if (l && l.falta === 0) c += (EDIFICIOS[l.tipo].capacidad || 0) + capacidadExtra(l.tipo);
  return c;
}

// Habitantes que necesitan todos los edificios (también los que están en obra)
function trabajosOcupados() {
  let n = 0;
  for (const l of todosLotes()) if (l) n += EDIFICIOS[l.tipo].trabajadores || 0;
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
  const real = estado.apoyo - antes;
  return real ? ` (${real > 0 ? "+" : ""}${real} 😊 apoyo)` : "";
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
  if (faltan > 0) return { ok: false, motivo: `Podés repetirla en ${faltan} turno${faltan > 1 ? "s" : ""}.` };
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

// Devuelve lo que entra y sale por turno, recurso por recurso
function balance() {
  const b = { comida: 0, madera: 0, piedra: 0, oro: 0, ciencia: 0 };
  const efi = eficiencia() * productividad();
  for (const l of todosLotes()) {
    if (!l || l.falta > 0) continue;
    const ed = EDIFICIOS[l.tipo];
    const factor = ed.trabajadores ? efi : productividad();
    for (const r in b) {
      const valor = ((ed.produce && ed.produce[r]) || 0) + mejoraEdificio(l.tipo, r);
      b[r] += valor * factor;
    }
  }
  // Impuestos: cada 3 habitantes pagan 1 de oro
  b.oro += Math.floor(estado.habitantes / 3) * (1 + efecto("impuestos")) * productividad();
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
  if ((ed.trabajadores || 0) > libres()) return { ok: false, motivo: `Necesita ${ed.trabajadores} habitantes libres (tenés ${libres()}).` };
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
  anotar(`🚧 Empieza la obra en ${nombreCiudad(ciudad)}: ${ed.nombre} (${ed.turnos} turno${ed.turnos > 1 ? "s" : ""}).`);
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

// Cada ciudad nueva cuesta más que la anterior
function costoFundar() {
  const n = (estado.colonias || []).length;
  const c = {};
  for (const r in FUNDACION.costo) c[r] = Math.round(FUNDACION.costo[r] * (1 + FUNDACION.aumento * n));
  return c;
}

function puedeFundar(x, y) {
  if (!vista(x, y)) return { ok: false, motivo: "Primero explorá esta zona." };
  if (FUNDACION.prohibidos.includes(terreno(x, y))) return { ok: false, motivo: `No se puede fundar una ciudad en ${MAPA.terrenos[terreno(x, y)].nombre.toLowerCase()}.` };
  if (estado.colonias.length >= FUNDACION.nombres.length) return { ok: false, motivo: "Ya fundaste todas las ciudades posibles." };
  const otras = [MAPA.roma, ...Object.values(ENEMIGOS), ...estado.colonias];
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
  const nombre = FUNDACION.nombres[estado.colonias.length];
  const lotes = Array(FUNDACION.lotes).fill(null);
  lotes[FUNDACION.lotePlaza] = { tipo: "plaza", falta: 0 };
  estado.colonias.push({ nombre, x, y, lotes });
  revelar(x, y, 1);
  anotar(`🏘️ ¡${FUNDACION.colonos} familias romanas fundan ${nombre}! Ya podés construir en sus terrenos.`, "bien");
  return estado.colonias.length;
}

// ---------- Niveles de las ciudades ----------

// Con cuántos terrenos empieza una ciudad, su nivel (1, 2...) y hasta qué nivel puede llegar.
// El nivel sale de cuántos terrenos tiene: así las partidas guardadas de antes andan solas.
const lotesIniciales = (i) => (i === 0 ? INICIO.lotes : FUNDACION.lotes);
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
    const n = Object.keys(TECNOLOGIAS).filter((id) => tiene(id) && periodoTec(id) === periodoActual()).length;
    lista.push({ texto: `${r.tecnologias} tecnologías de ${articulo(periodoActual())} ${PERIODOS[periodoActual()].nombre} (tenés ${n})`, ok: n >= r.tecnologias });
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
  anotar(`${sig.icono} ¡Comienza ${articulo(estado.periodo)} ${sig.nombre}! ${sig.desc} Ahora sos ${sig.titulo}.`, "bien");
  avanzarMeta();
  return true;
}

// ---------- Ejército ----------

function puedeEntrenar(tipo, n = 1) {
  const u = UNIDADES[tipo];
  if (u.requiere && !tiene(u.requiere)) return { ok: false, motivo: `Necesitás ${TECNOLOGIAS[u.requiere].nombre}.` };
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

// Solo cuenta la muralla de Roma (es la ciudad que atacan los enemigos)
function bonusMuralla() {
  if (!estado.lotes.some((l) => l && l.tipo === "muralla" && l.falta === 0)) return 0;
  return 0.5 + efecto("muralla");
}

// Fuerza para defender Roma: soldados + los habitantes que agarran palos
function poderDefensa() {
  let p = 0;
  for (const u in estado.ejercito) p += estado.ejercito[u] * UNIDADES[u].defensa;
  p = p * bonusDefensa() + 2 + estado.habitantes * 0.3;
  return p * (1 + bonusMuralla());
}

function poderAtaque(envio) {
  let p = 0;
  for (const u in envio) p += (envio[u] || 0) * UNIDADES[u].ataque;
  return p * bonusAtaque();
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

// El jugador ataca a un pueblo vecino. envio = { lanceros: 3, ... }
function atacarEnemigo(id, envio) {
  const e = estado.enemigos[id];
  const datos = ENEMIGOS[id];
  if (!e.vivo || estado.atacoEsteTurno || !descubierto(id)) return null;
  const grupo = {};
  let total = 0;
  for (const u in UNIDADES) {
    grupo[u] = Math.max(0, Math.min(estado.ejercito[u], Math.floor(envio[u] || 0)));
    total += grupo[u];
  }
  if (total === 0) return null;

  estado.atacoEsteTurno = true;
  for (const u in grupo) estado.ejercito[u] -= grupo[u];
  const r = choque(poderAtaque(grupo), defensaEnemiga(id, grupo.catapulta));
  const enviados = total;
  let muertos;

  if (r.ganaA) {
    muertos = aplicarBajas(grupo, r.perdidaGanador);
    e.vivo = false;
    e.marcha = null;
    for (const rec in datos.botin) estado.rec[rec] += datos.botin[rec];
    const botin = Object.entries(datos.botin).map(([rec, v]) => `${v} ${RECURSOS[rec].icono}`).join(", ");
    anotar(`🏆 ¡Conquistaste ${datos.ciudad}! Los ${datos.nombre.toLowerCase()} se rinden. Botín: ${botin}. Ahora te pagan tributo.${cambiarApoyo(APOYO.sucesos.conquista)}`, "bien");
  } else {
    muertos = aplicarBajas(grupo, 0.75);
    e.fuerza = Math.max(1, e.fuerza * (1 - r.perdidaGanador * 0.8));
    anotar(`💀 Derrota frente a ${datos.ciudad}. Volvieron ${enviados - muertos} de ${enviados} soldados.${cambiarApoyo(APOYO.sucesos.derrota)}`, "mal");
  }
  for (const u in grupo) estado.ejercito[u] += grupo[u];
  revisarFin();
  return { gano: r.ganaA, enviados, muertos };
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
    anotar(`🛡️ ¡Rechazaste a los ${datos.nombre.toLowerCase()}! Perdiste ${muertos} soldado(s).${cambiarApoyo(APOYO.sucesos.rechazo)}`, "bien");
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
    anotar(`🔥 ¡Los ${datos.nombre.toLowerCase()} saquearon Roma! Te robaron la mitad de todo y murieron ${perdidos} habitantes.${quemado} El pueblo pierde la confianza en vos${cambiarApoyo(APOYO.sucesos.saqueo)}.`, "mal");
  }
}


// ---------- Inmigración ----------

const lugarLibre = () => capacidad() - estado.habitantes - soldados();

function puedeInmigracion() {
  if (estado.inmigroEsteTurno) return { ok: false, motivo: "Ya lo hiciste este turno." };
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

// ---------- Fin de turno ----------

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
    const llegan = Math.min(lugar, 1 + Math.floor(cuenta("casa") / 2) + efecto("crecimiento"));
    if (llegan > 0) estado.habitantes += llegan;
  }

  // 4) Obras (las que le gustan al pueblo suben el apoyo al terminarse)
  for (const l of todosLotes()) {
    if (l && l.falta > 0) {
      l.falta--;
      if (l.falta === 0) anotar(`✅ Terminó la obra: ${EDIFICIOS[l.tipo].nombre}.${cambiarApoyo(APOYO.edificios[l.tipo])}`, "bien");
    }
  }

  // 4b) Con el tiempo el apoyo vuelve de a poco a su nivel normal
  const base = apoyoBase();
  if (apoyo() < base) estado.apoyo = Math.min(base, apoyo() + APOYO.vuelve);
  else if (apoyo() > base) estado.apoyo = Math.max(base, apoyo() - APOYO.vuelve);

  // 5) Enemigos: crecen, marchan y atacan
  estado.turno++;
  volverExploradores();
  for (const id in estado.enemigos) {
    const e = estado.enemigos[id];
    if (!e.vivo) continue;
    const datos = ENEMIGOS[id];
    e.fuerza += datos.crece;
    if (e.marcha && estado.turno >= e.marcha.llega) {
      defenderRoma(id);
      e.cada = Math.max(5, e.cada - 1);
      e.proximo = estado.turno + e.cada + Math.floor(azar(-1, 2));
    } else if (!e.marcha && estado.turno >= e.proximo - 2) {
      e.marcha = { fuerza: Math.round(e.fuerza * 0.6), llega: e.proximo };
      anotar(`⚠️ ¡Los ${datos.nombre.toLowerCase()} marchan hacia Roma! Llegan en ${e.proximo - estado.turno} turnos con unos ${estimar(e.marcha.fuerza)} de fuerza.`, "mal");
      if (!descubierto(id)) {
        revelar(datos.x, datos.y, 1);
        anotar(`👀 Tus vigías siguen las huellas y descubren de dónde vienen: ${datos.ciudad}. Ya aparece en el mapa.`);
      }
    }
  }
  estado.atacoEsteTurno = false;
  estado.inmigroEsteTurno = false;
  if (revisarFin()) return;

  anotar(`— Año ${estado.turno} de tu reinado —`, "turno");

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
  if (Object.values(estado.enemigos).every((e) => !e.vivo)) {
    estado.terminado = true;
    estado.resultado = "victoria";
    return true;
  }
  return false;
}
