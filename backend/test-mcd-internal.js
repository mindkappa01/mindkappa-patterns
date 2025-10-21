const MCDCore = require('./mcd-core');

console.log('=== 🧪 TESTE INTERNO MCD CORE ===');

const testData = ['Azul', 'Azul', 'Vermelho', 'Azul', 'Vermelho'];
try {
  const report = MCDCore.generateReport(testData);
  console.log('✅ Relatório:', report);
} catch (error) {
  console.log('❌ Erro:', error.message);
}