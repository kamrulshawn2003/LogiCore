const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { createNotificationValidator } = require('../validators/notificationValidator');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// User routes
router.get('/', auth, notificationController.getAllNotifications);
router.get('/unread', auth, notificationController.getUnreadNotifications);
router.patch('/:id/read', auth, notificationController.markAsRead);
router.patch('/read-all', auth, notificationController.markAllAsRead);
router.delete('/:id', auth, notificationController.deleteNotification);
router.delete('/clear-all', auth, notificationController.clearAllNotifications);

// Admin routes
router.post('/', auth, authorize('admin'), createNotificationValidator, notificationController.createNotification);

module.exports = router;