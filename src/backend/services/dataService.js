const salesRepository = require('../repositories/salesRepository');
const suppliersRepository = require('../repositories/suppliersRepository');
const accountsRepository = require('../repositories/accountsRepository');

async function getAll() {
  const [vendas, fornecedores, contas] = await Promise.all([
    salesRepository.findAll(),
    suppliersRepository.findAll(),
    accountsRepository.findAll()
  ]);

  return {
    vendas,
    fornecedores,
    contas
  };
}

module.exports = { getAll };
