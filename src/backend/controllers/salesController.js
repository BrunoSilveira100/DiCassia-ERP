const salesService = require('../services/salesService');

async function create(req, res) {
  res.status(201).json(await salesService.create(req.body));
}

async function update(req, res) {
  res.json(await salesService.update(req.params.id, req.body));
}

async function remove(req, res) {
  await salesService.remove(req.params.id);
  res.json({ ok: true });
}

module.exports = { create, update, remove };
