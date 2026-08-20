const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { 
  createOrderValidator,
  updateOrderStatusValidator
} = require('../validators/orderValidator');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Protected routes
router.get('/', auth, authorize('admin', 'warehouse_manager', 'customer'), orderController.getAllOrders);
router.get('/statistics', auth, authorize('admin', 'warehouse_manager'), orderController.getOrderStatistics);
router.get('/my-orders', auth, authorize('customer'), orderController.getCustomerOrders);
router.get('/:id', auth, authorize('admin', 'warehouse_manager', 'customer'), orderController.getOrderById);

router.post('/', auth, authorize('customer', 'admin'), createOrderValidator, orderController.createOrder);
router.patch('/:id/status', auth, authorize('admin', 'warehouse_manager'), updateOrderStatusValidator, orderController.updateOrderStatus);
router.post('/:id/cancel', auth, authorize('customer', 'admin'), orderController.cancelOrder);

module.exports = router;