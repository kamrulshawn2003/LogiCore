const authService = require('../services/authService');
const ApiResponse = require('../utils/ApiResponse');
const { validationResult } = require('express-validator');
const { AuditLog } = require('../models');

class AuthController {
  async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      const { user, token } = await authService.register(req.body);
      
      // Create audit log
      await AuditLog.create({
        user_id: user.id,
        action: 'USER_REGISTER',
        entity_type: 'User',
        entity_id: user.id,
        new_value: { email: user.email, role: user.role },
        ip_address: req.ip
      });
      
      res.status(201).json(
        ApiResponse.success({ user, token })
      );
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      const { email, password } = req.body;
      const { user, token } = await authService.login(email, password);
      
      // Create audit log
      await AuditLog.create({
        user_id: user.id,
        action: 'USER_LOGIN',
        entity_type: 'User',
        entity_id: user.id,
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success({ user, token })
      );
    } catch (error) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async getCurrentUser(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      res.json(
        ApiResponse.success({ user })
      );
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      const { currentPassword, newPassword } = req.body;
      const user = await authService.changePassword(
        req.user.id,
        currentPassword,
        newPassword
      );
      
      // Create audit log
      await AuditLog.create({
        user_id: user.id,
        action: 'PASSWORD_CHANGE',
        entity_type: 'User',
        entity_id: user.id,
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success({ message: 'Password changed successfully' })
      );
    } catch (error) {
      if (error.message === 'Current password is incorrect') {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      
      res.json(
        ApiResponse.success(result)
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();