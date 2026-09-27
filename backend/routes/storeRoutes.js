const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');

// Public storefront endpoints (no auth required)
router.get('/home', storeController.getHome);
router.get('/products', storeController.listProducts);
router.get('/products/:id', storeController.getProductDetail);

module.exports = router;
