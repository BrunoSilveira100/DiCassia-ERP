const { AppError } = require('../middlewares/errors');

function text(value) {
  return String(value == null ? '' : value).trim();
}

function positiveMoney(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : NaN;
}

function integerId(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError('Identificador inválido.', 400);
  }
  return parsed;
}

module.exports = { text, positiveMoney, integerId };
