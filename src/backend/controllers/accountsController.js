const accountsService = require('../services/accountsService');

function create(req, res) {
  res.status(201).json(accountsService.create(req.body));
}

function toggleStatus(req, res) {
  res.json(accountsService.toggleStatus(req.params.id));
}

function remove(req, res) {
  accountsService.remove(req.params.id);
  res.json({ ok: true });
}

module.exports = { create, toggleStatus, remove };
