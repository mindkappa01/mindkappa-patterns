const express = require("express");
const router = express.Router();
const MCDCore = require("../core/MCDCore");

router.post("/session", (req, res) => {
  const result = MCDCore.processSession(req.body);

  if (!result.success) {
    return res.status(400).json(result);
  }

  return res.status(200).json(result);
});

module.exports = router;