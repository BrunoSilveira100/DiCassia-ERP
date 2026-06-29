const { getDatabase } = require('../config/database');

const fields = 'id, nome, tel, email, produtos';

function findAll() {
  return getDatabase().prepare(`SELECT ${fields} FROM fornecedores ORDER BY nome COLLATE NOCASE ASC, id DESC`).all();
}

function findById(id) {
  return getDatabase().prepare(`SELECT ${fields} FROM fornecedores WHERE id = ?`).get(id);
}

function create(supplier) {
  const result = getDatabase()
    .prepare('INSERT INTO fornecedores (nome, tel, email, produtos) VALUES (?, ?, ?, ?)')
    .run(supplier.nome, supplier.tel, supplier.email, supplier.produtos);
  return findById(result.lastInsertRowid);
}

function remove(id) {
  return getDatabase().prepare('DELETE FROM fornecedores WHERE id = ?').run(id).changes > 0;
}

module.exports = { findAll, findById, create, remove };
