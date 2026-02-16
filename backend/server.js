require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ROTAS
app.use('/api/payments', require('./routes/payments'));
app.use('/api/webhook', require('./routes/webhook'));

// Health check
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', version: '3.0', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 MindKappa Backend 3.0 rodando na porta ${PORT}`)
);
