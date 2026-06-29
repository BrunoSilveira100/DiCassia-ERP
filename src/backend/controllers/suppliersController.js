const suppliersService = require('../services/suppliersService');

async function create(req, res) {
  res.status(201).json(await suppliersService.create(req.body));
}

async function remove(req, res) {
  await suppliersService.remove(req.params.id);
  res.json({ ok: true });
}

module.exports = { create, remove };
