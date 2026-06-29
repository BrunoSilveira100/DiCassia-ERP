const suppliersService = require('../services/suppliersService');

function create(req, res) {
  res.status(201).json(suppliersService.create(req.body));
}

function remove(req, res) {
  suppliersService.remove(req.params.id);
  res.json({ ok: true });
}

module.exports = { create, remove };
