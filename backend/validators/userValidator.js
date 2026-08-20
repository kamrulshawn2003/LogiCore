const { body } = require('express-validator');

const createUserValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]*$/)
    .withMessage('Invalid phone number format'),
  
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['admin', 'warehouse_manager', 'supplier', 'driver', 'customer'])
    .withMessage('Invalid role'),
  
  body('warehouse_id')
    .optional()
    .isInt()
    .withMessage('Invalid warehouse ID')
];

const updateUserValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]*$/)
    .withMessage('Invalid phone number format'),
  
  body('role')
    .optional()
    .isIn(['admin', 'warehouse_manager', 'supplier', 'driver', 'customer'])
    .withMessage('Invalid role'),
  
  body('warehouse_id')
    .optional()
    .isInt()
    .withMessage('Invalid warehouse ID'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Invalid status')
];

module.exports = {
  createUserValidator,
  updateUserValidator
};