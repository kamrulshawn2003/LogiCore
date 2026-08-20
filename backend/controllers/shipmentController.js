const shipmentService = require('../services/shipmentService');
const driverService = require('../services/driverService');
const ApiResponse = require('../utils/ApiResponse');
const { validationResult } = require('express-validator');
const { AuditLog } = require('../models');

class ShipmentController {
  async getAllShipments(req, res, next) {
    try {
      // Driver can only see their shipments
      if (req.user && req.user.role === 'driver') {
        const driver = await require('../models').Driver.findOne({
          where: { user_id: req.user.id }
        });
        
        if (driver) {
          req.query.driver_id = driver.id;
        }
      }
      
      // Warehouse manager can only see their warehouse shipments
      if (req.user && req.user.role === 'warehouse_manager' && req.user.warehouse_id) {
        req.query.warehouse_id = req.user.warehouse_id;
      }
      
      const result = await shipmentService.getAllShipments(req.query);
      res.json(
        ApiResponse.success(result.shipments, result.pagination)
      );
    } catch (error) {
      next(error);
    }
  }

  async getShipmentById(req, res, next) {
    try {
      const shipment = await shipmentService.getShipmentById(req.params.id);
      
      // Driver can only access their shipments
      if (req.user && req.user.role === 'driver') {
        const driver = await require('../models').Driver.findOne({
          where: { user_id: req.user.id }
        });
        
        if (!driver || shipment.driver_id !== driver.id) {
          return res.status(403).json(
            ApiResponse.error('You can only access your assigned shipments')
          );
        }
      }
      
      res.json(
        ApiResponse.success({ shipment })
      );
    } catch (error) {
      if (error.message === 'Shipment not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async createShipment(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      const shipment = await shipmentService.createShipment(
        req.body,
        req.user.id
      );
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'SHIPMENT_CREATE',
        entity_type: 'Shipment',
        entity_id: shipment.id,
        new_value: { 
          shipment_number: shipment.shipment_number,
          tracking_number: shipment.tracking_number 
        },
        ip_address: req.ip
      });
      
      res.status(201).json(
        ApiResponse.success({ shipment })
      );
    } catch (error) {
      if (error.message === 'Order not found' ||
          error.message === 'Order must be packed before creating shipment' ||
          error.message === 'Shipment already exists for this order') {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async assignDriver(req, res, next) {
    try {
      const { driver_id } = req.body;
      const shipment = await shipmentService.assignDriver(
        req.params.id,
        driver_id,
        req.user.id
      );
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'SHIPMENT_ASSIGN_DRIVER',
        entity_type: 'Shipment',
        entity_id: shipment.id,
        new_value: { driver_id },
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success({ shipment })
      );
    } catch (error) {
      if (error.message === 'Shipment not found' ||
          error.message === 'Driver not found' ||
          error.message === 'Shipment is not ready for driver assignment' ||
          error.message === 'Driver is not available for assignment') {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async updateShipmentStatus(req, res, next) {
    try {
      const { status } = req.body;
      const shipment = await shipmentService.updateShipmentStatus(
        req.params.id,
        status,
        req.user.id,
        req.user.role
      );
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'SHIPMENT_STATUS_CHANGE',
        entity_type: 'Shipment',
        entity_id: shipment.id,
        new_value: { status },
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success({ shipment })
      );
    } catch (error) {
      if (error.message === 'Shipment not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      if (error.message.includes('Invalid status transition') ||
          error.message === 'You can only update your assigned shipments' ||
          error.message === 'Drivers cannot update to this status') {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async trackShipment(req, res, next) {
    try {
      const tracking = await shipmentService.trackShipment(req.params.trackingNumber);
      res.json(
        ApiResponse.success({ tracking })
      );
    } catch (error) {
      if (error.message === 'Shipment not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async getShipmentStatistics(req, res, next) {
    try {
      const stats = await shipmentService.getShipmentStatistics();
      res.json(
        ApiResponse.success({ statistics: stats })
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ShipmentController();