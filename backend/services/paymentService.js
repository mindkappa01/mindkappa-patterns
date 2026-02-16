const { MercadoPagoConfig, Preference } = require('mercadopago');
const crypto = require('crypto');

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
});

module.exports = {
  createPreference: async () => {

    const sessionId = crypto.randomUUID();

    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: [
          {
            title: "Relatório Premium MindKappa",
            quantity: 1,
            unit_price: 9.9
          }
        ],
        back_urls: {
          success: `${process.env.FRONTEND_URL}/resultado.html?session_id=${sessionId}`,
          failure: `${process.env.FRONTEND_URL}/resultado.html?erro=true`,
          pending: `${process.env.FRONTEND_URL}/resultado.html?pending=true`
        },
        auto_return: "approved",
        notification_url: `${process.env.BACKEND_URL}/api/webhook`
      }
    });

    return {
      link: response.init_point,
      sessionId
    };
  }
};
