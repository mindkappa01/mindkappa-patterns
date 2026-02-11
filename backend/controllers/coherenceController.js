const mcdService = require('../services/mcdService');

const CoherenceController = {
  calculate: async (req, res) => {
    try {
      const { choices } = req.body;
      const report = mcdService.calculate(choices);
      res.json({ success: true, coherence: report });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
};

module.exports = CoherenceController;
