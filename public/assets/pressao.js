document.addEventListener("DOMContentLoaded", () => {
  const TOTAL = 40;
  const TEST_TYPE = "pressao";

  const AXIS = {
    axis_id: "impulso_controle",
    axis_label: "Impulso vs Controle",
    left_label: "impulso",
    right_label: "controle",
    left_angle_deg: 0,
    right_angle_deg: 180
  };

  let index = 0;
  let locked = false;
  let trials = [];
  let testStartedAt = new Date().toISOString();
  let trialStartedAt = performance.now();

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

  function embaralharSeNecessario() {
    if (index % 10 !== 0) return;

    const ordem = [azulBtn, vermelhoBtn];
    ordem.sort(() => Math.random() - 0.5);
    ordem.forEach((btn) => area.appendChild(btn));
  }

  function getSideFromDom(button) {
    return area.firstElementChild === button ? "left" : "right";
  }

  function buildTrial(choiceSide, timedOut = false) {
    const now = performance.now();
    const reactionTime = Math.round(now - trialStartedAt);
    const isLeft = choiceSide === "left";

    return {
      trial_index: index + 1,
      axis_id: AXIS.axis_id,
      axis_label: AXIS.axis_label,
      left_label: AXIS.left_label,
      right_label: AXIS.right_label,
      left_angle_deg: AXIS.left_angle_deg,
      right_angle_deg: AXIS.right_angle_deg,
      choice_side: choiceSide,
      choice_label: timedOut ? null : (isLeft ? AXIS.left_label : AXIS.right_label),
      choice_angle_deg: timedOut ? null : (isLeft ? AXIS.left_angle_deg : AXIS.right_angle_deg),
      reaction_time_ms: reactionTime,
      timed_out: timedOut,
      timestamp: new Date().toISOString()
    };
  }

  function iniciarTimer() {
    clearInterval(timerInterval);

    tempoBase = definirTempoBase();
    tempoRestante = tempoBase;
    locked = false;
    trialStartedAt = performance.now();

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

  function registrar(choiceSide) {
    if (locked) return;
    locked = true;

    const trial = buildTrial(choiceSide, false);
    trials.push(trial);
    proxima();
  }

  function registrarTimeout() {
    if (locked) return;
    locked = true;

    const trial = buildTrial("timeout", true);
    trials.push(trial);
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

  azulBtn.addEventListener("click", () => registrar(getSideFromDom(azulBtn)));
  vermelhoBtn.addEventListener("click", () => registrar(getSideFromDom(vermelhoBtn)));

  counter.textContent = `1 / ${TOTAL}`;
  embaralharSeNecessario();
  iniciarTimer();

  async function finalizarTeste() {
  clearInterval(timerInterval);

  const dados = {
    test_type: TEST_TYPE,
    started_at: testStartedAt,
    finished_at: new Date().toISOString(),
    trials
  };

  localStorage.setItem("teste3_pressao", JSON.stringify(dados));
  console.log("Pressão salvo:", dados);

  // Recarrega os testes já salvos
  const t1 = JSON.parse(localStorage.getItem("teste1_instinto") || "null");
  const t2 = JSON.parse(localStorage.getItem("teste2_equilibrio") || "null");
  const t3 = JSON.parse(localStorage.getItem("teste3_pressao") || "null");

  console.log("Sessão antes do envio:", {
    t1: t1?.trials?.length,
    t2: t2?.trials?.length,
    t3: t3?.trials?.length
  });

  const sessionPayload = {
    started_at: t1?.started_at || dados.started_at,
    finished_at: t3?.finished_at || dados.finished_at,
    tests: [t1, t2, t3].filter(Boolean)
  };

  try {
    const response = await fetch("/api/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(sessionPayload)
    });

    const result = await response.json();
    console.log("Resposta final do backend:", result);
    localStorage.setItem("mk_session_response", JSON.stringify(result));

    area.style.display = "none";

    if (btnProximo) {
      btnProximo.style.display = "block";
      btnProximo.onclick = () => {
        window.location.href = "resultado.html";
      };
    }
  } catch (error) {
    console.error("Erro ao enviar sessão final:", error);
  }
}
});