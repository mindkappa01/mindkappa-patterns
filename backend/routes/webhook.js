const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, Payment } = require('mercadopago');

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
});

router.post('/', async (req, res) => {

  try {

    const paymentId = req.body.data?.id;

    if (!paymentId) return res.sendStatus(200);

    const payment = new Payment(client);
    const result = await payment.get({ id: paymentId });

    if (result.status === "approved") {
      console.log("✅ Pagamento aprovado:", paymentId);
      // Aqui depois podemos salvar no banco
    }

    res.sendStatus(200);

  } catch (err) {
    console.error("Erro no webhook:", err);
    res.sendStatus(500);
  }

});

module.exports = router;
