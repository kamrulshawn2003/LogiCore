const { 
  Order, 
  OrderItem, 
  Product, 
  PurchaseOrder, 
  Inventory, 
  InventoryMovement,
  Shipment,
  Supplier,
  Warehouse,
  User,
  sequelize 
} = require('../models');
const { Op } = require('sequelize');

class ReportService {
  async generateSalesReport(params) {
    const { start_date, end_date, group_by = 'day' } = params;
    
    const where = {
      created_at: {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      },
      status: { [Op.ne]: 'CANCELLED' }
    };
    
    const groupFormat = group_by === 'month' ? '%Y-%m' : group_by === 'week' ? '%Y-%u' : '%Y-%m-%d';
    
    const salesData = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), groupFormat), 'period'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'order_count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue'],
        [sequelize.fn('AVG', sequelize.col('total_amount')), 'average_order_value']
      ],
      where,
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), groupFormat)],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), groupFormat), 'ASC']]
    });
    
    const summary = await Order.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_orders'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_revenue'],
        [sequelize.fn('AVG', sequelize.col('total_amount')), 'average_order_value'],
        [sequelize.fn('MIN', sequelize.col('total_amount')), 'min_order_value'],
        [sequelize.fn('MAX', sequelize.col('total_amount')), 'max_order_value']
      ],
      where
    });
    
    return {
      summary,
      data: salesData
    };
  }

  async generateInventoryReport(params) {
    const { warehouse_id } = params;
    
    const where = {};
    if (warehouse_id) {
      where.warehouse_id = warehouse_id;
    }
    
    const inventoryData = await Inventory.findAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'sku', 'name', 'price', 'cost_price', 'reorder_level']
        },
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['id', 'name', 'code']
        }
      ]
    });
    
    const report = inventoryData.map(inv => ({
      product: inv.product,
      warehouse: inv.warehouse,
      quantity: inv.quantity,
      reserved: inv.reserved_quantity,
      available: inv.quantity - inv.reserved_quantity,
      reorder_level: inv.reorder_level,
      is_low_stock: (inv.quantity - inv.reserved_quantity) <= inv.reorder_level,
      stock_value: (inv.quantity - inv.reserved_quantity) * parseFloat(inv.product?.price || 0),
      cost_value: (inv.quantity - inv.reserved_quantity) * parseFloat(inv.product?.cost_price || 0)
    }));
    
    const summary = {
      total_products: report.length,
      total_quantity: report.reduce((sum, item) => sum + item.available, 0),
      total_value: report.reduce((sum, item) => sum + item.stock_value, 0),
      total_cost: report.reduce((sum, item) => sum + item.cost_value, 0),
      low_stock_count: report.filter(item => item.is_low_stock).length
    };
    
    return { summary, data: report };
  }

  async generatePurchaseReport(params) {
    const { start_date, end_date, supplier_id } = params;
    
    const where = {
      created_at: {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      }
    };
    
    if (supplier_id) {
      where.supplier_id = supplier_id;
    }
    
    const poData = await PurchaseOrder.findAll({
      where,
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name']
        },
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [['created_at', 'ASC']]
    });
    
    const summary = {
      total_pos: poData.length,
      total_value: poData.reduce((sum, po) => sum + parseFloat(po.total_amount), 0),
      completed: poData.filter(po => po.status === 'RECEIVED').length,
      in_progress: poData.filter(po => ['SUBMITTED', 'APPROVED', 'ACCEPTED', 'PARTIALLY_RECEIVED'].includes(po.status)).length,
      cancelled: poData.filter(po => po.status === 'CANCELLED').length
    };
    
    return { summary, data: poData };
  }

  async generateShipmentReport(params) {
    const { start_date, end_date, status } = params;
    
    const where = {
      created_at: {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      }
    };
    
    if (status) {
      where.status = status;
    }
    
    const shipmentData = await Shipment.findAll({
      where,
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'order_number', 'total_amount']
        },
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [['created_at', 'ASC']]
    });
    
    const summary = {
      total_shipments: shipmentData.length,
      delivered: shipmentData.filter(s => s.status === 'DELIVERED').length,
      in_transit: shipmentData.filter(s => ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(s.status)).length,
      failed: shipmentData.filter(s => s.status === 'FAILED').length
    };
    
    return { summary, data: shipmentData };
  }

  async generateSupplierPerformanceReport() {
    const suppliers = await Supplier.findAll({
      where: { status: 'active' },
      include: [
        {
          model: PurchaseOrder,
          as: 'purchaseOrders',
          attributes: ['id', 'status', 'total_amount', 'created_at', 'expected_delivery_date']
        }
      ]
    });
    
    const report = suppliers.map(supplier => {
      const pos = supplier.purchaseOrders || [];
      const completed = pos.filter(po => po.status === 'RECEIVED');
      const onTime = completed.filter(po => {
        if (!po.expected_delivery_date) return true;
        return new Date(po.created_at) <= new Date(po.expected_delivery_date);
      });
      
      return {
        supplier: {
          id: supplier.id,
          name: supplier.name,
          email: supplier.email,
          rating: supplier.rating
        },
        total_pos: pos.length,
        completed_pos: completed.length,
        on_time_deliveries: onTime.length,
        on_time_rate: completed.length > 0 ? (onTime.length / completed.length) * 100 : 0,
        total_value: pos.reduce((sum, po) => sum + parseFloat(po.total_amount), 0)
      };
    });
    
    return report;
  }
}

module.exports = new ReportService();