const inventoryService = require('../services/inventoryService');
const ApiResponse = require('../utils/ApiResponse');
const { validationResult } = require('express-validator');
const { AuditLog } = require('../models');

class InventoryController {
  async getAllInventory(req, res, next) {
    try {
      // Warehouse managers can only see their warehouse
      if (req.user && req.user.role === 'warehouse_manager' && req.user.warehouse_id) {
        req.query.warehouse_id = req.user.warehouse_id;
      }
      
      const result = await inventoryService.getAllInventory(req.query);
      res.json(
        ApiResponse.success(result.inventory, result.pagination)
      );
    } catch (error) {
      next(error);
    }
  }

  async getInventoryById(req, res, next) {
    try {
      const inventory = await inventoryService.getInventoryById(req.params.id);
      
      // Check warehouse manager access
      if (
        req.user && req.user.role === 'warehouse_manager' && 
        req.user.warehouse_id !== inventory.warehouse_id
      ) {
        return res.status(403).json(
          ApiResponse.error('You do not have access to this inventory')
        );
      }
      
      res.json(
        ApiResponse.success({ inventory })
      );
    } catch (error) {
      if (error.message === 'Inventory record not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async adjustInventory(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      const result = await inventoryService.adjustInventory(
        req.body,
        req.user.id
      );
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'INVENTORY_ADJUST',
        entity_type: 'Inventory',
        entity_id: result.inventory.id,
        old_value: { quantity: result.old_quantity },
        new_value: { quantity: result.new_quantity },
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success({
          inventory: result.inventory,
          adjustment: result.adjustment
        })
      );
    } catch (error) {
      if (error.message === 'Cannot reduce quantity below reserved quantity') {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async transferInventory(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      const result = await inventoryService.transferInventory(
        req.body,
        req.user.id
      );
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'INVENTORY_TRANSFER',
        entity_type: 'Inventory',
        entity_id: result.source_inventory.id,
        new_value: {
          from_warehouse: req.body.from_warehouse_id,
          to_warehouse: req.body.to_warehouse_id,
          quantity: result.transferred_quantity
        },
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success({
          source_inventory: result.source_inventory,
          destination_inventory: result.destination_inventory,
          transferred_quantity: result.transferred_quantity
        })
      );
    } catch (error) {
      if (error.message === 'Source and destination warehouses must be different' ||
          error.message === 'Source inventory not found' ||
          error.message === 'Insufficient stock. Available:') {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async receiveInventory(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      const result = await inventoryService.receiveInventory(
        req.body,
        req.user.id
      );
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'INVENTORY_RECEIVE',
        entity_type: 'Inventory',
        entity_id: result.inventory.id,
        new_value: { 
          quantity: result.new_quantity,
          received: result.received_quantity 
        },
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success({
          inventory: result.inventory,
          received_quantity: result.received_quantity
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async issueInventory(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      const result = await inventoryService.issueInventory(
        req.body,
        req.user.id
      );
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'INVENTORY_ISSUE',
        entity_type: 'Inventory',
        entity_id: result.inventory.id,
        new_value: { 
          quantity: result.new_quantity,
          issued: result.issued_quantity 
        },
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success({
          inventory: result.inventory,
          issued_quantity: result.issued_quantity
        })
      );
    } catch (error) {
      if (error.message === 'Inventory record not found' ||
          error.message === 'Insufficient stock. Available:') {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async reserveInventory(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      const result = await inventoryService.reserveInventory(
        req.body,
        req.user.id
      );
      
      res.json(
        ApiResponse.success({
          inventory: result.inventory,
          reserved_quantity: result.reserved_quantity
        })
      );
    } catch (error) {
      if (error.message === 'Inventory record not found' ||
          error.message === 'Insufficient stock. Available:') {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async releaseInventory(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      const result = await inventoryService.releaseInventory(
        req.body,
        req.user.id
      );
      
      res.json(
        ApiResponse.success({
          inventory: result.inventory,
          released_quantity: result.released_quantity
        })
      );
    } catch (error) {
      if (error.message === 'Inventory record not found' ||
          error.message === 'Cannot release more than reserved quantity') {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async getInventoryMovements(req, res, next) {
    try {
      // Warehouse managers can only see their warehouse movements
      if (req.user && req.user.role === 'warehouse_manager' && req.user.warehouse_id) {
        req.query.warehouse_id = req.user.warehouse_id;
      }
      
      const result = await inventoryService.getInventoryMovements(req.query);
      res.json(
        ApiResponse.success(result.movements, result.pagination)
      );
    } catch (error) {
      next(error);
    }
  }

  async getLowStockInventory(req, res, next) {
    try {
      const inventory = await inventoryService.getLowStockInventory();
      res.json(
        ApiResponse.success({ inventory })
      );
    } catch (error) {
      next(error);
    }
  }

  async getInventoryStatistics(req, res, next) {
    try {
      const stats = await inventoryService.getInventoryStatistics();
      res.json(
        ApiResponse.success({ statistics: stats })
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InventoryController();