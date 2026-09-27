const refundService = require('../services/refundService');
const ApiResponse = require('../utils/ApiResponse');
const { validationResult } = require('express-validator');

class RefundController {
  async createRefund(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(ApiResponse.error(errors.array()[0].msg));
      }

      const refund = await refundService.createRefund(req.user.id, req.body);
      res.status(201).json(ApiResponse.success({ refund }));
    } catch (error) {
      const badRequestMessages = [
        'Please provide a reason (at least 5 characters)',
        'Type must be REFUND or RETURN',
        'Order not found',
        'You can only request a refund for your own orders',
        'Only delivered orders (or orders out for delivery) can request a refund',
        'Only paid orders can be refunded',
        'A refund request for this order is already in progress'
      ];
      if (badRequestMessages.includes(error.message)) {
        return res.status(400).json(ApiResponse.error(error.message));
      }
      next(error);
    }
  }

  async getAllRefunds(req, res, next) {
    try {
      const result = await refundService.getRefunds(req.query);
      res.json(ApiResponse.success(result.refunds, result.pagination));
    } catch (error) {
      next(error);
    }
  }

  async getMyRefunds(req, res, next) {
    try {
      const result = await refundService.getMyRefunds(req.user.id, req.query);
      res.json(ApiResponse.success(result.refunds, result.pagination));
    } catch (error) {
      next(error);
    }
  }

  async getStatistics(req, res, next) {
    try {
      const statistics = await refundService.getStatistics();
      res.json(ApiResponse.success({ statistics }));
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(ApiResponse.error(errors.array()[0].msg));
      }

      const refund = await refundService.updateStatus(
        req.params.id,
        req.body.status,
        req.user.id,
        req.body.admin_note
      );
      res.json(ApiResponse.success({ refund }));
    } catch (error) {
      if (
        error.code === 'NOT_FOUND' ||
        error.message === 'Refund request not found'
      ) {
        return res.status(404).json(ApiResponse.error(error.message));
      }
      if (
        error.message.includes('Invalid status transition') ||
        error.message === 'A rejection reason is required' ||
        error.message === 'Order not found'
      ) {
        return res.status(400).json(ApiResponse.error(error.message));
      }
      next(error);
    }
  }

  async cancelRefund(req, res, next) {
    try {
      const refund = await refundService.cancelRefund(req.params.id, req.user.id);
      res.json(ApiResponse.success({ refund }));
    } catch (error) {
      if (
        error.code === 'NOT_FOUND' ||
        error.message === 'Refund request not found'
      ) {
        return res.status(404).json(ApiResponse.error(error.message));
      }
      if (
        error.message === 'You can only cancel your own refund requests' ||
        error.message === 'Only pending refund requests can be cancelled'
      ) {
        return res.status(400).json(ApiResponse.error(error.message));
      }
      next(error);
    }
  }
}

module.exports = new RefundController();
