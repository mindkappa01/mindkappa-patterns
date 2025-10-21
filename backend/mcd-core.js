/**
 * 🧠 MCD Core - MindKappa Proprietary Technology
 * © 2025 MindKappa Labs. Todos os direitos reservados.
 * Uso comercial não autorizado é estritamente proibido.
 * 
 * Módulo interno do sistema MindKappa para cálculo de coerência decisional.
 * Desenvolvido por Lion (N1) com base em estatística circular von Mises.
 * 
 * CONFIDENCIAL: Este código não deve ser compartilhado ou distribuído.
 */

class MCDCore {
  /**
   * Calcula o parâmetro κ de coerência decisional
   * @param {string[]} choices - Array de escolhas ('Azul' ou 'Vermelho')
   * @returns {Object} Resultado com N, R e kappa
   */
  static computeKappa(choices) {
    if (!choices || !Array.isArray(choices) || choices.length === 0) {
      throw new Error('Array de escolhas inválido');
    }

    const thetas = choices.map(c => {
      if (c === 'Azul') return 0;
      if (c === 'Vermelho') return Math.PI;
      throw new Error(`Escolha inválida: ${c}. Apenas "Azul" ou "Vermelho" são permitidos.`);
    });

    const N = thetas.length;
    
    const sumCos = thetas.reduce((s, t) => s + Math.cos(t), 0);
    const sumSin = thetas.reduce((s, t) => s + Math.sin(t), 0);
    
    const R = Math.sqrt(sumCos**2 + sumSin**2) / N;
    
    // Proteções numéricas para casos extremos
    if (R < 0.001) return { N, R: 0, kappa: 0 };
    if (R > 0.999) return { N, R: 1, kappa: 10 };
    
    const kappa = (R * (2 - R**2)) / (1 - R**2);
    
    return { 
      N, 
      R: parseFloat(R.toFixed(4)), 
      kappa: parseFloat(Math.min(kappa, 10).toFixed(4))
    };
  }

  /**
   * Interpreta o valor κ em níveis de coerência
   * @param {number} kappa - Valor κ calculado
   * @returns {Object} Interpretação com nível, descrição e cor
   */
  static interpretKappa(kappa) {
    if (kappa >= 1.0) return { 
      nivel: 'ALTA', 
      descricao: 'Padrão decisional muito consistente e direcional',
      cor: '#10b981',
      emoji: '🎯'
    };
    if (kappa >= 0.5) return { 
      nivel: 'MODERADA', 
      descricao: 'Padrão discernível com tendência clara',
      cor: '#f59e0b',
      emoji: '📊'
    };
    if (kappa >= 0.3) return { 
      nivel: 'BAIXA', 
      descricao: 'Tendência leve detectável',
      cor: '#ef4444',
      emoji: '📈'
    };
    return { 
      nivel: 'ALEATÓRIA', 
      descricao: 'Padrão não detectável - decisões próximas do aleatório',
      cor: '#6b7280',
      emoji: '🎲'
    };
  }

  /**
   * Valida o array de escolhas
   * @param {string[]} choices - Array de escolhas
   * @param {number} expectedLength - Comprimento esperado (opcional)
   * @returns {boolean} True se válido
   */
  static validateChoices(choices, expectedLength = null) {
    if (!choices || !Array.isArray(choices)) {
      throw new Error('Array de escolhas é obrigatório');
    }
    
    if (expectedLength && choices.length !== expectedLength) {
      throw new Error(`Número incorreto de escolhas: ${choices.length}, esperado: ${expectedLength}`);
    }
    
    const validChoices = choices.filter(c => c === 'Azul' || c === 'Vermelho');
    if (validChoices.length !== choices.length) {
      const invalid = choices.filter(c => c !== 'Azul' && c !== 'Vermelho');
      throw new Error(`Escolhas inválidas detectadas: ${invalid.join(', ')}`);
    }
    
    return true;
  }

  /**
   * Gera relatório completo de coerência
   * @param {string[]} choices - Array de escolhas
   * @returns {Object} Relatório completo
   */
  static generateReport(choices) {
    this.validateChoices(choices);
    
    const { kappa, R, N } = this.computeKappa(choices);
    const interpretation = this.interpretKappa(kappa);
    
    const blueCount = choices.filter(c => c === 'Azul').length;
    const redCount = choices.filter(c => c === 'Vermelho').length;
    const bluePercentage = ((blueCount / N) * 100).toFixed(1);
    
    return {
      kappa,
      R,
      N,
      coherenceLevel: interpretation.nivel,
      description: interpretation.descricao,
      color: interpretation.cor,
      emoji: interpretation.emoji,
      statistics: {
        blueCount,
        redCount, 
        bluePercentage: `${bluePercentage}%`,
        redPercentage: `${(100 - bluePercentage).toFixed(1)}%`
      },
      timestamp: new Date().toISOString()
    };
  }
}

// Proteção contra uso não autorizado
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MCDCore;
} else {
  console.warn('⚠️  MCD Core - Uso não autorizado detectado');
  console.warn('🔒 Este módulo é propriedade exclusiva da MindKappa Labs');
}

console.log('🧠 MCD Core carregado - MindKappa Technology © 2025');