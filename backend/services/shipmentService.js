const { 
  Shipment, 
  Order, 
  OrderItem, 
  Product,
  Driver, 
  Warehouse, 
  User,
  Inventory,
  InventoryMovement,
  sequelize 
} = require('../models');
const { Op } = require('sequelize');
const { generateShipmentNumber, generateTrackingNumber } = require('../utils/generateNumber');
const notificationService = require('./notificationService');

class ShipmentService {
  async getAllShipments(query = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      driver_id = '',
      warehouse_id = '',
      start_date = '',
      end_date = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = query;

    const where = {};
    
    if (search) {
      where[Op.or] = [
        { shipment_number: { [Op.like]: `%${search}%` } },
        { tracking_number: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (driver_id) {
      where.driver_id = driver_id;
    }
    
    if (warehouse_id) {
      where.warehouse_id = warehouse_id;
    }
    
    if (start_date && end_date) {
      where.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    } else if (start_date) {
      where.created_at = {
        [Op.gte]: new Date(start_date)
      };
    } else if (end_date) {
      where.created_at = {
        [Op.lte]: new Date(end_date)
      };
    }

    const { rows, count } = await Shipment.findAndCountAll({
      where,
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'order_number', 'shipping_address', 'shipping_city', 'shipping_state', 'total_amount']
        },
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Driver,
          as: 'driver',
          attributes: ['id', 'license_number', 'vehicle_number', 'status'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email', 'phone']
            }
          ]
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true
    });

    return {
      shipments: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getShipmentById(id) {
    const shipment = await Shipment.findByPk(id, {
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            {
              model: User,
              as: 'customer',
              attributes: ['id', 'name', 'email', 'phone']
            },
            {
              model: OrderItem,
              as: 'items',
              include: [
                {
                  model: Product,
                  as: 'product',
                  attributes: ['id', 'sku', 'name']
                }
              ]
            }
          ]
        },
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['id', 'name', 'code', 'address']
        },
        {
          model: Driver,
          as: 'driver',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email', 'phone']
            }
          ]
        }
      ]
    });
    
    if (!shipment) {
      throw new Error('Shipment not found');
    }
    
    return shipment;
  }

  async createShipment(shipmentData, userId) {
    const { order_id, warehouse_id, driver_id, estimated_delivery } = shipmentData;
    
    const transaction = await sequelize.transaction();
    
    try {
      // Verify order exists and is in correct status
      const order = await Order.findByPk(order_id, { transaction });
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      if (!['PACKED', 'SHIPPED'].includes(order.status)) {
        throw new Error('Order must be packed before creating shipment');
      }
      
      // Check if shipment already exists for this order
      const existingShipment = await Shipment.findOne({
        where: { order_id },
        transaction
      });
      
      if (existingShipment) {
        throw new Error('Shipment already exists for this order');
      }
      
      // Generate shipment and tracking numbers
      const shipment_number = generateShipmentNumber();
      const tracking_number = generateTrackingNumber();
      
      // Create shipment
      const shipment = await Shipment.create({
        shipment_number,
        tracking_number,
        order_id,
        warehouse_id: warehouse_id || order.warehouse_id,
        driver_id,
        status: driver_id ? 'ASSIGNED' : 'READY',
        estimated_delivery
      }, { transaction });
      
      // Update order status to SHIPPED
      await order.update({ status: 'SHIPPED' }, { transaction });
      
      // If driver assigned, update driver status
      if (driver_id) {
        const driver = await Driver.findByPk(driver_id, { transaction });
        if (driver) {
          await driver.update({ status: 'ASSIGNED' }, { transaction });
          await driver.increment('total_deliveries', { transaction });
        }
      }
      
      await transaction.commit();
      
      // Send notifications
      const populatedShipment = await this.getShipmentById(shipment.id);
      
      // Notify customer
      await notificationService.createNotification({
        user_id: order.customer_id,
        title: 'Shipment Created',
        message: `Your order ${order.order_number} has been shipped. Tracking number: ${tracking_number}`,
        type: 'SUCCESS',
        link: `/orders/${order.id}`
      });
      
      // If driver assigned, notify driver
      if (driver_id) {
        const driver = await Driver.findByPk(driver_id, {
          include: [{ model: User, as: 'user' }]
        });
        if (driver) {
          await notificationService.createNotification({
            user_id: driver.user_id,
            title: 'New Delivery Assignment',
            message: `You have been assigned to deliver shipment ${shipment_number}`,
            type: 'INFO',
            link: `/shipments/${shipment.id}`
          });
        }
        
        await notificationService.notifyShipmentAssigned(populatedShipment);
      }
      
      return populatedShipment;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async assignDriver(shipmentId, driverId, userId) {
    const transaction = await sequelize.transaction();
    
    try {
      const shipment = await Shipment.findByPk(shipmentId, { transaction });
      
      if (!shipment) {
        throw new Error('Shipment not found');
      }
      
      if (!['READY', 'ASSIGNED'].includes(shipment.status)) {
        throw new Error('Shipment is not ready for driver assignment');
      }
      
      const driver = await Driver.findByPk(driverId, { transaction });
      
      if (!driver) {
        throw new Error('Driver not found');
      }
      
      if (driver.status !== 'AVAILABLE') {
        throw new Error('Driver is not available for assignment');
      }
      
      // If shipment already has a different driver, update old driver
      if (shipment.driver_id && shipment.driver_id !== driverId) {
        const oldDriver = await Driver.findByPk(shipment.driver_id, { transaction });
        if (oldDriver) {
          await oldDriver.update({ status: 'AVAILABLE' }, { transaction });
        }
      }
      
      // Assign new driver
      await shipment.update({
        driver_id: driverId,
        status: 'ASSIGNED'
      }, { transaction });
      
      await driver.update({ status: 'ASSIGNED' }, { transaction });
      await driver.increment('total_deliveries', { transaction });
      
      await transaction.commit();
      
      const populatedShipment = await this.getShipmentById(shipmentId);
      
      // Notify driver about assignment
      await notificationService.createNotification({
        user_id: driver.user_id,
        title: 'New Delivery Assignment',
        message: `You have been assigned to deliver shipment ${shipment.shipment_number}`,
        type: 'INFO',
        link: `/shipments/${shipment.id}`
      });
      
      // Send shipment assigned notification
      await notificationService.notifyShipmentAssigned(populatedShipment);
      
      // Notify customer about driver assignment
      const order = await Order.findByPk(shipment.order_id);
      if (order) {
        await notificationService.createNotification({
          user_id: order.customer_id,
          title: 'Driver Assigned',
          message: `A driver has been assigned to deliver your order ${order.order_number}`,
          type: 'INFO',
          link: `/orders/${order.id}`
        });
      }
      
      return populatedShipment;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateShipmentStatus(shipmentId, newStatus, userId, userRole) {
    const shipment = await Shipment.findByPk(shipmentId);
    
    if (!shipment) {
      throw new Error('Shipment not found');
    }
    
    // Define valid transitions
    const validTransitions = {
      'READY': ['ASSIGNED', 'CANCELLED'],
      'ASSIGNED': ['PICKED_UP', 'CANCELLED'],
      'PICKED_UP': ['IN_TRANSIT', 'FAILED'],
      'IN_TRANSIT': ['OUT_FOR_DELIVERY', 'FAILED'],
      'OUT_FOR_DELIVERY': ['DELIVERED', 'FAILED'],
      'DELIVERED': ['RETURNED'],
      'FAILED': ['RETURNED', 'ASSIGNED'],
      'RETURNED': [],
      'CANCELLED': []
    };
    
    if (!validTransitions[shipment.status] || !validTransitions[shipment.status].includes(newStatus)) {
      throw new Error(`Invalid status transition from ${shipment.status} to ${newStatus}`);
    }
    
    // Driver can only update their own shipments
    if (userRole === 'driver') {
      const driver = await Driver.findOne({ where: { user_id: userId } });
      
      if (!driver || shipment.driver_id !== driver.id) {
        throw new Error('You can only update your assigned shipments');
      }
      
      // Drivers can only update to specific statuses
      if (!['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(newStatus)) {
        throw new Error('Drivers cannot update to this status');
      }
    }
    
    const transaction = await sequelize.transaction();
    
    try {
      const oldStatus = shipment.status;
      
      // Update shipment
      await shipment.update({
        status: newStatus,
        pickup_time: newStatus === 'PICKED_UP' ? new Date() : shipment.pickup_time,
        shipped_time: newStatus === 'IN_TRANSIT' ? new Date() : shipment.shipped_time,
        actual_delivery: newStatus === 'DELIVERED' ? new Date() : shipment.actual_delivery
      }, { transaction });
      
      // Update driver status
      if (shipment.driver_id) {
        const driver = await Driver.findByPk(shipment.driver_id, { transaction });
        
        if (driver) {
          if (newStatus === 'DELIVERED') {
            await driver.update({ status: 'AVAILABLE' }, { transaction });
            await driver.increment('completed_deliveries', { transaction });
          } else if (newStatus === 'OUT_FOR_DELIVERY') {
            await driver.update({ status: 'ON_DELIVERY' }, { transaction });
          } else if (['PICKED_UP', 'IN_TRANSIT'].includes(newStatus)) {
            await driver.update({ status: 'ASSIGNED' }, { transaction });
          } else if (['FAILED', 'RETURNED', 'CANCELLED'].includes(newStatus)) {
            await driver.update({ status: 'AVAILABLE' }, { transaction });
          }
        }
      }
      
      // Update order status
      const order = await Order.findByPk(shipment.order_id, { transaction });
      
      if (order) {
        const orderStatusMap = {
          'PICKED_UP': 'SHIPPED',
          'IN_TRANSIT': 'SHIPPED',
          'OUT_FOR_DELIVERY': 'OUT_FOR_DELIVERY',
          'DELIVERED': 'DELIVERED',
          'FAILED': 'SHIPPED',
          'RETURNED': 'RETURNED'
        };
        
        if (orderStatusMap[newStatus]) {
          await order.update({ status: orderStatusMap[newStatus] }, { transaction });
        }
      }
      
      await transaction.commit();
      
      const populatedShipment = await this.getShipmentById(shipmentId);
      
      // Send notifications based on status change
      await notificationService.notifyShipmentStatusChange(populatedShipment, oldStatus, newStatus);
      
      // Special notifications for specific statuses
      if (newStatus === 'DELIVERED' && order) {
        await notificationService.createNotification({
          user_id: order.customer_id,
          title: 'Order Delivered',
          message: `Your order ${order.order_number} has been delivered successfully!`,
          type: 'SUCCESS',
          link: `/orders/${order.id}`
        });
      }
      
      if (newStatus === 'OUT_FOR_DELIVERY' && order) {
        await notificationService.createNotification({
          user_id: order.customer_id,
          title: 'Order Out for Delivery',
          message: `Your order ${order.order_number} is out for delivery and will arrive soon.`,
          type: 'INFO',
          link: `/orders/${order.id}`
        });
      }
      
      if (newStatus === 'FAILED' && order) {
        await notificationService.createNotification({
          user_id: order.customer_id,
          title: 'Delivery Failed',
          message: `We apologize, but the delivery of your order ${order.order_number} has failed. We will contact you shortly.`,
          type: 'ERROR',
          link: `/orders/${order.id}`
        });
      }
      
      return populatedShipment;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async trackShipment(trackingNumber) {
    const shipment = await Shipment.findOne({
      where: { tracking_number: trackingNumber },
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'order_number', 'status']
        },
        {
          model: Driver,
          as: 'driver',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['name', 'phone']
            }
          ]
        }
      ]
    });
    
    if (!shipment) {
      throw new Error('Shipment not found');
    }
    
    return {
      tracking_number: shipment.tracking_number,
      status: shipment.status,
      pickup_time: shipment.pickup_time,
      shipped_time: shipment.shipped_time,
      estimated_delivery: shipment.estimated_delivery,
      actual_delivery: shipment.actual_delivery,
      order_number: shipment.order?.order_number,
      driver_name: shipment.driver?.user?.name,
      driver_phone: shipment.driver?.user?.phone
    };
  }

  async getShipmentStatistics() {
    const totalShipments = await Shipment.count();
    const readyShipments = await Shipment.count({ where: { status: 'READY' } });
    const assignedShipments = await Shipment.count({ where: { status: 'ASSIGNED' } });
    const pickedUpShipments = await Shipment.count({ where: { status: 'PICKED_UP' } });
    const inTransitShipments = await Shipment.count({ where: { status: 'IN_TRANSIT' } });
    const outForDeliveryShipments = await Shipment.count({ where: { status: 'OUT_FOR_DELIVERY' } });
    const deliveredShipments = await Shipment.count({ where: { status: 'DELIVERED' } });
    const failedShipments = await Shipment.count({ where: { status: 'FAILED' } });
    
    const shipmentsTrend = await Shipment.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        created_at: {
          [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
    });
    
    return {
      total_shipments: totalShipments,
      ready_shipments: readyShipments,
      assigned_shipments: assignedShipments,
      picked_up_shipments: pickedUpShipments,
      in_transit_shipments: inTransitShipments,
      out_for_delivery_shipments: outForDeliveryShipments,
      delivered_shipments: deliveredShipments,
      failed_shipments: failedShipments,
      shipments_trend: shipmentsTrend
    };
  }
}

module.exports = new ShipmentService();