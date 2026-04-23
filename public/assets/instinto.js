document.addEventListener("DOMContentLoaded", () => {
  localStorage.removeItem("mk_paid_result");

  const TOTAL = 40;
  const TEST_TYPE = "instinto";

  const AXIS = {
    axis_id: "impulso_controle",
    axis_label: "Impulso vs Controle",
    left_label: "impulso",
    right_label: "controle",
    left_angle_deg: 0,
    right_angle_deg: 180
  };

  const API_BASE =
    window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "";

  let index = 0;
  let locked = false;
  let trials = [];
  let testStartedAt = new Date().toISOString();
  let trialStartedAt = performance.now();

  const contador = document.getElementById("contador");
  const btnAzul = document.getElementById("btnAzul");
  const btnVermelho = document.getElementById("btnVermelho");
  const btnArea = document.querySelector(".instinto-btn-area");
  const btnNext = document.getElementById("btnNextTest");

  if (!contador || !btnAzul || !btnVermelho || !btnArea) return;

  function updateCounter() {
    contador.textContent = `${index + 1} / ${TOTAL}`;
  }

  function buildTrial(choiceSide) {
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
      choice_label: isLeft ? AXIS.left_label : AXIS.right_label,
      choice_angle_deg: isLeft ? AXIS.left_angle_deg : AXIS.right_angle_deg,
      reaction_time_ms: reactionTime,
      timed_out: false,
      timestamp: new Date().toISOString()
    };
  }

  function registrar(choiceSide) {
    if (locked) return;
    locked = true;

    const trial = buildTrial(choiceSide);
    trials.push(trial);
    index++;

    if (index >= TOTAL) {
      finalizarTeste();
      return;
    }

    updateCounter();

    setTimeout(() => {
      locked = false;
      trialStartedAt = performance.now();
    }, 120);
  }

  btnAzul.addEventListener("click", () => registrar("left"));
  btnVermelho.addEventListener("click", () => registrar("right"));

  updateCounter();

  async function finalizarTeste() {
    const dados = {
      test_type: TEST_TYPE,
      started_at: testStartedAt,
      finished_at: new Date().toISOString(),
      trials
    };

    localStorage.setItem("teste1_instinto", JSON.stringify(dados));
    console.log("Instinto salvo:", dados);

    const payload = {
      started_at: dados.started_at,
      finished_at: dados.finished_at,
      tests: [dados]
    };

    try {
      const response = await fetch(`${API_BASE}/api/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("Resposta do backend:", result);

      localStorage.setItem(
        "teste1_instinto_backend_response",
        JSON.stringify(result)
      );
    } catch (error) {
      console.error("Erro ao enviar Instinto para o backend:", error);
    }

    btnArea.style.display = "none";

    if (btnNext) {
      btnNext.style.display = "block";
      btnNext.onclick = () => {
        window.location.href = "equilibrio.html";
      };
    }
  }
});