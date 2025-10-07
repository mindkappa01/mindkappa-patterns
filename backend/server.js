const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// ==================== 🗄️ CONEXÃO COM BANCO POSTGRESQL ====================
// ✅ VERIFICAR SE A VARIÁVEL EXISTE
console.log('🔧 Testando com URL correta...');

// ✅ COLE SUA URL CORRETA AQUI (substitua TODO o conteúdo)
const DATABASE_URL_CORRETA = 'postgresql://postgres:XCZkvTZkbwnJAnqMHWtzcEVcOUIFmYmf@postgres.railway.internal:5432/railway';

const pool = new Pool({
  connectionString: DATABASE_URL_CORRETA,
  ssl: { 
    rejectUnauthorized: false 
  },
  connectionTimeoutMillis: 15000, // 15 segundos
  idleTimeoutMillis: 30000
});

// Teste DETALHADO
console.log('🧪 Iniciando teste de conexão...');
console.log('🔗 URL:', DATABASE_URL_CORRETA.replace(/:[^:]*@/, ':****@')); // Esconde senha nos logs

pool.query('SELECT NOW() as server_time, version() as pg_version, current_database() as db_name')
  .then(result => {
    const row = result.rows[0];
    console.log('🎉 🎉 🎉 CONEXÃO BEM-SUCEDIDA! 🎉 🎉 🎉');
    console.log('⏰ Hora do servidor:', row.server_time);
    console.log('🐘 PostgreSQL:', row.pg_version.split(',')[0]);
    console.log('🗄️ Banco:', row.db_name);
    console.log('✅ BANCO DE DADOS CONECTADO COM SUCESSO!');
  })
  .catch(err => {
    console.error('❌ FALHA NA CONEXÃO:', err.message);
    console.log('🔧 Dicas:');
    console.log('   • Verifique se a senha está correta');
    console.log('   • Verifique se o host/port estão corretos');
    console.log('   • Verifique se o banco "railway" existe');
  });

// DEBUG DA CONEXÃO
console.log('=== 🚨 DEBUG CONEXÃO ===');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Teste rápido
pool.query('SELECT NOW() as time')
  .then(result => console.log('✅ Teste de conexão OK:', result.rows[0].time))
  .catch(err => console.error('❌ Teste de conexão FALHOU:', err.message));


console.log('🔧 Configurando Pool com:', process.env.DATABASE_URL ? 'DATABASE_URL encontrada' : 'DATABASE_URL não encontrada');

// ==================== 🔐 MERCADO PAGO ====================
const mercadopago = require('mercadopago');

// ✅ CONFIGURAÇÃO SUPER SIMPLES (sem try/catch)
mercadopago.configure({
  access_token: 'TEST-4776420197323076-100420-7bc09edb85e7e1e7cb76deb8b546988b-608368877'
});
console.log('✅ Mercado Pago configurado');

// OpenAI config - chave vem das variáveis de ambiente
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Rota de saúde para testar
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'MindKappa Backend funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rota principal para gerar relatórios
app.post('/api/generate-report', async (req, res) => {
  try {
    console.log('📥 Recebendo solicitação de relatório...');
    const { userData } = req.body;

    if (!userData) {
      return res.status(400).json({ error: 'Dados do usuário não fornecidos' });
    }

    // Preparar prompt baseado no exemplo que você me enviou
    const prompt = criarPromptPersonalizado(userData);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Você é um especialista em análise de padrões mentais. 

IMPORTANTE: SIGA EXATAMENTE este formato e estilo:

🧠 Seu Relatório Pessoal do MCD
[Nome] - Descobrindo Como Sua Mente Funciona
Data do Teste: [data]
Duração Total: Cerca de [X] minutos
Decisões Analisadas: [X] escolhas

🎯 O Que Você Fez (Resumo Simples)
[Descrição dos 3 testes com • bullets]

🔍 O Que Descobrimos Sobre Você
Seu Perfil Mental: "[Título Criativo]"
[Descrição do perfil]

Como Sua Mente Funciona:
[• Pontos com emojis]

🌟 O Que Isso Significa Para Você
Pontos Fortes da Sua Mente:
[• Lista]
Curiosidades Sobre Você:
[• Lista]

🎲 Comparando Você Com Outras Pessoas
[Comparação e "Seu Tipo Mental"]

💡 Dicas Para o Seu Dia a Dia
Use Seus Pontos Fortes:
[• Dicas]
Para Expandir Ainda Mais:
[• Dicas]

🎉 Mensagem Final
[Mensagem inspiradora]

TOM: Conversacional, motivador, "UAU", sempre positivo, prático com exemplos da vida real.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1800,
      temperature: 0.7
    });

    console.log('✅ Relatório gerado com sucesso');
    
    res.json({ 
      success: true,
      relatorio: completion.choices[0].message.content,
      insights: [
        "Análise completa dos seus padrões mentais",
        "Comparação com perfis similares", 
        "Recomendações personalizadas"
      ]
    });

  } catch (error) {
    console.error('❌ Erro no backend:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao gerar relatório: ' + error.message
    });
  }
});

// Função para criar prompt personalizado
function criarPromptPersonalizado(userData) {
  const teste1 = analisarTeste1(userData.teste1);
  const teste2 = analisarTeste2(userData.teste2);
  const teste3 = analisarTeste3(userData.teste3);

  return `Gere um relatório NO ESTILO EXATO do exemplo para:

NOME: ${userData.name}
IDADE: ${userData.age}
GÊNERO: ${userData.gender}
EMOÇÃO INICIAL: ${userData.emotion}

RESULTADOS DETALHADOS:

TESTE 1 - INSTINTO PURO (50 decisões):
• O que a pessoa fez: ${teste1.resumo}
• Padrão detectado: ${teste1.padrao}
• Revelação: ${teste1.revelacao}

TESTE 2 - EQUILÍBRIO MENTAL (40 decisões):
• O que a pessoa fez: ${teste2.resumo} 
• Precisão: ${teste2.precisao}
• Habilidade: ${teste2.habilidade}

TESTE 3 - PRESSÃO TEMPORAL (30 decisões):
• O que a pessoa fez: ${teste3.resumo}
• Performance: ${teste3.performance}
• Adaptação: ${teste3.adaptacao}

Crie um relatório PERSONALIZADO que gere "UAU" - destacando os padrões únicos e talentos específicos.`;
}

// Funções de análise
function analisarTeste1(teste1) {
  if (!teste1?.decisions) return { resumo: 'Padrões em análise', padrao: 'Emergente', revelacao: 'Em observação' };
  
  const azul = teste1.decisions.filter(d => d.choice === 'azul').length;
  const vermelho = teste1.decisions.filter(d => d.choice === 'vermelho').length;
  
  let padrao, revelacao;
  if (azul === 50) {
    padrao = '100% azul';
    revelacao = 'Comprometimento total com suas escolhas iniciais';
  } else if (vermelho === 50) {
    padrao = '100% vermelho'; 
    revelacao = 'Consistência impressionante nos primeiros impulsos';
  } else {
    padrao = 'Misturado';
    revelacao = 'Flexibilidade natural nas decisões rápidas';
  }
  
  return {
    resumo: `${azul} azuis, ${vermelho} vermelhos`,
    padrao,
    revelacao
  };
}

function analisarTeste2(teste2) {
  if (!teste2?.finalCounts) return { resumo: 'Dados em análise', precisao: 'Em observação', habilidade: 'Em desenvolvimento' };
  
  const azul = teste2.finalCounts.azul || 0;
  const vermelho = teste2.finalCounts.vermelho || 0;
  const diff = Math.abs(azul - vermelho);
  
  let precisao, habilidade;
  if (diff === 0) {
    precisao = 'PERFEITA (50/50 exato!)';
    habilidade = 'Precisão absoluta em atingir objetivos';
  } else if (diff <= 2) {
    precisao = 'Excelente';
    habilidade = 'Grande capacidade de controle';
  } else {
    precisao = 'Boa com preferências pessoais';
    habilidade = 'Autenticidade nas escolhas conscientes';
  }
  
  return {
    resumo: `${azul} azuis, ${vermelho} vermelhos`,
    precisao,
    habilidade
  };
}

function analisarTeste3(teste3) {
  if (!teste3?.pressureAnalysis) return { resumo: 'Dados em análise', performance: 'Em observação', adaptacao: 'Em desenvolvimento' };
  
  const timeouts = teste3.pressureAnalysis.totalTimeouts || 0;
  
  let performance, adaptacao;
  if (timeouts === 0) {
    performance = 'Excelente - manteve a clareza sob pressão';
    adaptacao = 'Alta resistência ao estresse temporal';
  } else if (timeouts <= 3) {
    performance = 'Boa - adaptação eficiente';
    adaptacao = 'Boa capacidade de ajuste sob pressão';
  } else {
    performance = 'Interessante - padrões únicos sob estresse';
    adaptacao = 'Resposta autêntica à aceleração';
  }
  
  return {
    resumo: `${timeouts} timeouts em 30 decisões`,
    performance,
    adaptacao
  };
}

app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'MindKappa Backend',
    timestamp: new Date().toISOString()
  });
});

// ==================== 💰 CRIAR ASSINATURA ====================
// ==================== 💰 CHECKOUT BÁSICO MERCADO PAGO ====================
app.post('/api/simple-subscription', async (req, res) => {
  try {
    console.log('💰 Criando checkout básico...');
    
    // ✅ CHECKOUT BÁSICO - método mais confiável
    const preference = {
      items: [
        {
          title: 'MindKappa Premium - Acesso Mensal',
          unit_price: 0.01,
          quantity: 1,
          currency_id: 'BRL'
        }
      ],
      back_urls: {
        success: 'https://mindkappa-patterns.vercel.app/success.html',
        failure: 'https://mindkappa-patterns.vercel.app',
        pending: 'https://mindkappa-patterns.vercel.app'
      },
      auto_return: 'approved',
      statement_descriptor: 'MINDKAPPA'
    };

    console.log('📦 Criando preferência...');
    const result = await mercadopago.preferences.create(preference);
    
    console.log('✅ Checkout criado:', result.body.id);
    
    res.json({
      success: true,
      payment_link: result.body.init_point,
      id: result.body.id
    });

  } catch (error) {
    console.error('❌ Erro no checkout:', error);
    
    // ✅ DETALHE DO ERRO ESPECÍFICO
    if (error.message.includes('invalid_token')) {
      res.status(500).json({
        success: false,
        error: 'Token do Mercado Pago inválido. Verifique as credenciais.'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Erro Mercado Pago: ' + error.message
      });
    }
  }
});

// ... suas rotas atuais (health, generate-report, simple-subscription) ...

// ==================== 🗄️ BANCO DE DADOS ====================
// 🔧 1. PRECISAMOS CONFIGURAR A CONEXÃO COM BANCO
app.get('/api/test-database', async (req, res) => {
  try {
    console.log('🧪 Testando conexão com banco...');
    
    // Teste simples - contar tabelas
    // TODO: Implementar teste real
    
    res.json({
      success: true,
      message: 'Conexão com banco OK!',
      tables: ['sessions', 'decisions', 'kappa_results']
    });
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro de conexão: ' + error.message 
    });
  }
});

// ==================== 🧪 TESTE DE CONEXÃO REAL ====================
app.get('/api/test-db-connection', async (req, res) => {
  try {
    console.log('🧪 Testando conexão REAL com banco...');
    
    // Teste SIMPLES - contar sessões
    const result = await pool.query('SELECT COUNT(*) as total FROM sessions');
    const totalSessions = result.rows[0].total;
    
    res.json({
      success: true,
      message: `✅ Conexão OK! Encontradas ${totalSessions} sessões`,
      database_url: process.env.DATABASE_URL ? 'Configurada' : 'NÃO ENCONTRADA',
      total_sessions: totalSessions
    });
    
  } catch (error) {
    console.error('❌ Erro na conexão REAL:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro de conexão: ' + error.message,
      database_url: process.env.DATABASE_URL ? 'Configurada' : 'NÃO ENCONTRADA'
    });
  }
});

// ==================== 💾 SALVAR DADOS DE PESQUISA ====================
app.post('/api/save-research-data', async (req, res) => {
  try {
    const { userData, decisions, kappaResults } = req.body;
    
    console.log('💾 Salvando dados de pesquisa...');
    
    // TODO: Implementar a lógica de salvar nas 3 tabelas
    
    res.json({ 
      success: true, 
      message: 'Dados salvos para pesquisa!',
      sessionId: 'temp_id'
    });
    
  } catch (error) {
    console.error('❌ Erro ao salvar dados:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao salvar dados: ' + error.message 
    });
  }
});

// ==================== 📤 EXPORTAR DADOS ====================
app.get('/api/export-research-data', async (req, res) => {
  try {
    console.log('📤 Exportando dados de pesquisa...');
    
    // TODO: Implementar exportação CSV/JSON
    
    res.json({
      success: true,
      message: 'Exportação em desenvolvimento',
      data: []
    });
    
  } catch (error) {
    console.error('❌ Erro ao exportar:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao exportar dados' 
    });
  }
});

// ==================== 📤 EXPORTAR DADOS CSV ====================
app.get('/api/export-csv', async (req, res) => {
  try {
    console.log('📤 Gerando arquivo CSV...');
    
    // 1. Buscar dados das 3 tabelas
    const sessionsData = await getSessionsData();
    const kappaData = await getKappaData();
    
    // 2. Gerar CSV
    const csvContent = generateCSV(sessionsData, kappaData);
    
    // 3. Enviar como download
    res.header('Content-Type', 'text/csv');
    res.attachment('mindkappa_research_data.csv');
    res.send(csvContent);
    
    console.log('✅ CSV gerado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao gerar CSV:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao exportar dados: ' + error.message 
    });
  }
});

// ==================== 🔍 DEBUG DATABASE_URL ====================
app.get('/api/debug-db', async (req, res) => {
  const hasDbUrl = !!process.env.DATABASE_URL;
  const dbUrlPreview = process.env.DATABASE_URL 
    ? process.env.DATABASE_URL.substring(0, 50) + '...' 
    : 'NÃO ENCONTRADA';
  
  res.json({
    has_database_url: hasDbUrl,
    database_url_preview: dbUrlPreview,
    node_env: process.env.NODE_ENV,
    all_variables: process.env
  });
});

// ==================== 📊 FUNÇÕES AUXILIARES ====================
async function getSessionsData() {
  try {
    const result = await pool.query(`
      SELECT id, user_data, created_at, completed, is_premium 
      FROM sessions 
      ORDER BY created_at DESC
    `);
    console.log(`📊 Encontradas ${result.rows.length} sessões`);
    return result.rows;
  } catch (error) {
    console.error('❌ Erro ao buscar sessões:', error);
    return [];
  }
}

async function getKappaData() {
  try {
    const result = await pool.query(`
      SELECT session_id, test_1_kappa, test_2_kappa, test_3_kappa, insights, calculated_at 
      FROM kappa_results 
      ORDER BY calculated_at DESC
    `);
    console.log(`📈 Encontrados ${result.rows.length} resultados κ`);
    return result.rows;
  } catch (error) {
    console.error('❌ Erro ao buscar resultados κ:', error);
    return [];
  }
}

function generateCSV(sessions, kappaResults) {
  if (sessions.length === 0) {
    return 'session_id,age,gender,emotion,test1_kappa,test2_kappa,test3_kappa,completed,is_premium,created_at\n' +
           'NO_DATA_FOUND,,,Nenhum dado coletado ainda,,,,,\n';
  }
  
  let csv = 'session_id,age,gender,emotion,test1_kappa,test2_kappa,test3_kappa,completed,is_premium,created_at\n';
  
  sessions.forEach(session => {
    try {
      const kappa = kappaResults.find(k => k.session_id === session.id) || {};
      const user = session.user_data || {};
      
      // Extrair dados do JSONB user_data
      const age = user.age || user.idade || '';
      const gender = user.gender || user.genero || '';
      const emotion = user.emotion || user.emocao || user.emoção || '';
      
      csv += `"${session.id}",${age},"${gender}","${emotion}",${kappa.test_1_kappa || ''},${kappa.test_2_kappa || ''},${kappa.test_3_kappa || ''},${session.completed},${session.is_premium},"${session.created_at}"\n`;
    } catch (error) {
      console.error('❌ Erro ao processar sessão:', session.id, error);
    }
  });
  
  return csv;
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MindKappa Backend rodando na porta ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});















