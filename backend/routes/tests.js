const express = require('express');
const router = express.Router();
//const MCDCore = require('../mcd-core');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

router.post('/tests', async (req, res) => {
  try {
    const { sessionId, testType, choices } = req.body;

    if (!sessionId || !testType || !choices) {
      return res.status(400).json({ success: false, error: 'Dados insuficientes.' });
    }

    const report = MCDCore.generateReport(choices);

    // Salvar no BD
    try {
      await pool.query(
        `INSERT INTO mindkappa_tests (session_id, test_type, choices, kappa, r_value, blue_count, red_count, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
        [
          sessionId,
          testType,
          choices,
          report.kappa,
          report.R,
          report.statistics.blueCount,
          report.statistics.redCount
        ]
      );
    } catch (dbErr) {
      console.log("⚠ Erro ao salvar teste:", dbErr.message);
    }

    return res.json({
      success: true,
      sessionId,
      testType,
      ...report
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
