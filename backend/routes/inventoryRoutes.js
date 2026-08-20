const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { 
  adjustInventoryValidator,
  transferInventoryValidator,
  receiveInventoryValidator,
  issueInventoryValidator,
  reserveInventoryValidator,
  releaseInventoryValidator
} = require('../validators/inventoryValidator');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Protected routes
router.get('/', auth, authorize('admin', 'warehouse_manager'), inventoryController.getAllInventory);
router.get('/movements', auth, authorize('admin', 'warehouse_manager'), inventoryController.getInventoryMovements);
router.get('/low-stock', auth, authorize('admin', 'warehouse_manager'), inventoryController.getLowStockInventory);
router.get('/statistics', auth, authorize('admin', 'warehouse_manager'), inventoryController.getInventoryStatistics);
router.get('/:id', auth, authorize('admin', 'warehouse_manager'), inventoryController.getInventoryById);

router.post('/adjust', auth, authorize('admin', 'warehouse_manager'), adjustInventoryValidator, inventoryController.adjustInventory);
router.post('/transfer', auth, authorize('admin', 'warehouse_manager'), transferInventoryValidator, inventoryController.transferInventory);
router.post('/receive', auth, authorize('admin', 'warehouse_manager'), receiveInventoryValidator, inventoryController.receiveInventory);
router.post('/issue', auth, authorize('admin', 'warehouse_manager'), issueInventoryValidator, inventoryController.issueInventory);
router.post('/reserve', auth, authorize('admin', 'warehouse_manager'), reserveInventoryValidator, inventoryController.reserveInventory);
router.post('/release', auth, authorize('admin', 'warehouse_manager'), releaseInventoryValidator, inventoryController.releaseInventory);

module.exports = router;