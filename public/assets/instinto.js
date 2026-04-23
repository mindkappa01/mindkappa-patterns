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

  function mostrarProcessando(texto = "Processando seu teste...") {
    btnArea.style.display = "none";

    let loadingBox = document.getElementById("mkLoadingBox");

    if (!loadingBox) {
      loadingBox = document.createElement("div");
      loadingBox.id = "mkLoadingBox";
      loadingBox.style.marginTop = "24px";
      loadingBox.style.padding = "18px 16px";
      loadingBox.style.borderRadius = "14px";
      loadingBox.style.background = "rgba(255,255,255,0.92)";
      loadingBox.style.color = "#1f2937";
      loadingBox.style.textAlign = "center";
      loadingBox.style.boxShadow = "0 6px 18px rgba(0,0,0,0.08)";
      loadingBox.style.fontSize = "1rem";
      loadingBox.style.lineHeight = "1.6";
      loadingBox.style.fontWeight = "600";
      btnArea.parentNode.appendChild(loadingBox);
    }

    loadingBox.innerHTML = `
      <div style="font-size: 1.15rem; margin-bottom: 6px;">⏳</div>
      <div>${texto}</div>
      <div style="font-size: 0.92rem; font-weight: 400; margin-top: 6px; color: #6b7280;">
        Aguarde um instante...
      </div>
    `;
  }

  function atualizarProcessando(texto) {
    const loadingBox = document.getElementById("mkLoadingBox");
    if (loadingBox) {
      loadingBox.innerHTML = `
        <div style="font-size: 1.15rem; margin-bottom: 6px;">⏳</div>
        <div>${texto}</div>
        <div style="font-size: 0.92rem; font-weight: 400; margin-top: 6px; color: #6b7280;">
          Aguarde um instante...
        </div>
      `;
    }
  }

  function esconderProcessando() {
    const loadingBox = document.getElementById("mkLoadingBox");
    if (loadingBox) {
      loadingBox.remove();
    }
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

    mostrarProcessando("Salvando seu teste...");

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

      atualizarProcessando("Preparando próxima etapa...");

      const result = await response.json();
      console.log("Resposta do backend:", result);

      localStorage.setItem(
        "teste1_instinto_backend_response",
        JSON.stringify(result)
      );

      esconderProcessando();

      if (btnNext) {
        btnNext.style.display = "block";
        btnNext.onclick = () => {
          window.location.href = "equilibrio.html";
        };
      }
    } catch (error) {
      esconderProcessando();
      console.error("Erro ao enviar Instinto para o backend:", error);

      let errorBox = document.getElementById("mkErrorBox");

      if (!errorBox) {
        errorBox = document.createElement("div");
        errorBox.id = "mkErrorBox";
        errorBox.style.marginTop = "24px";
        errorBox.style.padding = "18px 16px";
        errorBox.style.borderRadius = "14px";
        errorBox.style.background = "rgba(255,255,255,0.92)";
        errorBox.style.color = "#7f1d1d";
        errorBox.style.textAlign = "center";
        errorBox.style.boxShadow = "0 6px 18px rgba(0,0,0,0.08)";
        errorBox.style.lineHeight = "1.6";
        btnArea.parentNode.appendChild(errorBox);
      }

      errorBox.innerHTML = `
        <div style="font-size: 1.15rem; margin-bottom: 6px;">⚠️</div>
        <div style="font-weight: 600;">Não foi possível finalizar o teste agora.</div>
        <div style="font-size: 0.94rem; margin-top: 6px; color: #6b7280;">
          Tente novamente em alguns instantes.
        </div>
      `;
    }
  }
});