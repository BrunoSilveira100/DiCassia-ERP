const dataService = require('../services/dataService');

async function index(req, res) {
  res.json(await dataService.getAll());
}

module.exports = { index };
