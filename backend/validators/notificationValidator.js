const { body } = require('express-validator');

const createNotificationValidator = [
  body('user_id')
    .notEmpty()
    .withMessage('User ID is required')
    .isInt()
    .withMessage('Invalid user ID'),
  
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Title must be between 2 and 255 characters'),
  
  body('message')
    .optional()
    .trim(),
  
  body('type')
    .optional()
    .isIn(['INFO', 'SUCCESS', 'WARNING', 'ERROR'])
    .withMessage('Invalid notification type'),
  
  body('link')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Link must be less than 255 characters')
];

module.exports = {
  createNotificationValidator
};