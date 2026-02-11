const TestsController = {
  instinto: async (req, res) => {
    res.json({ ok: true, route: "teste_instinto_recebido" });
  },

  equilibrio: async (req, res) => {
    res.json({ ok: true, route: "teste_equilibrio_recebido" });
  },

  pressao: async (req, res) => {
    res.json({ ok: true, route: "teste_pressao_recebido" });
  }
};

module.exports = TestsController;
