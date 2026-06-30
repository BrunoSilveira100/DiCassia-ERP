const { getDatabase } = require('../config/database');

const fields = 'id, data, cliente, valor, pagamento, status, obs';

function findAll() {
  return getDatabase().prepare(`SELECT ${fields} FROM vendas ORDER BY data DESC, id DESC`).all();
}

function findById(id) {
  return getDatabase().prepare(`SELECT ${fields} FROM vendas WHERE id = ?`).get(id);
}

async function create(sale) {
  return getDatabase()
    .prepare(`
      INSERT INTO vendas (data, cliente, valor, pagamento, status, obs)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING ${fields}
    `)
    .get(sale.data, sale.cliente, sale.valor, sale.pagamento, sale.status, sale.obs);
}

async function update(id, sale) {
  return getDatabase()
    .prepare(`
      UPDATE vendas
      SET data = ?, cliente = ?, valor = ?, pagamento = ?, status = ?, obs = ?
      WHERE id = ?
      RETURNING ${fields}
    `)
    .get(sale.data, sale.cliente, sale.valor, sale.pagamento, sale.status, sale.obs, id);
}

function remove(id) {
  return getDatabase().prepare('DELETE FROM vendas WHERE id = ?').run(id);
}

module.exports = { findAll, findById, create, update, remove };
