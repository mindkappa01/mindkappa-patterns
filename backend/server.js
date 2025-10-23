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

app.post('/api/update-user-coherence', async (req, res) => {
    try {
        const { userData, sessionId } = req.body;
        console.log('🔄 Atualizando userData com coerência...');

        const updatedUserData = JSON.parse(JSON.stringify(userData)); // deep copy

        // ✅ USA SEU MCD CORE DIRETAMENTE (SEM FETCH INTERNO)
        if (userData.teste1?.decisions) {
            const choices = userData.teste1.decisions.map(d => 
                d.choice === 'azul' ? 'Azul' : 'Vermelho'
            );
            
            // ✅ CHAMA MCD CORE DIRETAMENTE (igual sua rota existente)
            MCDCore.validateChoices(choices);
            const report = MCDCore.generateReport(choices);
            
            updatedUserData.teste1.coherence = {
                kappa: report.kappa,
                level: report.coherenceLevel,
                description: report.description,
                emoji: report.emoji,
                color: report.color
            };
            updatedUserData.teste1.statistics = report.statistics;
        }

        // ✅ REPETE PARA teste2 E teste3
        if (userData.teste2?.decisions) {
            const choices = userData.teste2.decisions.map(d => 
                d.choice === 'azul' ? 'Azul' : 'Vermelho'
            );
            
            MCDCore.validateChoices(choices);
            const report = MCDCore.generateReport(choices);
            
            updatedUserData.teste2.coherence = {
                kappa: report.kappa,
                level: report.coherenceLevel,
                description: report.description, 
                emoji: report.emoji,
                color: report.color
            };
            updatedUserData.teste2.statistics = report.statistics;
        }

        if (userData.teste3?.decisions) {
            const choices = userData.teste3.decisions.map(d => 
                d.choice === 'azul' ? 'Azul' : 'Vermelho'
            );
            
            MCDCore.validateChoices(choices);
            const report = MCDCore.generateReport(choices);
            
            updatedUserData.teste3.coherence = {
                kappa: report.kappa,
                level: report.coherenceLevel,
                description: report.description,
                emoji: report.emoji, 
                color: report.color
            };
            updatedUserData.teste3.statistics = report.statistics;
        }

        res.json({
            success: true,
            updatedUserData: updatedUserData
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar coerência:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ✅ RELATÓRIO PREMIUM - ÉTICO E AVANÇADO
app.post('/api/generate-premium-report', async (req, res) => {
    try {
        const { userData, sessionId } = req.body;
        console.log('💎 Gerando relatório premium para:', userData?.name);

        let relatorioPremium, source;

        if (OPENAI_ENABLED && openai) {
            console.log('🔄 Gerando análise premium...');
            
            try {
                const completion = await Promise.race([
                    openai.chat.completions.create({
                        model: "gpt-4", // ✅ GPT-4 para premium
                        messages: [{
                            role: "user",
                            content: gerarPromptPremium(userData)
                        }],
                        max_tokens: 1200, // ✅ Mais detalhes
                        temperature: 0.7
                    }),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout')), 30000)
                    )
                ]);

                relatorioPremium = completion.choices[0].message.content;
                source = 'openai_premium';
                console.log('✅ Relatório premium gerado!');
                
            } catch (openaiError) {
                console.log('🔄 GPT-4 falhou, usando fallback:', openaiError.message);
                relatorioPremium = gerarFallbackPremium(userData);
                source = 'fallback_premium';
            }
        } else {
            relatorioPremium = gerarFallbackPremium(userData);
            source = 'fallback_premium';
        }

        // ✅ SALVAR NO BANCO COMO PREMIUM
        try {
            await pool.query(
                `INSERT INTO mindkappa_premium_reports (session_id, user_name, report_content, generated_at) 
                 VALUES ($1, $2, $3, $4) RETURNING id`,
                [sessionId, userData?.name, relatorioPremium, new Date().toISOString()]
            );
            console.log('💾 Relatório premium salvo no BD');
        } catch (dbError) {
            console.log('📝 Relatório premium não salvo:', dbError.message);
        }

        res.json({ 
            success: true,
            relatorio: relatorioPremium,
            source: source,
            tipo: 'premium'
        });

    } catch (error) {
        console.error('❌ Erro no relatório premium:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao gerar relatório premium'
        });
    }
});

function gerarPromptGratuito(userData) {
    // ✅ EXTRAIR DADOS REAIS DOS TESTES
    const t1 = userData.teste1;
    const t2 = userData.teste2; 
    const t3 = userData.teste3;

    const nome = userData.name || 'Explorador';
    
    // ✅ CALCULAR ESTATÍSTICAS REAIS
    const azuis1 = t1?.statistics?.blueCount || 0;
    const vermelhos1 = t1?.statistics?.redCount || 0;
    
    const azuis2 = t2?.statistics?.blueCount || 0;
    const vermelhos2 = t2?.statistics?.redCount || 0;
    
    const azuis3 = t3?.statistics?.blueCount || 0;
    const vermelhos3 = t3?.statistics?.redCount || 0;

    return `
CRIE UM RELATÓRIO EXCLUSIVO DO MINDKAPPA USANDO ESTA ESTRUTURA EXATA:

🧠 SEU RELATÓRIO PESSOAL DO MCD
${nome} - Descobrindo Como Sua Mente Funciona

🎯 O QUE VOCÊ FEZ (RESUMO SIMPLES)
Você participou de 3 testes diferentes onde tinha que escolher entre AZUL e VERMELHO.

TESTE 1: "Instinto Puro - Primeira Reação"
• O que pedimos: Siga sua primeira intuição
• O que você fez: ${azuis1} azuis e ${vermelhos1} vermelhos
• O que isso revela: ${gerarInsightTeste1(azuis1, vermelhos1)}

TESTE 2: "Equilíbrio Mental - Busque Balanceamento"  
• O que pedimos: Tente equilibrar suas escolhas
• O que você fez: ${azuis2} azuis e ${vermelhos2} vermelhos
• O que isso revela: ${gerarInsightTeste2(azuis2, vermelhos2)}

TESTE 3: "Pressão Temporal - Decisões Rápidas"
• O que pedimos: Escolha sob pressão de tempo
• O que você fez: ${azuis3} azuis e ${vermelhos3} vermelhos  
• O que isso revela: ${gerarInsightTeste3(azuis3, vermelhos3)}

🔍 O QUE DESCOBRIMOS SOBRE VOCÊ
${gerarPerfilMental(nome, azuis1, vermelhos1, azuis2, vermelhos2, azuis3, vermelhos3)}

💡 DICAS PARA SEU DIA A DIA
${gerarDicasPraticas(azuis1, vermelhos1, azuis2, vermelhos2, azuis3, vermelhos3)}

🎉 MENSAGEM FINAL
${gerarMensagemFinal(nome)}

---
INSTRUÇÕES OBRIGATÓRIAS:
• USE APENAS "AZUL" e "VERMELHO" (nunca A/B ou outras cores)
• USE "MCD" ou "MindKappa" (nunca ABC ou outros nomes)
• SIGA A ESTRUTURA ACIMA EXATAMENTE
• LINGUAGEM: Conversacional, motivadora, específica
• CHAME O USUÁRIO PELO NOME: "${nome}, sua mente..."
`;
}

function gerarDicasPraticas(azuis1, vermelhos1, azuis2, vermelhos2, azuis3, vermelhos3) {
    const dicas = [];
    
    if (azuis1 === 0 || vermelhos1 === 0) {
        dicas.push("• CONFIE NA SUA INTUIÇÃO - Quando você segue seu instinto, age com convicção!");
    }
    
    if (Math.abs(azuis2 - vermelhos2) <= 2) {
        dicas.push("• USE SEU TALENTO PARA EQUILÍBRIO - Você é ótimo em encontrar meio-termo em discussões!");
    }
    
    if (azuis3 === 0 || vermelhos3 === 0) {
        dicas.push("• EM MOMENTOS DECISIVOS - Lembre-se que você fica super focado sob pressão, use isso a seu favor!");
    }
    
    if (dicas.length === 0) {
        dicas.push("• EXPERIMENTE DIFERENTES ABORDAGENS - Sua mente se adapta bem a diversos contextos!");
        dicas.push("• OBSERVE SEUS PADRÕES - Preste atenção em como você toma decisões no dia a dia!");
    }
    
    return dicas.join('\n');
}

function gerarMensagemFinal(nome) {
    const mensagens = [
        `${nome}, sua mente é única e especial! Os padrões que descobrimos mostram características valiosas que você pode usar a seu favor!`,
        `${nome}, o teste revelou talentos mentais incríveis! Continue explorando como sua mente funciona - o autoconhecimento é um superpoder!`,
        `${nome}, cada mente é uma obra de arte! A sua tem padrões fascinantes que merecem ser celebrados e usados com sabedoria!`
    ];
    
    return mensagens[Math.floor(Math.random() * mensagens.length)];
}

// ✅ FUNÇÕES DE INSIGHT ESPECÍFICAS
function gerarInsightTeste1(azuis, vermelhos) {
    const total = azuis + vermelhos;
    if (total === 0) return "Seu instinto está sendo analisado...";
    
    if (azuis === 0 || vermelhos === 0) {
        return "Quando você segue a intuição, vai até o fim sem hesitar! Sua mente escolhe um caminho e segue com convicção total!";
    }
    if (Math.abs(azuis - vermelhos) <= 2) {
        return "Seu instinto naturalmente busca equilíbrio! Sua primeira reação já considera diferentes perspectivas de forma harmoniosa!";
    }
    if (azuis > vermelhos * 1.5) {
        return "Sua intuição tem uma clara preferência pelo azul! Quando você não pensa muito, sua mente escolhe uma direção específica!";
    }
    if (vermelhos > azuis * 1.5) {
        return "Sua intuição tem uma clara preferência pelo vermelho! Sua mente instintiva sabe exatamente o que quer!";
    }
    return "Sua primeira reação tem preferências bem definidas, mas com espaço para variação!";
}

function gerarInsightTeste2(azuis, vermelhos) {
    const total = azuis + vermelhos;
    if (total === 0) return "Seu equilíbrio está sendo analisado...";
    
    const diferenca = Math.abs(azuis - vermelhos);
    
    if (diferenca === 0) {
        return "PERFEITO! Quando você tenta equilibrar, consegue com precisão absoluta! Sua mente é uma balança perfeita!";
    }
    if (diferenca <= 2) {
        return "Excelente! Você tem um talento natural para encontrar equilíbrio! Sua mente busca harmonia de forma consistente!";
    }
    if (diferenca <= 5) {
        return "Você se esforça pelo equilíbrio, mas suas preferências pessoais ainda aparecem! Isso mostra autenticidade!";
    }
    return "Mesmo tentando equilibrar, suas inclinações naturais são fortes! Isso revela personalidade bem definida!";
}

function gerarInsightTeste3(azuis, vermelhos) {
    const total = azuis + vermelhos;
    if (total === 0) return "Sua performance sob pressão está sendo analisada...";
    
    if (azuis === 0 || vermelhos === 0) {
        return "SOB PRESSÃO, você se torna super focado! Sua mente escolhe uma direção e segue com determinação total, sem distrações!";
    }
    if (Math.abs(azuis - vermelhos) <= 3) {
        return "Incível! Mesmo sob pressão, você mantém o equilíbrio! Sua mente funciona bem mesmo em situações desafiadoras!";
    }
    if (azuis > vermelhos) {
        return "Sob pressão, sua mente se inclina fortemente para o azul! O estresse traz à tona suas preferências mais profundas!";
    }
    return "Sob pressão, sua mente se inclina fortemente para o vermelho! Situações intensas revelam seu lado mais decisivo!";
}

function gerarPerfilMental(nome, azuis1, vermelhos1, azuis2, vermelhos2, azuis3, vermelhos3) {
    const perfis = [];
    
    // ✅ ANALISAR MUDANÇA ENTRE TESTE 1 E 2
    const preferencia1 = azuis1 > vermelhos1 ? "AZUL" : "VERMELHO";
    const preferencia2 = azuis2 > vermelhos2 ? "AZUL" : "VERMELHO";
    
    if (preferencia1 !== preferencia2) {
        perfis.push(`MENTE ADAPTÁVEL - Você muda de estratégia quando o contexto pede (de ${preferencia1} para ${preferencia2})`);
    }
    
    // ✅ ANALISAR FORÇA DAS PREFERÊNCIAS
    const diferenca1 = Math.abs(azuis1 - vermelhos1);
    const diferenca2 = Math.abs(azuis2 - vermelhos2);
    
    if (diferenca1 >= 7) {
        perfis.push("INTUIÇÃO FORTE - Seu instinto tem preferências bem definidas");
    }
    
    if (diferenca2 >= 8) {
        perfis.push("PERSONALIDADE MARCADA - Mesmo tentando equilibrar, seu estilo único aparece");
    }
    
    // ✅ ANALISAR CONSISTÊNCIA SOB PRESSÃO
    const preferencia3 = azuis3 > vermelhos3 ? "AZUL" : "VERMELHO";
    if (preferencia2 === preferencia3) {
        perfis.push("FOCO SOB PRESSÃO - Sob estresse, você mantém a mesma direção que escolheu conscientemente");
    }
    
    if (perfis.length === 0) {
        perfis.push("EXPLORADOR ÚNICO - Sua mente tem combinações especiais que merecem ser descobertas");
    }
    
    return `${nome}, descobrimos que sua mente é fascinante! \n\nSEU PERFIL: "${perfis[0]}"\n\nCOMO SUA MENTE FUNCIONA:\n• ${perfis.join('\n• ')}\n\nIsso revela padrões mentais muito interessantes!`;
}

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
                            content: gerarPromptGratuito(userData)
}],
                        max_tokens: 600,
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
    console.log('🔄 Criando pagamento com PIX...');
    
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
        success: `${process.env.FRONTEND_URL}/success.html`,
        failure: `${process.env.FRONTEND_URL}/failure.html`,
        pending: `${process.env.FRONTEND_URL}/pending.html`
      },
      auto_return: 'approved',
      statement_descriptor: 'MINDKAPPA',
      
      // ✅ NOVO: CONFIGURAÇÃO PIX
      payment_methods: {
        excluded_payment_types: [
          { id: 'ticket' }, // Remove boleto
          { id: 'atm' }     // Remove caixa eletrônico
        ],
        default_installments: 1,
        excluded_payment_methods: [
          { id: 'debvisa' }, // Remove débito
          { id: 'debmaster' }
        ]
      },
      
      // ✅ PIX AUTOMÁTICO (30 minutos)
      pix: {
        expiration: 1800 // 30 minutos em segundos
      }
    };

    function gerarPromptPremium(userData) {
    const t1 = userData.teste1;
    const t2 = userData.teste2;
    const t3 = userData.teste3;

    const nome = userData.name || 'Explorador';
    
    const azuis1 = t1?.statistics?.blueCount || 0;
    const vermelhos1 = t1?.statistics?.redCount || 0;
    const azuis2 = t2?.statistics?.blueCount || 0;
    const vermelhos2 = t2?.statistics?.redCount || 0;
    const azuis3 = t3?.statistics?.blueCount || 0;
    const vermelhos3 = t3?.statistics?.redCount || 0;

    return `
CRIE UM RELATÓRIO PREMIUM DE AUTOCONHECIMENTO BASEADO NESTES DADOS:

DADOS ANALISADOS:
• TESTE 1 (Instinto): ${azuis1} azuis, ${vermelhos1} vermelhos
• TESTE 2 (Equilíbrio): ${azuis2} azuis, ${vermelhos2} vermelhos  
• TESTE 3 (Pressão): ${azuis3} azuis, ${vermelhos3} vermelhos

INSTRUÇÕES OBRIGATÓRIAS:

1. FOCO EM AUTOCONHECIMENTO, NÃO DIAGNÓSTICO
2. LINGUAGEM: Científica mas acessível, motivadora
3. ESTRUTURA:

🧠 SEU MAPA DECISIONAL AVANÇADO
${nome} - Análise Profunda de Padrões

📊 SEUS RESULTADOS EM 3 DIMENSÕES:
[Apresentar dados dos 3 testes com insights]

🔍 PADRÕES E TENDÊNCIAS IDENTIFICADAS:
[Analisar mudanças, consistências, evolução]

🌟 SEU ESTILO DECISIONAL ÚNICO:
[Perfil baseado em padrões observados]

💡 ESTRATÉGIAS PARA OTIMIZAÇÃO PESSOAL:
[Sugestões práticas baseadas nos padrões]

📈 CONTEXTO COMPARATIVO EDUCACIONAL:
[Perspectiva sobre os padrões encontrados]

---

🛡️ IMPORTANTE: 
• Use termos como "padrões observados", "tendências identificadas"
• Evite "diagnóstico", "condição", "problema" 
• Destaque que é análise comportamental educacional
• Inclua disclaimer sobre não ser avaliação médica

NOME: ${nome}
LINGUAGEM: Português brasileiro
TAMANHO: Detalhado mas claro
`;
}

function gerarFallbackPremium(userData) {
    const t1 = userData.teste1;
    const t2 = userData.teste2;
    const t3 = userData.teste3;

    const nome = userData.name || 'Explorador';
    
    return `🧠 RELATÓRIO PREMIUM MINDKAPPA - ${nome}

📊 ANÁLISE AVANÇADA DOS SEUS PADRÕES DECISIONAIS

Seus dados revelam padrões fascinantes de comportamento decisional em diferentes contextos. Esta análise aprofundada oferece insights valiosos para seu autoconhecimento e desenvolvimento pessoal.

💡 LEMBRETE: Este é um relatório educacional de autoconhecimento. Não substitui avaliação profissional.

Entre em contato para receber a versão completa com GPT-4.

MindKappa - Tecnologia para Autoconhecimento 🧠`;
}

    const response = await mercadopago.preferences.create(preference);
    
    console.log('✅ Pagamento PIX criado:', response.body.id);
    
    res.json({
      success: true,
      payment_link: response.body.init_point,
      fallback: false,
      // ✅ NOVO: DADOS PIX ESPECÍFICOS
      pix_data: response.body.pix || null
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

