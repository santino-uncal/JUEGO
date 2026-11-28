// Tutorial de Rey de Roma: un cartel abajo de la pantalla que va explicando paso a paso
// y marca con un borde dorado la parte de la que habla. Los textos están en data/tutorial.js.

let pasoTutorial = -1;   // -1 = el tutorial está cerrado

function abrirTutorial() {
  pasoTutorial = 0;
  mostrarPasoTutorial();
}

function cerrarTutorial() {
  pasoTutorial = -1;
  quitarResaltado();
  $("tutorial").classList.add("oculto");
  // Queda todo como al empezar: la ciudad y la pestaña Construir
  cambiarVista("ciudad");
  pestania = "construir";
  dibujarPanel();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

const quitarResaltado = () => document.querySelectorAll(".tuto-resaltado").forEach((el) => el.classList.remove("tuto-resaltado"));

function mostrarPasoTutorial() {
  const paso = PASOS_TUTORIAL[pasoTutorial];
  const ultimo = pasoTutorial === PASOS_TUTORIAL.length - 1;
  if (paso.vista) cambiarVista(paso.vista);
  if (paso.pestania) { pestania = paso.pestania; dibujarPanel(); }
  quitarResaltado();
  const el = paso.resaltar && document.querySelector(paso.resaltar);
  if (el) {
    el.classList.add("tuto-resaltado");
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  const puntos = PASOS_TUTORIAL.map((_, i) => `<span class="${i === pasoTutorial ? "activo" : ""}"></span>`).join("");
  $("tutorial").innerHTML = `
    <div class="tuto-cabeza"><h3>${paso.titulo}</h3><small>${pasoTutorial + 1} de ${PASOS_TUTORIAL.length}</small></div>
    <p>${paso.texto}</p>
    <div class="tuto-puntos">${puntos}</div>
    <div class="tuto-botones">
      ${ultimo ? "<span></span>" : `<button data-tuto="saltear" class="claro">Saltear tutorial</button>`}
      <div>
        ${pasoTutorial ? `<button data-tuto="atras" class="claro">⬅ Atrás</button>` : ""}
        <button data-tuto="siguiente">${ultimo ? "¡A jugar! 🏛️" : "Siguiente ➜"}</button>
      </div>
    </div>`;
  $("tutorial").classList.remove("oculto");
}

// (se carga antes que js/ciudad.js, por eso acá no se usa $)
document.getElementById("tutorial").addEventListener("click", (ev) => {
  const b = ev.target.closest("button[data-tuto]");
  if (!b) return;
  const que = b.dataset.tuto;
  if (que === "saltear" || (que === "siguiente" && pasoTutorial === PASOS_TUTORIAL.length - 1)) { cerrarTutorial(); return; }
  pasoTutorial += que === "atras" ? -1 : 1;
  mostrarPasoTutorial();
});

// Con el teclado: flechas para moverse, Escape para salir
document.addEventListener("keydown", (ev) => {
  if (pasoTutorial < 0) return;
  if (ev.key === "Escape") cerrarTutorial();
  else if (ev.key === "ArrowRight") $("tutorial").querySelector('[data-tuto="siguiente"]').click();
  else if (ev.key === "ArrowLeft" && pasoTutorial > 0) { pasoTutorial--; mostrarPasoTutorial(); }
});
