const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, Payment } = require('mercadopago');

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
});

// Armazenamento temporário em memória (simples por enquanto)
const approvedPayments = new Set();

router.post('/', async (req, res) => {
  try {

    const paymentId = req.body.data?.id;
    if (!paymentId) return res.sendStatus(200);

    const payment = new Payment(client);
    const result = await payment.get({ id: paymentId });

    if (result.status === "approved") {
      console.log("✅ Pagamento aprovado:", paymentId);
      approvedPayments.add(String(paymentId));
    }

    res.sendStatus(200);

  } catch (err) {
    console.error("Erro no webhook:", err);
    res.sendStatus(500);
  }
});

// Rota para verificar status
router.get('/status', (req, res) => {
  const paymentId = req.query.payment_id;

  if (!paymentId) {
    return res.json({ approved: false });
  }

  const isApproved = approvedPayments.has(String(paymentId));

  res.json({ approved: isApproved });
});

module.exports = router;
