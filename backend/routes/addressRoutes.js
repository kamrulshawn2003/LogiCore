const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.use(auth, authorize('customer', 'admin'));

router.get('/', addressController.listAddresses);
router.post('/', addressController.createAddress);
router.patch('/:id/default', addressController.setDefault);
router.put('/:id', addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);

module.exports = router;
