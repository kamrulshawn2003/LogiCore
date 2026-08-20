const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { 
  createDriverValidator,
  updateDriverValidator
} = require('../validators/driverValidator');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Protected routes
router.get('/', auth, authorize('admin', 'warehouse_manager'), driverController.getAllDrivers);
router.get('/statistics', auth, authorize('admin', 'warehouse_manager'), driverController.getDriverStatistics);
router.get('/:id', auth, authorize('admin', 'warehouse_manager', 'driver'), driverController.getDriverById);

router.post('/', auth, authorize('admin'), createDriverValidator, driverController.createDriver);
router.put('/:id', auth, authorize('admin'), updateDriverValidator, driverController.updateDriver);
router.delete('/:id', auth, authorize('admin'), driverController.deleteDriver);
router.patch('/:id/status', auth, authorize('admin', 'warehouse_manager'), driverController.updateDriverStatus);
router.get('/:id/shipments', auth, authorize('admin', 'warehouse_manager', 'driver'), driverController.getDriverShipments);

module.exports = router;