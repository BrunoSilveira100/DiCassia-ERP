const { getDatabase } = require('../config/database');

const fields = 'id, desc, valor, venc, status';

function findAll() {
  return getDatabase().prepare(`SELECT ${fields} FROM contas ORDER BY venc ASC, id DESC`).all();
}

function findById(id) {
  return getDatabase().prepare(`SELECT ${fields} FROM contas WHERE id = ?`).get(id);
}

function create(account) {
  const result = getDatabase()
    .prepare('INSERT INTO contas (desc, valor, venc, status) VALUES (?, ?, ?, ?)')
    .run(account.desc, account.valor, account.venc, account.status);
  return findById(result.lastInsertRowid);
}

function toggleStatus(id) {
  const result = getDatabase()
    .prepare("UPDATE contas SET status = CASE status WHEN 'Pago' THEN 'Pendente' ELSE 'Pago' END WHERE id = ?")
    .run(id);
  return result.changes ? findById(id) : undefined;
}

function remove(id) {
  return getDatabase().prepare('DELETE FROM contas WHERE id = ?').run(id).changes > 0;
}

module.exports = { findAll, findById, create, toggleStatus, remove };
