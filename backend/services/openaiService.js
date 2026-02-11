const OpenAI = require("openai");
const iaKappaPrompt = require("./iakappaprompt");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateIAKappaReport({ kappa, nDecisoes, contexto }) {
  const userPrompt = `
DADOS DO PARTICIPANTE:
- Valor médio: ${kappa}
- Número de decisões: ${nDecisoes}
- Contexto: ${contexto}

INSTRUÇÕES:
1) Analise os dados acima.
2) Crie um perfil mental positivo.
3) Gere o relatório no formato JSON obrigatório.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.6,
    messages: [
      { role: "system", content: iaKappaPrompt },
      { role: "user", content: userPrompt }
    ]
  });

  const resposta = completion.choices[0].message.content;

  try {
    return JSON.parse(resposta);
  } catch (err) {
    console.error("IA-Kappa retornou algo inválido:", resposta);
    throw new Error("Resposta da IA inválida (não é JSON).");
  }
}

module.exports = {
  generateIAKappaReport
};
