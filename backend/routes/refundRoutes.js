const express = require('express');
const router = express.Router();
const refundController = require('../controllers/refundController');
const {
  createRefundValidator,
  updateRefundStatusValidator
} = require('../validators/refundValidator');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Staff: list & decide refund requests
router.get('/', auth, authorize('admin', 'warehouse_manager'), refundController.getAllRefunds);
router.get('/statistics', auth, authorize('admin', 'warehouse_manager'), refundController.getStatistics);

// Customer: my requests / create / cancel
router.get('/mine', auth, authorize('customer'), refundController.getMyRefunds);
router.post('/', auth, authorize('customer'), createRefundValidator, refundController.createRefund);
router.post('/:id/cancel', auth, authorize('customer'), refundController.cancelRefund);

// Staff: approve / reject / complete
router.patch('/:id/status', auth, authorize('admin', 'warehouse_manager'), updateRefundStatusValidator, refundController.updateStatus);

module.exports = router;
