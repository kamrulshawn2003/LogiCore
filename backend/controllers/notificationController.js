const notificationService = require('../services/notificationService');
const ApiResponse = require('../utils/ApiResponse');
const { validationResult } = require('express-validator');
const { AuditLog } = require('../models');

class NotificationController {
  async getAllNotifications(req, res, next) {
    try {
      const result = await notificationService.getAllNotifications(
        req.user.id,
        req.query
      );
      
      res.json(
        ApiResponse.success(result.notifications, result.pagination)
      );
    } catch (error) {
      next(error);
    }
  }

  async getUnreadNotifications(req, res, next) {
    try {
      const result = await notificationService.getUnreadNotifications(req.user.id);
      
      res.json(
        ApiResponse.success({
          notifications: result.notifications,
          unread_count: result.unread_count
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async createNotification(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      const notification = await notificationService.createNotification(req.body);
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'NOTIFICATION_CREATE',
        entity_type: 'Notification',
        entity_id: notification.id,
        new_value: { title: notification.title, user_id: notification.user_id },
        ip_address: req.ip
      });
      
      res.status(201).json(
        ApiResponse.success({ notification })
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

  async markAsRead(req, res, next) {
    try {
      const notification = await notificationService.markAsRead(
        req.params.id,
        req.user.id
      );
      
      res.json(
        ApiResponse.success({ notification })
      );
    } catch (error) {
      if (error.message === 'Notification not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.user.id);
      
      res.json(
        ApiResponse.success(result)
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req, res, next) {
    try {
      const result = await notificationService.deleteNotification(
        req.params.id,
        req.user.id
      );
      
      res.json(
        ApiResponse.success(result)
      );
    } catch (error) {
      if (error.message === 'Notification not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async clearAllNotifications(req, res, next) {
    try {
      const result = await notificationService.clearAllNotifications(req.user.id);
      
      res.json(
        ApiResponse.success(result)
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();