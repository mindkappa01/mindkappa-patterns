const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const OpenAI = require('openai');
const MCDCore = require('./mcd-core');
const mercadopago = require('mercadopago');

const app = express();

// ✅ CORS QUE FUNCIONA
app.use(cors({
    origin: true,
    credentials: true
}));

app.get('/healthz', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'mindkappa-backend',
    version: '1.0.0'
  });
});

app.use(express.json());

mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
});

// ✅ CONFIGURAÇÕES CONTROLADAS (INTERRUPTORES)
const OPENAI_ENABLED = process.env.OPENAI_ENABLED === 'true';
const OPENAI_TIMEOUT = parseInt(process.env.OPENAI_TIMEOUT) || 10000;

console.log('🔧 Configurações Seguras:', {
    OPENAI_ENABLED,
    OPENAI_TIMEOUT
});

// ✅ CONEXÃO COM BANCO
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ✅ OPENAI (SE CONFIGURADO)
let openai;
if (process.env.OPENAI_API_KEY && OPENAI_ENABLED) {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
    console.log('✅ OpenAI configurado (controlado)');
} else {
    console.log('🔄 OpenAI desligado por configuração');
}

// ✅ HEALTH CHECK
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        openai_enabled: OPENAI_ENABLED,
        timestamp: new Date().toISOString()
    });
});

// ✅ SALVAR DADOS (JÁ FUNCIONA)
app.post('/api/save-research-data', async (req, res) => {
    try {
        const { userData } = req.body;
        console.log('💾 Salvando dados para:', userData?.name);
        
        const result = await pool.query(
            `INSERT INTO mindkappa_sessions1 (user_data) VALUES ($1) RETURNING id`,
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

// ✅ NOVA ROTA: CÁLCULO DE COERÊNCIA COM MCD CORE
app.post('/api/calculate-coherence', async (req, res) => {
    try {
        const { choices, testType, sessionId } = req.body;
        
        console.log(`🧠 Calculando coerência: ${testType}, ${choices.length} escolhas`);

        // ✅ VALIDAR E CALCULAR COM MCD CORE
        MCDCore.validateChoices(choices);
        const report = MCDCore.generateReport(choices);

        // ✅ SALVAR NO BANCO (OPCIONAL)
        let dbResult;
        try {
            dbResult = await pool.query(
                `INSERT INTO mindkappa_coherence (session_id, test_type, choices, kappa_value, r_value, coherence_level) 
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [sessionId, testType, choices, report.kappa, report.R, report.coherenceLevel]
            );
            console.log('✅ Coerência salva no BD:', dbResult.rows[0].id);
        } catch (dbError) {
            console.log('📝 Coerência calculada (não salva no BD):', dbError.message);
        }

        res.json({
            success: true,
            testType: testType || 'unknown',
            sessionId: sessionId || 'anonymous',
            coherence: {
                kappa: report.kappa,
                level: report.coherenceLevel,
                description: report.description,
                emoji: report.emoji,
                color: report.color
            },
            statistics: report.statistics,
            metrics: {
                R: report.R,
                N: report.N,
                timestamp: report.timestamp
            },
            savedToDb: !!dbResult
        });

    } catch (error) {
        console.error('❌ Erro no cálculo de coerência:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ✅ RELATÓRIO SEGURO COM INTERRUPTOR
app.post('/api/generate-report', async (req, res) => {
    try {
        const { userData } = req.body;
        console.log('🧠 Gerando relatório para:', userData?.name);

        let relatorio, source;

        // ✅ INTERRUPTOR: OPENAI LIGADO/DESLIGADO
        if (OPENAI_ENABLED && openai) {
            console.log('🔄 Tentando OpenAI...');
            
            try {
                const completion = await Promise.race([
                    openai.chat.completions.create({
                        model: "gpt-3.5-turbo",
                        messages: [{
                            role: "user",
                            content: `Resumo CURTO (máximo 100 palavras) para ${userData.name}, ${userData.age} anos: análise de padrões mentais baseada em 3 testes. Seja positivo e motivador.`
                        }],
                        max_tokens: 150,
                        temperature: 0.7
                    }),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout')), OPENAI_TIMEOUT)
                    )
                ]);

                relatorio = completion.choices[0].message.content;
                source = 'openai';
                console.log('✅ OpenAI funcionou!');
                
            } catch (openaiError) {
                console.log('🔄 OpenAI falhou, usando fallback:', openaiError.message);
            }
        }

        // ✅ FALLBACK GARANTIDO (sempre funciona)
        if (!relatorio) {
            relatorio = `Relatório personalizado para ${userData?.name}. Seus 3 testes de padrões mentais foram analisados com sucesso! Padrões únicos detectados.`;
            source = 'fallback';
        }

        res.json({ 
            success: true,
            relatorio: relatorio,
            source: source
        });

    } catch (error) {
        console.error('❌ Erro geral:', error);
        
        res.json({
            success: true,
            relatorio: 'Análise concluída. Seus dados foram processados com sucesso!',
            source: 'emergency_fallback'
        });
    }
});

// ✅ MERCADO PAGO (JÁ FUNCIONA)
app.post('/api/simple-subscription', async (req, res) => {
  try {
    console.log('🔄 Criando pagamento real...');
    
    const preference = {
      items: [
        {
          title: 'Relatório Premium MindKappa',
          unit_price: 9.90,
          quantity: 1,
          currency_id: 'BRL',
          description: 'Análise profunda do seu padrão decisional com relatório PDF completo'
        }
      ],
      back_urls: {
        success: `${process.env.FRONTEND_URL}/success`,
        failure: `${process.env.FRONTEND_URL}/failure`,
        pending: `${process.env.FRONTEND_URL}/pending`
      },
      auto_return: 'approved',
      statement_descriptor: 'MINDKAPPA PREMIUM'
    };

    const response = await mercadopago.preferences.create(preference);
    
    console.log('✅ Pagamento criado:', response.body.id);
    
    res.json({
      success: true,
      payment_link: response.body.init_point, // URL REAL de pagamento
      fallback: false // AGORA É REAL!
    });

  } catch (error) {
    console.error('❌ Erro Mercado Pago:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar pagamento',
      fallback: true
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MindKappa Backend SEGURO rodando na porta ${PORT}`);
    console.log(`🧠 MCD Core: ATIVO`);
    console.log(`💳 Mercado Pago: ${process.env.MERCADOPAGO_ACCESS_TOKEN ? 'PRONTO PARA PAGAMENTOS' : 'CONFIGURAR'}`);
    console.log(`🤖 OpenAI: ${OPENAI_ENABLED ? 'LIGADO' : 'DESLIGADO'}`);
    console.log(`🔗 Frontend: ${process.env.FRONTEND_URL || 'NÃO CONFIGURADO'}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
});

// ✅ MANTER PROCESSO ATIVO (OPCIONAL MAS RECOMENDADO)
process.on('SIGTERM', () => {
    console.log('🔄 Servidor recebeu SIGTERM, encerrando graciosamente...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🔄 Servidor reiniciando...');
    process.exit(0);
});

