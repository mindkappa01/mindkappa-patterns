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

  const API_BASE =
    window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "";

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
    if (timerCircle) {
      timerCircle.style.setProperty("--p-progress", `${progress}deg`);
    }
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

      if (timerText) {
        timerText.textContent = tempoRestante.toFixed(1) + "s";
      }

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

  function mostrarProcessando(texto = "Processando sua sessão...") {
    area.style.display = "none";

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
      area.parentNode.appendChild(loadingBox);
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

    mostrarProcessando("Salvando sua sessão...");

    try {
      const response = await fetch(`${API_BASE}/api/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(sessionPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }

      atualizarProcessando("Preparando seu resultado...");

      const result = await response.json();
      console.log("Resposta final do backend:", result);
      localStorage.setItem("mk_session_response", JSON.stringify(result));

      esconderProcessando();

      if (btnProximo) {
        btnProximo.style.display = "block";
        btnProximo.onclick = () => {
          window.location.href = "resultado.html";
        };
      }
    } catch (error) {
      esconderProcessando();
      console.error("Erro ao enviar sessão final:", error);

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
        area.parentNode.appendChild(errorBox);
      }

      errorBox.innerHTML = `
        <div style="font-size: 1.15rem; margin-bottom: 6px;">⚠️</div>
        <div style="font-weight: 600;">Não foi possível finalizar sua sessão agora.</div>
        <div style="font-size: 0.94rem; margin-top: 6px; color: #6b7280;">
          Tente novamente em alguns instantes.
        </div>
      `;
    }
  }
});