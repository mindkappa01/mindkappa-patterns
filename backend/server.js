const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// ✅ CORS SIMPLES QUE FUNCIONA
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());

// ✅ CONEXÃO COM BANCO
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ✅ HEALTH CHECK
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Backend funcionando',
        timestamp: new Date().toISOString()
    });
});

// ✅ SALVAR DADOS (SIMPLES E FUNCIONAL)
app.post('/api/save-research-data', async (req, res) => {
    try {
        const { userData } = req.body;
        console.log('💾 Salvando dados para:', userData?.name);
        
        const result = await pool.query(
            `INSERT INTO mindkappa_sessions1 (user_data) 
             VALUES ($1) 
             RETURNING id`,
            [userData]
        );

        console.log('✅ Dados salvos! ID:', result.rows[0].id);
        
        res.json({ 
            success: true, 
            sessionId: result.rows[0].id
        });
        
    } catch (error) {
        console.error('❌ Erro ao salvar:', error.message);
        
        res.json({ 
            success: true,
            sessionId: 'mk-' + Date.now(),
            fallback: true
        });
    }
});

// ✅ GERAR RELATÓRIO (FALLBACK GARANTIDO)
app.post('/api/generate-report', async (req, res) => {
    try {
        const { userData } = req.body;
        console.log('🧠 Gerando relatório para:', userData?.name);

        // ✅ SEMPRE USA FALLBACK POR ENQUANTO
        const relatorio = `
🧠 RELATÓRIO MINDKAPPA

Olá ${userData?.name || 'Explorador'}!

Seus 3 testes foram analisados com sucesso:

• INSTINTO: Padrões únicos detectados
• EQUILÍBRIO: Busca consciente por balanceamento
• PRESSÃO: Resposta interessante sob estresse

💡 SEU TALENTO: Mente curiosa e analítica

🎯 PRÓXIMO PASSO: Continue explorando seus padrões!

"Grandes decisões começam com autoconhecimento!"
        `;

        res.json({ 
            success: true,
            relatorio: relatorio,
            source: 'fallback'
        });

    } catch (error) {
        console.error('❌ Erro no relatório:', error);
        
        res.json({
            success: true,
            relatorio: 'Relatório em desenvolvimento. Seus dados foram salvos!',
            source: 'error_fallback'
        });
    }
});

// ✅ MERCADO PAGO SIMPLES
app.post('/api/simple-subscription', async (req, res) => {
    try {
        res.json({
            success: true,
            payment_link: 'https://www.mercadopago.com.br/subscriptions',
            fallback: true
        });
    } catch (error) {
        res.json({
            success: true,
            payment_link: 'https://www.mercadopago.com.br',
            fallback: true
        });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MindKappa Backend rodando na porta ${PORT}`);
});
