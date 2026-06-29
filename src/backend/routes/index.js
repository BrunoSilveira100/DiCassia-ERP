const express = require('express');
const dataController = require('../controllers/dataController');
const salesController = require('../controllers/salesController');
const suppliersController = require('../controllers/suppliersController');
const accountsController = require('../controllers/accountsController');
const dashboardController = require('../controllers/dashboardController');
const { getDatabase } = require('../config/database');

const router = express.Router();

router.get('/', function (req, res) {
  res.json({
    name: 'DiCassia API',
    status: 'ok',
    endpoints: ['/api/health', '/api/status', '/api/data', '/api/dashboard']
  });
});

router.get('/health', function (req, res) {
  res.json({ status: 'ok' });
});

router.get('/status', async function (req, res) {
  await getDatabase().prepare('SELECT 1 AS ok').get();
  res.json({
    status: 'ok',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});

router.get('/data', dataController.index);
router.get('/dashboard', dashboardController.show);

router.post('/vendas', salesController.create);
router.put('/vendas/:id', salesController.update);
router.delete('/vendas/:id', salesController.remove);

router.post('/fornecedores', suppliersController.create);
router.delete('/fornecedores/:id', suppliersController.remove);

router.post('/contas', accountsController.create);
router.patch('/contas/:id/toggle', accountsController.toggleStatus);
router.delete('/contas/:id', accountsController.remove);

module.exports = router;
