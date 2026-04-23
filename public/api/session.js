const MCDCore = require("../backend/core/MCDCore");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed"
    });
  }

  try {
    const result = MCDCore.processSession(req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Erro em /api/session:", error);

    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
};