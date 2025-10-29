require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const OpenAI = require('openai');
const MCDCore = require('./mcd-core');

// ✅ MERCADO PAGO (SDK v2)
const { MercadoPagoConfig, Preference } = require('mercadopago');

const MANUS_FREE = `
Você é o MindKappa Analyst, a extensão lógica do criador do projeto MCD (Medidor de Coerência Decisional). Sua missão é transformar dados estatísticos complexos (κ - kappa) em insights humanos, positivos e profundos.
Regras:
- Tom: encorajador, científico-acessível, com "UAU".
- Proibido jargões (κ, von Mises, “coerência”) no relatório grátis.
- Use termos humanos: Equilíbrio, Constância, Flexibilidade, Foco, Resposta ao Tempo.
- Use emojis com moderação (1 por título e 1 por bullet).
- Análise: Baseie sua análise nos dados brutos e nas regras de Tipos Mentais fornecidas no Contexto.
- Estrutura obrigatória (nessa ordem):
  1) 🧠 O TÍTULO (A Revelação)•
  2) 🎯 O QUE VOCÊ FEZ (Tradução dos Dados)
  3) 🔍 O QUE DESCOBRIMOS SOBRE VOCÊ (O Insight Central)
  4) ⭐ SEUS SUPERPODERES MENTAIS
  5) 💡 DICAS PARA O SEU DIA A DIA
  O relatório deve seguir esta estrutura exata, com o tom de voz definido.
  SEÇÃO 1: O TÍTULO (A Revelação)•
  Título: Use o Tipo Mental descoberto. Ex: "Sua Mente: A Executora Perfeita"
  Subtítulo: Uma frase de impacto. Ex: "Você é extraordinária em transformar intenções em resultados exatos." 

  SEÇÃO 2: O QUE VOCÊ FEZ (Tradução dos Dados)
  Objetivo: Traduzir os 3 testes para linguagem humana.
  Formato: Use o formato de lista para clareza.
  Teste Aleatório: (Descreva o resultado) Ex: "Sua mente tem uma paixão forte pelo vermelho"
  Teste 50/50: (Descreva o resultado) Ex: "Precisão absoluta! Você atingiu o objetivo com perfeição"
  Teste Preferência: (Descreva o resultado) Ex: "Totalmente comprometida com sua decisão"

  SEÇÃO 3: O QUE DESCOBRIMOS SOBRE VOCÊ (O Insight Central)
  O bjetivo: Explicar o Tipo Mental com profundidade e tom positivo.
  Conteúdo: Conecte os 3 resultados em uma única narrativa.
  Exemplo: "Sua mente é uma obra-prima de disciplina. Você consegue ser apaixonada, mas quando tem um objetivo, sua capacidade de autocontrole é perfeita."

  SEÇÃO 4: SEUS SUPERPODERES MENTAIS
  Objetivo: Lista de 3-4 pontos fortes que o usuário pode usar na vida real.
  Exemplo: Precisão Absoluta: Você atinge metas com exatidão.
  Autocontrole Estratégico: Você se disciplina quando é importante.
  Comprometimento Total: Quando você decide, você vai até o fim.

  SEÇÃO 5: DICAS PARA O SEU DIA A DIA
  Objetivo: 3-4 conselhos práticos baseados no Tipo Mental.
  Exemplo: "Use sua precisão em projetos que exijam detalhes. Confie no seu autocontrole para resistir a distrações."

  SEÇÃO 7: MENSAGEM FINAL
  Objetivo: Encerramento com alto impacto emocional.
  Exemplo: "Continue sendo essa pessoa [Tipo Mental] que você é! Seu [Ponto Forte] é um superpoder valioso!"
  6) 🚀 Próximo passo (convite gentil ao Premium: Analise completa em PDF, dicas personalizadas para o dia-a-dia, melhora criatividade, foco etc., comparações)
  - Tamanho: 180–1200 palavras, direto e sem floreio.

Tipos Mentais (heurística):
- Executora Perfeita: "aleatório" alto, "50/50" perfeito, "preferência" alto.
- Aleatório Natural: "aleatório" perfeito/quase, "50/50" um pouco menos preciso.
- Racional Equilibrado: "aleatório" baixo/médio, "50/50" perfeito, "preferência" alto.
- Mestre do Equilíbrio: "aleatório" baixo/perfeito e "50/50" perfeito.
- Apaixonado Controlado: "aleatório" alto, "50/50" perfeito, "preferência" alto.
- Equilibrista Absoluta: "50/50" perfeito e "preferência" ~50/50.
- Apaixonado Disciplinado: "aleatório" alto, "50/50" quase perfeito, "preferência" alto.
- Equilibrista Determinado: "aleatório" baixo/médio, "50/50" quase perfeito, "preferência" alto.
- Autêntica Consistente: "aleatório" médio, "50/50" levemente alto, "preferência" alto.
- Aleatório Criativo (Lion): κ médio muito baixo; variabilidade extrema.
`;

// PREMIUM: quadro de Tipos Mentais e comparação populacional (pode usar κ nos bastidores)
const MANUS_PREMIUM = `
Você é o MindKappa Analyst (versão Premium).
Objetivo: classificar Tipo Mental com base nas 3 dimensões e comparar com população.
Regras de estilo:
- Tom: forte, inspirador, técnico-acessível. Emojis moderados.
- No texto final, não exagere em números brutos; traduza κ em linguagem humana (pode citar, mas priorize significado).

Tipos Mentais (heurística):
- Executora Perfeita: "aleatório" alto, "50/50" perfeito, "preferência" alto.
- Aleatório Natural: "aleatório" perfeito/quase, "50/50" um pouco menos preciso.
- Racional Equilibrado: "aleatório" baixo/médio, "50/50" perfeito, "preferência" alto.
- Mestre do Equilíbrio: "aleatório" baixo/perfeito e "50/50" perfeito.
- Apaixonado Controlado: "aleatório" alto, "50/50" perfeito, "preferência" alto.
- Equilibrista Absoluta: "50/50" perfeito e "preferência" ~50/50.
- Apaixonado Disciplinado: "aleatório" alto, "50/50" quase perfeito, "preferência" alto.
- Equilibrista Determinado: "aleatório" baixo/médio, "50/50" quase perfeito, "preferência" alto.
- Autêntica Consistente: "aleatório" médio, "50/50" levemente alto, "preferência" alto.
- Aleatório Criativo (Lion): κ médio muito baixo; variabilidade extrema.

Comparação Populacional:
- κ médio populacional (Primeiros10): 10.476
- κ médio Lion: 0.413
Diretrizes:
- Se κ médio usuário < 1.0, destaque “mais aleatório que a média”.
- Se “50/50” ~perfeito, destacar precisão quase perfeita.
Estrutura Premium:
1) Título (Tipo Mental)
2) O que você fez (3 testes + contagens)
3) Insight central (narrativa única)
4) Superpoderes mentais (3–4 bullets)
5) Comparação com mundo (raridade/benchmark)
6) Dicas aplicáveis (3–4)
7) Mensagem final forte
`;

// ✅ cria o client com o access token do .env
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
});

async function gerarSystemPrompt() {
  return `
Você é o "MindKappa Analyst" — a extensão lógica e pedagógica do projeto MCD (Medidor de Coerência Decisional).
Missão: transformar dados do MCD em um Relatório Premium que impressione (tom positivo, científico e acessível).
REGRAS:
- Tom: encorajador e inspirador, mas neutro e NÃO-DIAGNÓSTICO.
- NÃO use jargões técnicos (κ, von Mises) no corpo do relatório; prefira termos humanos: Equilíbrio, Paixão, Precisão, Autocontrole.
- Estrutura obrigatória do relatório (em português, pt-BR):
  1) Título / Revelação com Tipo Mental
  2) O que você fez (resumo dos 3 testes)
  3) O que descobrimos (insight central)
  4) Seus superpoderes mentais (3-4 pontos)
  5) Comparação com a população (usar valores populacionais fornecidos)
  6) Dicas práticas (3-4 conselhos curtos)
  7) Mensagem final inspiradora
- Traduza números em linguagem humana (ex.: "você é X vezes mais aleatório que a média") e explique a raridade.
- Propor 3 exercícios práticos (1-2 linhas cada).
- Evitar avaliações médicas ou linguagem clínica.
- Responder em Português (pt-BR).
`;
}



function montarUserMessagePremium(userData) {
  const nome = userData.name || 'Explorador';
  const t1 = userData.teste1 || {};
  const t2 = userData.teste2 || {};
  const t3 = userData.teste3 || {};

  const azuis1 = Number(t1.statistics?.blueCount || 0);
  const vermelhos1 = Number(t1.statistics?.redCount || 0);
  const azuis2 = Number(t2.statistics?.blueCount || 0);
  const vermelhos2 = Number(t2.statistics?.redCount || 0);
  const azuis3 = Number(t3.statistics?.blueCount || 0);
  const vermelhos3 = Number(t3.statistics?.redCount || 0);

  const k1 = Number.isFinite(Number(t1.coherence?.kappa)) ? Number(t1.coherence.kappa) : NaN;
  const k2 = Number.isFinite(Number(t2.coherence?.kappa)) ? Number(t2.coherence.kappa) : NaN;
  const k3 = Number.isFinite(Number(t3.coherence?.kappa)) ? Number(t3.coherence.kappa) : NaN;

  const kValues = [k1, k2, k3].filter(v => !Number.isNaN(v));
  const kMedia = kValues.length ? (kValues.reduce((s,v)=>s+v,0) / kValues.length).toFixed(3) : "N/A";

  // Estatísticas populacionais (exemplo — ajuste se tiver números diferentes)
  const kPopMedia = 10.476;
  const kLion = 0.413;

  return `
DADOS DO USUÁRIO:
NOME: ${nome}
TESTE 1 (Instinto): ${azuis1} AZUL / ${vermelhos1} VERMELHO | κ1 = ${Number.isNaN(k1) ? 'N/A' : k1.toFixed(3)}
TESTE 2 (Equilíbrio): ${azuis2} AZUL / ${vermelhos2} VERMELHO | κ2 = ${Number.isNaN(k2) ? 'N/A' : k2.toFixed(3)}
TESTE 3 (Pressão): ${azuis3} AZUL / ${vermelhos3} VERMELHO | κ3 = ${Number.isNaN(k3) ? 'N/A' : k3.toFixed(3)}
κ MÉDIO: ${kMedia}

DADOS POPULACIONAIS:
κ médio populacional (Primeiros10): ${kPopMedia}
κ médio do criador (Lion): ${kLion}

INSTRUÇÕES:
1) Classifique o usuário em um Tipo Mental com base nos κs.
2) Gere o Relatório PREMIUM seguindo a estrutura do system prompt.
3) Traduza métricas em linguagem humana (Equilíbrio, Paixão, Precisão) — sem termos técnicos.
4) Proponha 3 exercícios práticos (1-2 linhas cada).
5) Tom: inspirador, não-diagnóstico. Linguagem: Português.
6) Tamanho: detalhado (máximo de tokens permitido).
`;
}

const app = express();

// ✅ CORS (liberado para dev; pode travar por domínio depois)
app.use(cors({ origin: true, credentials: true }));

// ✅ JSON body
app.use(express.json());

// ✅ Servir estáticos do frontend (/public)
app.use(express.static(path.join(__dirname, '..', 'public')));

// (Opcional) cache leve para assets
app.use((_, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=300');
  next();
});

app.get('/healthz', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'mindkappa-backend',
    version: '1.0.0'
  });
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
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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

// ✅ SALVAR DADOS
app.post('/api/save-research-data', async (req, res) => {
  try {
    const { userData } = req.body;
    console.log('💾 Salvando dados para:', userData?.name);

    const result = await pool.query(
      `INSERT INTO mindkappa_sessions1 (user_data) VALUES ($1) RETURNING id`,
      [userData]
    );

    console.log('✅ Dados salvos! ID:', result.rows[0].id);

    res.json({ success: true, sessionId: result.rows[0].id });
  } catch (error) {
    console.error('❌ Erro ao salvar:', error.message);
    res.json({ success: true, sessionId: 'mk-' + Date.now(), fallback: true });
  }
});

// ✅ CÁLCULO DE COERÊNCIA COM MCD CORE
app.post('/api/calculate-coherence', async (req, res) => {
  try {
    const { choices, testType, sessionId } = req.body;

    console.log(`🧠 Calculando coerência: ${testType}, ${choices.length} escolhas`);

    MCDCore.validateChoices(choices);
    const report = MCDCore.generateReport(choices);

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
      metrics: { R: report.R, N: report.N, timestamp: report.timestamp },
      savedToDb: !!dbResult
    });
  } catch (error) {
    console.error('❌ Erro no cálculo de coerência:', error);
    res.status(400).json({ success: false, error: error.message, timestamp: new Date().toISOString() });
  }
});

app.post('/api/update-user-coherence', async (req, res) => {
  try {
    const { userData } = req.body;
    console.log('🔄 Atualizando userData com coerência...');

    const updatedUserData = JSON.parse(JSON.stringify(userData)); // deep copy

    // Teste 1
    if (userData.teste1?.decisions) {
      const choices = userData.teste1.decisions.map(d => d.choice === 'azul' ? 'Azul' : 'Vermelho');
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

    // Teste 2
    if (userData.teste2?.decisions) {
      const choices = userData.teste2.decisions.map(d => d.choice === 'azul' ? 'Azul' : 'Vermelho');
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

    // Teste 3
    if (userData.teste3?.decisions) {
      const choices = userData.teste3.decisions.map(d => d.choice === 'azul' ? 'Azul' : 'Vermelho');
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

    res.json({ success: true, updatedUserData });
  } catch (error) {
    console.error('❌ Erro ao atualizar coerência:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ RELATÓRIO PREMIUM
app.post('/api/generate-premium-report', async (req, res) => {
  try {
    const { userData, sessionId } = req.body;
    console.log('💎 Gerando relatório premium para:', userData?.name);

    console.log('🔍 Dados recebidos para análise premium:', {
      temTeste1: !!userData?.teste1,
      temTeste2: !!userData?.teste2,
      temTeste3: !!userData?.teste3,
      coerenciaTeste1: userData?.teste1?.coherence,
      coerenciaTeste2: userData?.teste2?.coherence,
      coerenciaTeste3: userData?.teste3?.coherence
    });

    let relatorioPremium = null;
    let source = 'fallback_premium';

    if (OPENAI_ENABLED && openai) {
      try {
        const systemPrompt = await gerarSystemPrompt();
        const userPrompt = gerarPromptPremiumV2(userData);

        const messages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ];

        const completion = await Promise.race([
          openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages,
            max_tokens: 1100,
            temperature: 0.6
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('OpenAI timeout')), OPENAI_TIMEOUT))
        ]);

        relatorioPremium = completion.choices?.[0]?.message?.content || null;

        if (relatorioPremium) {
          source = 'gpt35_premium';
          console.log('✅ GPT gerou relatório premium. tamanho:', relatorioPremium.length);
        } else {
          console.log('⚠️ GPT retornou vazio, usando fallback.');
        }
      } catch (openaiError) {
        console.warn('❌ OpenAI erro (premium):', openaiError.message);
      }
    } else {
      console.log('ℹ️ OpenAI desligado ou não configurado — usando fallback.');
    }

    if (!relatorioPremium) {
      relatorioPremium = gerarFallbackPremium(userData);
      source = source === 'gpt35_premium' ? source : 'fallback_premium';
      console.log('ℹ️ Usando fallback premium.');
    }

    try {
      const dbResult = await pool.query(
        `INSERT INTO mindkappa_premium_reports (session_id, user_name, report_content, generated_at) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [sessionId, userData?.name, relatorioPremium, new Date().toISOString()]
      );
      console.log('💾 Relatório premium salvo no BD:', dbResult.rows[0].id);
    } catch (dbError) {
      console.log('📝 Relatório premium não salvo no BD:', dbError.message);
    }

    return res.json({ success: true, relatorio: relatorioPremium, source, tipo: 'premium' });
  } catch (error) {
    console.error('❌ Erro crítico no relatório premium:', error);
    res.status(500).json({ success: false, error: 'Erro ao gerar relatório premium' });
  }
});

function gerarPromptGratuito(userData) {
  const nome = userData?.name || 'Explorador';

  const t1 = userData?.teste1 || {};
  const t2 = userData?.teste2 || {};
  const t3 = userData?.teste3 || {};

  // Contagens (AZUL/VERMELHO)
  const a1 = Number(t1.statistics?.blueCount || 0);
  const v1 = Number(t1.statistics?.redCount || 0);
  const a2 = Number(t2.statistics?.blueCount || 0);
  const v2 = Number(t2.statistics?.redCount || 0);
  const a3 = Number(t3.statistics?.blueCount || 0);
  const v3 = Number(t3.statistics?.redCount || 0);

  // Equilíbrio simples 0–100 (%)
  const bal = (a, v) => {
    const tot = a + v;
    if (!tot) return 0;
    const dev = Math.abs(a - v);
    return Math.round((1 - dev / tot) * 100);
  };
  const bal1 = bal(a1, v1); // instinto
  const bal2 = bal(a2, v2); // equilíbrio
  const bal3 = bal(a3, v3); // pressão

  // Alternância no Teste 2
  let alternancias2 = 0;
  if (Array.isArray(t2.decisions) && t2.decisions.length > 1) {
    for (let i = 1; i < t2.decisions.length; i++) {
      const prev = t2.decisions[i - 1]?.choice;
      const cur  = t2.decisions[i]?.choice;
      if (prev && cur && prev !== cur) alternancias2++;
    }
  }
  const total2 = (a2 + v2) || (t2.decisions?.length || 0);
  const alternanciaRate2 = total2 > 1 ? Math.round((alternancias2 / (total2 - 1)) * 100) : 0;

  // Pressão temporal (timeouts + tempo médio de reação válido)
  let timeouts3 = 0, somaRT3 = 0, contRT3 = 0;
  if (Array.isArray(t3.decisions)) {
    for (const d of t3.decisions) {
      if (d.timedOut) timeouts3++;
      if (!d.timedOut && Number.isFinite(d.reactionTime)) {
        somaRT3 += d.reactionTime; contRT3++;
      }
    }
  }
  const timeoutRate3 = (t3.decisions && t3.decisions.length)
    ? Math.round((timeouts3 / t3.decisions.length) * 100)
    : 0;
  const avgRT3s = contRT3 ? Math.round((somaRT3 / contRT3) / 100) / 10 : 0; // seg., 1 casa

  // pistas heurísticas para narrativa (não imprimir as palavras)
  const pistaInstinto   = (a1 + v1 === 0) ? 'sem_dados' : (bal1 >= 70 ? 'equilibrado' : (a1 > v1 ? 'pref_azul' : 'pref_vermelho'));
  const pistaEquilibrio = (a2 + v2 === 0) ? 'sem_dados' : (bal2 >= 75 ? 'equilibrado' : (a2 > v2 ? 'puxa_azul' : 'puxa_vermelho'));
  const pistaPressao    = (a3 + v3 === 0) ? 'sem_dados' :
    ((timeoutRate3 <= 20 && bal3 >= 60) ? 'mantem_equilibrio' : (a3 > v3 ? 'pressao_azul' : 'pressao_vermelho'));

  return `
${MANUS_FREE}

DADOS:
• Nome: ${nome}
• Teste 1 (Instinto): ${a1} AZUL / ${v1} VERMELHO
• Teste 2 (Equilíbrio): ${a2} AZUL / ${v2} VERMELHO
• Teste 3 (Pressão): ${a3} AZUL / ${v3} VERMELHO

SINAIS (usar na narrativa, não como tabela):
• Equilíbrio % — Instinto: ${bal1} | Equilíbrio: ${bal2} | Pressão: ${bal3}
• Alternância no Teste 2: ${alternancias2} (~${alternanciaRate2}%)
• Pressão — timeouts: ${timeouts3} (${timeoutRate3}%), tempo médio: ~${avgRT3s}s
• Pistas: instinto=${pistaInstinto}, equilibrio=${pistaEquilibrio}, pressao=${pistaPressao}

SAÍDA:
- 180–1200 palavras, 2ª pessoa, pt-BR.
- Títulos com 1 emoji; bullets com 1 emoji.
- Explique os 3 testes com as contagens e traduza os sinais em experiência humana.
- Proibido jargões técnicos (κ etc).
- Inclua “Próximo passo” convidando ao Premium (IA + PDF + comparações).
`;
}

function gerarPromptPremiumV2(userData) {
  const nome = userData?.name || 'Explorador';
  const t1 = userData?.teste1 || {};
  const t2 = userData?.teste2 || {};
  const t3 = userData?.teste3 || {};

  const a1 = Number(t1.statistics?.blueCount || 0);
  const v1 = Number(t1.statistics?.redCount || 0);
  const a2 = Number(t2.statistics?.blueCount || 0);
  const v2 = Number(t2.statistics?.redCount || 0);
  const a3 = Number(t3.statistics?.blueCount || 0);
  const v3 = Number(t3.statistics?.redCount || 0);

  const k1 = Number(t1.coherence?.kappa || 0);
  const k2 = Number(t2.coherence?.kappa || 0);
  const k3 = Number(t3.coherence?.kappa || 0);
  const kVals = [k1, k2, k3].filter(n => Number.isFinite(n));
  const kMed = kVals.length ? (kVals.reduce((s,v)=>s+v,0)/kVals.length) : 0;

  return `
${MANUS_PREMIUM}

DADOS:
• Nome: ${nome}
• Teste 1 (Instinto): ${a1} AZUL / ${v1} VERMELHO | κ1 ≈ ${k1.toFixed(3)}
• Teste 2 (Equilíbrio): ${a2} AZUL / ${v2} VERMELHO | κ2 ≈ ${k2.toFixed(3)}
• Teste 3 (Pressão): ${a3} AZUL / ${v3} VERMELHO | κ3 ≈ ${k3.toFixed(3)}
• κ médio (usuário): ${kMed.toFixed(3)}
• κ médio (População Primeiros10): 10.476
• κ médio (Lion): 0.413

INSTRUÇÕES:
- Classifique o Tipo Mental com base nas três dimensões (use as diretrizes “Tipos Mentais”).
- Converta κ em linguagem humana (evite fórmulas; pode citar κ pontualmente).
- Use a Estrutura Premium.
- Emojis moderados em títulos e bullets.
- Português (Brasil).
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

  const preferencia1 = azuis1 > vermelhos1 ? "AZUL" : "VERMELHO";
  const preferencia2 = azuis2 > vermelhos2 ? "AZUL" : "VERMELHO";

  if (preferencia1 !== preferencia2) {
    perfis.push(`MENTE ADAPTÁVEL - Você muda de estratégia quando o contexto pede (de ${preferencia1} para ${preferencia2})`);
  }

  const diferenca1 = Math.abs(azuis1 - vermelhos1);
  const diferenca2 = Math.abs(azuis2 - vermelhos2);

  if (diferenca1 >= 7) {
    perfis.push("INTUIÇÃO FORTE - Seu instinto tem preferências bem definidas");
  }

  if (diferenca2 >= 8) {
    perfis.push("PERSONALIDADE MARCADA - Mesmo tentando equilibrar, seu estilo único aparece");
  }

  const preferencia3 = azuis3 > vermelhos3 ? "AZUL" : "VERMELHO";
  if (preferencia2 === preferencia3) {
    perfis.push("FOCO SOB PRESSÃO - Sob estresse, você mantém a mesma direção que escolheu conscientemente");
  }

  if (perfis.length === 0) {
    perfis.push("EXPLORADOR ÚNICO - Sua mente tem combinações especiais que merecem ser descobertas");
  }

  return `${nome}, descobrimos que sua mente é fascinante! \n\nSEU PERFIL: "${perfis[0]}"\n\nCOMO SUA MENTE FUNCIONA:\n• ${perfis.join('\n• ')}\n\nIsso revela padrões mentais muito interessantes!`;
}

// ✅ RELATÓRIO GRATUITO (com fallback)
app.post('/api/generate-report', async (req, res) => {
  try {
    const { userData } = req.body;
    console.log('🧠 Gerando relatório para:', userData?.name || 'Explorador');

    let relatorio, source;

    if (OPENAI_ENABLED && openai) {
      console.log('🔄 Tentando OpenAI...');
      try {
        const completion = await Promise.race([
          openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
      {
        role: "system",
        content: "Você escreve relatórios MindKappa no estilo MANUS. Siga estritamente o manual. Proíba termos técnicos (κ, von Mises). Tom não-diagnóstico."
      },
      {
        role: "user",
        content: gerarPromptGratuito(userData)
      }
    ],
            max_tokens: 750,
            temperature: 0.7
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), OPENAI_TIMEOUT))
        ]);

        relatorio = completion.choices[0].message.content;
        source = 'openai';
        console.log('✅ OpenAI funcionou!');
      } catch (openaiError) {
        console.log('🔄 OpenAI falhou, usando fallback:', openaiError.message);
      }
    }

    if (!relatorio) {
      relatorio = `Relatório personalizado para ${userData?.name}. Seus 3 testes de padrões mentais foram analisados com sucesso! Padrões únicos detectados.`;
      source = 'fallback';
    }

    res.json({ success: true, relatorio, source });
  } catch (error) {
    console.error('❌ Erro geral:', error);
    res.json({
      success: true,
      relatorio: 'Análise concluída. Seus dados foram processados com sucesso!',
      source: 'emergency_fallback'
    });
  }
});


// ✅ MERCADO PAGO (Checkout Pro)
app.post('/api/simple-subscription', async (req, res) => {
  try {
    console.log('🔄 Criando preferência de pagamento (Checkout Pro)…');

    // --- NORMALIZA E VALIDA FRONTEND_URL ---
    const FRONTEND =
      (process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim())
        ? process.env.FRONTEND_URL.trim().replace(/\/+$/, '') // remove barra final
        : 'http://localhost:3000';

    const isLocal = /^https?:\/\/localhost(:\d+)?$/i.test(FRONTEND);

    const backUrls = {
      success: `${FRONTEND}/success.html`,
      failure: `${FRONTEND}/failure.html`,
      pending: `${FRONTEND}/pending.html`
    };
    console.log('↩️ back_urls em uso:', backUrls);

    // segurança: exige protocolo http/https
    if (!/^https?:\/\//i.test(backUrls.success)) {
      throw new Error(`BACK_URL_INVALID: success="${backUrls.success}" — verifique FRONTEND_URL no .env`);
    }

    // monta preference
    const preference = {
      items: [
        {
          id: 'premium-report',
          title: 'Relatório Premium MindKappa',
          description: 'Análise profunda do padrão decisional (PDF completo)',
          quantity: 1,
          unit_price: 9.9,
          currency_id: 'BRL'
        }
      ],
      back_urls: backUrls,
      statement_descriptor: 'MINDKAPPA'
      // não force métodos de pagamento
    };

    // ⚠️ auto_return só em produção (URLs públicas https)
    if (!isLocal) {
      preference.auto_return = 'approved';
    } else {
      console.log('ℹ️ Ambiente local detectado — auto_return desativado para evitar erro do MP.');
    }

    const preferenceClient = new Preference(mpClient);
    const response = await preferenceClient.create({ body: preference });

    // 🔍 LOG COMPLETO PARA VERMOS O FORMATO REAL
    console.log('🔎 MP RAW response:\n', JSON.stringify(response, null, 2));

    // 🧠 Extração defensiva
    const raw = response || {};
    const prefId =
      raw.id ?? raw.body?.id ?? raw.response?.id ?? null;

    const initPoint =
      raw.init_point ??
      raw.body?.init_point ??
      raw.sandbox_init_point ??
      raw.body?.sandbox_init_point ??
      null;

    console.log('✅ Preferência criada (normalizada):', { id: prefId, init_point: initPoint });

    if (!prefId || !initPoint) {
      return res.status(500).json({
        success: false,
        error: 'Preferência criada mas sem init_point/id no retorno',
        fallback: true,
        details: { prefId, initPoint, raw }
      });
    }

    return res.json({
      success: true,
      payment_link: initPoint,
      fallback: false,
      pix_data: null
    });

  } catch (error) {
    const details = error?.cause || error?.response || error?.message || error;
    console.error('❌ Erro Mercado Pago (Preference v2):', details);
    return res.status(500).json({
      success: false,
      error: 'Erro ao criar pagamento',
      fallback: true,
      details
    });
  }
});


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

  const k1 = t1?.coherence?.kappa || 0;
  const k2 = t2?.coherence?.kappa || 0;
  const k3 = t3?.coherence?.kappa || 0;

  return `
CRIE UM RELATÓRIO PREMIUM **IMPRESSIOANTE** PARA ESTUDIOSOS DE COMPORTAMENTO:

DADOS COMPLETOS DO USUÁRIO:
• NOME: ${nome}
• TESTE 1 (Instinto): ${azuis1} azuis, ${vermelhos1} vermelhos | κ = ${k1.toFixed(3)}
• TESTE 2 (Equilíbrio): ${azuis2} azuis, ${vermelhos2} vermelhos | κ = ${k2.toFixed(3)}  
• TESTE 3 (Pressão): ${azuis3} azuis, ${vermelhos3} vermelhos | κ = ${k3.toFixed(3)}

INSTRUÇÕES PARA RELATÓRIO **IMPRESSIOANTE**:

🧠 ANÁLISE PROFUNDA DO PERFIL COGNITIVO
[Incluir análise técnica dos padrões κ]

📊 MAPA VISUAL DE PADRÕES  
[Descrever visualmente os 3 testes lado a lado]

🎯 DETECÇÃO DE TENDÊNCIAS COMPORTAMENTAIS
[Identificar padrões específicos: criatividade vs foco, κ alto vs baixo]

💡 EXERCÍCIOS COMPORTAMENTAIS PERSONALIZADOS
[Criar 3-4 exercícios baseados nos padrões detectados]

🔬 BENCHMARK CIENTÍFICO
[Comparar com bases de pesquisa em tomada de decisão]

📈 ESTRATÉGIAS DE OTIMIZAÇÃO COGNITIVA
[Baseado em κ alto/baixo para diferentes contexts]

ESTRUTURA OBRIGATÓTIA:
1. Análise Técnica Profunda
2. Padrões Detectados com Dados
3. Exercícios Práticos Personalizados  
4. Contexto Científico
5. Estratégias de Alto Impacto

NÍVEL: Estudosos de comportamento - linguagem técnica mas acessível
TAMANHO: Extremamente detalhado (máximo de tokens)
`;
}

// ✅ FALLBACK PREMIUM
function gerarFallbackPremium(userData) {
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

  return `🧠 RELATÓRIO PREMIUM MINDKAPPA - ${nome}

📊 ANÁLISE AVANÇADA DOS SEUS PADRÕES DECISIONAIS

Seus dados de ${azuis1 + vermelhos1 + azuis2 + vermelhos2 + azuis3 + vermelhos3} escolhas revelam padrões fascinantes de comportamento decisional em diferentes contextos.

📈 SEUS RESULTADOS:
• INSTINTO: ${azuis1} azuis, ${vermelhos1} vermelhos
• EQUILÍBRIO: ${azuis2} azuis, ${vermelhos2} vermelhos
• PRESSÃO: ${azuis3} azuis, ${vermelhos3} vermelhos

💡 PADRÕES IDENTIFICADOS:
Sua mente mostra características únicas de adaptação e consistência entre os diferentes contextos testados.

🎯 PRÓXIMOS PASSOS:
Para uma análise completa com IA avançada, tente novamente em alguns minutos.

---
🛡️ AVISO: Este é um relatório educacional de autoconhecimento.
Não constitui avaliação psicológica ou médica.

MindKappa - Tecnologia para Autoconhecimento 🧠`;
}

// ✅ ROTAS MINDKAPPA LAB (MCD v2)

// Retorna permissão e status do Lab
app.get('/api/lab-access', (req, res) => {
  try {
    res.json({
      success: true,
      version: '2.0',
      equation: 'κ = [R(2 - R²)] / [(1 - R²) + σ]',
      message: 'Acesso liberado ao MindKappa Lab • MCD v2 ativo 🧠'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro no acesso ao Lab' });
  }
});

// Recebe e registra sessão do Lab
app.post('/api/save-lab-data', async (req, res) => {
  try {
    const { userData, labSession } = req.body;

    if (!labSession || !Array.isArray(labSession.decisions)) {
      return res.status(400).json({ success: false, error: 'Dados inválidos do Lab' });
    }

    // cálculo redundante de segurança
    const thetas = labSession.decisions.map(d => d.choice === 'azul' ? 0 : Math.PI);
    const N = thetas.length;
    const sumCos = thetas.reduce((s, t) => s + Math.cos(t), 0);
    const sumSin = thetas.reduce((s, t) => s + Math.sin(t), 0);
    const R = Math.sqrt(sumCos ** 2 + sumSin ** 2) / N;
    const meanAngle = Math.atan2(sumSin, sumCos);
    const diffs = thetas.map(t => Math.atan2(Math.sin(t - meanAngle), Math.cos(t - meanAngle)));
    const sigma = Math.sqrt(diffs.reduce((s, t) => s + t ** 2, 0) / N);
    const kappa = (R * (2 - R ** 2)) / ((1 - R ** 2) + sigma);

    const safeUser = userData?.name || 'Anônimo';

    // salva no banco (opcional)
    try {
      const result = await pool.query(
        `INSERT INTO mindkappa_lab_sessions (user_name, decisions, r_value, sigma_value, kappa_value, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id`,
        [safeUser, labSession.decisions, R, sigma, kappa]
      );
      console.log('🧠 Nova sessão Lab salva:', result.rows[0].id);
    } catch (dbErr) {
      console.warn('⚠️ Erro ao salvar no banco:', dbErr.message);
    }

    res.json({
      success: true,
      message: 'Sessão do Lab salva com sucesso!',
      results: {
        user: safeUser,
        N,
        R: Number(R.toFixed(4)),
        sigma: Number(sigma.toFixed(4)),
        kappa: Number(kappa.toFixed(4))
      }
    });
  } catch (error) {
    console.error('❌ Erro ao salvar sessão do Lab:', error);
    res.status(500).json({ success: false, error: 'Erro ao processar sessão do Lab' });
  }
});

// Retorna estatísticas gerais (ex: média global de κ)
app.get('/api/lab-stats', async (req, res) => {
  try {
    const query = await pool.query(`
      SELECT 
        COUNT(*) as total,
        ROUND(AVG(kappa_value)::numeric, 4) as kappa_media,
        ROUND(AVG(r_value)::numeric, 4) as r_media,
        ROUND(AVG(sigma_value)::numeric, 4) as sigma_media
      FROM mindkappa_lab_sessions
    `);
    res.json({
      success: true,
      data: query.rows[0],
      message: '📊 Estatísticas globais do MindKappa Lab'
    });
  } catch (err) {
    console.error('Erro nas estatísticas do Lab:', err.message);
    res.json({ success: false, error: 'Erro ao obter estatísticas do Lab' });
  }
});


// ✅ PORTA PADRÃO 3000 (alinha com FRONTEND_URL)
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MindKappa Backend SEGURO rodando na porta ${PORT}`);
  console.log(`🧠 MCD Core: ATIVO`);
  console.log(`💳 Mercado Pago: ${process.env.MERCADOPAGO_ACCESS_TOKEN ? 'PRONTO PARA PAGAMENTOS' : 'CONFIGURAR'}`);
  console.log(`🤖 OpenAI: ${OPENAI_ENABLED ? 'LIGADO' : 'DESLIGADO'}`);
  console.log(`🔗 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
});

// ✅ Catch-all final para servir HTML do /public sem afetar /api/*
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const file = req.path.endsWith('.html') ? req.path : '/index.html';
  res.sendFile(path.join(__dirname, '..', 'public', file));
});

// ✅ MANTER PROCESSO ATIVO (graceful)
process.on('SIGTERM', () => {
  console.log('🔄 Servidor recebeu SIGTERM, encerrando graciosamente...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Servidor reiniciando...');
  process.exit(0);
});
