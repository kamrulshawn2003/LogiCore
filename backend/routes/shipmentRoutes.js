const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipmentController');
const { 
  createShipmentValidator,
  updateShipmentStatusValidator
} = require('../validators/shipmentValidator');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Public tracking route
router.get('/track/:trackingNumber', shipmentController.trackShipment);

// Protected routes
router.get('/', auth, authorize('admin', 'warehouse_manager', 'driver'), shipmentController.getAllShipments);
router.get('/statistics', auth, authorize('admin', 'warehouse_manager'), shipmentController.getShipmentStatistics);
router.get('/:id', auth, authorize('admin', 'warehouse_manager', 'driver'), shipmentController.getShipmentById);

router.post('/', auth, authorize('admin', 'warehouse_manager'), createShipmentValidator, shipmentController.createShipment);
router.post('/:id/assign', auth, authorize('admin', 'warehouse_manager'), shipmentController.assignDriver);
router.patch('/:id/status', auth, authorize('admin', 'warehouse_manager', 'driver'), updateShipmentStatusValidator, shipmentController.updateShipmentStatus);

module.exports = router;