const { MercadoPagoConfig, Preference } = require('mercadopago');

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
});

module.exports = {
  createPreference: async () => {
    const preference = new Preference(client);

    const res = await preference.create({
      body: {
        items: [
          { title: "Relatório Premium MindKappa", quantity: 1, unit_price: 9.9 }
        ]
      }
    });

    return res.body.init_point;
  }
};
