document.addEventListener("DOMContentLoaded", () => {

  let escolhas = [];
  let index = 0;
  const TOTAL = 40;
  let locked = false;

  const counter = document.getElementById("eqCounter");
  const azulBtn = document.getElementById("btnAzul");
  const vermelhoBtn = document.getElementById("btnVermelho");
  const area = document.getElementById("eqBtnArea");
  const btnNext = document.getElementById("btnNextTest2");

  if (!counter || !azulBtn || !vermelhoBtn || !area) return;

  function updateCounter() {
    counter.textContent = `${index + 1} / ${TOTAL}`;
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
    }, 150);
  }

  azulBtn.addEventListener("click", () => registrar(0));
  vermelhoBtn.addEventListener("click", () => registrar(180));

  updateCounter();

  function finalizarTeste() {
    const dados = {
      escolhas,
      tipo: "equilibrio",
      timestamp: Date.now()
    };

    localStorage.setItem("teste2_equilibrio", JSON.stringify(dados));

    area.style.display = "none";

    if (btnNext) {
      btnNext.style.display = "block";
      btnNext.onclick = () => {
        window.location.href = "pressao.html";
      };
    }
  }

});
