console.log("📊 Resultado MindKappa carregado");

let views = Number(localStorage.getItem("mk_result_views") || 0);
localStorage.setItem("mk_result_views", views + 1);
console.log("👁️ Resultados vistos:", views + 1);

document.addEventListener("DOMContentLoaded", () => {

  // ===============================
  // 1. Carregar dados dos testes
  // ===============================
  const t1 = JSON.parse(localStorage.getItem("teste1_instinto") || "{}");
  const t2 = JSON.parse(localStorage.getItem("teste2_equilibrio") || "{}");
  const t3 = JSON.parse(localStorage.getItem("teste3_pressao") || "{}");

  const countValid = arr =>
    (arr || []).filter(v => v === 0 || v === 180).length;

  document.getElementById("t1Count").textContent = countValid(t1.escolhas);
  document.getElementById("t2Count").textContent = countValid(t2.escolhas);
  document.getElementById("t3Count").textContent = countValid(t3.escolhas);

  // ===============================
  // 2. Unificar escolhas (com proteção)
  // ===============================
  const escolhas = [
    ...(t1.escolhas || []),
    ...(t2.escolhas || []),
    ...(t3.escolhas || [])
  ].filter(v => v === 0 || v === 180 || v === null);

  console.log("Total registros:", escolhas.length);

  if (escolhas.length === 0) {
    document.getElementById("kappaValor").textContent = "--";
    document.getElementById("kappaFaixa").textContent = "Dados insuficientes";
    return;
  }

  // ===============================
  // 3. Calcular K (MCDCore)
  // ===============================
  const resultado = MCDCore.generateReport(escolhas);

  document.getElementById("kappaValor").textContent =
    resultado.kappa.toFixed(3).replace(".", ",");

  document.getElementById("kappaFaixa").textContent =
    `${resultado.emoji} ${resultado.nivel}`;

  // ===============================
  // 4. Interpretação prática (Premium)
  // ===============================
  const k = resultado.kappa;
  let texto = "";

  // Sinal adicional: colapso sob pressão
  if (resultado.statistics.timeoutCount > 5) {
    texto += `
<strong>Sinal adicional</strong><br>
Houve dificuldade recorrente em decidir sob pressão de tempo,
indicando sobrecarga ou conflito em situações urgentes.<br><br>
`;
  }

  if (k < 0.2) {
    texto += `
<strong>Estado atual: Alta variabilidade decisional</strong><br>
Sua mente está reagindo a múltiplas influências ao mesmo tempo, sem uma direção estável. É comum sentir dúvida, mudar de opinião ou não reconhecer qual opção realmente representa sua intenção.<br><br>

<strong>Atenção neste momento</strong><br>
Decidir agora aumenta a chance de arrependimento, reversão rápida ou escolhas impulsivas que não refletem sua direção real.<br><br>

<strong>Janela de decisão (próximas 24h)</strong><br>
• Evite decisões importantes<br>
• Reduza estímulos externos (opiniões, pressão, excesso de informação)<br>
• Observe qual opção retorna de forma consistente quando o ambiente está mais calmo<br><br>

<strong>Pergunta-chave</strong><br>
Se você não decidir hoje, qual opção ainda fará sentido amanhã?
`;
  }

  else if (k < 0.5) {
    texto += `
<strong>Estado atual: Oscilação entre possibilidades</strong><br>
Sua mente está alternando entre possibilidades. Existe abertura para caminhos diferentes, mas a direção ainda não está consolidada.<br><br>

<strong>Risco atual</strong><br>
Decisões tomadas agora tendem a gerar dúvida posterior ou necessidade de revisão.<br><br>

<strong>Janela de decisão (próximas 24h)</strong><br>
• Limite suas opções a no máximo duas<br>
• Evite introduzir novas alternativas<br>
• Observe qual delas gera menos tensão ao imaginar a execução<br><br>

<strong>Pergunta-chave</strong><br>
Qual opção parece mais leve quando você imagina vivendo com ela?
`;
  }

  else if (k < 0.8) {
    texto += `
<strong>Estado atual: Coerência decisional</strong><br>
Suas respostas mostram alinhamento. Sua mente está operando com clareza suficiente para sustentar uma escolha.<br><br>

<strong>Risco neste estado</strong><br>
O principal risco não é decidir — é adiar e reabrir dúvidas desnecessárias.<br><br>

<strong>Janela de decisão (próximas 24h)</strong><br>
• Tome a decisão<br>
• Defina o primeiro passo concreto<br>
• Evite reavaliar após iniciar a ação<br><br>

<strong>Pergunta-chave</strong><br>
Qual é a menor ação que já move essa decisão para o mundo real?
`;
  }

  else {
    texto += `
<strong>Estado atual: Alta rigidez decisional</strong><br>
Sua mente está fortemente orientada em uma única direção. Isso pode indicar clareza — ou fechamento prematuro para novas informações.<br><br>

<strong>Risco atual</strong><br>
Ignorar riscos relevantes ou manter uma decisão baseada em convicção não revisada.<br><br>

<strong>Janela de decisão (próximas 24h)</strong><br>
• Revise os principais riscos da escolha<br>
• Busque uma única opinião externa confiável<br>
• Confirme que a decisão não está baseada apenas em impulso ou defesa<br><br>

<strong>Pergunta-chave</strong><br>
O que precisaria acontecer para você reconsiderar essa decisão?
`;
  }

  texto += `<br><br><em>O K não mede quem você é. Ele mostra como sua mente está funcionando neste momento.</em>`;

  document.getElementById("iaTexto").innerHTML = texto;

// ===============================
// 4. Sistema de desbloqueio via Mercado Pago
// ===============================
const params = new URLSearchParams(window.location.search);

const status = params.get("status");
const premiumContent = document.getElementById("premiumContent");
const lockOverlay = document.getElementById("lockOverlay");

if (status === "approved") {
  console.log("Pagamento aprovado - desbloqueando conteúdo");

  if (premiumContent) premiumContent.classList.remove("locked");
  if (lockOverlay) lockOverlay.style.display = "none";
}

else if (status === "pending") {
  console.log("Pagamento pendente");

  if (lockOverlay) {
    lockOverlay.innerHTML = `
      <h3>Pagamento em processamento</h3>
      <p style="font-size:14px; color:#6b7280;">
        Estamos aguardando a confirmação do Pix.
        Assim que for aprovado, volte para esta página.
      </p>
    `;
  }
}

else if (status === "rejected") {
  console.log("Pagamento recusado");

  if (lockOverlay) {
    lockOverlay.innerHTML = `
      <h3>Pagamento não aprovado</h3>
      <p style="font-size:14px; color:#6b7280;">
        O pagamento não foi concluído.
        Você pode tentar novamente.
      </p>
      <button id="premiumBtn">
        Tentar novamente · R$9,90
      </button>
    `;
  }
}


  // ===============================
  // 7. Navegação
  // ===============================
  document.getElementById("refazerBtn").onclick = () => {
    window.location.href = "instinto.html";
  };

  document.getElementById("inicioBtn").onclick = () => {
    window.location.href = "index.html";
  };

});
