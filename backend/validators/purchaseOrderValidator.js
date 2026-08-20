const { body } = require('express-validator');

const createPurchaseOrderValidator = [
  body('supplier_id')
    .notEmpty()
    .withMessage('Supplier ID is required')
    .isInt()
    .withMessage('Invalid supplier ID'),
  
  body('warehouse_id')
    .notEmpty()
    .withMessage('Warehouse ID is required')
    .isInt()
    .withMessage('Invalid warehouse ID'),
  
  body('expected_delivery_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  
  body('items.*.product_id')
    .isInt()
    .withMessage('Invalid product ID'),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('items.*.unit_price')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),
  
  body('notes')
    .optional()
    .trim()
];

const receivePurchaseOrderValidator = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  
  body('items.*.purchase_order_item_id')
    .isInt()
    .withMessage('Invalid purchase order item ID'),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer')
];

module.exports = {
  createPurchaseOrderValidator,
  receivePurchaseOrderValidator
};