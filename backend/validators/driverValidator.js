const { body } = require('express-validator');

const createDriverValidator = [
  body('user_id')
    .notEmpty()
    .withMessage('User ID is required')
    .isInt()
    .withMessage('Invalid user ID'),
  
  body('license_number')
    .notEmpty()
    .withMessage('License number is required')
    .isLength({ min: 5, max: 50 })
    .withMessage('License number must be between 5 and 50 characters'),
  
  body('vehicle_number')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Vehicle number must be less than 50 characters'),
  
  body('vehicle_type')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Vehicle type must be less than 50 characters')
];

const updateDriverValidator = [
  body('license_number')
    .optional()
    .isLength({ min: 5, max: 50 })
    .withMessage('License number must be between 5 and 50 characters'),
  
  body('vehicle_number')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Vehicle number must be less than 50 characters'),
  
  body('vehicle_type')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Vehicle type must be less than 50 characters'),
  
  body('status')
    .optional()
    .isIn(['AVAILABLE', 'ASSIGNED', 'ON_DELIVERY', 'OFF_DUTY', 'INACTIVE'])
    .withMessage('Invalid status')
];

module.exports = {
  createDriverValidator,
  updateDriverValidator
};