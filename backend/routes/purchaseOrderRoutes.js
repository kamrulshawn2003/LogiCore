const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');
const { 
  createPurchaseOrderValidator,
  receivePurchaseOrderValidator
} = require('../validators/purchaseOrderValidator');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Protected routes
router.get('/', auth, authorize('admin', 'warehouse_manager', 'supplier'), purchaseOrderController.getAllPurchaseOrders);
router.get('/statistics', auth, authorize('admin', 'warehouse_manager'), purchaseOrderController.getPurchaseOrderStatistics);
router.get('/:id', auth, authorize('admin', 'warehouse_manager', 'supplier'), purchaseOrderController.getPurchaseOrderById);

router.post('/', auth, authorize('admin', 'warehouse_manager'), createPurchaseOrderValidator, purchaseOrderController.createPurchaseOrder);
router.put('/:id', auth, authorize('admin', 'warehouse_manager'), createPurchaseOrderValidator, purchaseOrderController.updatePurchaseOrder);
router.post('/:id/submit', auth, authorize('admin', 'warehouse_manager'), purchaseOrderController.submitPurchaseOrder);
router.post('/:id/approve', auth, authorize('admin'), purchaseOrderController.approvePurchaseOrder);
router.post('/:id/reject', auth, authorize('admin'), purchaseOrderController.rejectPurchaseOrder);
router.post('/:id/accept', auth, authorize('supplier'), purchaseOrderController.acceptPurchaseOrder);
router.post('/:id/cancel', auth, authorize('admin', 'warehouse_manager'), purchaseOrderController.cancelPurchaseOrder);
router.post('/:id/receive', auth, authorize('admin', 'warehouse_manager'), receivePurchaseOrderValidator, purchaseOrderController.receivePurchaseOrder);

module.exports = router;