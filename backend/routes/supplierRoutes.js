const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { 
  createSupplierValidator, 
  updateSupplierValidator,
  updateRatingValidator
} = require('../validators/supplierValidator');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Public routes
router.get('/', supplierController.getAllSuppliers);
router.get('/statistics', auth, authorize('admin', 'warehouse_manager'), supplierController.getSupplierStatistics);
router.get('/:id', supplierController.getSupplierById);

// Protected routes
router.post('/', auth, authorize('admin'), createSupplierValidator, supplierController.createSupplier);
router.put('/:id', auth, authorize('admin'), updateSupplierValidator, supplierController.updateSupplier);
router.delete('/:id', auth, authorize('admin'), supplierController.deleteSupplier);
router.patch('/:id/rating', auth, authorize('admin', 'warehouse_manager'), updateRatingValidator, supplierController.updateSupplierRating);
router.get('/:id/purchase-orders', auth, authorize('admin', 'warehouse_manager', 'supplier'), supplierController.getSupplierPurchaseOrders);

module.exports = router;