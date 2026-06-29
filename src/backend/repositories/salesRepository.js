const { getDatabase } = require('../config/database');

const fields = 'id, data, cliente, valor, pagamento, status, obs';

function findAll() {
  return getDatabase().prepare(`SELECT ${fields} FROM vendas ORDER BY data DESC, id DESC`).all();
}

function findById(id) {
  return getDatabase().prepare(`SELECT ${fields} FROM vendas WHERE id = ?`).get(id);
}

async function create(sale) {
  const result = await getDatabase()
    .prepare('INSERT INTO vendas (data, cliente, valor, pagamento, status, obs) VALUES (?, ?, ?, ?, ?, ?)')
    .run(sale.data, sale.cliente, sale.valor, sale.pagamento, sale.status, sale.obs);
  return findById(result.lastInsertRowid);
}

async function update(id, sale) {
  const result = await getDatabase()
    .prepare('UPDATE vendas SET data = ?, cliente = ?, valor = ?, pagamento = ?, status = ?, obs = ? WHERE id = ?')
    .run(sale.data, sale.cliente, sale.valor, sale.pagamento, sale.status, sale.obs, id);
  return result.changes ? findById(id) : undefined;
}

function remove(id) {
  return getDatabase().prepare('DELETE FROM vendas WHERE id = ?').run(id);
}

module.exports = { findAll, findById, create, update, remove };
