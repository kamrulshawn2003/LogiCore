const { 
  Order, 
  OrderItem, 
  Product, 
  Warehouse, 
  User,
  Inventory,
  InventoryMovement,
  Shipment,
  sequelize 
} = require('../models');
const { Op } = require('sequelize');
const { generateOrderNumber } = require('../utils/generateNumber');
const notificationService = require('./notificationService');

class OrderService {
  async getAllOrders(query = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      customer_id = '',
      warehouse_id = '',
      payment_status = '',
      start_date = '',
      end_date = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = query;

    const where = {};
    
    if (search) {
      where[Op.or] = [
        { order_number: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (customer_id) {
      where.customer_id = customer_id;
    }
    
    if (warehouse_id) {
      where.warehouse_id = warehouse_id;
    }
    
    if (payment_status) {
      where.payment_status = payment_status;
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

    const { rows, count } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['id', 'name', 'code']
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
        },
        {
          model: Shipment,
          as: 'shipment',
          attributes: ['id', 'shipment_number', 'tracking_number', 'status']
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true
    });

    return {
      orders: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getOrderById(id, userId = null, userRole = null) {
    const order = await Order.findByPk(id, {
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['id', 'name', 'code', 'address']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'sku', 'name', 'description', 'unit']
            },
            {
              model: Warehouse,
              as: 'warehouse',
              attributes: ['id', 'name', 'code']
            }
          ]
        },
        {
          model: Shipment,
          as: 'shipment',
          attributes: ['id', 'shipment_number', 'tracking_number', 'status', 'estimated_delivery', 'actual_delivery']
        }
      ]
    });
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    // Check access rights
    if (userRole === 'customer' && order.customer_id !== userId) {
      throw new Error('You can only view your own orders');
    }
    
    if (userRole === 'warehouse_manager' && 
        order.warehouse_id !== null && 
        order.warehouse_id !== undefined) {
      // Warehouse managers can only see orders for their warehouse
      const user = await User.findByPk(userId);
      if (user && user.warehouse_id !== order.warehouse_id) {
        throw new Error('You do not have access to this order');
      }
    }
    
    return order;
  }

  async createOrder(orderData, customerId) {
    const { items, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country, notes } = orderData;
    
    if (!items || items.length === 0) {
      throw new Error('Order must have at least one item');
    }
    
    // Determine warehouse for fulfillment (use first available or specified)
    let warehouseId = orderData.warehouse_id;
    
    const transaction = await sequelize.transaction();
    
    try {
      // Generate order number
      const order_number = generateOrderNumber();
      
      // Calculate totals and validate inventory
      let totalAmount = 0;
      const orderItems = [];
      const inventoryUpdates = [];
      
      for (const item of items) {
        const product = await Product.findByPk(item.product_id, {
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        
        if (!product || product.status !== 'active') {
          throw new Error(`Product with ID ${item.product_id} not found or inactive`);
        }
        
        // If no warehouse specified, find one with enough inventory
        if (!warehouseId) {
          const availableInventory = await Inventory.findOne({
            where: {
              product_id: item.product_id,
              quantity: {
                [Op.gte]: sequelize.literal('reserved_quantity + ' + item.quantity)
              }
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
            order: [['quantity', 'DESC']]
          });
          
          if (!availableInventory) {
            throw new Error(`Insufficient inventory for product ${product.name}`);
          }
          
          warehouseId = availableInventory.warehouse_id;
        }
        
        // Check inventory in selected warehouse
        const inventory = await Inventory.findOne({
          where: {
            product_id: item.product_id,
            warehouse_id: warehouseId
          },
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        
        if (!inventory) {
          throw new Error(`No inventory for product ${product.name} in selected warehouse`);
        }
        
        const availableQuantity = inventory.quantity - inventory.reserved_quantity;
        
        if (item.quantity > availableQuantity) {
          throw new Error(`Insufficient stock for product ${product.name}. Available: ${availableQuantity}, Requested: ${item.quantity}`);
        }
        
        // Reserve inventory
        await inventory.update({
          reserved_quantity: inventory.reserved_quantity + item.quantity
        }, { transaction });
        
        const subtotal = item.quantity * product.price;
        totalAmount += subtotal;
        
        orderItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: product.price,
          subtotal,
          warehouse_id: warehouseId
        });
        
        inventoryUpdates.push({
          inventory,
          quantity: item.quantity
        });
      }
      
      // Create order
      const order = await Order.create({
        order_number,
        customer_id: customerId,
        warehouse_id: warehouseId,
        status: 'PENDING',
        total_amount: totalAmount,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_zip,
        shipping_country,
        payment_status: 'PENDING',
        notes
      }, { transaction });
      
      // Create order items
      for (const item of orderItems) {
        await OrderItem.create({
          order_id: order.id,
          ...item
        }, { transaction });
      }
      
      // Create inventory movements for reservation
      for (const update of inventoryUpdates) {
        await InventoryMovement.create({
          product_id: update.inventory.product_id,
          warehouse_id: update.inventory.warehouse_id,
          type: 'OUT',
          quantity: update.quantity,
          reference_type: 'ORDER',
          reference_id: order.id,
          reason: `Reserved for order ${order_number}`,
          created_by: customerId
        }, { transaction });
      }
      
      await transaction.commit();
      
      // Notify customer about order creation
      await notificationService.createNotification({
        user_id: customerId,
        title: 'Order Created',
        message: `Your order ${order_number} has been created successfully`,
        type: 'SUCCESS',
        link: `/orders/${order.id}`
      });
      
      return this.getOrderById(order.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateOrderStatus(id, newStatus, userId, userRole) {
    const order = await Order.findByPk(id);
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    // Store old status for notification
    const oldStatus = order.status;
    
    // Define valid status transitions
    const validTransitions = {
      'PENDING': ['CONFIRMED', 'CANCELLED'],
      'CONFIRMED': ['PROCESSING', 'CANCELLED'],
      'PROCESSING': ['PACKED', 'CANCELLED'],
      'PACKED': ['SHIPPED', 'CANCELLED'],
      'SHIPPED': ['OUT_FOR_DELIVERY', 'RETURN_REQUESTED'],
      'OUT_FOR_DELIVERY': ['DELIVERED', 'FAILED', 'RETURN_REQUESTED'],
      'DELIVERED': ['RETURN_REQUESTED'],
      'CANCELLED': [],
      'RETURN_REQUESTED': ['RETURNED'],
      'RETURNED': []
    };
    
    // Check if transition is valid
    if (!validTransitions[order.status] || !validTransitions[order.status].includes(newStatus)) {
      throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
    }
    
    // Check role permissions for specific transitions
    if (newStatus === 'CANCELLED' && userRole === 'customer') {
      if (order.customer_id !== userId) {
        throw new Error('You can only cancel your own orders');
      }
      if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
        throw new Error('Only pending or confirmed orders can be cancelled');
      }
    }
    
    const transaction = await sequelize.transaction();
    
    try {
      // If cancelling, release reserved inventory
      if (newStatus === 'CANCELLED') {
        const orderItems = await OrderItem.findAll({
          where: { order_id: id },
          transaction
        });
        
        for (const item of orderItems) {
          const inventory = await Inventory.findOne({
            where: {
              product_id: item.product_id,
              warehouse_id: item.warehouse_id
            },
            transaction,
            lock: transaction.LOCK.UPDATE
          });
          
          if (inventory) {
            await inventory.update({
              reserved_quantity: Math.max(0, inventory.reserved_quantity - item.quantity)
            }, { transaction });
            
            await InventoryMovement.create({
              product_id: item.product_id,
              warehouse_id: item.warehouse_id,
              type: 'RETURN',
              quantity: item.quantity,
              reference_type: 'ORDER',
              reference_id: id,
              reason: `Released reservation for cancelled order ${order.order_number}`,
              created_by: userId
            }, { transaction });
          }
        }
        
        order.cancelled_at = new Date();
      }
      
      // If shipping, release reservation and reduce actual quantity
      if (newStatus === 'SHIPPED') {
        const orderItems = await OrderItem.findAll({
          where: { order_id: id },
          transaction
        });
        
        for (const item of orderItems) {
          const inventory = await Inventory.findOne({
            where: {
              product_id: item.product_id,
              warehouse_id: item.warehouse_id
            },
            transaction,
            lock: transaction.LOCK.UPDATE
          });
          
          if (inventory) {
            await inventory.update({
              quantity: inventory.quantity - item.quantity,
              reserved_quantity: Math.max(0, inventory.reserved_quantity - item.quantity)
            }, { transaction });
            
            await InventoryMovement.create({
              product_id: item.product_id,
              warehouse_id: item.warehouse_id,
              type: 'OUT',
              quantity: item.quantity,
              reference_type: 'ORDER',
              reference_id: id,
              reason: `Shipped for order ${order.order_number}`,
              created_by: userId
            }, { transaction });
          }
        }
      }
      
      order.status = newStatus;
      await order.save({ transaction });
      await transaction.commit();
      
      // Notify about status change
      await notificationService.notifyOrderStatusChange(order, oldStatus, newStatus);
      
      return order;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async cancelOrder(id, customerId, reason) {
    const order = await Order.findByPk(id);
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (order.customer_id !== customerId) {
      throw new Error('You can only cancel your own orders');
    }
    
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new Error('Only pending or confirmed orders can be cancelled');
    }
    
    const result = await this.updateOrderStatus(id, 'CANCELLED', customerId, 'customer');
    
    if (reason) {
      order.cancellation_reason = reason;
      await order.save();
    }
    
    return result;
  }

  async getOrderStatistics() {
    const totalOrders = await Order.count();
    const pendingOrders = await Order.count({ where: { status: 'PENDING' } });
    const confirmedOrders = await Order.count({ where: { status: 'CONFIRMED' } });
    const processingOrders = await Order.count({ where: { status: 'PROCESSING' } });
    const packedOrders = await Order.count({ where: { status: 'PACKED' } });
    const shippedOrders = await Order.count({ where: { status: 'SHIPPED' } });
    const deliveredOrders = await Order.count({ where: { status: 'DELIVERED' } });
    const cancelledOrders = await Order.count({ where: { status: 'CANCELLED' } });
    
    const totalRevenue = await Order.sum('total_amount', {
      where: {
        status: {
          [Op.in]: ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED']
        }
      }
    }) || 0;
    
    const ordersTrend = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_value']
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
      total_orders: totalOrders,
      pending_orders: pendingOrders,
      confirmed_orders: confirmedOrders,
      processing_orders: processingOrders,
      packed_orders: packedOrders,
      shipped_orders: shippedOrders,
      delivered_orders: deliveredOrders,
      cancelled_orders: cancelledOrders,
      total_revenue: totalRevenue,
      orders_trend: ordersTrend
    };
  }

  async getCustomerOrders(customerId, query = {}) {
    const {
      page = 1,
      limit = 10,
      status = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = query;

    const where = { customer_id: customerId };
    
    if (status) {
      where.status = status;
    }

    const { rows, count } = await Order.findAndCountAll({
      where,
      include: [
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
        },
        {
          model: Shipment,
          as: 'shipment',
          attributes: ['id', 'shipment_number', 'tracking_number', 'status']
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true
    });

    return {
      orders: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }
}

module.exports = new OrderService();