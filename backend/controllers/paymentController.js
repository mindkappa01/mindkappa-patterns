const paymentService = require('../services/paymentService');

const PaymentController = {
  createPayment: async (req, res) => {
    try {
      const { link, sessionId } = await paymentService.createPreference();

      res.json({
        success: true,
        link,
        sessionId
      });

    } catch (err) {
      console.error("Erro ao criar pagamento:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

module.exports = PaymentController;
