const salesRepository = require('../repositories/salesRepository');
const { AppError } = require('../middlewares/errors');
const { text, positiveMoney, integerId } = require('./validation');

const allowedStatuses = new Set(['Pago', 'Concluído', 'Pendente', 'A Receber', 'Cancelada', 'Agendada']);

function normalize(input) {
  const sale = {
    data: text(input.data),
    cliente: text(input.cliente),
    valor: positiveMoney(input.valor),
    pagamento: text(input.pagamento) || 'PIX',
    status: text(input.status) || 'Pago',
    obs: text(input.obs)
  };

  if (!sale.data || !sale.cliente || !Number.isFinite(sale.valor)) {
    throw new AppError('Preencha data, cliente e valor.', 400);
  }
  if (!allowedStatuses.has(sale.status)) {
    throw new AppError('Status da venda inválido.', 400);
  }

  return sale;
}

async function create(input) {
  return salesRepository.create(normalize(input));
}

async function update(idValue, input) {
  const sale = await salesRepository.update(integerId(idValue), normalize(input));
  if (!sale) throw new AppError('Venda não encontrada.', 404);
  return sale;
}

async function remove(idValue) {
  const result = await salesRepository.remove(integerId(idValue));
  if (!result.changes) {
    throw new AppError('Venda não encontrada.', 404);
  }
}

module.exports = { create, update, remove };
