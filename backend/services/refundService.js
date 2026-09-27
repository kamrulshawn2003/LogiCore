const {
  Refund,
  Order,
  OrderItem,
  User,
  Product,
  Inventory,
  InventoryMovement,
  sequelize
} = require('../models');
const { Op } = require('sequelize');
const { generateRefundNumber } = require('../utils/generateNumber');
const notificationService = require('./notificationService');

// Orders a customer may request a refund/return for
const ELIGIBLE_ORDER_STATUSES = ['DELIVERED', 'SHIPPED', 'OUT_FOR_DELIVERY'];
const ACTIVE_REFUND_STATUSES = ['PENDING', 'APPROVED'];

class RefundService {
  /**
   * Customer requests a refund (money back, keep items) or a return (send back + money back).
   */
  async createRefund(userId, data) {
    const { order_id, type = 'REFUND', reason } = data;

    if (!reason || reason.trim().length < 5) {
      throw new Error('Please provide a reason (at least 5 characters)');
    }

    if (!['REFUND', 'RETURN'].includes(type)) {
      throw new Error('Type must be REFUND or RETURN');
    }

    const order = await Order.findByPk(order_id);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.customer_id !== userId) {
      throw new Error('You can only request a refund for your own orders');
    }

    const active = await Refund.findOne({
      where: {
        order_id,
        status: { [Op.in]: ACTIVE_REFUND_STATUSES }
      }
    });
    if (active) {
      throw new Error('A refund request for this order is already in progress');
    }

    if (!ELIGIBLE_ORDER_STATUSES.includes(order.status)) {
      throw new Error('Only delivered orders (or orders out for delivery) can request a refund');
    }

    if (order.payment_status !== 'PAID') {
      throw new Error('Only paid orders can be refunded');
    }

    const refund = await Refund.create({
      refund_number: generateRefundNumber(),
      order_id: order.id,
      user_id: userId,
      type,
      reason,
      amount: order.total_amount,
      status: 'PENDING'
    });

    // Mark the order as return-requested so both customer and staff see it
    await order.update({ status: 'RETURN_REQUESTED' });

    await notificationService.createNotification({
      user_id: userId,
      title: type === 'RETURN' ? 'Return Requested' : 'Refund Requested',
      message: `Your ${type === 'RETURN' ? 'return' : 'refund'} for order ${order.order_number} ($${Number(order.total_amount).toFixed(2)}) has been submitted`,
      type: 'INFO',
      link: `/my-orders`
    });

    // Notify all staff who can decide (admin + warehouse managers)
    const staff = await User.findAll({
      where: { role: { [Op.in]: ['admin', 'warehouse_manager'] }, status: 'active' }
    });
    for (const s of staff) {
      await notificationService.createNotification({
        user_id: s.id,
        title: 'New Refund Request',
        message: `${order.order_number} — ${type === 'RETURN' ? 'return' : 'refund'} request for $${Number(order.total_amount).toFixed(2)}`,
        type: 'WARNING',
        link: `/refunds`
      });
    }

    return this.getRefundById(refund.id);
  }

  async getRefundById(id) {
    const refund = await Refund.findByPk(id, {
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'order_number', 'total_amount', 'payment_status', 'status'],
          include: [
            {
              model: OrderItem,
              as: 'items',
              include: [
                {
                  model: Product,
                  as: 'product',
                  attributes: ['id', 'sku', 'name', 'image_url']
                }
              ]
            }
          ]
        },
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'decidedBy',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!refund) {
      const err = new Error('Refund request not found');
      err.code = 'NOT_FOUND';
      throw err;
    }

    return refund;
  }

  /**
   * Staff list of refund requests with pagination + filters.
   */
  async getRefunds(query = {}) {
    const {
      page = 1,
      limit = 10,
      status = '',
      type = '',
      search = '',
      start_date = '',
      end_date = ''
    } = query;

    const where = {};

    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }
    if (search) {
      where[Op.or] = [
        { refund_number: { [Op.like]: `%${search}%` } },
        { '$order.order_number$': { [Op.like]: `%${search}%` } }
      ];
    }
    if (start_date && end_date) {
      where.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    } else if (start_date) {
      where.created_at = { [Op.gte]: new Date(start_date) };
    } else if (end_date) {
      where.created_at = { [Op.lte]: new Date(end_date) };
    }

    const { rows, count } = await Refund.findAndCountAll({
      where,
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'order_number', 'total_amount', 'status']
        },
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true
    });

    return {
      refunds: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Customer's own refund requests.
   */
  async getMyRefunds(userId, query = {}) {
    const { page = 1, limit = 10, status = '' } = query;
    const where = { user_id: userId };
    if (status) {
      where.status = status;
    }

    const { rows, count } = await Refund.findAndCountAll({
      where,
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'order_number', 'total_amount']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    return {
      refunds: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getStatistics() {
    const statuses = ['PENDING', 'APPROVED', 'REJECTED', 'REFUNDED', 'CANCELLED'];
    const byStatus = {};
    for (const s of statuses) {
      byStatus[s.toLowerCase()] = await Refund.count({ where: { status: s } });
    }

    const totalRefunded = await Refund.sum('amount', {
      where: { status: 'REFUNDED' }
    }) || 0;

    return {
      total_requests: await Refund.count(),
      pending: byStatus.pending,
      approved: byStatus.approved,
      rejected: byStatus.rejected,
      refunded: byStatus.refunded,
      cancelled: byStatus.cancelled,
      total_refunded_amount: totalRefunded
    };
  }

  /**
   * Staff decision: APPROVED → REFUNDED, or REJECTED (with note).
   * REFUNDED completes the flow: marks payment refunded, returns stock for RETURNs.
   */
  async updateStatus(id, newStatus, adminId, adminNote) {
    const refund = await Refund.findByPk(id);
    if (!refund) {
      const err = new Error('Refund request not found');
      err.code = 'NOT_FOUND';
      throw err;
    }

    const validTransitions = {
      PENDING: ['APPROVED', 'REJECTED'],
      APPROVED: ['REFUNDED'],
      REJECTED: [],
      REFUNDED: [],
      CANCELLED: []
    };

    if (!validTransitions[refund.status] || !validTransitions[refund.status].includes(newStatus)) {
      throw new Error(`Invalid status transition from ${refund.status} to ${newStatus}`);
    }

    if (newStatus === 'REJECTED' && (!adminNote || !adminNote.trim())) {
      throw new Error('A rejection reason is required');
    }

    const transaction = await sequelize.transaction();
    try {
      const order = await Order.findByPk(refund.order_id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!order) {
        throw new Error('Order not found');
      }

      if (newStatus === 'APPROVED') {
        await refund.update(
          { status: 'APPROVED', admin_note: adminNote || null, decided_by: adminId },
          { transaction }
        );
        // Payment will be refunded when the flow completes; keep order in return-requested state
      }

      if (newStatus === 'REJECTED') {
        await refund.update(
          { status: 'REJECTED', admin_note: adminNote, decided_by: adminId },
          { transaction }
        );

        // Restore the order status if it was only flagged for return
        if (order.status === 'RETURN_REQUESTED') {
          await order.update({ status: 'DELIVERED' }, { transaction });
        }
      }

      if (newStatus === 'REFUNDED') {
        await refund.update(
          {
            status: 'REFUNDED',
            admin_note: adminNote || refund.admin_note,
            decided_by: adminId,
            refunded_at: new Date()
          },
          { transaction }
        );

        await order.update(
          {
            payment_status: 'REFUNDED',
            status: refund.type === 'RETURN' ? 'RETURNED' : order.status
          },
          { transaction }
        );

        // Restock returned items
        if (refund.type === 'RETURN') {
          const items = await OrderItem.findAll({
            where: { order_id: order.id },
            transaction
          });

          for (const item of items) {
            const inventory = await Inventory.findOne({
              where: { product_id: item.product_id, warehouse_id: item.warehouse_id },
              transaction,
              lock: transaction.LOCK.UPDATE
            });

            if (inventory) {
              await inventory.update(
                { quantity: inventory.quantity + item.quantity },
                { transaction }
              );

              await InventoryMovement.create(
                {
                  product_id: item.product_id,
                  warehouse_id: item.warehouse_id,
                  type: 'RETURN',
                  quantity: item.quantity,
                  reference_type: 'REFUND',
                  reference_id: refund.id,
                  reason: `Restocked returned items for ${refund.refund_number}`,
                  created_by: adminId
                },
                { transaction }
              );
            }
          }
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    // Notify customer
    const messages = {
      APPROVED: `Your refund request ${refund.refund_number} has been approved. Refund of $${Number(refund.amount).toFixed(2)} will be processed.`,
      REJECTED: `Your refund request ${refund.refund_number} was rejected${refund.admin_note ? ': ' + refund.admin_note : ''}`,
      REFUNDED: `Your refund for ${refund.refund_number} ($${Number(refund.amount).toFixed(2)}) has been issued.`
    };

    await notificationService.createNotification({
      user_id: refund.user_id,
      title: 'Refund Update',
      message: messages[newStatus],
      type: newStatus === 'REJECTED' ? 'ERROR' : 'SUCCESS',
      link: `/my-orders`
    });

    return this.getRefundById(refund.id);
  }

  /**
   * Customer cancels their own pending refund request.
   */
  async cancelRefund(id, userId) {
    const refund = await Refund.findByPk(id);
    if (!refund) {
      const err = new Error('Refund request not found');
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (refund.user_id !== userId) {
      throw new Error('You can only cancel your own refund requests');
    }

    if (refund.status !== 'PENDING') {
      throw new Error('Only pending refund requests can be cancelled');
    }

    await refund.update({ status: 'CANCELLED' });

    // Restore the order status if it was only flagged for return
    const order = await Order.findByPk(refund.order_id);
    if (order && order.status === 'RETURN_REQUESTED') {
      await order.update({ status: 'DELIVERED' });
    }

    await notificationService.createNotification({
      user_id: userId,
      title: 'Refund Request Cancelled',
      message: `You cancelled ${refund.refund_number}`,
      type: 'INFO',
      link: `/my-orders`
    });

    return this.getRefundById(refund.id);
  }
}

module.exports = new RefundService();
