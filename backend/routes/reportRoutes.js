const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.get('/sales', auth, authorize('admin', 'warehouse_manager'), reportController.generateSalesReport);
router.get('/inventory', auth, authorize('admin', 'warehouse_manager'), reportController.generateInventoryReport);
router.get('/purchases', auth, authorize('admin', 'warehouse_manager'), reportController.generatePurchaseReport);
router.get('/shipments', auth, authorize('admin', 'warehouse_manager'), reportController.generateShipmentReport);
router.get('/supplier-performance', auth, authorize('admin'), reportController.generateSupplierPerformanceReport);

module.exports = router;