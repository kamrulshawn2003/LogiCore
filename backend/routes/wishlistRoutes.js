const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.use(auth, authorize('customer', 'admin'));

router.get('/', wishlistController.listWishlist);
router.get('/map', wishlistController.getWishlistMap);
router.post('/:productId', wishlistController.addToWishlist);
router.delete('/:productId', wishlistController.removeFromWishlist);

module.exports = router;
