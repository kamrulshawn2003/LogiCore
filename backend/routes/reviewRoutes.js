const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Public: product reviews
router.get('/product/:productId', reviewController.getProductReviews);

// Protected: create review / my reviews
router.post('/', auth, authorize('customer'), reviewController.createReview);
router.get('/mine', auth, authorize('customer'), reviewController.getMyReviews);

module.exports = router;
