const driverService = require('../services/driverService');
const ApiResponse = require('../utils/ApiResponse');
const { validationResult } = require('express-validator');
const { AuditLog } = require('../models');

class DriverController {
  async getAllDrivers(req, res, next) {
    try {
      const result = await driverService.getAllDrivers(req.query);
      res.json(
        ApiResponse.success(result.drivers, result.pagination)
      );
    } catch (error) {
      next(error);
    }
  }

  async getDriverById(req, res, next) {
    try {
      const driver = await driverService.getDriverById(req.params.id);
      res.json(
        ApiResponse.success({ driver })
      );
    } catch (error) {
      if (error.message === 'Driver not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async createDriver(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      const driver = await driverService.createDriver(req.body);
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'DRIVER_CREATE',
        entity_type: 'Driver',
        entity_id: driver.id,
        new_value: { 
          license_number: driver.license_number,
          vehicle_number: driver.vehicle_number 
        },
        ip_address: req.ip
      });
      
      res.status(201).json(
        ApiResponse.success({ driver })
      );
    } catch (error) {
      if (error.message === 'User not found' ||
          error.message === 'User is already registered as a driver' ||
          error.message === 'License number already exists') {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async updateDriver(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      const driverId = req.params.id;
      const oldDriver = await driverService.getDriverById(driverId);
      const driver = await driverService.updateDriver(driverId, req.body);
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'DRIVER_UPDATE',
        entity_type: 'Driver',
        entity_id: driver.id,
        old_value: { 
          license_number: oldDriver.license_number,
          status: oldDriver.status 
        },
        new_value: { 
          license_number: driver.license_number,
          status: driver.status 
        },
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success({ driver })
      );
    } catch (error) {
      if (error.message === 'Driver not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      if (error.message === 'License number already exists') {
        return res.status(409).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async deleteDriver(req, res, next) {
    try {
      const result = await driverService.deleteDriver(req.params.id);
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'DRIVER_DELETE',
        entity_type: 'Driver',
        entity_id: req.params.id,
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success(result)
      );
    } catch (error) {
      if (error.message === 'Driver not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      if (error.message === 'Cannot delete driver with active shipments') {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async updateDriverStatus(req, res, next) {
    try {
      const { status } = req.body;
      const driver = await driverService.updateDriverStatus(
        req.params.id,
        status
      );
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'DRIVER_STATUS_CHANGE',
        entity_type: 'Driver',
        entity_id: driver.id,
        new_value: { status },
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success({ driver })
      );
    } catch (error) {
      if (error.message === 'Driver not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      if (error.message === 'Invalid driver status') {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async getDriverShipments(req, res, next) {
    try {
      const result = await driverService.getDriverShipments(
        req.params.id,
        req.query
      );
      
      res.json(
        ApiResponse.success(result.shipments, result.pagination)
      );
    } catch (error) {
      next(error);
    }
  }

  async getDriverStatistics(req, res, next) {
    try {
      const stats = await driverService.getDriverStatistics();
      res.json(
        ApiResponse.success({ statistics: stats })
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DriverController();