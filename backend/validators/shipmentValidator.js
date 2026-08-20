const { body } = require('express-validator');

const createShipmentValidator = [
  body('order_id')
    .notEmpty()
    .withMessage('Order ID is required')
    .isInt()
    .withMessage('Invalid order ID'),
  
  body('warehouse_id')
    .optional()
    .isInt()
    .withMessage('Invalid warehouse ID'),
  
  body('driver_id')
    .optional()
    .isInt()
    .withMessage('Invalid driver ID'),
  
  body('estimated_delivery')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
];

const updateShipmentStatusValidator = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn([
      'READY',
      'ASSIGNED',
      'PICKED_UP',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'FAILED',
      'RETURNED'
    ])
    .withMessage('Invalid status')
];

module.exports = {
  createShipmentValidator,
  updateShipmentStatusValidator
};