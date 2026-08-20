const { body } = require('express-validator');

const createOrderValidator = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  
  body('items.*.product_id')
    .isInt()
    .withMessage('Invalid product ID'),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('shipping_address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Shipping address must be less than 500 characters'),
  
  body('shipping_city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must be less than 100 characters'),
  
  body('shipping_state')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('State must be less than 100 characters'),
  
  body('shipping_zip')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('ZIP code must be less than 20 characters'),
  
  body('shipping_country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country must be less than 100 characters'),
  
  body('notes')
    .optional()
    .trim()
];

const updateOrderStatusValidator = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn([
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'PACKED',
      'SHIPPED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
      'RETURN_REQUESTED',
      'RETURNED'
    ])
    .withMessage('Invalid status')
];

module.exports = {
  createOrderValidator,
  updateOrderStatusValidator
};