const { validateSessionPayload } = require("../utils/validators");

class MCDCore {
  static processSession(payload) {
    const validation = validateSessionPayload(payload);

    if (!validation.isValid) {
      return {
        success: false,
        validation,
        session_metrics: null,
        test_metrics: [],
        display_summary: null
      };
    }

    const testMetrics = payload.tests.map((test) =>
      this.computeTestMetrics(test)
    );

    const sessionMetrics = this.computeSessionMetrics(payload, testMetrics);
    const displaySummary = this.buildDisplaySummary(sessionMetrics, testMetrics);

    return {
      success: true,
      validation,
      session_metrics: sessionMetrics,
      test_metrics: testMetrics,
      display_summary: displaySummary
    };
  }

  static computeTestMetrics(test) {
    const trials = Array.isArray(test?.trials) ? test.trials : [];
    const validTrials = trials.filter((trial) => this.isValidTrial(trial));

    const totalTrials = trials.length;
    const validCount = validTrials.length;

    const leftCount = validTrials.filter((t) => t.choice_side === "left").length;
    const rightCount = validTrials.filter((t) => t.choice_side === "right").length;
    const timeoutCount = trials.filter((t) => t.timed_out === true).length;

    const meanReactionTimeMs = this.computeMeanReactionTime(validTrials);
    const reversals = this.computeReversals(validTrials);
    const longestRun = this.computeLongestRun(validTrials);
    const r = this.computeResultantLength(validTrials);
    const kappa = this.estimateKappaFromR(r, validCount);

    const startedAt = test?.started_at || null;
    const finishedAt = test?.finished_at || null;
    const durationMs = this.computeDurationMs(startedAt, finishedAt);

    return {
      test_type: test?.test_type || "desconhecido",
      started_at: startedAt,
      finished_at: finishedAt,
      duration_ms: durationMs,

      total_trials: totalTrials,
      valid_trials: validCount,
      timeout_trials: timeoutCount,

      left_count: leftCount,
      right_count: rightCount,

      mean_reaction_time_ms: meanReactionTimeMs,
      reversals,
      longest_run: longestRun,

      r,
      kappa,

      consistency_label: this.getConsistencyLabel(kappa),
      speed_label: this.getSpeedLabel(meanReactionTimeMs),
      continuity_label: this.getContinuityLabel(reversals, longestRun, validCount)
    };
  }

  static computeSessionMetrics(payload, testMetrics) {
    const allTrials = Array.isArray(payload?.tests)
      ? payload.tests.flatMap((test) => Array.isArray(test?.trials) ? test.trials : [])
      : [];

    const validTrials = allTrials.filter((trial) => this.isValidTrial(trial));

    const totalTests = Array.isArray(payload?.tests) ? payload.tests.length : 0;
    const totalTrials = allTrials.length;
    const validCount = validTrials.length;

    const overallMeanReactionTimeMs = this.computeMeanReactionTime(validTrials);
    const overallReversals = this.computeReversals(validTrials);
    const overallLongestRun = this.computeLongestRun(validTrials);
    const overallR = this.computeResultantLength(validTrials);
    const overallKappa = this.estimateKappaFromR(overallR, validCount);

    const mostStableTest = this.pickExtremeTest(testMetrics, "kappa", "max");
    const leastStableTest = this.pickExtremeTest(testMetrics, "kappa", "min");
    const fastestTest = this.pickExtremeTest(testMetrics, "mean_reaction_time_ms", "min");
    const slowestTest = this.pickExtremeTest(testMetrics, "mean_reaction_time_ms", "max");
    const mostReversalTest = this.pickExtremeTest(testMetrics, "reversals", "max");
    const longestRunTest = this.pickExtremeTest(testMetrics, "longest_run", "max");

    return {
      started_at: payload?.started_at || null,
      finished_at: payload?.finished_at || null,
      duration_ms: this.computeDurationMs(payload?.started_at, payload?.finished_at),

      total_tests: totalTests,
      total_trials: totalTrials,
      valid_trials: validCount,

      overall_mean_reaction_time_ms: overallMeanReactionTimeMs,
      overall_reversals: overallReversals,
      overall_longest_run: overallLongestRun,
      overall_r: overallR,
      overall_kappa: overallKappa,

      fastest_test: fastestTest?.test_type || null,
      slowest_test: slowestTest?.test_type || null,
      most_stable_test: mostStableTest?.test_type || null,
      least_stable_test: leastStableTest?.test_type || null,
      most_reversal_test: mostReversalTest?.test_type || null,
      longest_run_test: longestRunTest?.test_type || null
    };
  }

  static buildDisplaySummary(sessionMetrics, testMetrics) {
    const overallKappa = sessionMetrics?.overall_kappa;
    const coherenceLevel = this.getConsistencyLabel(overallKappa);

    const mostStable = this.findTestByType(
      testMetrics,
      sessionMetrics?.most_stable_test
    );
    const leastStable = this.findTestByType(
      testMetrics,
      sessionMetrics?.least_stable_test
    );
    const fastest = this.findTestByType(
      testMetrics,
      sessionMetrics?.fastest_test
    );
    const slowest = this.findTestByType(
      testMetrics,
      sessionMetrics?.slowest_test
    );

    const highlights = [];

    if (mostStable && leastStable && mostStable.test_type !== leastStable.test_type) {
      highlights.push(
        `Seu padrão ficou mais consistente em ${this.formatTestName(mostStable.test_type)} e mais instável em ${this.formatTestName(leastStable.test_type)}.`
      );
    }

    if (fastest && slowest && fastest.test_type !== slowest.test_type) {
      highlights.push(
        `O ritmo mais rápido apareceu em ${this.formatTestName(fastest.test_type)}, enquanto o maior atrito apareceu em ${this.formatTestName(slowest.test_type)}.`
      );
    }

    if (!highlights.length) {
      highlights.push(
        "Sua sessão foi processada com sucesso. O valor principal agora está em comparar como seu padrão apareceu em Instinto, Equilíbrio e Pressão."
      );
    }

    return {
      message: "Sessão válida recebida com sucesso.",
      main_message: this.buildMainMessage(sessionMetrics, testMetrics),
      coherence_level: coherenceLevel,
      highlights
    };
  }

  static buildMainMessage(sessionMetrics, testMetrics) {
    const mostStable = this.findTestByType(
      testMetrics,
      sessionMetrics?.most_stable_test
    );
    const leastStable = this.findTestByType(
      testMetrics,
      sessionMetrics?.least_stable_test
    );

    if (mostStable && leastStable && mostStable.test_type !== leastStable.test_type) {
      return `Seu padrão mudou entre os contextos: houve mais estabilidade em ${this.formatTestName(mostStable.test_type)} e mais oscilação em ${this.formatTestName(leastStable.test_type)}.`;
    }

    const overallKappa = sessionMetrics?.overall_kappa ?? 0;

    if (overallKappa >= 4) {
      return "Sua sessão mostrou um padrão de resposta muito estável ao longo dos testes.";
    }

    if (overallKappa >= 1.5) {
      return "Sua sessão mostrou um padrão relativamente consistente, com alguma variação entre os testes.";
    }

    return "Sua sessão mostrou um padrão mais oscilante, com menor concentração de escolhas ao longo dos testes.";
  }

  static isValidTrial(trial) {
    if (!trial || trial.timed_out === true) return false;

    const validSide = trial.choice_side === "left" || trial.choice_side === "right";
    const validAngle = typeof trial.choice_angle_deg === "number" && Number.isFinite(trial.choice_angle_deg);
    const validReactionTime =
      typeof trial.reaction_time_ms === "number" &&
      Number.isFinite(trial.reaction_time_ms) &&
      trial.reaction_time_ms >= 0;

    return validSide && validAngle && validReactionTime;
  }

  static computeMeanReactionTime(trials) {
    if (!trials.length) return null;

    const total = trials.reduce((sum, trial) => sum + trial.reaction_time_ms, 0);
    return Math.round(total / trials.length);
  }

  static computeReversals(trials) {
    if (trials.length < 2) return 0;

    let reversals = 0;

    for (let i = 1; i < trials.length; i++) {
      if (trials[i].choice_side !== trials[i - 1].choice_side) {
        reversals++;
      }
    }

    return reversals;
  }

  static computeLongestRun(trials) {
    if (!trials.length) return 0;

    let longest = 1;
    let current = 1;

    for (let i = 1; i < trials.length; i++) {
      if (trials[i].choice_side === trials[i - 1].choice_side) {
        current++;
        if (current > longest) longest = current;
      } else {
        current = 1;
      }
    }

    return longest;
  }

  static computeResultantLength(trials) {
    if (!trials.length) return null;

    let sumX = 0;
    let sumY = 0;

    for (const trial of trials) {
      const angleRad = (trial.choice_angle_deg * Math.PI) / 180;
      sumX += Math.cos(angleRad);
      sumY += Math.sin(angleRad);
    }

    const n = trials.length;
    const r = Math.sqrt(sumX ** 2 + sumY ** 2) / n;

    return Number(r.toFixed(4));
  }

  static estimateKappaFromR(r, n = 0) {
    if (r === null || r === undefined || !Number.isFinite(r)) return null;
    if (n <= 0) return null;
    if (r < 1e-8) return 0;

    let kappa;

    if (r < 0.53) {
      kappa = 2 * r + r ** 3 + (5 * (r ** 5)) / 6;
    } else if (r < 0.85) {
      kappa = -0.4 + 1.39 * r + 0.43 / (1 - r);
    } else {
      kappa = 1 / (r ** 3 - 4 * r ** 2 + 3 * r);
    }

    if (n < 15 && kappa !== null) {
      if (kappa < 2) {
        kappa = Math.max(kappa - 2 / (n * Math.max(kappa, 0.0001)), 0);
      } else {
        kappa = ((n - 1) ** 3 * kappa) / (n ** 3 + n);
      }
    }

    if (!Number.isFinite(kappa)) return null;

    return Number(kappa.toFixed(4));
  }

  static computeDurationMs(startedAt, finishedAt) {
    if (!startedAt || !finishedAt) return null;

    const start = new Date(startedAt).getTime();
    const end = new Date(finishedAt).getTime();

    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;

    return Math.max(0, end - start);
  }

  static pickExtremeTest(testMetrics, field, mode = "max") {
    const valid = testMetrics.filter(
      (test) => typeof test?.[field] === "number" && Number.isFinite(test[field])
    );

    if (!valid.length) return null;

    return valid.reduce((best, current) => {
      if (!best) return current;

      if (mode === "min") {
        return current[field] < best[field] ? current : best;
      }

      return current[field] > best[field] ? current : best;
    }, null);
  }

  static findTestByType(testMetrics, testType) {
    if (!testType) return null;
    return testMetrics.find((test) => test.test_type === testType) || null;
  }

  static formatTestName(testType) {
    const names = {
      instinto: "Instinto",
      equilibrio: "Equilíbrio",
      pressao: "Pressão"
    };

    return names[testType] || testType || "Teste";
  }

  static getConsistencyLabel(kappa) {
    if (kappa === null || kappa === undefined) return "Sem dados";
    if (kappa < 0.3) return "Disperso";
    if (kappa < 1.5) return "Oscilante";
    if (kappa < 4) return "Consistente";
    return "Muito consistente";
  }

  static getSpeedLabel(meanReactionTimeMs) {
    if (meanReactionTimeMs === null || meanReactionTimeMs === undefined) {
      return "Sem dados";
    }

    if (meanReactionTimeMs < 700) return "Rápido";
    if (meanReactionTimeMs < 1400) return "Moderado";
    return "Hesitante";
  }

  static getContinuityLabel(reversals, longestRun, validCount) {
    if (!validCount) return "Sem dados";

    const reversalRate = validCount > 1 ? reversals / (validCount - 1) : 0;
    const runRatio = longestRun / validCount;

    if (reversalRate < 0.25 || runRatio >= 0.35) return "Sustentado";
    if (reversalRate > 0.6 && runRatio < 0.2) return "Quebrado";
    return "Intermediário";
  }
}

module.exports = MCDCore;