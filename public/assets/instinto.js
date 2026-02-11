document.addEventListener("DOMContentLoaded", () => {

  localStorage.removeItem("mk_paid_result");

  let escolhas = [];
  let index = 0;
  const TOTAL = 40;
  let locked = false;

  const contador = document.getElementById("contador");
  const btnAzul = document.getElementById("btnAzul");
  const btnVermelho = document.getElementById("btnVermelho");
  const btnArea = document.querySelector(".instinto-btn-area");
  const btnNext = document.getElementById("btnNextTest");

  if (!contador || !btnAzul || !btnVermelho || !btnArea) return;

  function updateCounter() {
    contador.textContent = `${index + 1} / ${TOTAL}`;
  }

  function registrar(angle) {
    if (locked) return;
    locked = true;

    escolhas.push(Number(angle));
    index++;

    if (index >= TOTAL) {
      finalizarTeste();
      return;
    }

    updateCounter();

    setTimeout(() => {
      locked = false;
    }, 120);
  }

  btnAzul.addEventListener("click", () => registrar(0));
  btnVermelho.addEventListener("click", () => registrar(180));

  updateCounter();

  function finalizarTeste() {
    const dados = {
      escolhas,
      tipo: "instinto",
      timestamp: Date.now()
    };

    localStorage.setItem("teste1_instinto", JSON.stringify(dados));

    btnArea.style.display = "none";

    if (btnNext) {
      btnNext.style.display = "block";
      btnNext.onclick = () => {
        window.location.href = "equilibrio.html";
      };
    }
  }

});
