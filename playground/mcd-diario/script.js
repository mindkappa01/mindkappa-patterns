// 🧠 MCD Diário – Lado frontend (somente sessão atual, sem salvar histórico em banco)

let decisions = [];        // { choice: "Azul" | "Vermelho", angle, timeFormatted }
const TOTAL = 20;

let kappaGlobal = null;

// Elementos DOM
const buttonsContainer   = document.getElementById("buttonsContainer");
const decisionCountEl    = document.getElementById("decisionCount");
const progressFillEl     = document.getElementById("progressFill");
const statusTextEl       = document.getElementById("statusText");

const kappaValueEl       = document.getElementById("kappaValue");
const coherenceLabelEl   = document.getElementById("coherenceLabel");
const coherenceBarEl     = document.getElementById("coherenceBar");

const statNEl            = document.getElementById("statN");
const statREl            = document.getElementById("statR");
const statAzulEl         = document.getElementById("statAzul");
const statVermelhoEl     = document.getElementById("statVermelho");

const decisionHistoryEl  = document.getElementById("decisionHistory");

const iaButtonEl         = document.getElementById("iaButton");
const interpretationTextEl = document.getElementById("interpretationText");

// Botões de decisão criados via JS (para poder reordenar facilmente)
const blueBtn = document.createElement("button");
blueBtn.className = "decision-btn blue-btn";
blueBtn.textContent = "AZUL";

const redBtn = document.createElement("button");
redBtn.className = "decision-btn red-btn";
redBtn.textContent = "VERMELHO";

// Eventos
blueBtn.addEventListener("click", () => registrarDecisao("Azul"));
redBtn.addEventListener("click", () => registrarDecisao("Vermelho"));

iaButtonEl.addEventListener("click", async () => {
  if (typeof kappaGlobal !== "number" || isNaN(kappaGlobal)) return;

  iaButtonEl.disabled = true;
  iaButtonEl.textContent = "Interpretando…";

  try {
    const resp = await fetch("http://localhost:3000/api/kappa/interpret", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        kappa: kappaGlobal,
        nDecisoes: decisions.length,
        contexto: "MCD Diário Web"
      })
    });

    if (!resp.ok) {
      interpretationTextEl.textContent = "Erro ao obter interpretação da IA-Kappa (backend).";
      return;
    }

    const data = await resp.json();
    if (data && data.texto) {
      interpretationTextEl.textContent = data.texto;
    } else {
      interpretationTextEl.textContent = "Resposta inesperada da IA-Kappa.";
    }
  } catch (err) {
    console.error("Erro ao chamar IA-Kappa:", err);
    interpretationTextEl.textContent = "Erro de conexão com IA-Kappa.";
  } finally {
    iaButtonEl.disabled = false;
    iaButtonEl.textContent = "🤖 Interpretar κ";
  }
});

// Inicialização: colocar os botões pela primeira vez
randomizarBotoes();
atualizarUIBasica();

// 🔵 Função principal: registrar decisão
function registrarDecisao(cor) {
  if (decisions.length >= TOTAL) return;

  const angle = cor === "Azul" ? 0 : Math.PI;
  const now = new Date();

  decisions.push({
    choice: cor,
    angle,
    timestamp: now.getTime(),
    timeFormatted: now.toLocaleTimeString("pt-BR")
  });

  atualizarContagem();
  atualizarHistorico();

  if (decisions.length === TOTAL) {
    calcularKappaEAtualizarUI();
  }

  // Sempre randomizar a posição dos botões após cada clique
  randomizarBotoes();
}

// 🔵 Randomiza a posição dos botões (tanto em desktop quanto mobile)
function randomizarBotoes() {
  buttonsContainer.innerHTML = "";
  if (Math.random() > 0.5) {
    buttonsContainer.appendChild(blueBtn);
    buttonsContainer.appendChild(redBtn);
  } else {
    buttonsContainer.appendChild(redBtn);
    buttonsContainer.appendChild(blueBtn);
  }
}

// 🔵 Atualiza contagem e barra de progresso
function atualizarContagem() {
  decisionCountEl.textContent = decisions.length;

  const percent = (decisions.length / TOTAL) * 100;
  progressFillEl.style.width = `${percent}%`;

  if (decisions.length < TOTAL) {
    statusTextEl.textContent = `Complete as ${TOTAL} decisões para ver seu κ e pedir interpretação da IA-Kappa.`;
  } else {
    statusTextEl.textContent = "Sessão completa. κ calculado. Você pode chamar a IA-Kappa para interpretar.";
  }
}

// 🔵 Atualiza histórico (últimas 10 decisões)
function atualizarHistorico() {
  if (decisions.length === 1) {
    // remover placeholder
    decisionHistoryEl.innerHTML = "";
  }

  const ultimas = decisions.slice(-10);
  decisionHistoryEl.innerHTML = "";

  ultimas.forEach(d => {
    const item = document.createElement("div");
    item.className = "history-item";

    item.innerHTML = `
      <span>${d.timeFormatted}</span>
      <span style="font-weight:bold; color:${d.choice === "Azul" ? "#3498db" : "#e74c3c"};">
        ${d.choice.toUpperCase()}
      </span>
    `;

    decisionHistoryEl.appendChild(item);
  });

  decisionHistoryEl.scrollTop = decisionHistoryEl.scrollHeight;
}

// 🔵 Cálculo de κ, R, proporções e atualização de UI
function calcularKappaEAtualizarUI() {
  const N = decisions.length;
  if (N === 0) return;

  const angles = decisions.map(d => d.angle);
  let sumCos = 0;
  let sumSin = 0;

  angles.forEach(t => {
    sumCos += Math.cos(t);
    sumSin += Math.sin(t);
  });

  const R_linear = Math.sqrt(sumCos * sumCos + sumSin * sumSin);
  const R = R_linear / N;

  let kappa = 0;
  if (R < 0.001) {
    kappa = 0;
  } else if (R > 0.999) {
    kappa = 10;
  } else {
    // Mesmo formato aproximado usado no backend MCDCore
    kappa = (R * (2 - R ** 2)) / (1 - R ** 2);
    if (kappa > 10) kappa = 10;
  }

  kappa = Number(kappa.toFixed(4));
  kappaGlobal = kappa;

  // Estatísticas simples
  const azulCount = decisions.filter(d => d.choice === "Azul").length;
  const vermelhoCount = N - azulCount;

  const pAzul = (azulCount / N) * 100;
  const pVermelho = (vermelhoCount / N) * 100;

  // Atualizar UI de stats
  kappaValueEl.textContent = kappa.toFixed(3);
  statNEl.textContent = N;
  statREl.textContent = R.toFixed(3);
  statAzulEl.textContent = `${pAzul.toFixed(1)}%`;
  statVermelhoEl.textContent = `${pVermelho.toFixed(1)}%`;

  // Barra de coerência
  // Vamos usar uma escala: 0 a ~1.5 mapeia para 0–100% (cortando no máximo)
  const barPercent = Math.min(100, (kappa / 1.5) * 100);
  coherenceBarEl.style.width = `${barPercent}%`;

  // Níveis de coerência baseados em kappa (não diagnóstico, só padrão)
  let nivel = "ALEATÓRIO";
  let cor = "#6b7280";

  if (kappa >= 1.0) {
    nivel = "ALTA COERÊNCIA";
    cor = "#10b981";
  } else if (kappa >= 0.5) {
    nivel = "COERÊNCIA MODERADA";
    cor = "#f59e0b";
  } else if (kappa >= 0.3) {
    nivel = "TENDÊNCIA LEVE";
    cor = "#ef4444";
  } else {
    nivel = "PRÓXIMO DO ALEATÓRIO";
    cor = "#6b7280";
  }

  coherenceLabelEl.textContent = nivel;
  coherenceLabelEl.style.color = cor;
  coherenceBarEl.style.backgroundColor = cor;

  // Habilitar botão da IA-Kappa
  iaButtonEl.disabled = false;

  // Atualizar texto padrão da interpretação (antes da IA)
  interpretationTextEl.textContent =
    `κ = ${kappa.toFixed(3)} em uma sessão de ${N} decisões.\n` +
    `Distribuição: ${azulCount}x Azul (${pAzul.toFixed(1)}%) e ${vermelhoCount}x Vermelho (${pVermelho.toFixed(1)}%).\n` +
    `Você pode pedir à IA-Kappa uma leitura matemática detalhada desse padrão.`;
}

// 🔵 Estado inicial de UI
function atualizarUIBasica() {
  decisionCountEl.textContent = "0";
  progressFillEl.style.width = "0%";

  kappaValueEl.textContent = "–";
  coherenceLabelEl.textContent = "Aguardando decisões…";
  coherenceLabelEl.style.color = "#7f8c8d";
  coherenceBarEl.style.width = "0%";
  coherenceBarEl.style.backgroundColor = "#95a5a6";

  statNEl.textContent = "0";
  statREl.textContent = "0.00";
  statAzulEl.textContent = "0%";
  statVermelhoEl.textContent = "0%";

  decisionHistoryEl.innerHTML = `
    <div class="history-placeholder">
      Nenhuma decisão registrada ainda.
    </div>
  `;

  iaButtonEl.disabled = true;
}
