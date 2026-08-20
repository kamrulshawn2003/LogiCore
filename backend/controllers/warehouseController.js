const warehouseService = require('../services/warehouseService');
const ApiResponse = require('../utils/ApiResponse');
const { validationResult } = require('express-validator');
const { AuditLog } = require('../models');

class WarehouseController {
  async getAllWarehouses(req, res, next) {
    try {
      // Check user role for warehouse filtering
      if (req.user && req.user.role === 'warehouse_manager') {
        req.query.manager_id = req.user.id;
      }
      
      const result = await warehouseService.getAllWarehouses(req.query);
      res.json(
        ApiResponse.success(result.warehouses, result.pagination)
      );
    } catch (error) {
      next(error);
    }
  }

  async getWarehouseById(req, res, next) {
    try {
      const warehouse = await warehouseService.getWarehouseById(req.params.id);
      
      // Check if user has access to this warehouse
      if (
        req.user && req.user.role === 'warehouse_manager' && 
        warehouse.manager_id !== req.user.id
      ) {
        return res.status(403).json(
          ApiResponse.error('You do not have access to this warehouse')
        );
      }
      
      res.json(
        ApiResponse.success({ warehouse })
      );
    } catch (error) {
      if (error.message === 'Warehouse not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async createWarehouse(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      const warehouse = await warehouseService.createWarehouse(req.body);
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'WAREHOUSE_CREATE',
        entity_type: 'Warehouse',
        entity_id: warehouse.id,
        new_value: { name: warehouse.name, code: warehouse.code },
        ip_address: req.ip
      });
      
      res.status(201).json(
        ApiResponse.success({ warehouse })
      );
    } catch (error) {
      if (error.message === 'Warehouse with this code already exists') {
        return res.status(409).json(
          ApiResponse.error(error.message)
        );
      }
      if (error.message === 'Manager not found' || 
          error.message === 'User must be a warehouse manager') {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async updateWarehouse(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      const warehouseId = req.params.id;
      const oldWarehouse = await warehouseService.getWarehouseById(warehouseId);
      const warehouse = await warehouseService.updateWarehouse(warehouseId, req.body);
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'WAREHOUSE_UPDATE',
        entity_type: 'Warehouse',
        entity_id: warehouse.id,
        old_value: { 
          name: oldWarehouse.name, 
          status: oldWarehouse.status,
          manager_id: oldWarehouse.manager_id 
        },
        new_value: { 
          name: warehouse.name, 
          status: warehouse.status,
          manager_id: warehouse.manager_id 
        },
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success({ warehouse })
      );
    } catch (error) {
      if (error.message === 'Warehouse not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      if (error.message === 'Manager not found' || 
          error.message === 'User must be a warehouse manager') {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async deleteWarehouse(req, res, next) {
    try {
      const result = await warehouseService.deleteWarehouse(req.params.id);
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'WAREHOUSE_DELETE',
        entity_type: 'Warehouse',
        entity_id: req.params.id,
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success(result)
      );
    } catch (error) {
      if (error.message === 'Warehouse not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      if (error.message === 'Cannot delete warehouse with existing inventory' ||
          error.message === 'Cannot delete warehouse with active orders') {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async getWarehouseInventory(req, res, next) {
    try {
      // Check user access
      if (req.user && req.user.role === 'warehouse_manager') {
        const warehouse = await require('../models').Warehouse.findByPk(req.params.id);
        if (!warehouse || warehouse.manager_id !== req.user.id) {
          return res.status(403).json(
            ApiResponse.error('You do not have access to this warehouse')
          );
        }
      }
      
      const result = await warehouseService.getWarehouseInventory(
        req.params.id,
        req.query
      );
      
      res.json(
        ApiResponse.success(result.inventory, result.pagination)
      );
    } catch (error) {
      next(error);
    }
  }

  async getWarehouseStatistics(req, res, next) {
    try {
      const stats = await warehouseService.getWarehouseStatistics();
      res.json(
        ApiResponse.success({ statistics: stats })
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WarehouseController();