const orderService = require('../services/orderService');
const ApiResponse = require('../utils/ApiResponse');
const { validationResult } = require('express-validator');
const { AuditLog } = require('../models');

class OrderController {
  async getAllOrders(req, res, next) {
    try {
      // Customer can only see their own orders
      if (req.user && req.user.role === 'customer') {
        req.query.customer_id = req.user.id;
      }
      
      // Warehouse manager can only see their warehouse orders
      if (req.user && req.user.role === 'warehouse_manager' && req.user.warehouse_id) {
        req.query.warehouse_id = req.user.warehouse_id;
      }
      
      const result = await orderService.getAllOrders(req.query);
      res.json(
        ApiResponse.success(result.orders, result.pagination)
      );
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null;
      const userRole = req.user ? req.user.role : null;
      
      const order = await orderService.getOrderById(
        req.params.id,
        userId,
        userRole
      );
      
      res.json(
        ApiResponse.success({ order })
      );
    } catch (error) {
      if (error.message === 'Order not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      if (error.message === 'You can only view your own orders' ||
          error.message === 'You do not have access to this order') {
        return res.status(403).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async createOrder(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      if (!req.user) {
        return res.status(401).json(
          ApiResponse.error('Authentication required')
        );
      }
      
      const order = await orderService.createOrder(
        req.body,
        req.user.id
      );
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'ORDER_CREATE',
        entity_type: 'Order',
        entity_id: order.id,
        new_value: { 
          order_number: order.order_number,
          total_amount: order.total_amount 
        },
        ip_address: req.ip
      });
      
      res.status(201).json(
        ApiResponse.success({ order })
      );
    } catch (error) {
      if (error.message === 'Order must have at least one item' ||
          error.message.includes('Insufficient') ||
          error.message.includes('Product with ID') ||
          error.message.includes('No inventory')) {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json(
          ApiResponse.error('Status is required')
        );
      }
      
      if (!req.user) {
        return res.status(401).json(
          ApiResponse.error('Authentication required')
        );
      }
      
      const order = await orderService.updateOrderStatus(
        req.params.id,
        status,
        req.user.id,
        req.user.role
      );
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'ORDER_STATUS_CHANGE',
        entity_type: 'Order',
        entity_id: order.id,
        new_value: { status },
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success({ order })
      );
    } catch (error) {
      if (error.message === 'Order not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      if (error.message.includes('Invalid status transition') ||
          error.message.includes('Only pending') ||
          error.message === 'You can only cancel your own orders') {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async cancelOrder(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json(
          ApiResponse.error('Authentication required')
        );
      }
      
      const { reason } = req.body;
      const order = await orderService.cancelOrder(
        req.params.id,
        req.user.id,
        reason
      );
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'ORDER_CANCEL',
        entity_type: 'Order',
        entity_id: order.id,
        new_value: { status: 'CANCELLED', reason },
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success({ order })
      );
    } catch (error) {
      if (error.message === 'Order not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      if (error.message === 'You can only cancel your own orders' ||
          error.message === 'Only pending or confirmed orders can be cancelled') {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async getCustomerOrders(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json(
          ApiResponse.error('Authentication required')
        );
      }
      
      const result = await orderService.getCustomerOrders(
        req.user.id,
        req.query
      );
      
      res.json(
        ApiResponse.success(result.orders, result.pagination)
      );
    } catch (error) {
      next(error);
    }
  }

  async getOrderStatistics(req, res, next) {
    try {
      const stats = await orderService.getOrderStatistics();
      res.json(
        ApiResponse.success({ statistics: stats })
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();