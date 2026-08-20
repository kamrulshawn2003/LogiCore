const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.get('/stats', auth, authorize('admin', 'warehouse_manager'), dashboardController.getDashboardStats);
router.get('/sales', auth, authorize('admin', 'warehouse_manager'), dashboardController.getSalesAnalytics);
router.get('/inventory', auth, authorize('admin', 'warehouse_manager'), dashboardController.getInventoryAnalytics);
router.get('/purchase-orders', auth, authorize('admin', 'warehouse_manager'), dashboardController.getPurchaseOrderAnalytics);
router.get('/shipments', auth, authorize('admin', 'warehouse_manager'), dashboardController.getShipmentAnalytics);

module.exports = router;