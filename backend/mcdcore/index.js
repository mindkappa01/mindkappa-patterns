// ============================================
// 🧠 MindKappa — MCDCore (versão oficial 0°/180°)
// ============================================

function validateChoices(choices) {
  if (!Array.isArray(choices)) {
    throw new Error("As escolhas devem estar em um array");
  }

  for (const c of choices) {
    if (c !== 0 && c !== 180) {
      throw new Error("Cada escolha deve ser 0 (azul) ou 180 (vermelho)");
    }
  }
}

function calculateKappa(choices) {
  const N = choices.length;
  if (N === 0) return { kappa: 0, R: 0 };

  let sumCos = 0;
  let sumSin = 0;

  for (const angle of choices) {
    const rad = angle * (Math.PI / 180);
    sumCos += Math.cos(rad);
    sumSin += Math.sin(rad);
  }

  const R = Math.sqrt(sumCos ** 2 + sumSin ** 2) / N;
  const kappa = R;

  return { kappa, R };
}

function classifyCoherence(k) {
  if (k < 0.20) return { level: "caótico", emoji: "🌪️", color: "#6b7280" };
  if (k < 0.50) return { level: "oscilações criativas", emoji: "🎨", color: "#10b981" };
  if (k < 0.80) return { level: "coerente", emoji: "🌿", color: "#3b82f6" };
  return { level: "extremamente coerente", emoji: "🔥", color: "#ef4444" };
}

function generateReport(choices) {
  validateChoices(choices);

  const { kappa, R } = calculateKappa(choices);

  const coherence = classifyCoherence(kappa);

  const blueCount = choices.filter(c => c === 0).length;
  const redCount = choices.filter(c => c === 180).length;

  return {
    kappa: Number(kappa.toFixed(3)),
    R: Number(R.toFixed(3)),
    coherenceLevel: coherence.level,
    emoji: coherence.emoji,
    color: coherence.color,
    statistics: {
      blueCount,
      redCount,
      total: choices.length
    },
    timestamp: Date.now()
  };
}

module.exports = {
  validateChoices,
  generateReport
};
