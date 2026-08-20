const { 
  PurchaseOrder, 
  PurchaseOrderItem, 
  Supplier, 
  Warehouse, 
  Product, 
  User,
  Inventory,
  InventoryMovement,
  sequelize 
} = require('../models');
const { Op } = require('sequelize');
const { generatePONumber } = require('../utils/generateNumber');
const notificationService = require('./notificationService');

class PurchaseOrderService {
  async getAllPurchaseOrders(query = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      supplier_id = '',
      warehouse_id = '',
      start_date = '',
      end_date = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = query;

    const where = {};
    
    if (search) {
      where[Op.or] = [
        { po_number: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (supplier_id) {
      where.supplier_id = supplier_id;
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

    const { rows, count } = await PurchaseOrder.findAndCountAll({
      where,
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['id', 'name', 'code']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: PurchaseOrderItem,
          as: 'items',
          attributes: ['id', 'product_id', 'quantity', 'received_quantity', 'unit_price'],
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'sku', 'name']
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
      purchaseOrders: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getPurchaseOrderById(id) {
    const purchaseOrder = await PurchaseOrder.findByPk(id, {
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'email', 'phone', 'address']
        },
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['id', 'name', 'code', 'address']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'email']
        },
        {
          model: PurchaseOrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'sku', 'name', 'unit', 'reorder_level']
            }
          ]
        }
      ]
    });
    
    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }
    
    // Calculate received percentage
    const totalQuantity = purchaseOrder.items.reduce((sum, item) => sum + item.quantity, 0);
    const receivedQuantity = purchaseOrder.items.reduce((sum, item) => sum + item.received_quantity, 0);
    const receivedPercentage = totalQuantity > 0 ? (receivedQuantity / totalQuantity) * 100 : 0;
    
    return {
      ...purchaseOrder.toJSON(),
      total_quantity: totalQuantity,
      received_quantity: receivedQuantity,
      received_percentage: receivedPercentage
    };
  }

  async createPurchaseOrder(poData, userId) {
    const { supplier_id, warehouse_id, expected_delivery_date, items, notes } = poData;
    
    // Validate items
    if (!items || items.length === 0) {
      throw new Error('Purchase order must have at least one item');
    }
    
    const transaction = await sequelize.transaction();
    
    try {
      // Verify supplier exists
      const supplier = await Supplier.findByPk(supplier_id, { transaction });
      if (!supplier) {
        throw new Error('Supplier not found');
      }
      
      // Verify warehouse exists
      const warehouse = await Warehouse.findByPk(warehouse_id, { transaction });
      if (!warehouse) {
        throw new Error('Warehouse not found');
      }
      
      // Generate PO number
      const po_number = generatePONumber();
      
      // Calculate total amount
      let totalAmount = 0;
      const poItems = [];
      
      for (const item of items) {
        const product = await Product.findByPk(item.product_id, { transaction });
        if (!product) {
          throw new Error(`Product with ID ${item.product_id} not found`);
        }
        
        const subtotal = item.quantity * item.unit_price;
        totalAmount += subtotal;
        
        poItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal
        });
      }
      
      // Create purchase order
      const purchaseOrder = await PurchaseOrder.create({
        po_number,
        supplier_id,
        warehouse_id,
        status: 'DRAFT',
        total_amount: totalAmount,
        expected_delivery_date,
        notes,
        created_by: userId
      }, { transaction });
      
      // Create PO items
      for (const item of poItems) {
        await PurchaseOrderItem.create({
          purchase_order_id: purchaseOrder.id,
          ...item
        }, { transaction });
      }
      
      await transaction.commit();
      
      // Notify creator about PO creation
      await notificationService.createNotification({
        user_id: userId,
        title: 'Purchase Order Created',
        message: `Purchase Order ${po_number} has been created successfully`,
        type: 'SUCCESS',
        link: `/purchase-orders/${purchaseOrder.id}`
      });
      
      return this.getPurchaseOrderById(purchaseOrder.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updatePurchaseOrder(id, poData, userId) {
    const purchaseOrder = await PurchaseOrder.findByPk(id);
    
    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }
    
    // Only allow updates in DRAFT status
    if (purchaseOrder.status !== 'DRAFT') {
      throw new Error('Only draft purchase orders can be updated');
    }
    
    const transaction = await sequelize.transaction();
    
    try {
      const { supplier_id, warehouse_id, expected_delivery_date, items, notes } = poData;
      
      if (supplier_id) {
        purchaseOrder.supplier_id = supplier_id;
      }
      
      if (warehouse_id) {
        purchaseOrder.warehouse_id = warehouse_id;
      }
      
      if (expected_delivery_date) {
        purchaseOrder.expected_delivery_date = expected_delivery_date;
      }
      
      if (notes !== undefined) {
        purchaseOrder.notes = notes;
      }
      
      // Update items if provided
      if (items && items.length > 0) {
        // Delete existing items
        await PurchaseOrderItem.destroy({
          where: { purchase_order_id: id },
          transaction
        });
        
        // Create new items
        let totalAmount = 0;
        for (const item of items) {
          const product = await Product.findByPk(item.product_id, { transaction });
          if (!product) {
            throw new Error(`Product with ID ${item.product_id} not found`);
          }
          
          const subtotal = item.quantity * item.unit_price;
          totalAmount += subtotal;
          
          await PurchaseOrderItem.create({
            purchase_order_id: id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal
          }, { transaction });
        }
        
        purchaseOrder.total_amount = totalAmount;
      }
      
      await purchaseOrder.save({ transaction });
      await transaction.commit();
      
      return this.getPurchaseOrderById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async submitPurchaseOrder(id, userId) {
    const purchaseOrder = await PurchaseOrder.findByPk(id);
    
    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }
    
    // Store old status for notification
    const oldStatus = purchaseOrder.status;
    
    if (purchaseOrder.status !== 'DRAFT') {
      throw new Error('Only draft purchase orders can be submitted');
    }
    
    // Check if PO has items
    const itemCount = await PurchaseOrderItem.count({
      where: { purchase_order_id: id }
    });
    
    if (itemCount === 0) {
      throw new Error('Cannot submit empty purchase order');
    }
    
    purchaseOrder.status = 'SUBMITTED';
    await purchaseOrder.save();
    
    // Notify about submission
    await notificationService.notifyPurchaseOrderStatus(purchaseOrder, oldStatus, 'SUBMITTED');
    
    return purchaseOrder;
  }

  async approvePurchaseOrder(id, userId) {
    const purchaseOrder = await PurchaseOrder.findByPk(id);
    
    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }
    
    // Store old status for notification
    const oldStatus = purchaseOrder.status;
    
    if (purchaseOrder.status !== 'SUBMITTED') {
      throw new Error('Only submitted purchase orders can be approved');
    }
    
    purchaseOrder.status = 'APPROVED';
    purchaseOrder.approved_by = userId;
    purchaseOrder.approved_at = new Date();
    await purchaseOrder.save();
    
    // Notify about approval
    await notificationService.notifyPurchaseOrderStatus(purchaseOrder, oldStatus, 'APPROVED');
    
    return purchaseOrder;
  }

  async rejectPurchaseOrder(id, userId, reason) {
    const purchaseOrder = await PurchaseOrder.findByPk(id);
    
    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }
    
    // Store old status for notification
    const oldStatus = purchaseOrder.status;
    
    if (!['SUBMITTED', 'APPROVED'].includes(purchaseOrder.status)) {
      throw new Error('Only submitted or approved purchase orders can be rejected');
    }
    
    purchaseOrder.status = 'REJECTED';
    purchaseOrder.cancellation_reason = reason;
    await purchaseOrder.save();
    
    // Notify about rejection
    await notificationService.notifyPurchaseOrderStatus(purchaseOrder, oldStatus, 'REJECTED');
    
    return purchaseOrder;
  }

  async acceptPurchaseOrder(id, supplierId) {
    const purchaseOrder = await PurchaseOrder.findByPk(id);
    
    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }
    
    // Verify supplier owns this PO
    if (purchaseOrder.supplier_id !== supplierId) {
      throw new Error('You can only accept your own purchase orders');
    }
    
    // Store old status for notification
    const oldStatus = purchaseOrder.status;
    
    if (purchaseOrder.status !== 'APPROVED') {
      throw new Error('Only approved purchase orders can be accepted');
    }
    
    purchaseOrder.status = 'ACCEPTED';
    await purchaseOrder.save();
    
    // Notify about acceptance
    await notificationService.notifyPurchaseOrderStatus(purchaseOrder, oldStatus, 'ACCEPTED');
    
    return purchaseOrder;
  }

  async cancelPurchaseOrder(id, userId, reason) {
    const purchaseOrder = await PurchaseOrder.findByPk(id);
    
    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }
    
    if (['RECEIVED', 'CANCELLED', 'REJECTED'].includes(purchaseOrder.status)) {
      throw new Error(`Cannot cancel purchase order in ${purchaseOrder.status} status`);
    }
    
    // Store old status for notification
    const oldStatus = purchaseOrder.status;
    
    purchaseOrder.status = 'CANCELLED';
    purchaseOrder.cancelled_at = new Date();
    purchaseOrder.cancellation_reason = reason;
    await purchaseOrder.save();
    
    // Notify about cancellation
    await notificationService.notifyPurchaseOrderStatus(purchaseOrder, oldStatus, 'CANCELLED');
    
    return purchaseOrder;
  }

  async receivePurchaseOrder(id, receiveData, userId) {
    const { items } = receiveData;
    const purchaseOrder = await PurchaseOrder.findByPk(id, {
      include: [
        {
          model: PurchaseOrderItem,
          as: 'items'
        }
      ]
    });
    
    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }
    
    if (!['ACCEPTED', 'PARTIALLY_RECEIVED'].includes(purchaseOrder.status)) {
      throw new Error('Only accepted or partially received purchase orders can receive items');
    }
    
    const transaction = await sequelize.transaction();
    
    try {
      let allItemsReceived = true;
      let anyItemsReceived = false;
      const receivedItems = [];
      
      for (const receiveItem of items) {
        const poItem = purchaseOrder.items.find(item => item.id === receiveItem.purchase_order_item_id);
        
        if (!poItem) {
          throw new Error(`Purchase order item with ID ${receiveItem.purchase_order_item_id} not found`);
        }
        
        const remainingQuantity = poItem.quantity - poItem.received_quantity;
        
        if (receiveItem.quantity > remainingQuantity) {
          throw new Error(`Cannot receive more than remaining quantity for item ${poItem.id}. Remaining: ${remainingQuantity}`);
        }
        
        // Update PO item received quantity
        const newReceivedQuantity = poItem.received_quantity + receiveItem.quantity;
        await poItem.update({
          received_quantity: newReceivedQuantity
        }, { transaction });
        
        // Update inventory
        let inventory = await Inventory.findOne({
          where: {
            product_id: poItem.product_id,
            warehouse_id: purchaseOrder.warehouse_id
          },
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        
        if (!inventory) {
          const product = await Product.findByPk(poItem.product_id);
          inventory = await Inventory.create({
            product_id: poItem.product_id,
            warehouse_id: purchaseOrder.warehouse_id,
            quantity: 0,
            reserved_quantity: 0,
            reorder_level: product?.reorder_level || 10
          }, { transaction });
        }
        
        await inventory.update({
          quantity: inventory.quantity + receiveItem.quantity,
          last_counted_at: new Date()
        }, { transaction });
        
        // Create inventory movement
        await InventoryMovement.create({
          product_id: poItem.product_id,
          warehouse_id: purchaseOrder.warehouse_id,
          type: 'IN',
          quantity: receiveItem.quantity,
          reference_type: 'PURCHASE_ORDER',
          reference_id: purchaseOrder.id,
          reason: `Received from PO ${purchaseOrder.po_number}`,
          created_by: userId
        }, { transaction });
        
        receivedItems.push({
          product_id: poItem.product_id,
          quantity: receiveItem.quantity
        });
        
        if (newReceivedQuantity < poItem.quantity) {
          allItemsReceived = false;
        }
        anyItemsReceived = true;
      }
      
      // Store old status for notification
      const oldStatus = purchaseOrder.status;
      
      // Update PO status
      if (allItemsReceived) {
        purchaseOrder.status = 'RECEIVED';
      } else if (anyItemsReceived) {
        purchaseOrder.status = 'PARTIALLY_RECEIVED';
      }
      
      await purchaseOrder.save({ transaction });
      await transaction.commit();
      
      // Notify about receipt
      await notificationService.notifyPurchaseOrderStatus(purchaseOrder, oldStatus, purchaseOrder.status);
      
      // Send inventory update notification
      for (const item of receivedItems) {
        const product = await Product.findByPk(item.product_id);
        if (product) {
          await notificationService.createNotification({
            user_id: userId,
            title: 'Inventory Updated',
            message: `Product ${product.name} (${product.sku}) has been restocked with ${item.quantity} units from PO ${purchaseOrder.po_number}`,
            type: 'INFO',
            link: `/products/${product.id}`
          });
        }
      }
      
      return this.getPurchaseOrderById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getPurchaseOrderStatistics() {
    const totalPOs = await PurchaseOrder.count();
    const draftPOs = await PurchaseOrder.count({ where: { status: 'DRAFT' } });
    const submittedPOs = await PurchaseOrder.count({ where: { status: 'SUBMITTED' } });
    const approvedPOs = await PurchaseOrder.count({ where: { status: 'APPROVED' } });
    const acceptedPOs = await PurchaseOrder.count({ where: { status: 'ACCEPTED' } });
    const partiallyReceivedPOs = await PurchaseOrder.count({ where: { status: 'PARTIALLY_RECEIVED' } });
    const receivedPOs = await PurchaseOrder.count({ where: { status: 'RECEIVED' } });
    const cancelledPOs = await PurchaseOrder.count({ where: { status: 'CANCELLED' } });
    
    const totalValue = await PurchaseOrder.sum('total_amount', {
      where: {
        status: { [Op.ne]: 'CANCELLED' }
      }
    }) || 0;
    
    const poTrend = await PurchaseOrder.findAll({
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
      total_po: totalPOs,
      draft_po: draftPOs,
      submitted_po: submittedPOs,
      approved_po: approvedPOs,
      accepted_po: acceptedPOs,
      partially_received_po: partiallyReceivedPOs,
      received_po: receivedPOs,
      cancelled_po: cancelledPOs,
      total_value: totalValue,
      po_trend: poTrend
    };
  }
}

module.exports = new PurchaseOrderService();