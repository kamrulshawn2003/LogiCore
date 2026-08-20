const { Supplier, Product, PurchaseOrder, User } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

class SupplierService {
  async getAllSuppliers(query = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      min_rating = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = query;

    const where = {};
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (min_rating) {
      where.rating = { [Op.gte]: parseFloat(min_rating) };
    }

    const { rows, count } = await Supplier.findAndCountAll({
      where,
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['id', 'sku', 'name', 'price'],
          required: false
        },
        {
          model: User,
          as: 'userAccount',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true
    });

    // Calculate supplier statistics
    const suppliersWithStats = await Promise.all(rows.map(async (supplier) => {
      const productCount = await Product.count({ where: { supplier_id: supplier.id } });
      const activeProductCount = await Product.count({ 
        where: { supplier_id: supplier.id, status: 'active' } 
      });
      const poCount = await PurchaseOrder.count({ where: { supplier_id: supplier.id } });
      const completedPOCount = await PurchaseOrder.count({ 
        where: { supplier_id: supplier.id, status: 'RECEIVED' } 
      });
      
      return {
        ...supplier.toJSON(),
        statistics: {
          total_products: productCount,
          active_products: activeProductCount,
          total_purchase_orders: poCount,
          completed_purchase_orders: completedPOCount
        }
      };
    }));

    return {
      suppliers: suppliersWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getSupplierById(id) {
    const supplier = await Supplier.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['id', 'sku', 'name', 'price', 'cost_price', 'status'],
          include: [
            {
              model: require('../models').Category,
              as: 'category',
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: User,
          as: 'userAccount',
          attributes: ['id', 'name', 'email', 'phone', 'status']
        },
        {
          model: PurchaseOrder,
          as: 'purchaseOrders',
          attributes: ['id', 'po_number', 'status', 'total_amount', 'created_at'],
          limit: 10,
          order: [['created_at', 'DESC']]
        }
      ]
    });
    
    if (!supplier) {
      throw new Error('Supplier not found');
    }
    
    // Calculate performance metrics
    const totalPOs = await PurchaseOrder.count({ where: { supplier_id: id } });
    const completedPOs = await PurchaseOrder.count({ 
      where: { supplier_id: id, status: 'RECEIVED' } 
    });
    const cancelledPOs = await PurchaseOrder.count({ 
      where: { supplier_id: id, status: 'CANCELLED' } 
    });
    
    const onTimeDelivery = completedPOs > 0 ? 
      (completedPOs / (totalPOs || 1)) * 100 : 0;
    
    return {
      ...supplier.toJSON(),
      performance: {
        total_purchase_orders: totalPOs,
        completed_purchase_orders: completedPOs,
        cancelled_purchase_orders: cancelledPOs,
        completion_rate: totalPOs > 0 ? (completedPOs / totalPOs) * 100 : 0,
        on_time_delivery_rate: onTimeDelivery
      }
    };
  }

  async createSupplier(supplierData) {
    const { name, email, phone, address } = supplierData;
    
    // Check if supplier exists
    const existingSupplier = await Supplier.findOne({ 
      where: { email: email.toLowerCase() } 
    });
    
    if (existingSupplier) {
      throw new Error('Supplier with this email already exists');
    }
    
    const supplier = await Supplier.create({
      name,
      email: email.toLowerCase(),
      phone,
      address,
      rating: 0.00,
      status: 'active'
    });
    
    return supplier;
  }

  async updateSupplier(id, supplierData) {
    const supplier = await Supplier.findByPk(id);
    
    if (!supplier) {
      throw new Error('Supplier not found');
    }
    
    const { name, email, phone, address, status } = supplierData;
    
    // Check email uniqueness if email is being changed
    if (email && email !== supplier.email) {
      const existingSupplier = await Supplier.findOne({ 
        where: { 
          email: email.toLowerCase(),
          id: { [Op.ne]: id }
        } 
      });
      
      if (existingSupplier) {
        throw new Error('Supplier with this email already exists');
      }
    }
    
    await supplier.update({
      name: name || supplier.name,
      email: email ? email.toLowerCase() : supplier.email,
      phone: phone !== undefined ? phone : supplier.phone,
      address: address !== undefined ? address : supplier.address,
      status: status || supplier.status
    });
    
    return supplier;
  }

  async deleteSupplier(id) {
    const supplier = await Supplier.findByPk(id);
    
    if (!supplier) {
      throw new Error('Supplier not found');
    }
    
    // Check if supplier has active purchase orders
    const activePOs = await PurchaseOrder.count({
      where: {
        supplier_id: id,
        status: {
          [Op.in]: ['DRAFT', 'SUBMITTED', 'APPROVED', 'ACCEPTED', 'PARTIALLY_RECEIVED']
        }
      }
    });
    
    if (activePOs > 0) {
      throw new Error('Cannot deactivate supplier with active purchase orders');
    }
    
    // Soft delete - deactivate supplier
    await supplier.update({ status: 'inactive' });
    
    return { message: 'Supplier deactivated successfully' };
  }

  async updateSupplierRating(id, rating) {
    const supplier = await Supplier.findByPk(id);
    
    if (!supplier) {
      throw new Error('Supplier not found');
    }
    
    if (rating < 0 || rating > 5) {
      throw new Error('Rating must be between 0 and 5');
    }
    
    await supplier.update({ rating });
    
    return supplier;
  }

  async getSupplierPurchaseOrders(supplierId, query = {}) {
    const {
      page = 1,
      limit = 10,
      status = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = query;

    const where = { supplier_id: supplierId };
    
    if (status) {
      where.status = status;
    }

    const { rows, count } = await PurchaseOrder.findAndCountAll({
      where,
      include: [
        {
          model: require('../models').Warehouse,
          as: 'warehouse',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
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

  async getSupplierStatistics() {
    const totalSuppliers = await Supplier.count();
    const activeSuppliers = await Supplier.count({ where: { status: 'active' } });
    const inactiveSuppliers = await Supplier.count({ where: { status: 'inactive' } });
    
    const topSuppliers = await Supplier.findAll({
      attributes: [
        'id',
        'name',
        'email',
        'rating',
        [sequelize.fn('COUNT', sequelize.col('purchaseOrders.id')), 'total_orders']
      ],
      include: [
        {
          model: PurchaseOrder,
          as: 'purchaseOrders',
          attributes: [],
          required: false
        }
      ],
      group: ['Supplier.id'],
      order: [[sequelize.literal('total_orders'), 'DESC']],
      limit: 10,
      where: { status: 'active' }
    });
    
    const averageRating = await Supplier.findOne({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'avg_rating']
      ],
      where: { status: 'active' }
    });
    
    return {
      totalSuppliers,
      activeSuppliers,
      inactiveSuppliers,
      averageRating: averageRating?.get('avg_rating') || 0,
      topSuppliers
    };
  }
}

module.exports = new SupplierService();