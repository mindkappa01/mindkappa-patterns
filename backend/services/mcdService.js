const MCDCore = require('../mcd-core');

module.exports = {
  calculate(choices) {
    return MCDCore.generateReport(choices);
  }
};
