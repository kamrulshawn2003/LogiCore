const { body } = require('express-validator');

const createWarehouseValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Warehouse name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Warehouse name must be between 2 and 255 characters'),
  
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Warehouse code is required')
    .isLength({ min: 2, max: 20 })
    .withMessage('Warehouse code must be between 2 and 20 characters')
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Warehouse code can only contain uppercase letters, numbers, and hyphens'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must be less than 500 characters'),
  
  body('manager_id')
    .optional()
    .isInt()
    .withMessage('Invalid manager ID'),
  
  body('capacity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Capacity must be a positive number'),
  
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180')
];

const updateWarehouseValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Warehouse name must be between 2 and 255 characters'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must be less than 500 characters'),
  
  body('manager_id')
    .optional()
    .isInt()
    .withMessage('Invalid manager ID'),
  
  body('capacity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Capacity must be a positive number'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'maintenance'])
    .withMessage('Invalid status'),
  
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180')
];

module.exports = {
  createWarehouseValidator,
  updateWarehouseValidator
};