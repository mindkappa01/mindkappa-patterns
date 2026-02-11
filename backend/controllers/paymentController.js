const paymentService = require('../services/paymentService');

const PaymentController = {
  createPayment: async (req, res) => {
    try {
      const link = await paymentService.createPreference();
      res.json({ success: true, link });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

module.exports = PaymentController;
