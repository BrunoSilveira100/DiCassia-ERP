const salesService = require('../services/salesService');

function create(req, res) {
  res.status(201).json(salesService.create(req.body));
}

function update(req, res) {
  res.json(salesService.update(req.params.id, req.body));
}

function remove(req, res) {
  salesService.remove(req.params.id);
  res.json({ ok: true });
}

module.exports = { create, update, remove };
