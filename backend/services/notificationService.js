const { Notification, User, sequelize } = require('../models');
const { Op } = require('sequelize');

class NotificationService {
  async getAllNotifications(userId, query = {}) {
    const {
      page = 1,
      limit = 20,
      type = '',
      is_read = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = query;

    const where = { user_id: userId };
    
    if (type) {
      where.type = type;
    }
    
    if (is_read !== '') {
      where.is_read = is_read === 'true';
    }

    const { rows, count } = await Notification.findAndCountAll({
      where,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    return {
      notifications: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getUnreadNotifications(userId) {
    const notifications = await Notification.findAll({
      where: {
        user_id: userId,
        is_read: false
      },
      order: [['created_at', 'DESC']],
      limit: 50
    });
    
    const unreadCount = await Notification.count({
      where: {
        user_id: userId,
        is_read: false
      }
    });
    
    return {
      notifications,
      unread_count: unreadCount
    };
  }

  async createNotification(notificationData) {
    const { user_id, title, message, type = 'INFO', link } = notificationData;
    
    // Verify user exists
    const user = await User.findByPk(user_id);
    if (!user) {
      throw new Error('User not found');
    }
    
    const notification = await Notification.create({
      user_id,
      title,
      message,
      type,
      link,
      is_read: false
    });
    
    return notification;
  }

  async createBulkNotifications(notifications) {
    const created = await Notification.bulkCreate(notifications, {
      validate: true
    });
    
    return created;
  }

  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        user_id: userId
      }
    });
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    await notification.update({ is_read: true });
    
    return notification;
  }

  async markAllAsRead(userId) {
    const result = await Notification.update(
      { is_read: true },
      {
        where: {
          user_id: userId,
          is_read: false
        }
      }
    );
    
    return {
      updated_count: result[0]
    };
  }

  async deleteNotification(notificationId, userId) {
    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        user_id: userId
      }
    });
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    await notification.destroy();
    
    return { message: 'Notification deleted successfully' };
  }

  async clearAllNotifications(userId) {
    const result = await Notification.destroy({
      where: {
        user_id: userId
      }
    });
    
    return {
      deleted_count: result
    };
  }

  // Helper methods for creating specific notifications
  async notifyLowStock(product, inventory, warehouse) {
    const admins = await User.findAll({
      where: { role: 'admin', status: 'active' }
    });
    
    const managers = await User.findAll({
      where: {
        role: 'warehouse_manager',
        status: 'active',
        warehouse_id: warehouse.id
      }
    });
    
    const recipients = [...admins, ...managers];
    
    const notifications = recipients.map(recipient => ({
      user_id: recipient.id,
      title: 'Low Stock Alert',
      message: `${product.name} (${product.sku}) is low on stock. Current: ${inventory.quantity}, Reorder level: ${product.reorder_level}`,
      type: 'WARNING',
      link: `/inventory?product_id=${product.id}`
    }));
    
    if (notifications.length > 0) {
      await this.createBulkNotifications(notifications);
    }
  }

  async notifyOrderStatusChange(order, oldStatus, newStatus) {
    const notification = {
      user_id: order.customer_id,
      title: 'Order Status Update',
      message: `Your order ${order.order_number} has been updated from ${oldStatus} to ${newStatus}`,
      type: 'INFO',
      link: `/orders/${order.id}`
    };
    
    await this.createNotification(notification);
  }

  async notifyShipmentAssigned(shipment) {
    if (!shipment.driver_id) return;
    
    const driver = await require('../models').Driver.findByPk(shipment.driver_id);
    if (!driver) return;
    
    const notification = {
      user_id: driver.user_id,
      title: 'Shipment Assigned',
      message: `You have been assigned to shipment ${shipment.shipment_number}`,
      type: 'INFO',
      link: `/shipments/${shipment.id}`
    };
    
    await this.createNotification(notification);
  }

  async notifyPurchaseOrderStatus(po, oldStatus, newStatus) {
    // Notify supplier
    const supplier = await require('../models').Supplier.findByPk(po.supplier_id);
    
    if (supplier && supplier.user_id) {
      const notification = {
        user_id: supplier.user_id,
        title: 'Purchase Order Update',
        message: `PO ${po.po_number} status changed from ${oldStatus} to ${newStatus}`,
        type: 'INFO',
        link: `/purchase-orders/${po.id}`
      };
      
      await this.createNotification(notification);
    }
    
    // Notify creator
    if (po.created_by) {
      const notification = {
        user_id: po.created_by,
        title: 'Purchase Order Update',
        message: `PO ${po.po_number} status changed from ${oldStatus} to ${newStatus}`,
        type: 'INFO',
        link: `/purchase-orders/${po.id}`
      };
      
      await this.createNotification(notification);
    }
  }
}

module.exports = new NotificationService();