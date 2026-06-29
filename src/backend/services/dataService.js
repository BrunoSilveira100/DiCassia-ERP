const salesRepository = require('../repositories/salesRepository');
const suppliersRepository = require('../repositories/suppliersRepository');
const accountsRepository = require('../repositories/accountsRepository');

function getAll() {
  return {
    vendas: salesRepository.findAll(),
    fornecedores: suppliersRepository.findAll(),
    contas: accountsRepository.findAll()
  };
}

module.exports = { getAll };
