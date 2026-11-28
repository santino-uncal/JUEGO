// Tutorial: un cartel abajo de la pantalla que va explicando paso a paso y marca con un
// borde dorado la parte de la que habla. Lo usan los dos modos de juego; cada uno tiene
// sus textos en data/ (tutorial-ciudad.js y tutorial-teg.js).
//
// abrirTutorial(pasos, { alPaso, alCerrar })
//   pasos:    lista de { titulo, texto, resaltar } (resaltar = selector CSS de lo que se marca)
//   alPaso:   se llama con cada paso antes de mostrarlo (para cambiar de vista, elegir algo, etc.)
//   alCerrar: se llama al terminar o saltear el tutorial
// (se carga antes que el código de cada juego, por eso acá no se usa $)

let tutorial = null;   // null = cerrado; si no, { pasos, i, alPaso, alCerrar }
const cajaTutorial = () => document.getElementById("tutorial");

function abrirTutorial(pasos, opciones = {}) {
  tutorial = { pasos, i: 0, ...opciones };
  mostrarPasoTutorial();
}

function cerrarTutorial() {
  if (!tutorial) return;
  const alCerrar = tutorial.alCerrar;
  tutorial = null;
  quitarResaltado();
  cajaTutorial().classList.add("oculto");
  if (alCerrar) alCerrar();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

const quitarResaltado = () => document.querySelectorAll(".tuto-resaltado").forEach((el) => el.classList.remove("tuto-resaltado"));

function mostrarPasoTutorial() {
  const { pasos, i } = tutorial;
  const paso = pasos[i];
  const ultimo = i === pasos.length - 1;
  if (tutorial.alPaso) tutorial.alPaso(paso);
  quitarResaltado();
  const el = paso.resaltar && document.querySelector(paso.resaltar);
  if (el && el.getClientRects().length) {   // (si está oculto, no se marca nada)
    el.classList.add("tuto-resaltado");
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  const puntos = pasos.map((_, k) => `<span class="${k === i ? "activo" : ""}"></span>`).join("");
  cajaTutorial().innerHTML = `
    <div class="tuto-cabeza"><h3>${paso.titulo}</h3><small>${i + 1} de ${pasos.length}</small></div>
    <p>${paso.texto}</p>
    <div class="tuto-puntos">${puntos}</div>
    <div class="tuto-botones">
      ${ultimo ? "<span></span>" : `<button data-tuto="saltear" class="claro">Saltear tutorial</button>`}
      <div>
        ${i ? `<button data-tuto="atras" class="claro">⬅ Atrás</button>` : ""}
        <button data-tuto="siguiente">${ultimo ? "¡A jugar! 🏛️" : "Siguiente ➜"}</button>
      </div>
    </div>`;
  cajaTutorial().classList.remove("oculto");
}

function moverTutorial(cuanto) {
  if (!tutorial) return;
  const i = tutorial.i + cuanto;
  if (i < 0) return;
  if (i >= tutorial.pasos.length) { cerrarTutorial(); return; }
  tutorial.i = i;
  mostrarPasoTutorial();
}

cajaTutorial().addEventListener("click", (ev) => {
  const b = ev.target.closest("button[data-tuto]");
  if (!b) return;
  const que = b.dataset.tuto;
  if (que === "saltear") cerrarTutorial();
  else moverTutorial(que === "atras" ? -1 : 1);
});

// Con el teclado: flechas para moverse, Escape para salir
document.addEventListener("keydown", (ev) => {
  if (!tutorial || ev.target.matches("input, textarea")) return;
  if (ev.key === "Escape") cerrarTutorial();
  else if (ev.key === "ArrowRight") moverTutorial(1);
  else if (ev.key === "ArrowLeft") moverTutorial(-1);
});
