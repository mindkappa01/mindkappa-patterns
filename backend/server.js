const express = require("express");
const cors = require("cors");

const sessionRoutes = require("./routes/sessions");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", sessionRoutes);

app.get("/healthz", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server rodando em http://localhost:${PORT}`);
});