document.addEventListener("DOMContentLoaded", () => {

  let escolhas = [];
  let index = 0;
  const TOTAL = 40;
  let locked = false;

  const counter = document.getElementById("pressaoCounter");
  const timerCircle = document.getElementById("timerCircle");
  const timerText = document.getElementById("timerText");

  const azulBtn = document.getElementById("btnAzul");
  const vermelhoBtn = document.getElementById("btnVermelho");
  const area = document.getElementById("pressaoBtnArea");
  const btnProximo = document.getElementById("btnProximo");

  if (!counter || !azulBtn || !vermelhoBtn || !area) return;

  let tempoBase = 3.0;
  let tempoRestante = tempoBase;
  let timerInterval;

  function definirTempoBase() {
    if (index < 10) return 3.0;
    if (index < 20) return 2.5;
    if (index < 30) return 2.0;
    return 1.5;
  }

  function atualizarTimer(progress) {
    timerCircle.style.setProperty("--p-progress", `${progress}deg`);
  }

  function iniciarTimer() {
    clearInterval(timerInterval);

    tempoBase = definirTempoBase();
    tempoRestante = tempoBase;
    locked = false;

    const inicio = performance.now();

    timerInterval = setInterval(() => {
      const agora = performance.now();
      tempoRestante = tempoBase - (agora - inicio) / 1000;

      if (tempoRestante <= 0) {
        registrarTimeout();
        return;
      }

      timerText.textContent = tempoRestante.toFixed(1) + "s";
      atualizarTimer((tempoRestante / tempoBase) * 360);

    }, 40);
  }

  function embaralharSeNecessario() {
    if (index % 10 !== 0) return;
    const ordem = [azulBtn, vermelhoBtn];
    ordem.sort(() => Math.random() - 0.5);
    ordem.forEach(btn => area.appendChild(btn));
  }

  function registrar(angle) {
    if (locked) return;
    locked = true;

    escolhas.push(Number(angle));
    proxima();
  }

  function registrarTimeout() {
    if (locked) return;
    locked = true;

    escolhas.push(null); // colapso sob pressão
    proxima();
  }

  function proxima() {
    clearInterval(timerInterval);
    index++;

    if (index >= TOTAL) {
      finalizarTeste();
      return;
    }

    counter.textContent = `${index + 1} / ${TOTAL}`;
    embaralharSeNecessario();
    iniciarTimer();
  }

  azulBtn.addEventListener("click", () => registrar(0));
  vermelhoBtn.addEventListener("click", () => registrar(180));

  counter.textContent = `1 / ${TOTAL}`;
  embaralharSeNecessario();
  iniciarTimer();

  function finalizarTeste() {
    const dados = {
      escolhas,
      tipo: "pressao",
      timestamp: Date.now()
    };

    localStorage.setItem("teste3_pressao", JSON.stringify(dados));

    area.style.display = "none";

    if (btnProximo) {
      btnProximo.style.display = "block";
      btnProximo.onclick = () => {
        window.location.href = "resultado.html";
      };
    }
  }

});
