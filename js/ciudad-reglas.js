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
  return {
    turno: 1,
    rec: { ...INICIO.recursos },
    habitantes: INICIO.habitantes,
    lotes, techs: {}, ejercito, enemigos,
    saqueos: 0, atacoEsteTurno: false,
    log: [], terminado: false, resultado: null,
  };
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
function cuenta(tipo, incluirObras = false) {
  return estado.lotes.filter((l) => l && l.tipo === tipo && (incluirObras || l.falta === 0)).length;
}

function soldados() {
  let n = 0;
  for (const u in estado.ejercito) n += estado.ejercito[u];
  return n;
}

function capacidad() {
  let c = 0;
  for (const l of estado.lotes) if (l && l.falta === 0) c += EDIFICIOS[l.tipo].capacidad || 0;
  return c;
}

// Habitantes que necesitan todos los edificios (también los que están en obra)
function trabajosOcupados() {
  let n = 0;
  for (const l of estado.lotes) if (l) n += EDIFICIOS[l.tipo].trabajadores || 0;
  return n;
}

const libres = () => Math.max(0, estado.habitantes - trabajosOcupados());

// Si falta gente, los edificios rinden menos
function eficiencia() {
  const t = trabajosOcupados();
  return t === 0 ? 1 : Math.min(1, estado.habitantes / t);
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

// ---------- Producción ----------

// Devuelve lo que entra y sale por turno, recurso por recurso
function balance() {
  const b = { comida: 0, madera: 0, piedra: 0, oro: 0, ciencia: 0 };
  const efi = eficiencia();
  for (const l of estado.lotes) {
    if (!l || l.falta > 0) continue;
    const ed = EDIFICIOS[l.tipo];
    if (!ed.produce) continue;
    const factor = ed.trabajadores ? efi : 1;
    for (const r in ed.produce) {
      let valor = ed.produce[r];
      if (l.tipo === "granja" && tiene("agricultura")) valor += 2;
      if (l.tipo === "biblioteca" && tiene("matematicas")) valor += 2;
      b[r] += valor * factor;
    }
  }
  // Impuestos: cada 3 habitantes pagan 1 de oro
  b.oro += Math.floor(estado.habitantes / 3) * (tiene("derecho") ? 1.5 : 1);
  // Tributos de pueblos conquistados
  for (const id in estado.enemigos) {
    if (estado.enemigos[id].vivo) continue;
    const t = ENEMIGOS[id].tributo;
    for (const r in t) b[r] += t[r];
  }
  // Lo que come la gente: medio por habitante, uno por soldado
  b.comida -= Math.ceil(estado.habitantes / 2) + soldados();
  for (const r in b) b[r] = Math.floor(b[r]);
  return b;
}

// ---------- Construir ----------

// Dice si se puede construir y, si no, por qué
function puedeConstruir(tipo) {
  const ed = EDIFICIOS[tipo];
  if (ed.fijo) return { ok: false, motivo: "No se puede construir." };
  if (ed.requiere && !tiene(ed.requiere)) return { ok: false, motivo: `Necesitás investigar ${TECNOLOGIAS[ed.requiere].nombre}.` };
  if (ed.unico && cuenta(tipo, true) > 0) return { ok: false, motivo: "Ya tenés uno." };
  if ((ed.trabajadores || 0) > libres()) return { ok: false, motivo: `Necesita ${ed.trabajadores} habitantes libres (tenés ${libres()}).` };
  if (!alcanza(ed.costo)) return { ok: false, motivo: "No te alcanzan los recursos." };
  return { ok: true };
}

function construir(lote, tipo) {
  if (estado.lotes[lote] || !puedeConstruir(tipo).ok) return false;
  const ed = EDIFICIOS[tipo];
  pagar(ed.costo);
  estado.lotes[lote] = { tipo, falta: ed.turnos };
  anotar(`🚧 Empieza la obra: ${ed.nombre} (${ed.turnos} turno${ed.turnos > 1 ? "s" : ""}).`);
  return true;
}

function demoler(lote) {
  const l = estado.lotes[lote];
  if (!l || EDIFICIOS[l.tipo].fijo) return false;
  estado.lotes[lote] = null;
  anotar(`Demolés: ${EDIFICIOS[l.tipo].nombre}.`);
  return true;
}

// ---------- Tecnologías ----------

function puedeInvestigar(id) {
  const t = TECNOLOGIAS[id];
  if (tiene(id)) return { ok: false, motivo: "Ya la tenés." };
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
  return true;
}

// ---------- Ejército ----------

function puedeEntrenar(tipo, n = 1) {
  const u = UNIDADES[tipo];
  if (u.requiere && !tiene(u.requiere)) return { ok: false, motivo: `Necesitás ${TECNOLOGIAS[u.requiere].nombre}.` };
  if (cuenta(u.edificio) === 0) return { ok: false, motivo: `Necesitás un ${EDIFICIOS[u.edificio].nombre} terminado.` };
  if (libres() < n) return { ok: false, motivo: "No hay habitantes libres para alistar." };
  if (!alcanza(multiplicar(u.costo, n))) return { ok: false, motivo: "No te alcanzan los recursos." };
  return { ok: true };
}

function entrenar(tipo, n = 1) {
  if (!puedeEntrenar(tipo, n).ok) return false;
  pagar(multiplicar(UNIDADES[tipo].costo, n));
  estado.habitantes -= n;            // el habitante pasa a ser soldado
  estado.ejercito[tipo] += n;
  anotar(`Entrenás ${n} ${UNIDADES[tipo].nombre.toLowerCase()}.`);
  return true;
}

const bonusEjercito = () => (tiene("disciplina") ? 1.25 : 1);

function bonusMuralla() {
  if (cuenta("muralla") === 0) return 0;
  return tiene("fortificacion") ? 1 : 0.5;
}

// Fuerza para defender Roma: soldados + los habitantes que agarran palos
function poderDefensa() {
  let p = 0;
  for (const u in estado.ejercito) p += estado.ejercito[u] * UNIDADES[u].defensa;
  p = p * bonusEjercito() + 2 + estado.habitantes * 0.3;
  return p * (1 + bonusMuralla());
}

function poderAtaque(envio) {
  let p = 0;
  for (const u in envio) p += (envio[u] || 0) * UNIDADES[u].ataque;
  return p * bonusEjercito();
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
  if (!e.vivo || estado.atacoEsteTurno) return null;
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
    anotar(`🏆 ¡Conquistaste ${datos.ciudad}! Los ${datos.nombre.toLowerCase()} se rinden. Botín: ${botin}. Ahora te pagan tributo.`, "bien");
  } else {
    muertos = aplicarBajas(grupo, 0.75);
    e.fuerza = Math.max(1, e.fuerza * (1 - r.perdidaGanador * 0.8));
    anotar(`💀 Derrota frente a ${datos.ciudad}. Volvieron ${enviados - muertos} de ${enviados} soldados.`, "mal");
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
    anotar(`🛡️ ¡Rechazaste a los ${datos.nombre.toLowerCase()}! Perdiste ${muertos} soldado(s).`, "bien");
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
    anotar(`🔥 ¡Los ${datos.nombre.toLowerCase()} saquearon Roma! Te robaron la mitad de todo y murieron ${perdidos} habitantes.${quemado} (Saqueos: ${estado.saqueos}/${MAX_SAQUEOS})`, "mal");
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

  // 2) Hambre
  if (estado.rec.comida < 0) {
    estado.rec.comida = 0;
    if (soldados() > 0) {
      const tipos = Object.keys(estado.ejercito).filter((u) => estado.ejercito[u] > 0);
      estado.ejercito[tipos[0]]--;
      anotar("🍂 ¡No hay comida! Un soldado deserta.", "mal");
    } else if (estado.habitantes > 1) {
      estado.habitantes--;
      anotar("🍂 ¡No hay comida! Un habitante se va de Roma.", "mal");
    }
  } else if (b.comida >= 0) {
    // 3) Crecimiento: si hay comida y lugar, llega gente
    const lugar = capacidad() - estado.habitantes - soldados();
    const llegan = Math.min(lugar, 1 + Math.floor(cuenta("casa") / 2));
    if (llegan > 0) estado.habitantes += llegan;
  }

  // 4) Obras
  for (const l of estado.lotes) {
    if (l && l.falta > 0) {
      l.falta--;
      if (l.falta === 0) anotar(`✅ Terminó la obra: ${EDIFICIOS[l.tipo].nombre}.`, "bien");
    }
  }

  // 5) Enemigos: crecen, marchan y atacan
  estado.turno++;
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
  if (estado.saqueos >= MAX_SAQUEOS) {
    estado.terminado = true;
    estado.resultado = "derrota";
    return true;
  }
  if (Object.values(estado.enemigos).every((e) => !e.vivo)) {
    estado.terminado = true;
    estado.resultado = "victoria";
    return true;
  }
  return false;
}
