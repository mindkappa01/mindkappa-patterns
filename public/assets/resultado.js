console.log("📊 Resultado MindKappa carregado");

let views = Number(localStorage.getItem("mk_result_views") || 0);
localStorage.setItem("mk_result_views", views + 1);
console.log("👁️ Resultados vistos:", views + 1);

document.addEventListener("DOMContentLoaded", () => {
  const t1 = JSON.parse(localStorage.getItem("teste1_instinto") || "{}");
  const t2 = JSON.parse(localStorage.getItem("teste2_equilibrio") || "{}");
  const t3 = JSON.parse(localStorage.getItem("teste3_pressao") || "{}");

  const normalizeChoices = (arr) =>
    (arr || []).filter((v) => v === 0 || v === 180);

  const countColors = (arr) => {
    const escolhas = normalizeChoices(arr);
    return {
      vermelho: escolhas.filter((v) => v === 0).length,
      azul: escolhas.filter((v) => v === 180).length,
      total: escolhas.length,
    };
  };

  const escolhasGerais = [
    ...normalizeChoices(t1.escolhas),
    ...normalizeChoices(t2.escolhas),
    ...normalizeChoices(t3.escolhas),
  ];

  const byId = (id) => document.getElementById(id);

  const setText = (id, value) => {
    const el = byId(id);
    if (el) el.textContent = value;
  };

  if (escolhasGerais.length === 0) {
    setText("resultadoFrase", "Não foi possível gerar seu resultado.");
    setText("resultadoSub", "Faça os testes novamente para ver sua leitura.");
    setText("estadoBadge", "Sem dados");
    setText("estadoResumo", "Não encontramos escolhas válidas suficientes.");
    setText("resultadoEspelho", "Sem dados para interpretar.");
    setText("resultadoRisco", "Sem dados para avaliar este momento.");
    setText("resultadoAcao", "Refaça os testes para gerar sua leitura.");
    setText("resultadoConclusao", "Seu resultado não pôde ser calculado.");
    setText("kappaValor", "--");
    return;
  }

  const resultadoGeral = MCDCore.generateReport(escolhasGerais);

  const calcTestReport = (teste) => {
    const escolhas = normalizeChoices(teste.escolhas);
    if (escolhas.length === 0) {
      return null;
    }
    return {
      resultado: MCDCore.generateReport(escolhas),
      contagem: countColors(escolhas),
    };
  };

  const r1 = calcTestReport(t1);
  const r2 = calcTestReport(t2);
  const r3 = calcTestReport(t3);

  const formatK = (value) => value.toFixed(3).replace(".", ",");

  const getBand = (k) => {
    if (k < 0.2) {
      return {
        badge: "🔴 Muito instável",
        frase: "Você não está decidindo. Está reagindo.",
        sub: "Seu resultado mostra alta variabilidade no modo como sua mente respondeu aos 3 testes.",
        resumo:
          "Sua mente mostrou pouca estabilidade neste momento. Isso costuma aparecer quando há dúvida, conflito interno ou excesso de influência do momento.",
        espelho:
          "Durante o teste, seu padrão não se manteve estável. Em vez de uma direção clara, sua resposta oscilou mais do que o esperado.",
        risco:
          "Se você decidir agora, há mais chance de impulsividade, arrependimento ou mudança rápida de direção.",
        acao:
          "Evite decisões importantes agora. Diminua estímulos, espere um pouco e observe se a mesma direção continua fazendo sentido depois.",
        conclusao:
          "Seu resultado sugere um estado de instabilidade momentânea. Isso não define quem você é, mas indica que sua mente pode estar mais reativa do que clara agora.",
        emoji: "⚠️",
      };
    }

    if (k < 0.5) {
      return {
        badge: "🟡 Oscilando",
        frase: "Sua mente está oscilando antes de decidir.",
        sub: "Existe direção, mas ela ainda não parece consolidada.",
        resumo:
          "Seu padrão mostra alternância entre possibilidades. Isso costuma acontecer quando sua mente ainda está tentando estabilizar uma escolha.",
        espelho:
          "Você não está totalmente sem direção, mas também não parece em um estado firme o bastante para sustentar qualquer escolha com tranquilidade.",
        risco:
          "Se você decidir agora, pode acabar reabrindo a dúvida depois ou sentindo necessidade de revisar a escolha.",
        acao:
          "Reduza opções, evite adicionar novas variáveis e observe qual caminho parece mais leve e consistente nas próximas horas.",
        conclusao:
          "Seu resultado indica oscilação. Há sinal de escolha, mas ainda com espaço para dúvida ou revisão posterior.",
        emoji: "🧠",
      };
    }

    if (k < 0.8) {
      return {
        badge: "🟢 Claro",
        frase: "Sua mente está relativamente clara para decidir.",
        sub: "Seu padrão mostrou boa consistência ao longo dos testes.",
        resumo:
          "Sua resposta se manteve mais estável, sugerindo que você está em um estado melhor para sustentar uma decisão neste momento.",
        espelho:
          "Durante os testes, sua mente mostrou alinhamento suficiente para indicar direção. Há menos ruído e mais coerência na forma como você respondeu.",
        risco:
          "O risco aqui não é tanto decidir. É adiar demais e reabrir dúvidas que já estavam relativamente resolvidas.",
        acao:
          "Se a decisão for importante e você já tem contexto suficiente, este pode ser um bom momento para agir com simplicidade.",
        conclusao:
          "Seu resultado sugere clareza suficiente para avançar. Ainda assim, continue atento ao contexto real da decisão.",
        emoji: "✅",
      };
    }

    return {
      badge: "🟣 Muito fechado",
      frase: "Sua mente está muito fechada em uma direção.",
      sub: "Há alta consistência no seu padrão, mas isso pode significar clareza ou rigidez.",
      resumo:
        "Seu padrão ficou fortemente concentrado em uma única direção. Isso pode indicar convicção, mas também pouca abertura para revisar o que precisa ser revisto.",
      espelho:
        "Sua resposta mostrou estabilidade muito alta. Em alguns casos isso é clareza; em outros, pode ser fechamento prematuro.",
      risco:
        "Se você decidir agora sem revisar minimamente os riscos, pode ignorar sinais importantes só porque já se sente convicto.",
      acao:
        "Antes de agir, faça uma revisão simples: qual ponto poderia mostrar que essa decisão precisa ser reconsiderada?",
      conclusao:
        "Seu resultado sugere alta consistência. O ponto agora não é buscar mais certeza, mas garantir que ela não virou rigidez.",
      emoji: "🔍",
    };
  };

  const getTestInsight = (k, tipo) => {
    const names = {
      instinto: "sua resposta automática",
      equilibrio: "seu estado mais estável",
      pressao: "sua resposta sob tensão",
    };

    if (k < 0.2) {
      return `${names[tipo]} apareceu de forma muito instável, com forte oscilação no padrão de escolha.`;
    }
    if (k < 0.5) {
      return `${names[tipo]} mostrou alternância entre direções, sugerindo dúvida ou ajuste interno durante o teste.`;
    }
    if (k < 0.8) {
      return `${names[tipo]} mostrou boa consistência, indicando direção relativamente clara neste estado.`;
    }
    return `${names[tipo]} ficou muito concentrada em uma única direção, sugerindo forte fechamento no padrão.`;
  };

  const faixa = getBand(resultadoGeral.kappa);

  setText("resultadoEmoji", faixa.emoji);
  setText("resultadoFrase", faixa.frase);
  setText("resultadoSub", faixa.sub);
  setText("estadoBadge", faixa.badge);
  setText("estadoResumo", faixa.resumo);
  setText("resultadoEspelho", faixa.espelho);
  setText("resultadoRisco", faixa.risco);
  setText("resultadoAcao", faixa.acao);
  setText("resultadoConclusao", faixa.conclusao);
  setText("kappaValor", formatK(resultadoGeral.kappa));

  const fillTestBlock = (report, prefix, tipo) => {
    if (!report) {
      setText(`${prefix}Kappa`, "Sem dados");
      setText(`${prefix}Resumo`, "Não houve escolhas válidas suficientes neste teste.");
      setText(`${prefix}Contagem`, "Vermelho: — · Azul: —");
      return;
    }

    setText(`${prefix}Kappa`, `K ${formatK(report.resultado.kappa)}`);
    setText(`${prefix}Resumo`, getTestInsight(report.resultado.kappa, tipo));
    setText(
      `${prefix}Contagem`,
      `Vermelho: ${report.contagem.vermelho} · Azul: ${report.contagem.azul}`
    );
  };

  fillTestBlock(r1, "t1", "instinto");
  fillTestBlock(r2, "t2", "equilibrio");
  fillTestBlock(r3, "t3", "pressao");

  const premiumBtn = byId("premiumBtn");
  if (premiumBtn) {
    premiumBtn.onclick = () => {
      alert("A análise completa entra no próximo passo.");
    };
  }

  const refazerBtn = byId("refazerBtn");
  if (refazerBtn) {
    refazerBtn.onclick = () => {
      window.location.href = "instinto.html";
    };
  }

  const inicioBtn = byId("inicioBtn");
  if (inicioBtn) {
    inicioBtn.onclick = () => {
      window.location.href = "index.html";
    };
  }
});