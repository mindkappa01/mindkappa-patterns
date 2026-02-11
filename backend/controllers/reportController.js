const openaiService = require('../services/openaiService');

const ReportController = {
  freeReport: async (req, res) => {
    try {
      const report = await openaiService.generateFree(req.body.userData);
      res.json({ success: true, report });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  premiumReport: async (req, res) => {
    try {
      const report = await openaiService.generatePremium(req.body.userData);
      res.json({ success: true, report });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

module.exports = ReportController;
