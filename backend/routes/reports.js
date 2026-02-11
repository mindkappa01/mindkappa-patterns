const express = require('express');
const router = express.Router();
const { generateIAKappaReport } = require("../services/openaiService");

router.post("/kappa/interpret", async (req, res) => {
  try {
    const { kappa, nDecisoes, contexto } = req.body;

    const relatorio = await generateIAKappaReport({
      kappa,
      nDecisoes,
      contexto
    });

    res.json(relatorio);
  } catch (error) {
    console.error("Erro IA-Kappa:", error.message);
    res.status(500).json({ error: "Falha ao gerar relatório IA-Kappa." });
  }
});

module.exports = router;
