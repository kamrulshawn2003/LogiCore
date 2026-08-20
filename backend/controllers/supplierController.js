const supplierService = require('../services/supplierService');
const ApiResponse = require('../utils/ApiResponse');
const { validationResult } = require('express-validator');
const { AuditLog } = require('../models');

class SupplierController {
  async getAllSuppliers(req, res, next) {
    try {
      const result = await supplierService.getAllSuppliers(req.query);
      res.json(
        ApiResponse.success(result.suppliers, result.pagination)
      );
    } catch (error) {
      next(error);
    }
  }

  async getSupplierById(req, res, next) {
    try {
      const supplier = await supplierService.getSupplierById(req.params.id);
      res.json(
        ApiResponse.success({ supplier })
      );
    } catch (error) {
      if (error.message === 'Supplier not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async createSupplier(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      const supplier = await supplierService.createSupplier(req.body);
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'SUPPLIER_CREATE',
        entity_type: 'Supplier',
        entity_id: supplier.id,
        new_value: { name: supplier.name, email: supplier.email },
        ip_address: req.ip
      });
      
      res.status(201).json(
        ApiResponse.success({ supplier })
      );
    } catch (error) {
      if (error.message === 'Supplier with this email already exists') {
        return res.status(409).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async updateSupplier(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      const supplierId = req.params.id;
      const oldSupplier = await supplierService.getSupplierById(supplierId);
      const supplier = await supplierService.updateSupplier(supplierId, req.body);
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'SUPPLIER_UPDATE',
        entity_type: 'Supplier',
        entity_id: supplier.id,
        old_value: { 
          name: oldSupplier.name, 
          email: oldSupplier.email,
          status: oldSupplier.status 
        },
        new_value: { 
          name: supplier.name, 
          email: supplier.email,
          status: supplier.status 
        },
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success({ supplier })
      );
    } catch (error) {
      if (error.message === 'Supplier not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      if (error.message === 'Supplier with this email already exists') {
        return res.status(409).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async deleteSupplier(req, res, next) {
    try {
      const result = await supplierService.deleteSupplier(req.params.id);
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'SUPPLIER_DELETE',
        entity_type: 'Supplier',
        entity_id: req.params.id,
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success(result)
      );
    } catch (error) {
      if (error.message === 'Supplier not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      if (error.message === 'Cannot deactivate supplier with active purchase orders') {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async updateSupplierRating(req, res, next) {
    try {
      const { rating } = req.body;
      const supplier = await supplierService.updateSupplierRating(
        req.params.id, 
        rating
      );
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'SUPPLIER_RATING_UPDATE',
        entity_type: 'Supplier',
        entity_id: supplier.id,
        old_value: { rating: supplier.rating },
        new_value: { rating },
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success({ supplier })
      );
    } catch (error) {
      if (error.message === 'Supplier not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      if (error.message === 'Rating must be between 0 and 5') {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async getSupplierPurchaseOrders(req, res, next) {
    try {
      const result = await supplierService.getSupplierPurchaseOrders(
        req.params.id,
        req.query
      );
      res.json(
        ApiResponse.success(result.purchaseOrders, result.pagination)
      );
    } catch (error) {
      next(error);
    }
  }

  async getSupplierStatistics(req, res, next) {
    try {
      const stats = await supplierService.getSupplierStatistics();
      res.json(
        ApiResponse.success({ statistics: stats })
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SupplierController();