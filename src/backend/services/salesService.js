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

function create(input) {
  return salesRepository.create(normalize(input));
}

function update(idValue, input) {
  const sale = salesRepository.update(integerId(idValue), normalize(input));
  if (!sale) throw new AppError('Venda não encontrada.', 404);
  return sale;
}

function remove(idValue) {
  if (!salesRepository.remove(integerId(idValue))) {
    throw new AppError('Venda não encontrada.', 404);
  }
}

module.exports = { create, update, remove };
