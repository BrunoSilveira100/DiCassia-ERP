const accountsService = require('../services/accountsService');

async function create(req, res) {
  res.status(201).json(await accountsService.create(req.body));
}

async function toggleStatus(req, res) {
  res.json(await accountsService.toggleStatus(req.params.id));
}

async function remove(req, res) {
  await accountsService.remove(req.params.id);
  res.json({ ok: true });
}

module.exports = { create, toggleStatus, remove };
