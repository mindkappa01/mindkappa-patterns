const db = require('../db/pool');

const SessionController = {
  save: async (req, res) => {
    try {
      const result = await db.query(
        `INSERT INTO mindkappa_sessions (data) VALUES ($1) RETURNING id`,
        [req.body]
      );
      res.json({ success: true, sessionId: result.rows[0].id });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

module.exports = SessionController;
