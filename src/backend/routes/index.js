const express = require('express');
const dataController = require('../controllers/dataController');
const salesController = require('../controllers/salesController');
const suppliersController = require('../controllers/suppliersController');
const accountsController = require('../controllers/accountsController');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

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
