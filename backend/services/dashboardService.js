const { 
  User, 
  Product, 
  Category,
  Supplier, 
  Warehouse, 
  Inventory, 
  PurchaseOrder, 
  Order, 
  Shipment,
  Driver,
  sequelize 
} = require('../models');
const { Op } = require('sequelize');

class DashboardService {
  async getDashboardStats(userId = null, userRole = null, warehouseId = null) {
    try {
      // Get counts with error handling for each
      const [
        totalProducts,
        activeProducts,
        totalSuppliers,
        activeSuppliers,
        totalWarehouses,
        activeWarehouses,
        totalInventory,
        lowStockCount,
        pendingPOs,
        pendingOrders,
        activeShipments,
        totalDrivers,
        availableDrivers,
        totalCustomers,
        totalRevenue
      ] = await Promise.all([
        Product.count().catch(() => 0),
        Product.count({ where: { status: 'active' } }).catch(() => 0),
        Supplier.count().catch(() => 0),
        Supplier.count({ where: { status: 'active' } }).catch(() => 0),
        Warehouse.count().catch(() => 0),
        Warehouse.count({ where: { status: 'active' } }).catch(() => 0),
        Inventory.sum('quantity').catch(() => 0),
        Inventory.count({ where: { quantity: { [Op.lte]: 10 } } }).catch(() => 0),
        PurchaseOrder.count({ 
          where: { status: { [Op.in]: ['SUBMITTED', 'APPROVED', 'ACCEPTED'] } } 
        }).catch(() => 0),
        Order.count({ 
          where: { status: { [Op.in]: ['PENDING', 'CONFIRMED', 'PROCESSING'] } } 
        }).catch(() => 0),
        Shipment.count({ 
          where: { status: { [Op.in]: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } } 
        }).catch(() => 0),
        Driver.count().catch(() => 0),
        Driver.count({ where: { status: 'AVAILABLE' } }).catch(() => 0),
        User.count({ where: { role: 'customer' } }).catch(() => 0),
        Order.sum('total_amount', {
          where: { 
            status: { [Op.in]: ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'] } 
          }
        }).catch(() => 0)
      ]);

      // Get recent orders
      const recentOrders = await Order.findAll({
        include: [
          {
            model: User,
            as: 'customer',
            attributes: ['id', 'name', 'email']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: 5
      }).catch(() => []);

      // Get low stock items
      const lowStockItems = await Inventory.findAll({
        where: { quantity: { [Op.lte]: 10 } },
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'sku', 'name', 'reorder_level', 'price']
          },
          {
            model: Warehouse,
            as: 'warehouse',
            attributes: ['id', 'name', 'code']
          }
        ],
        limit: 10
      }).catch(() => []);

      return {
        products: {
          total: totalProducts || 0,
          active: activeProducts || 0,
          low_stock: lowStockCount || 0
        },
        suppliers: {
          total: totalSuppliers || 0,
          active: activeSuppliers || 0
        },
        warehouses: {
          total: totalWarehouses || 0,
          active: activeWarehouses || 0
        },
        inventory: {
          total_quantity: totalInventory || 0,
          low_stock_count: lowStockCount || 0
        },
        purchase_orders: {
          pending: pendingPOs || 0
        },
        orders: {
          pending: pendingOrders || 0,
          total_revenue: totalRevenue || 0
        },
        shipments: {
          active: activeShipments || 0
        },
        drivers: {
          total: totalDrivers || 0,
          available: availableDrivers || 0
        },
        customers: {
          total: totalCustomers || 0
        },
        recent_orders: recentOrders,
        low_stock_items: lowStockItems
      };
    } catch (error) {
      console.error('Dashboard stats error:', error);
      // Return empty data instead of throwing
      return {
        products: { total: 0, active: 0, low_stock: 0 },
        suppliers: { total: 0, active: 0 },
        warehouses: { total: 0, active: 0 },
        inventory: { total_quantity: 0, low_stock_count: 0 },
        purchase_orders: { pending: 0 },
        orders: { pending: 0, total_revenue: 0 },
        shipments: { active: 0 },
        drivers: { total: 0, available: 0 },
        customers: { total: 0 },
        recent_orders: [],
        low_stock_items: []
      };
    }
  }

  async getSalesAnalytics(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const dailySales = await Order.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'order_count'],
          [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue']
        ],
        where: {
          created_at: { [Op.gte]: startDate },
          status: { [Op.ne]: 'CANCELLED' }
        },
        group: [sequelize.fn('DATE', sequelize.col('created_at'))],
        order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
      }).catch(() => []);

      const ordersByStatus = await Order.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status']
      }).catch(() => []);

      return {
        daily_sales: dailySales,
        orders_by_status: ordersByStatus
      };
    } catch (error) {
      console.error('Sales analytics error:', error);
      return { daily_sales: [], orders_by_status: [] };
    }
  }

  async getInventoryAnalytics() {
    try {
      const inventoryByWarehouse = await Inventory.findAll({
        attributes: [
          'warehouse_id',
          [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'product_count']
        ],
        include: [
          {
            model: Warehouse,
            as: 'warehouse',
            attributes: ['name', 'code']
          }
        ],
        group: ['warehouse_id']
      }).catch(() => []);

      return {
        inventory_by_warehouse: inventoryByWarehouse
      };
    } catch (error) {
      console.error('Inventory analytics error:', error);
      return { inventory_by_warehouse: [] };
    }
  }

  async getPurchaseOrderAnalytics(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const poTrends = await PurchaseOrder.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'po_count'],
          [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_value']
        ],
        where: {
          created_at: { [Op.gte]: startDate }
        },
        group: [sequelize.fn('DATE', sequelize.col('created_at'))]
      }).catch(() => []);

      return { po_trends: poTrends };
    } catch (error) {
      console.error('PO analytics error:', error);
      return { po_trends: [] };
    }
  }

  async getShipmentAnalytics(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const shipmentTrends = await Shipment.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'shipment_count']
        ],
        where: {
          created_at: { [Op.gte]: startDate }
        },
        group: [sequelize.fn('DATE', sequelize.col('created_at'))]
      }).catch(() => []);

      return { shipment_trends: shipmentTrends };
    } catch (error) {
      console.error('Shipment analytics error:', error);
      return { shipment_trends: [] };
    }
  }
}

module.exports = new DashboardService();