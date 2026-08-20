const { body } = require('express-validator');

const adjustInventoryValidator = [
  body('product_id')
    .notEmpty()
    .withMessage('Product ID is required')
    .isInt()
    .withMessage('Invalid product ID'),
  
  body('warehouse_id')
    .notEmpty()
    .withMessage('Warehouse ID is required')
    .isInt()
    .withMessage('Invalid warehouse ID'),
  
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt()
    .withMessage('Quantity must be an integer'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters')
];

const transferInventoryValidator = [
  body('product_id')
    .notEmpty()
    .withMessage('Product ID is required')
    .isInt()
    .withMessage('Invalid product ID'),
  
  body('from_warehouse_id')
    .notEmpty()
    .withMessage('Source warehouse ID is required')
    .isInt()
    .withMessage('Invalid source warehouse ID'),
  
  body('to_warehouse_id')
    .notEmpty()
    .withMessage('Destination warehouse ID is required')
    .isInt()
    .withMessage('Invalid destination warehouse ID'),
  
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters')
];

const receiveInventoryValidator = [
  body('product_id')
    .notEmpty()
    .withMessage('Product ID is required')
    .isInt()
    .withMessage('Invalid product ID'),
  
  body('warehouse_id')
    .notEmpty()
    .withMessage('Warehouse ID is required')
    .isInt()
    .withMessage('Invalid warehouse ID'),
  
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('reference_type')
    .optional()
    .trim(),
  
  body('reference_id')
    .optional()
    .isInt()
    .withMessage('Invalid reference ID'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters')
];

const issueInventoryValidator = [
  body('product_id')
    .notEmpty()
    .withMessage('Product ID is required')
    .isInt()
    .withMessage('Invalid product ID'),
  
  body('warehouse_id')
    .notEmpty()
    .withMessage('Warehouse ID is required')
    .isInt()
    .withMessage('Invalid warehouse ID'),
  
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('reference_type')
    .optional()
    .trim(),
  
  body('reference_id')
    .optional()
    .isInt()
    .withMessage('Invalid reference ID'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters')
];

const reserveInventoryValidator = [
  body('product_id')
    .notEmpty()
    .withMessage('Product ID is required')
    .isInt()
    .withMessage('Invalid product ID'),
  
  body('warehouse_id')
    .notEmpty()
    .withMessage('Warehouse ID is required')
    .isInt()
    .withMessage('Invalid warehouse ID'),
  
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('reference_type')
    .optional()
    .trim(),
  
  body('reference_id')
    .optional()
    .isInt()
    .withMessage('Invalid reference ID')
];

const releaseInventoryValidator = [
  body('product_id')
    .notEmpty()
    .withMessage('Product ID is required')
    .isInt()
    .withMessage('Invalid product ID'),
  
  body('warehouse_id')
    .notEmpty()
    .withMessage('Warehouse ID is required')
    .isInt()
    .withMessage('Invalid warehouse ID'),
  
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('reference_type')
    .optional()
    .trim(),
  
  body('reference_id')
    .optional()
    .isInt()
    .withMessage('Invalid reference ID')
];

module.exports = {
  adjustInventoryValidator,
  transferInventoryValidator,
  receiveInventoryValidator,
  issueInventoryValidator,
  reserveInventoryValidator,
  releaseInventoryValidator
};