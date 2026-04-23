console.log("📊 Resultado MindKappa carregado (novo fluxo completo)");

document.addEventListener("DOMContentLoaded", () => {
  const response = JSON.parse(localStorage.getItem("mk_session_response") || "null");

  const byId = (id) => document.getElementById(id);

  const setText = (id, value) => {
    const el = byId(id);
    if (el) el.textContent = value;
  };

  const clearSession = () => {
    localStorage.removeItem("teste1_instinto");
    localStorage.removeItem("teste2_equilibrio");
    localStorage.removeItem("teste3_pressao");
    localStorage.removeItem("mk_session_response");
    localStorage.removeItem("mk_session_response_manual");
    localStorage.removeItem("teste1_instinto_backend_response");
    localStorage.removeItem("mk_paid_result");
    localStorage.removeItem("mk_result_views");
  };

  function formatMs(ms) {
    if (ms === null || ms === undefined || !Number.isFinite(ms)) return "—";
    if (ms < 1000) return `${ms} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  }

  function formatNumber(value, digits = 2) {
    if (value === null || value === undefined || !Number.isFinite(value)) return "—";
    return Number(value).toFixed(digits);
  }

  function formatTestName(testType) {
    const names = {
      instinto: "Instinto",
      equilibrio: "Equilíbrio",
      pressao: "Pressão"
    };
    return names[testType] || testType || "Teste";
  }

  function buildSessionMainText(sessionMetrics) {
    const mostStable = sessionMetrics?.most_stable_test;
    const leastStable = sessionMetrics?.least_stable_test;
    const fastest = sessionMetrics?.fastest_test;
    const slowest = sessionMetrics?.slowest_test;

    if (mostStable && leastStable && mostStable !== leastStable) {
      let text = `Seu padrão não apareceu do mesmo jeito nos 3 contextos. Houve mais estabilidade em ${formatTestName(mostStable)} e mais oscilação em ${formatTestName(leastStable)}.`;

      if (fastest && slowest && fastest !== slowest) {
        text += ` O ritmo mais rápido apareceu em ${formatTestName(fastest)}, enquanto o maior atrito apareceu em ${formatTestName(slowest)}.`;
      }

      return text;
    }

    const overallKappa = sessionMetrics?.overall_kappa;

    if (overallKappa !== null && overallKappa !== undefined) {
      if (overallKappa >= 4) {
        return "Sua sessão mostrou um padrão muito estável ao longo dos testes, com forte continuidade nas escolhas.";
      }
      if (overallKappa >= 1.5) {
        return "Sua sessão mostrou alguma consistência, mas com variações entre os contextos.";
      }
      return "Sua sessão mostrou um padrão mais oscilante, com menor concentração de escolhas ao longo dos testes.";
    }

    return "Sua sessão foi processada, mas ainda não há dados suficientes para uma leitura mais detalhada.";
  }

  function buildRiskText(sessionMetrics) {
    const mostStable = sessionMetrics?.most_stable_test;
    const leastStable = sessionMetrics?.least_stable_test;
    const overallReversals = sessionMetrics?.overall_reversals;

    if (mostStable && leastStable && mostStable !== leastStable) {
      return `Se você decidir agora, o ponto principal não é apenas o lado escolhido, mas onde sua direção se sustentou e onde ela cedeu. Nesta sessão, sua base mais firme apareceu em ${formatTestName(mostStable)}, enquanto a maior quebra apareceu em ${formatTestName(leastStable)}.`;
    }

    if (overallReversals !== null && overallReversals !== undefined) {
      if (overallReversals <= 20) {
        return "Se você decidir agora, sua sessão sugere mais continuidade do que quebra. O cuidado é diferenciar convicção de rigidez.";
      }
      if (overallReversals <= 50) {
        return "Se você decidir agora, há sinais mistos de continuidade e oscilação. Talvez o mais importante seja observar em qual contexto sua direção ficou mais firme.";
      }
      return "Se você decidir agora, sua sessão sugere bastante alternância. O risco pode estar menos no impulso puro e mais na dificuldade de sustentar a mesma linha.";
    }

    return "Se você decidir agora, o mais importante é observar como seu padrão mudou entre Instinto, Equilíbrio e Pressão.";
  }

  function buildActionText(sessionMetrics) {
    const fastest = sessionMetrics?.fastest_test;
    const slowest = sessionMetrics?.slowest_test;
    const mostStable = sessionMetrics?.most_stable_test;

    if (mostStable && slowest && mostStable === slowest) {
      return `Sua direção mais firme apareceu em ${formatTestName(mostStable)}, mesmo com mais atrito. Isso sugere que nem toda lentidão é desorganização — às vezes ela acompanha uma escolha que se sustenta melhor.`;
    }

    if (mostStable && fastest && mostStable === fastest) {
      return `Sua direção mais firme apareceu em ${formatTestName(mostStable)} e também foi ali que a resposta saiu mais rápida. Isso sugere um contexto de decisão mais direto nesta sessão.`;
    }

    if (mostStable) {
      return `Use este resultado como leitura do momento. Se houver uma decisão importante agora, vale prestar mais atenção ao contexto em que sua mente ficou mais estável: ${formatTestName(mostStable)}.`;
    }

    return "Use este resultado como leitura do seu momento. A análise completa aprofunda o que se manteve, o que oscilou e o que mudou quando o contexto mudou.";
  }

  function buildConclusionText(sessionMetrics) {
    const mostStable = sessionMetrics?.most_stable_test;
    const leastStable = sessionMetrics?.least_stable_test;

    if (mostStable && leastStable && mostStable !== leastStable) {
      return `Sua sessão sugere um padrão momentâneo com contraste entre contextos: mais estabilidade em ${formatTestName(mostStable)} e mais oscilação em ${formatTestName(leastStable)}. Isso não define quem você é, mas mostra como sua mente respondeu agora.`;
    }

    return "Seu resultado sugere um padrão momentâneo de decisão. Ele não define quem você é, mas mostra como sua mente está funcionando agora.";
  }

  function buildTestSummary(report) {
    if (!report) return "Sem dados válidos para este teste.";

    const consistency = report.consistency_label || "Sem dados";
    const speed = report.speed_label || "Sem dados";
    const continuity = report.continuity_label || "Sem dados";

    const chunks = [];

    if (consistency !== "Sem dados") {
      if (consistency === "Muito consistente") {
        chunks.push("Seu padrão ficou muito estável neste contexto.");
      } else if (consistency === "Consistente") {
        chunks.push("Houve uma direção relativamente estável neste contexto.");
      } else if (consistency === "Oscilante") {
        chunks.push("Seu padrão oscilou mais neste contexto.");
      } else if (consistency === "Disperso") {
        chunks.push("As escolhas ficaram mais dispersas neste contexto.");
      }
    }

    if (speed !== "Sem dados") {
      if (speed === "Rápido") {
        chunks.push("O ritmo de resposta foi rápido.");
      } else if (speed === "Moderado") {
        chunks.push("O ritmo de resposta ficou em uma faixa intermediária.");
      } else if (speed === "Hesitante") {
        chunks.push("Houve mais atrito no tempo de resposta.");
      }
    }

    if (continuity !== "Sem dados") {
      if (continuity === "Sustentado") {
        chunks.push("Você conseguiu sustentar a mesma linha por mais tempo.");
      } else if (continuity === "Quebrado") {
        chunks.push("Houve várias quebras de direção ao longo do teste.");
      } else if (continuity === "Intermediário") {
        chunks.push("A continuidade ficou entre sustentação e quebra.");
      }
    }

    if (!chunks.length) {
      return "Este teste foi processado, mas ainda sem dados suficientes para leitura detalhada.";
    }

    return chunks.join(" ");
  }

  function buildTestMeta(report, emoji) {
    if (!report) return "Dados indisponíveis";

    const parts = [];

    parts.push(`${emoji} ${report.total_trials ?? "—"} decisões`);
    parts.push(`válidas: ${report.valid_trials ?? "—"}`);
    parts.push(`L:${report.left_count ?? "—"}`);
    parts.push(`R:${report.right_count ?? "—"}`);
    parts.push(`rev:${report.reversals ?? "—"}`);
    parts.push(`run:${report.longest_run ?? "—"}`);

    return parts.join(" · ");
  }

  function buildKappaHeader(report) {
    if (!report) return "—";

    const k = report.kappa;
    const r = report.r;

    if (k !== null && k !== undefined && r !== null && r !== undefined) {
      return `K ${formatNumber(k, 2)} · R ${formatNumber(r, 2)}`;
    }

    if (k !== null && k !== undefined) {
      return `K ${formatNumber(k, 2)}`;
    }

    return `${report.total_trials ?? "—"} decisões`;
  }

  function fillTestBlock(report, prefix, nome, emoji, descricaoBase) {
    if (!report) {
      setText(`${prefix}Kappa`, "—");
      setText(`${prefix}Resumo`, `Não houve dados válidos para ${nome}.`);
      setText(`${prefix}Contagem`, "Dados indisponíveis");
      return;
    }

    const extra = [
      `Tempo médio: ${formatMs(report.mean_reaction_time_ms)}.`,
      `Reversões: ${report.reversals ?? "—"}.`,
      `Maior sequência: ${report.longest_run ?? "—"}.`
    ].join(" ");

    setText(`${prefix}Kappa`, buildKappaHeader(report));
    setText(
      `${prefix}Resumo`,
      `${descricaoBase} ${buildTestSummary(report)} ${extra}`
    );
    setText(`${prefix}Contagem`, buildTestMeta(report, emoji));
  }

  if (!response || !response.success) {
    setText("resultadoEmoji", "⚠️");
    setText("resultadoFrase", "Não foi possível gerar seu resultado agora.");
    setText("resultadoSub", "Finalize os 3 testes novamente para ver sua leitura.");
    setText("estadoBadge", "Sem dados");
    setText("estadoResumo", "Não encontramos uma resposta válida da sua sessão.");
    setText("kappaValor", "—");
    setText("resultadoEspelho", "Sem dados suficientes para interpretar seu padrão neste momento.");
    setText("resultadoRisco", "Refaça os testes para gerar uma nova leitura.");
    setText("resultadoAcao", "Volte ao início e complete os 3 testes em sequência.");
    setText("t1Kappa", "—");
    setText("t1Resumo", "Sem dados válidos para Instinto.");
    setText("t1Contagem", "Dados indisponíveis");
    setText("t2Kappa", "—");
    setText("t2Resumo", "Sem dados válidos para Equilíbrio.");
    setText("t2Contagem", "Dados indisponíveis");
    setText("t3Kappa", "—");
    setText("t3Resumo", "Sem dados válidos para Pressão.");
    setText("t3Contagem", "Dados indisponíveis");
    setText("resultadoConclusao", "Seu resultado não pôde ser calculado nesta tentativa.");
    return;
  }

  const sessionMetrics = response.session_metrics || {};
  const testMetrics = response.test_metrics || [];
  const display = response.display_summary || {};

  const instinto = testMetrics.find((t) => t.test_type === "instinto");
  const equilibrio = testMetrics.find((t) => t.test_type === "equilibrio");
  const pressao = testMetrics.find((t) => t.test_type === "pressao");

  const totalTests = sessionMetrics.total_tests ?? testMetrics.length ?? 0;
  const totalTrials = sessionMetrics.total_trials ?? "—";

  setText("resultadoEmoji", "🧠");
  setText(
    "resultadoFrase",
    display.main_message || buildSessionMainText(sessionMetrics)
  );

  setText(
    "resultadoSub",
    `Este resultado mostra como sua mente respondeu ao conjunto dos ${totalTests} testes, com ${totalTrials} decisões registradas.`
  );

  setText(
    "estadoBadge",
    display.coherence_level || "Processado"
  );

  setText(
    "estadoResumo",
    (display.highlights && display.highlights.length)
      ? display.highlights.join(" ")
      : buildSessionMainText(sessionMetrics)
  );

  setText(
    "kappaValor",
    sessionMetrics.overall_kappa !== null && sessionMetrics.overall_kappa !== undefined
      ? `K ${formatNumber(sessionMetrics.overall_kappa, 2)} · R ${formatNumber(sessionMetrics.overall_r, 2)}`
      : "—"
  );

  setText("resultadoEspelho", buildSessionMainText(sessionMetrics));
  setText("resultadoRisco", buildRiskText(sessionMetrics));
  setText("resultadoAcao", buildActionText(sessionMetrics));

  fillTestBlock(
    instinto,
    "t1",
    "Instinto",
    "⚡",
    "Aqui aparece como sua resposta automática se organizou quando o fluxo pedia decisão mais direta."
  );

  fillTestBlock(
    equilibrio,
    "t2",
    "Equilíbrio",
    "⚖️",
    "Aqui aparece seu padrão em um contexto mais estável, funcionando como base comparativa da sessão."
  );

  fillTestBlock(
    pressao,
    "t3",
    "Pressão",
    "🔥",
    "Aqui aparece como seu comportamento respondeu quando o contexto ficou mais apertado e instável."
  );

  setText("resultadoConclusao", buildConclusionText(sessionMetrics));

  const premiumBtn = byId("premiumBtn");
  if (premiumBtn) {
    premiumBtn.onclick = () => {
      window.location.href = "analise-completa.html";
    };
  }

  const alivioBtn = byId("alivioBtn");
  if (alivioBtn) {
    alivioBtn.onclick = () => {
      window.location.href = "alivio.html";
    };
  }

  const refazerBtn = byId("refazerBtn");
  if (refazerBtn) {
    refazerBtn.onclick = () => {
      clearSession();
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