const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');
const { 
  createWarehouseValidator, 
  updateWarehouseValidator 
} = require('../validators/warehouseValidator');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Public routes
router.get('/', warehouseController.getAllWarehouses);
router.get('/statistics', auth, authorize('admin'), warehouseController.getWarehouseStatistics);
router.get('/:id', warehouseController.getWarehouseById);

// Protected routes
router.post('/', auth, authorize('admin'), createWarehouseValidator, warehouseController.createWarehouse);
router.put('/:id', auth, authorize('admin'), updateWarehouseValidator, warehouseController.updateWarehouse);
router.delete('/:id', auth, authorize('admin'), warehouseController.deleteWarehouse);
router.get('/:id/inventory', auth, authorize('admin', 'warehouse_manager'), warehouseController.getWarehouseInventory);

module.exports = router;