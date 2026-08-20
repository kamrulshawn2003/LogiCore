const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { 
  createCategoryValidator, 
  updateCategoryValidator 
} = require('../validators/categoryValidator');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Protected routes
router.post('/', auth, authorize('admin'), createCategoryValidator, categoryController.createCategory);
router.put('/:id', auth, authorize('admin'), updateCategoryValidator, categoryController.updateCategory);
router.delete('/:id', auth, authorize('admin'), categoryController.deleteCategory);

module.exports = router;