const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Read routes: any authenticated user may read their own (possibly empty) cart.
// This keeps the global cart-count poll from 403-ing admin/manager layouts.
router.get('/', auth, cartController.getCart);
router.get('/count', auth, cartController.getCartCount);

// Mutation routes require a customer (or admin) session
router.use(auth, authorize('customer', 'admin'));

router.post('/items', cartController.addItem);
router.patch('/items/:id', cartController.updateQuantity);
router.delete('/items/:id', cartController.removeItem);
router.delete('/', cartController.clearCart);

module.exports = router;
