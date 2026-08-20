const { 
  Inventory, 
  InventoryMovement, 
  Product, 
  Warehouse, 
  User,
  sequelize 
} = require('../models');
const { Op } = require('sequelize');
const ApiResponse = require('../utils/ApiResponse');

class InventoryService {
  async getAllInventory(query = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      warehouse_id = '',
      category_id = '',
      low_stock = '',
      sortBy = 'updated_at',
      sortOrder = 'DESC'
    } = query;

    const where = {};
    
    if (warehouse_id) {
      where.warehouse_id = warehouse_id;
    }
    
    if (low_stock === 'true') {
      where[Op.and] = [
        sequelize.literal('quantity - reserved_quantity <= reorder_level')
      ];
    }

    const productWhere = {};
    if (search) {
      productWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (category_id) {
      productWhere.category_id = category_id;
    }

    const { rows, count } = await Inventory.findAndCountAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          where: productWhere,
          attributes: ['id', 'sku', 'name', 'price', 'cost_price', 'unit', 'reorder_level'],
          include: [
            {
              model: require('../models').Category,
              as: 'category',
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true
    });

    // Calculate available quantities and add flags
    const inventoryWithDetails = rows.map(inv => {
      const available = inv.quantity - inv.reserved_quantity;
      return {
        ...inv.toJSON(),
        available_quantity: available,
        is_low_stock: available <= inv.reorder_level,
        stock_value: available * inv.product.price,
        cost_value: available * inv.product.cost_price
      };
    });

    return {
      inventory: inventoryWithDetails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getInventoryById(id) {
    const inventory = await Inventory.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'sku', 'name', 'description', 'price', 'cost_price', 'unit', 'reorder_level']
        },
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['id', 'name', 'code', 'address']
        }
      ]
    });
    
    if (!inventory) {
      throw new Error('Inventory record not found');
    }
    
    const available = inventory.quantity - inventory.reserved_quantity;
    
    return {
      ...inventory.toJSON(),
      available_quantity: available,
      is_low_stock: available <= inventory.reorder_level,
      stock_value: available * inventory.product.price,
      cost_value: available * inventory.product.cost_price
    };
  }

  async adjustInventory(adjustmentData, userId) {
    const { product_id, warehouse_id, quantity, reason } = adjustmentData;
    
    // Start transaction
    const transaction = await sequelize.transaction();
    
    try {
      // Find or create inventory record
      let inventory = await Inventory.findOne({
        where: { product_id, warehouse_id },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      
      if (!inventory) {
        inventory = await Inventory.create({
          product_id,
          warehouse_id,
          quantity: 0,
          reserved_quantity: 0,
          reorder_level: 10
        }, { transaction });
      }
      
      const oldQuantity = inventory.quantity;
      const newQuantity = Math.max(0, oldQuantity + quantity);
      
      if (newQuantity < inventory.reserved_quantity) {
        throw new Error('Cannot reduce quantity below reserved quantity');
      }
      
      // Update inventory
      await inventory.update({
        quantity: newQuantity,
        last_counted_at: new Date()
      }, { transaction });
      
      // Create movement record
      await InventoryMovement.create({
        product_id,
        warehouse_id,
        type: quantity >= 0 ? 'ADJUSTMENT' : 'ADJUSTMENT',
        quantity: Math.abs(quantity),
        reason: reason || 'Manual adjustment',
        created_by: userId
      }, { transaction });
      
      await transaction.commit();
      
      return {
        inventory,
        old_quantity: oldQuantity,
        new_quantity: newQuantity,
        adjustment: quantity
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async transferInventory(transferData, userId) {
    const { product_id, from_warehouse_id, to_warehouse_id, quantity, reason } = transferData;
    
    if (from_warehouse_id === to_warehouse_id) {
      throw new Error('Source and destination warehouses must be different');
    }
    
    // Start transaction
    const transaction = await sequelize.transaction();
    
    try {
      // Lock source inventory
      const sourceInventory = await Inventory.findOne({
        where: { product_id, warehouse_id: from_warehouse_id },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      
      if (!sourceInventory) {
        throw new Error('Source inventory not found');
      }
      
      const availableQuantity = sourceInventory.quantity - sourceInventory.reserved_quantity;
      
      if (quantity > availableQuantity) {
        throw new Error(`Insufficient stock. Available: ${availableQuantity}, Requested: ${quantity}`);
      }
      
      // Find or create destination inventory
      let destinationInventory = await Inventory.findOne({
        where: { product_id, warehouse_id: to_warehouse_id },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      
      if (!destinationInventory) {
        destinationInventory = await Inventory.create({
          product_id,
          warehouse_id: to_warehouse_id,
          quantity: 0,
          reserved_quantity: 0,
          reorder_level: sourceInventory.reorder_level
        }, { transaction });
      }
      
      // Update source inventory
      await sourceInventory.update({
        quantity: sourceInventory.quantity - quantity
      }, { transaction });
      
      // Update destination inventory
      await destinationInventory.update({
        quantity: destinationInventory.quantity + quantity
      }, { transaction });
      
      // Create movement records
      await InventoryMovement.create({
        product_id,
        warehouse_id: from_warehouse_id,
        type: 'TRANSFER',
        quantity: quantity,
        reference_type: 'TRANSFER',
        reference_id: sourceInventory.id,
        reason: reason || `Transfer to warehouse ${to_warehouse_id}`,
        created_by: userId
      }, { transaction });
      
      await InventoryMovement.create({
        product_id,
        warehouse_id: to_warehouse_id,
        type: 'TRANSFER',
        quantity: quantity,
        reference_type: 'TRANSFER',
        reference_id: destinationInventory.id,
        reason: reason || `Transfer from warehouse ${from_warehouse_id}`,
        created_by: userId
      }, { transaction });
      
      await transaction.commit();
      
      return {
        source_inventory: sourceInventory,
        destination_inventory: destinationInventory,
        transferred_quantity: quantity
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async receiveInventory(receiveData, userId) {
    const { product_id, warehouse_id, quantity, reference_type, reference_id, reason } = receiveData;
    
    const transaction = await sequelize.transaction();
    
    try {
      let inventory = await Inventory.findOne({
        where: { product_id, warehouse_id },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      
      if (!inventory) {
        inventory = await Inventory.create({
          product_id,
          warehouse_id,
          quantity: 0,
          reserved_quantity: 0,
          reorder_level: 10
        }, { transaction });
      }
      
      const oldQuantity = inventory.quantity;
      const newQuantity = oldQuantity + quantity;
      
      await inventory.update({
        quantity: newQuantity,
        last_counted_at: new Date()
      }, { transaction });
      
      await InventoryMovement.create({
        product_id,
        warehouse_id,
        type: 'IN',
        quantity,
        reference_type,
        reference_id,
        reason: reason || 'Stock received',
        created_by: userId
      }, { transaction });
      
      await transaction.commit();
      
      return {
        inventory,
        received_quantity: quantity,
        old_quantity: oldQuantity,
        new_quantity: newQuantity
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async issueInventory(issueData, userId) {
    const { product_id, warehouse_id, quantity, reference_type, reference_id, reason } = issueData;
    
    const transaction = await sequelize.transaction();
    
    try {
      const inventory = await Inventory.findOne({
        where: { product_id, warehouse_id },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      
      if (!inventory) {
        throw new Error('Inventory record not found');
      }
      
      const availableQuantity = inventory.quantity - inventory.reserved_quantity;
      
      if (quantity > availableQuantity) {
        throw new Error(`Insufficient stock. Available: ${availableQuantity}, Requested: ${quantity}`);
      }
      
      const oldQuantity = inventory.quantity;
      const newQuantity = oldQuantity - quantity;
      
      await inventory.update({
        quantity: newQuantity
      }, { transaction });
      
      await InventoryMovement.create({
        product_id,
        warehouse_id,
        type: 'OUT',
        quantity,
        reference_type,
        reference_id,
        reason: reason || 'Stock issued',
        created_by: userId
      }, { transaction });
      
      await transaction.commit();
      
      return {
        inventory,
        issued_quantity: quantity,
        old_quantity: oldQuantity,
        new_quantity: newQuantity
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async reserveInventory(reserveData, userId) {
    const { product_id, warehouse_id, quantity, reference_type, reference_id } = reserveData;
    
    const transaction = await sequelize.transaction();
    
    try {
      const inventory = await Inventory.findOne({
        where: { product_id, warehouse_id },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      
      if (!inventory) {
        throw new Error('Inventory record not found');
      }
      
      const availableQuantity = inventory.quantity - inventory.reserved_quantity;
      
      if (quantity > availableQuantity) {
        throw new Error(`Insufficient stock. Available: ${availableQuantity}, Requested: ${quantity}`);
      }
      
      const oldReserved = inventory.reserved_quantity;
      const newReserved = oldReserved + quantity;
      
      await inventory.update({
        reserved_quantity: newReserved
      }, { transaction });
      
      // No movement record for reservation, just update reserved quantity
      
      await transaction.commit();
      
      return {
        inventory,
        reserved_quantity: quantity,
        old_reserved: oldReserved,
        new_reserved: newReserved
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async releaseInventory(releaseData, userId) {
    const { product_id, warehouse_id, quantity, reference_type, reference_id } = releaseData;
    
    const transaction = await sequelize.transaction();
    
    try {
      const inventory = await Inventory.findOne({
        where: { product_id, warehouse_id },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      
      if (!inventory) {
        throw new Error('Inventory record not found');
      }
      
      if (quantity > inventory.reserved_quantity) {
        throw new Error(`Cannot release more than reserved quantity. Reserved: ${inventory.reserved_quantity}, Requested: ${quantity}`);
      }
      
      const oldReserved = inventory.reserved_quantity;
      const newReserved = Math.max(0, oldReserved - quantity);
      
      await inventory.update({
        reserved_quantity: newReserved
      }, { transaction });
      
      await transaction.commit();
      
      return {
        inventory,
        released_quantity: quantity,
        old_reserved: oldReserved,
        new_reserved: newReserved
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getInventoryMovements(query = {}) {
    const {
      page = 1,
      limit = 20,
      product_id = '',
      warehouse_id = '',
      type = '',
      search = '',
      start_date = '',
      end_date = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = query;

    const where = {};
    
    if (product_id) {
      where.product_id = product_id;
    }
    
    if (warehouse_id) {
      where.warehouse_id = warehouse_id;
    }
    
    if (type) {
      where.type = type;
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

    const productWhere = {};
    if (search) {
      productWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } }
      ];
    }

    const { rows, count } = await InventoryMovement.findAndCountAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          where: productWhere,
          attributes: ['id', 'sku', 'name']
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
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true
    });

    return {
      movements: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getLowStockInventory() {
    const inventory = await Inventory.findAll({
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'sku', 'name', 'reorder_level', 'price'],
          where: { status: 'active' }
        },
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['id', 'name', 'code']
        }
      ]
    });
    
    return inventory
      .map(inv => {
        const available = inv.quantity - inv.reserved_quantity;
        return {
          ...inv.toJSON(),
          available_quantity: available,
          shortage_quantity: Math.max(0, inv.reorder_level - available)
        };
      })
      .filter(inv => inv.available_quantity <= inv.reorder_level)
      .sort((a, b) => a.shortage_quantity - b.shortage_quantity);
  }

  async getInventoryStatistics() {
    const totalInventory = await Inventory.sum('quantity') || 0;
    const totalReserved = await Inventory.sum('reserved_quantity') || 0;
    const totalProducts = await Inventory.count();
    
    const inventoryByWarehouse = await Inventory.findAll({
      attributes: [
        'warehouse_id',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
        [sequelize.fn('SUM', sequelize.col('reserved_quantity')), 'total_reserved']
      ],
      include: [
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['id', 'name', 'code']
        }
      ],
      group: ['warehouse_id'],
      order: [[sequelize.literal('total_quantity'), 'DESC']]
    });
    
    const lowStockCount = await Inventory.count({
      where: sequelize.literal('quantity - reserved_quantity <= reorder_level')
    });
    
    const inventoryValue = await Inventory.findAll({
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['price', 'cost_price']
        }
      ]
    });
    
    const totalStockValue = inventoryValue.reduce((sum, inv) => {
      const available = inv.quantity - inv.reserved_quantity;
      return sum + (available * parseFloat(inv.product?.price || 0));
    }, 0);
    
    const totalCostValue = inventoryValue.reduce((sum, inv) => {
      const available = inv.quantity - inv.reserved_quantity;
      return sum + (available * parseFloat(inv.product?.cost_price || 0));
    }, 0);
    
    return {
      total_inventory: totalInventory,
      total_reserved: totalReserved,
      available_inventory: totalInventory - totalReserved,
      total_products: totalProducts,
      low_stock_count: lowStockCount,
      total_stock_value: totalStockValue,
      total_cost_value: totalCostValue,
      inventory_by_warehouse: inventoryByWarehouse
    };
  }
}

module.exports = new InventoryService();