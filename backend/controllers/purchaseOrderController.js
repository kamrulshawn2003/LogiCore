const purchaseOrderService = require('../services/purchaseOrderService');
const ApiResponse = require('../utils/ApiResponse');
const { validationResult } = require('express-validator');
const { AuditLog, Supplier } = require('../models');

class PurchaseOrderController {
  async getAllPurchaseOrders(req, res, next) {
    try {
      // Filter for supplier role
      if (req.user.role === 'supplier') {
        const supplier = await Supplier.findOne({ 
          where: { user_id: req.user.id } 
        });
        if (supplier) {
          req.query.supplier_id = supplier.id;
        }
      }
      
      // Filter for warehouse manager
      if (req.user.role === 'warehouse_manager' && req.user.warehouse_id) {
        req.query.warehouse_id = req.user.warehouse_id;
      }
      
      const result = await purchaseOrderService.getAllPurchaseOrders(req.query);
      res.json(
        ApiResponse.success(result.purchaseOrders, result.pagination)
      );
    } catch (error) {
      next(error);
    }
  }

  async getPurchaseOrderById(req, res, next) {
    try {
      const purchaseOrder = await purchaseOrderService.getPurchaseOrderById(req.params.id);
      
      // Check supplier access
      if (req.user.role === 'supplier') {
        const supplier = await Supplier.findOne({ 
          where: { user_id: req.user.id } 
        });
        if (!supplier || purchaseOrder.supplier_id !== supplier.id) {
          return res.status(403).json(
            ApiResponse.error('You do not have access to this purchase order')
          );
        }
      }
      
      res.json(
        ApiResponse.success({ purchaseOrder })
      );
    } catch (error) {
      if (error.message === 'Purchase order not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async createPurchaseOrder(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      const purchaseOrder = await purchaseOrderService.createPurchaseOrder(
        req.body,
        req.user.id
      );
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'PO_CREATE',
        entity_type: 'PurchaseOrder',
        entity_id: purchaseOrder.id,
        new_value: { 
          po_number: purchaseOrder.po_number,
          total_amount: purchaseOrder.total_amount 
        },
        ip_address: req.ip
      });
      
      res.status(201).json(
        ApiResponse.success({ purchaseOrder })
      );
    } catch (error) {
      if (error.message === 'Purchase order must have at least one item' ||
          error.message === 'Supplier not found' ||
          error.message === 'Warehouse not found' ||
          error.message.includes('Product with ID')) {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async updatePurchaseOrder(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      const poId = req.params.id;
      const oldPO = await purchaseOrderService.getPurchaseOrderById(poId);
      const purchaseOrder = await purchaseOrderService.updatePurchaseOrder(
        poId,
        req.body,
        req.user.id
      );
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'PO_UPDATE',
        entity_type: 'PurchaseOrder',
        entity_id: purchaseOrder.id,
        old_value: { 
          total_amount: oldPO.total_amount,
          status: oldPO.status 
        },
        new_value: { 
          total_amount: purchaseOrder.total_amount,
          status: purchaseOrder.status 
        },
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success({ purchaseOrder })
      );
    } catch (error) {
      if (error.message === 'Purchase order not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      if (error.message === 'Only draft purchase orders can be updated') {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async submitPurchaseOrder(req, res, next) {
    try {
      const purchaseOrder = await purchaseOrderService.submitPurchaseOrder(
        req.params.id,
        req.user.id
      );
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'PO_SUBMIT',
        entity_type: 'PurchaseOrder',
        entity_id: purchaseOrder.id,
        new_value: { status: purchaseOrder.status },
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success({ purchaseOrder })
      );
    } catch (error) {
      if (error.message === 'Purchase order not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      if (error.message === 'Only draft purchase orders can be submitted' ||
          error.message === 'Cannot submit empty purchase order') {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async approvePurchaseOrder(req, res, next) {
    try {
      const purchaseOrder = await purchaseOrderService.approvePurchaseOrder(
        req.params.id,
        req.user.id
      );
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'PO_APPROVE',
        entity_type: 'PurchaseOrder',
        entity_id: purchaseOrder.id,
        new_value: { status: purchaseOrder.status },
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success({ purchaseOrder })
      );
    } catch (error) {
      if (error.message === 'Purchase order not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      if (error.message === 'Only submitted purchase orders can be approved') {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async rejectPurchaseOrder(req, res, next) {
    try {
      const { reason } = req.body;
      const purchaseOrder = await purchaseOrderService.rejectPurchaseOrder(
        req.params.id,
        req.user.id,
        reason
      );
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'PO_REJECT',
        entity_type: 'PurchaseOrder',
        entity_id: purchaseOrder.id,
        new_value: { status: purchaseOrder.status, reason },
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success({ purchaseOrder })
      );
    } catch (error) {
      if (error.message === 'Purchase order not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      if (error.message === 'Only submitted or approved purchase orders can be rejected') {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async acceptPurchaseOrder(req, res, next) {
    try {
      // Get supplier ID from user
      const supplier = await Supplier.findOne({ 
        where: { user_id: req.user.id } 
      });
      
      if (!supplier) {
        return res.status(403).json(
          ApiResponse.error('Supplier profile not found')
        );
      }
      
      const purchaseOrder = await purchaseOrderService.acceptPurchaseOrder(
        req.params.id,
        supplier.id
      );
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'PO_ACCEPT',
        entity_type: 'PurchaseOrder',
        entity_id: purchaseOrder.id,
        new_value: { status: purchaseOrder.status },
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success({ purchaseOrder })
      );
    } catch (error) {
      if (error.message === 'Purchase order not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      if (error.message === 'You can only accept your own purchase orders' ||
          error.message === 'Only approved purchase orders can be accepted') {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async cancelPurchaseOrder(req, res, next) {
    try {
      const { reason } = req.body;
      const purchaseOrder = await purchaseOrderService.cancelPurchaseOrder(
        req.params.id,
        req.user.id,
        reason
      );
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'PO_CANCEL',
        entity_type: 'PurchaseOrder',
        entity_id: purchaseOrder.id,
        new_value: { status: purchaseOrder.status, reason },
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success({ purchaseOrder })
      );
    } catch (error) {
      if (error.message === 'Purchase order not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      if (error.message.includes('Cannot cancel purchase order')) {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async receivePurchaseOrder(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      const purchaseOrder = await purchaseOrderService.receivePurchaseOrder(
        req.params.id,
        req.body,
        req.user.id
      );
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'PO_RECEIVE',
        entity_type: 'PurchaseOrder',
        entity_id: purchaseOrder.id,
        new_value: { 
          status: purchaseOrder.status,
          received_percentage: purchaseOrder.received_percentage 
        },
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success({ purchaseOrder })
      );
    } catch (error) {
      if (error.message === 'Purchase order not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      if (error.message === 'Only accepted or partially received purchase orders can receive items' ||
          error.message.includes('Cannot receive more than') ||
          error.message.includes('Purchase order item with ID')) {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async getPurchaseOrderStatistics(req, res, next) {
    try {
      const stats = await purchaseOrderService.getPurchaseOrderStatistics();
      res.json(
        ApiResponse.success({ statistics: stats })
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PurchaseOrderController();