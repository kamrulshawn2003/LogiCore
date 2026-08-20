const userService = require('../services/userService');
const ApiResponse = require('../utils/ApiResponse');
const { validationResult } = require('express-validator');
const { AuditLog } = require('../models');

class UserController {
  async getAllUsers(req, res, next) {
    try {
      const result = await userService.getAllUsers(req.query);
      res.json(
        ApiResponse.success(result.users, result.pagination)
      );
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      res.json(
        ApiResponse.success({ user })
      );
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      const user = await userService.createUser(req.body);
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'USER_CREATE',
        entity_type: 'User',
        entity_id: user.id,
        new_value: { email: user.email, role: user.role },
        ip_address: req.ip
      });
      
      res.status(201).json(
        ApiResponse.success({ user })
      );
    } catch (error) {
      if (error.message === 'User with this email already exists') {
        return res.status(409).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      const userId = req.params.id;
      const oldUser = await userService.getUserById(userId);
      const user = await userService.updateUser(userId, req.body);
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'USER_UPDATE',
        entity_type: 'User',
        entity_id: user.id,
        old_value: { name: oldUser.name, role: oldUser.role },
        new_value: { name: user.name, role: user.role },
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success({ user })
      );
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const result = await userService.deleteUser(req.params.id);
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'USER_DELETE',
        entity_type: 'User',
        entity_id: req.params.id,
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success(result)
      );
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const { status } = req.body;
      const user = await userService.updateUserStatus(req.params.id, status);
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'USER_STATUS_CHANGE',
        entity_type: 'User',
        entity_id: user.id,
        new_value: { status },
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success({ user })
      );
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }
}

module.exports = new UserController();