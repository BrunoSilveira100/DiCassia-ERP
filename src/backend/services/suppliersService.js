const suppliersRepository = require('../repositories/suppliersRepository');
const { AppError } = require('../middlewares/errors');
const { text, integerId } = require('./validation');

function create(input) {
  const supplier = {
    nome: text(input.nome),
    tel: text(input.tel),
    email: text(input.email),
    produtos: text(input.produtos)
  };

  if (!supplier.nome) throw new AppError('Informe o nome do fornecedor.', 400);
  return suppliersRepository.create(supplier);
}

function remove(idValue) {
  if (!suppliersRepository.remove(integerId(idValue))) {
    throw new AppError('Fornecedor não encontrado.', 404);
  }
}

module.exports = { create, remove };
