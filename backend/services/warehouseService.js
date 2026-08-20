const { Warehouse, User, Inventory, Product, PurchaseOrder, Order, Shipment, InventoryMovement, sequelize } = require('../models');
const { Op } = require('sequelize');

class WarehouseService {
  async getAllWarehouses(query = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = query;

    const where = {};
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (status) {
      where.status = status;
    }

    const { rows, count } = await Warehouse.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true
    });

    // Calculate warehouse statistics
    const warehousesWithStats = await Promise.all(rows.map(async (warehouse) => {
      const inventoryCount = await Inventory.count({ 
        where: { warehouse_id: warehouse.id } 
      });
      
      const totalStock = await Inventory.sum('quantity', { 
        where: { warehouse_id: warehouse.id } 
      }) || 0;
      
      const totalProducts = await Inventory.count({
        where: { 
          warehouse_id: warehouse.id,
          quantity: { [Op.gt]: 0 }
        }
      });
      
      const lowStockItems = await Inventory.count({
        where: {
          warehouse_id: warehouse.id,
          quantity: { [Op.lte]: 10 } // Simple check, can be improved
        }
      });
      
      const pendingPOs = await PurchaseOrder.count({
        where: {
          warehouse_id: warehouse.id,
          status: { [Op.in]: ['SUBMITTED', 'APPROVED', 'ACCEPTED'] }
        }
      });
      
      const pendingOrders = await Order.count({
        where: {
          warehouse_id: warehouse.id,
          status: { [Op.in]: ['PENDING', 'CONFIRMED', 'PROCESSING'] }
        }
      });
      
      return {
        ...warehouse.toJSON(),
        statistics: {
          total_inventory_items: inventoryCount,
          total_stock: totalStock,
          total_products: totalProducts,
          low_stock_items: lowStockItems,
          pending_purchase_orders: pendingPOs,
          pending_orders: pendingOrders
        }
      };
    }));

    return {
      warehouses: warehousesWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getWarehouseById(id) {
    const warehouse = await Warehouse.findByPk(id, {
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });
    
    if (!warehouse) {
      throw new Error('Warehouse not found');
    }
    
    // Calculate simple statistics
    const totalInventory = await Inventory.sum('quantity', { 
      where: { warehouse_id: id } 
    }) || 0;
    
    const totalReserved = await Inventory.sum('reserved_quantity', { 
      where: { warehouse_id: id } 
    }) || 0;
    
    const inventoryItems = await Inventory.count({ 
      where: { warehouse_id: id } 
    });
    
    return {
      ...warehouse.toJSON(),
      statistics: {
        total_inventory: totalInventory,
        total_reserved: totalReserved,
        available_inventory: totalInventory - totalReserved,
        inventory_items: inventoryItems,
        capacity_utilization: warehouse.capacity > 0 ? 
          (totalInventory / parseFloat(warehouse.capacity)) * 100 : 0
      }
    };
  }

  async createWarehouse(warehouseData) {
    const { name, code, address, manager_id, capacity } = warehouseData;
    
    // Check if warehouse code exists
    const existingWarehouse = await Warehouse.findOne({ 
      where: { code: code.toUpperCase() } 
    });
    
    if (existingWarehouse) {
      throw new Error('Warehouse with this code already exists');
    }
    
    const warehouse = await Warehouse.create({
      name,
      code: code.toUpperCase(),
      address,
      manager_id,
      capacity: capacity || 0,
      status: 'active'
    });
    
    return warehouse;
  }

  async updateWarehouse(id, warehouseData) {
    const warehouse = await Warehouse.findByPk(id);
    
    if (!warehouse) {
      throw new Error('Warehouse not found');
    }
    
    const { name, address, manager_id, capacity, status } = warehouseData;
    
    await warehouse.update({
      name: name || warehouse.name,
      address: address !== undefined ? address : warehouse.address,
      manager_id: manager_id !== undefined ? manager_id : warehouse.manager_id,
      capacity: capacity !== undefined ? capacity : warehouse.capacity,
      status: status || warehouse.status
    });
    
    return warehouse;
  }

  async deleteWarehouse(id) {
    const warehouse = await Warehouse.findByPk(id);
    
    if (!warehouse) {
      throw new Error('Warehouse not found');
    }
    
    // Soft delete - deactivate warehouse
    await warehouse.update({ status: 'inactive' });
    
    return { message: 'Warehouse deactivated successfully' };
  }

  async getWarehouseStatistics() {
    const totalWarehouses = await Warehouse.count();
    const activeWarehouses = await Warehouse.count({ where: { status: 'active' } });
    
    return {
      totalWarehouses,
      activeWarehouses,
      inactiveWarehouses: totalWarehouses - activeWarehouses
    };
  }
}

module.exports = new WarehouseService();