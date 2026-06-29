const suppliersRepository = require('../repositories/suppliersRepository');
const { AppError } = require('../middlewares/errors');
const { text, integerId } = require('./validation');

async function create(input) {
  const supplier = {
    nome: text(input.nome),
    tel: text(input.tel),
    email: text(input.email),
    produtos: text(input.produtos)
  };

  if (!supplier.nome) throw new AppError('Informe o nome do fornecedor.', 400);
  return suppliersRepository.create(supplier);
}

async function remove(idValue) {
  const result = await suppliersRepository.remove(integerId(idValue));
  if (!result.changes) {
    throw new AppError('Fornecedor não encontrado.', 404);
  }
}

module.exports = { create, remove };
