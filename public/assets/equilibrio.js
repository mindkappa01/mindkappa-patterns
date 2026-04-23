document.addEventListener("DOMContentLoaded", () => {
  console.log("equilibrio.js novo carregado");

  const TOTAL = 40;
  const TEST_TYPE = "equilibrio";

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

  const counter = document.getElementById("eqCounter");
  const azulBtn = document.getElementById("btnAzul");
  const vermelhoBtn = document.getElementById("btnVermelho");
  const area = document.getElementById("eqBtnArea");
  const btnNext = document.getElementById("btnNextTest2");

  if (!counter || !azulBtn || !vermelhoBtn || !area) {
    console.error("Equilíbrio: elementos não encontrados no HTML");
    return;
  }

  function updateCounter() {
    counter.textContent = `${index + 1} / ${TOTAL}`;
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
    }, 150);
  }

  azulBtn.addEventListener("click", () => registrar("left"));
  vermelhoBtn.addEventListener("click", () => registrar("right"));

  updateCounter();

  function finalizarTeste() {
    const dados = {
      test_type: TEST_TYPE,
      started_at: testStartedAt,
      finished_at: new Date().toISOString(),
      trials
    };

    localStorage.setItem("teste2_equilibrio", JSON.stringify(dados));
    console.log("Equilíbrio salvo:", dados);

    area.style.display = "none";

    if (btnNext) {
      btnNext.style.display = "block";
      btnNext.onclick = () => {
        window.location.href = "pressao.html";
      };
    }
  }
});