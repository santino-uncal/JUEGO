// Imperium – conexión entre amigos (modo TEG online)
// Usa PeerJS: los navegadores se conectan directo entre sí. El servidor público
// de PeerJS solo sirve para que se encuentren usando el código de la sala.
// El que crea la sala ("anfitrión") tiene la partida y les manda a todos cómo va.

const Red = {
  PREFIJO: "imperium-teg-",
  LETRAS: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", // sin O/0 ni I/1 para no confundirse
  peer: null,
  conexiones: {},   // anfitrión: id del invitado -> conexión
  conexion: null,   // invitado: conexión con el anfitrión
  ultimaSenal: {},  // id -> hora del último mensaje recibido
  LATIDO: 3000,     // cada cuánto se avisa "sigo acá"
  SILENCIO: 12000,  // si alguien no da señales en este tiempo, se lo da por desconectado

  codigoNuevo() {
    let c = "";
    for (let i = 0; i < 5; i++) c += this.LETRAS[Math.floor(Math.random() * this.LETRAS.length)];
    return c;
  },

  miId() { return this.peer ? this.peer.id : null; },

  // Crea la sala. Si el código está ocupado (o recién se liberó) prueba de nuevo.
  crearSala(codigo, { alListo, alEntrar, alMensaje, alSalir, alError }, intentos = 6) {
    const peer = new Peer(this.PREFIJO + codigo, { debug: 1 });
    this.peer = peer;
    peer.on("open", () => alListo(codigo));
    const salio = (id) => {
      if (!this.conexiones[id]) return;
      const c = this.conexiones[id];
      delete this.conexiones[id];
      delete this.ultimaSenal[id];
      c.close();
      alSalir(id);
    };
    peer.on("connection", (conn) => {
      conn.on("open", () => {
        this.conexiones[conn.peer] = conn;
        this.ultimaSenal[conn.peer] = Date.now();
        alEntrar(conn.peer);
      });
      conn.on("data", (msg) => {
        this.ultimaSenal[conn.peer] = Date.now();
        if (msg && msg.tipo === "latido") return;
        alMensaje(conn.peer, msg);
      });
      conn.on("close", () => salio(conn.peer));
      conn.on("error", () => {});
    });
    // Latido: le aviso a cada invitado que sigo acá y reviso quién dejó de responder
    clearInterval(this._latido);
    this._latido = setInterval(() => {
      this.aTodos({ tipo: "latido" });
      for (const id in this.conexiones) if (Date.now() - this.ultimaSenal[id] > this.SILENCIO) salio(id);
    }, this.LATIDO);
    peer.on("disconnected", () => { if (!peer.destroyed) peer.reconnect(); });
    peer.on("error", (e) => {
      if (e.type === "unavailable-id" && intentos > 0) {
        peer.destroy();
        setTimeout(() => this.crearSala(codigo, { alListo, alEntrar, alMensaje, alSalir, alError }, intentos - 1), 2500);
      } else if (e.type !== "peer-unavailable") {
        alError(textoError(e));
      }
    });
  },

  unirse(codigo, { alAbrir, alMensaje, alCerrar, alError }) {
    const peer = new Peer({ debug: 1 });
    this.peer = peer;
    let abierta = false;
    peer.on("open", () => {
      const conn = peer.connect(this.PREFIJO + codigo, { reliable: true, serialization: "json" });
      this.conexion = conn;
      let ultima = Date.now();
      const cortar = () => {
        if (!abierta) return;
        abierta = false;
        clearInterval(this._latido);
        alCerrar();
      };
      conn.on("open", () => {
        abierta = true;
        alAbrir();
        clearInterval(this._latido);
        this._latido = setInterval(() => {
          this.alAnfitrion({ tipo: "latido" });
          if (Date.now() - ultima > this.SILENCIO) cortar();
        }, this.LATIDO);
      });
      conn.on("data", (msg) => {
        ultima = Date.now();
        if (msg && msg.tipo !== "latido") alMensaje(msg);
      });
      conn.on("close", cortar);
    });
    peer.on("error", (e) => {
      if (e.type === "peer-unavailable") alError("No existe ninguna sala con el código " + codigo + ". Revisá que esté bien escrito y que el anfitrión tenga la página abierta.");
      else if (abierta) { abierta = false; clearInterval(this._latido); alCerrar(); }
      else alError(textoError(e));
    });
  },

  // Anfitrión → un invitado
  enviar(id, msg) {
    const c = this.conexiones[id];
    if (c && c.open) c.send(msg);
  },
  // Anfitrión → todos
  aTodos(msg) { for (const id in this.conexiones) this.enviar(id, msg); },
  // Invitado → anfitrión
  alAnfitrion(msg) { if (this.conexion && this.conexion.open) this.conexion.send(msg); },

  echar(id) { const c = this.conexiones[id]; if (c) setTimeout(() => c.close(), 300); },
};

function textoError(e) {
  if (e.type === "network" || e.type === "server-error" || e.type === "socket-error")
    return "No se pudo conectar. Revisá tu internet y probá de nuevo.";
  if (e.type === "browser-incompatible") return "Este navegador no permite jugar online. Probá con Chrome.";
  if (e.type === "unavailable-id") return "Ese código de sala está ocupado. Probá de nuevo en unos segundos.";
  return "Hubo un problema con la conexión (" + e.type + ").";
}
