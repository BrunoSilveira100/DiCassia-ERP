const dashboardService = require('../services/dashboardService');

async function show(req, res) {
  res.json(await dashboardService.getMetrics(req.query));
}

module.exports = { show };
