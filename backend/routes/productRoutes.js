const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { 
  createProductValidator, 
  updateProductValidator 
} = require('../validators/productValidator');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/low-stock', auth, authorize('admin', 'warehouse_manager'), productController.getLowStockProducts);
router.get('/statistics', auth, authorize('admin', 'warehouse_manager'), productController.getProductStatistics);
router.get('/:id', productController.getProductById);

// Protected routes
router.post('/', auth, authorize('admin'), createProductValidator, productController.createProduct);
router.put('/:id', auth, authorize('admin'), updateProductValidator, productController.updateProduct);
router.delete('/:id', auth, authorize('admin'), productController.deleteProduct);
router.patch('/:id/status', auth, authorize('admin'), productController.updateProductStatus);

module.exports = router;