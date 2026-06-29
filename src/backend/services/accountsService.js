const accountsRepository = require('../repositories/accountsRepository');
const { AppError } = require('../middlewares/errors');
const { text, positiveMoney, integerId } = require('./validation');

async function create(input) {
  const account = {
    desc: text(input.desc),
    valor: positiveMoney(input.valor),
    venc: text(input.venc),
    status: text(input.status) === 'Pago' ? 'Pago' : 'Pendente'
  };

  if (!account.desc || !Number.isFinite(account.valor)) {
    throw new AppError('Preencha descrição e valor.', 400);
  }

  return accountsRepository.create(account);
}

async function toggleStatus(idValue) {
  const account = await accountsRepository.toggleStatus(integerId(idValue));
  if (!account) throw new AppError('Conta não encontrada.', 404);
  return account;
}

async function remove(idValue) {
  const result = await accountsRepository.remove(integerId(idValue));
  if (!result.changes) {
    throw new AppError('Conta não encontrada.', 404);
  }
}

module.exports = { create, toggleStatus, remove };
