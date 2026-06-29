const dataService = require('../services/dataService');

function index(req, res) {
  res.json(dataService.getAll());
}

module.exports = { index };
