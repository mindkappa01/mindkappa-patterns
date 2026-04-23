const sessionContract = require("../contracts/sessionContract");

function hasRequiredFields(obj, fields) {
  return fields.every((field) => Object.prototype.hasOwnProperty.call(obj, field));
}

function validateSessionPayload(payload) {
  const errors = [];

  if (!hasRequiredFields(payload, sessionContract.requiredSessionFields)) {
    errors.push("Sessão inválida: faltam campos obrigatórios.");
    return { isValid: false, errors };
  }

  if (!Array.isArray(payload.tests) || payload.tests.length === 0) {
    errors.push("Sessão inválida: tests deve ser um array com pelo menos 1 teste.");
    return { isValid: false, errors };
  }

  payload.tests.forEach((test, testIndex) => {
    if (!hasRequiredFields(test, sessionContract.requiredTestFields)) {
      errors.push(`Teste ${testIndex} inválido: faltam campos obrigatórios.`);
      return;
    }

    if (!Array.isArray(test.trials) || test.trials.length === 0) {
      errors.push(`Teste ${testIndex} inválido: trials deve ser um array com pelo menos 1 item.`);
      return;
    }

    test.trials.forEach((trial, trialIndex) => {
      if (!hasRequiredFields(trial, sessionContract.requiredTrialFields)) {
        errors.push(`Trial ${trialIndex} do teste ${testIndex} inválido: faltam campos obrigatórios.`);
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateSessionPayload
};