require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
//const testRoutes = require('./routes/testRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rotas carregadas dinamicamente
//app.use('/api/tests', require('./routes/tests'));
//app.use('/api/coherence', require('./routes/coherence'));
app.use('/api/reports', require('./routes/reports'));
//app.use('/api/payments', require('./routes/payments'));
//app.use('/api/session', require('./routes/session'));
//app.use('/api', testRoutes);

// Health check
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', version: '2.0', timestamp: new Date().toISOString() });
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 MindKappa Backend 2.0 rodando na porta ${PORT}`));
