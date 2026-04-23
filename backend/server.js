require("dotenv").config({ path: "../.env" });

const express = require("express");
const cors = require("cors");

const sessionRoutes = require("./routes/sessions");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/api", sessionRoutes);

app.get("/healthz", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Rota não encontrada",
    path: req.originalUrl
  });
});

app.use((err, req, res, next) => {
  console.error("Erro interno no servidor:", err);

  res.status(500).json({
    success: false,
    error: "Erro interno do servidor"
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server rodando em http://localhost:${PORT}`);
});