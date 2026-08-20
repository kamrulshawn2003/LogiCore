const { body } = require('express-validator');

const createSupplierValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Supplier name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Supplier name must be between 2 and 255 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]*$/)
    .withMessage('Invalid phone number format'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must be less than 500 characters')
];

const updateSupplierValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Supplier name must be between 2 and 255 characters'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]*$/)
    .withMessage('Invalid phone number format'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must be less than 500 characters'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'blacklisted'])
    .withMessage('Invalid status')
];

const updateRatingValidator = [
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5')
];

module.exports = {
  createSupplierValidator,
  updateSupplierValidator,
  updateRatingValidator
};