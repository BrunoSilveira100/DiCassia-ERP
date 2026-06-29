const dashboardService = require('../services/dashboardService');

function show(req, res) {
  res.json(dashboardService.getMetrics(req.query));
}

module.exports = { show };
