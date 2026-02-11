function validateChoices(choices) {
  if (!Array.isArray(choices)) {
    throw new Error("As escolhas devem estar em um array");
  }

  for (const c of choices) {
    if (c !== 0 && c !== 180 && c !== null) {
      throw new Error("Escolhas devem ser 0, 180 ou null");
    }
  }
}

function calculateKappa(choices) {
  const validChoices = choices.filter(c => c === 0 || c === 180);
  const N = validChoices.length;

  if (N === 0) return { kappa: 0, R: 0 };

  let sumCos = 0;
  let sumSin = 0;

  for (const angle of validChoices) {
    const rad = angle * (Math.PI / 180);
    sumCos += Math.cos(rad);
    sumSin += Math.sin(rad);
  }

  const R = Math.sqrt(sumCos ** 2 + sumSin ** 2) / N;
  return { kappa: R, R };
}

function classifyCoherence(k) {
  if (k < 0.20) return { level: "Alta variabilidade", emoji: "🌪️", color: "#6b7280" };
  if (k < 0.50) return { level: "Oscilação", emoji: "🎨", color: "#10b981" };
  if (k < 0.80) return { level: "Coerência", emoji: "🌿", color: "#3b82f6" };
  return { level: "Alta rigidez", emoji: "🔥", color: "#ef4444" };
}

function generateReport(choices) {
  validateChoices(choices);

  const { kappa, R } = calculateKappa(choices);
  const coherence = classifyCoherence(kappa);

  const blueCount = choices.filter(c => c === 0).length;
  const redCount = choices.filter(c => c === 180).length;
  const timeoutCount = choices.filter(c => c === null).length;

  return {
    kappa,
    R,
    nivel: coherence.level,
    emoji: coherence.emoji,
    color: coherence.color,
    statistics: {
      blueCount,
      redCount,
      timeoutCount,
      total: choices.length
    },
    timestamp: Date.now()
  };
}

window.MCDCore = { generateReport };
