const { body, param } = require('express-validator');

const createRefundValidator = [
  body('order_id')
    .isInt({ min: 1 })
    .withMessage('Order ID must be a positive integer'),
  body('type')
    .optional()
    .isIn(['REFUND', 'RETURN'])
    .withMessage('Type must be REFUND or RETURN'),
  body('reason')
    .isString()
    .trim()
    .isLength({ min: 5 })
    .withMessage('Please provide a reason (at least 5 characters)')
];

const updateRefundStatusValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid refund id'),
  body('status')
    .isIn(['APPROVED', 'REJECTED', 'REFUNDED'])
    .withMessage('Status must be APPROVED, REJECTED or REFUNDED'),
  body('admin_note')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Admin note must be at least 3 characters')
];

module.exports = {
  createRefundValidator,
  updateRefundStatusValidator
};
