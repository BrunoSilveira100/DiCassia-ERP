const { getDatabase } = require('../config/database');

const fields = 'id, "desc" AS "desc", valor, venc, status';

function findAll() {
  return getDatabase().prepare(`SELECT ${fields} FROM contas ORDER BY venc ASC, id DESC`).all();
}

function findById(id) {
  return getDatabase().prepare(`SELECT ${fields} FROM contas WHERE id = ?`).get(id);
}

async function create(account) {
  const result = await getDatabase()
    .prepare('INSERT INTO contas ("desc", valor, venc, status) VALUES (?, ?, ?, ?)')
    .run(account.desc, account.valor, account.venc, account.status);
  return findById(result.lastInsertRowid);
}

async function toggleStatus(id) {
  const result = await getDatabase()
    .prepare("UPDATE contas SET status = CASE status WHEN 'Pago' THEN 'Pendente' ELSE 'Pago' END WHERE id = ?")
    .run(id);
  return result.changes ? findById(id) : undefined;
}

function remove(id) {
  return getDatabase().prepare('DELETE FROM contas WHERE id = ?').run(id);
}

module.exports = { findAll, findById, create, toggleStatus, remove };
