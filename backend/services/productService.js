const { Product, Category, Supplier, Inventory, Warehouse } = require('../models');
const { Op } = require('sequelize');
const { generateSKU } = require('../utils/generateNumber');

class ProductService {
  async getAllProducts(query = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      category_id = '',
      supplier_id = '',
      status = '',
      min_price = '',
      max_price = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = query;

    const where = {};
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (category_id) {
      where.category_id = category_id;
    }
    
    if (supplier_id) {
      where.supplier_id = supplier_id;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (min_price) {
      where.price = { [Op.gte]: min_price };
    }
    
    if (max_price) {
      where.price = { ...where.price, [Op.lte]: max_price };
    }

    const { rows, count } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['id', 'warehouse_id', 'quantity', 'reserved_quantity'],
          include: [
            {
              model: Warehouse,
              as: 'warehouse',
              attributes: ['id', 'name', 'code']
            }
          ]
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true
    });

    // Calculate total stock for each product
    const productsWithStock = rows.map(product => {
      const totalStock = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
      const totalReserved = product.inventory.reduce((sum, inv) => sum + inv.reserved_quantity, 0);
      
      return {
        ...product.toJSON(),
        total_stock: totalStock,
        total_reserved: totalReserved,
        available_stock: totalStock - totalReserved
      };
    });

    return {
      products: productsWithStock,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getProductById(id) {
    const product = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'description']
        },
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'email', 'phone', 'rating']
        },
        {
          model: Inventory,
          as: 'inventory',
          include: [
            {
              model: Warehouse,
              as: 'warehouse',
              attributes: ['id', 'name', 'code', 'address']
            }
          ]
        }
      ]
    });
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    // Calculate total stock
    const totalStock = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
    const totalReserved = product.inventory.reduce((sum, inv) => sum + inv.reserved_quantity, 0);
    
    return {
      ...product.toJSON(),
      total_stock: totalStock,
      total_reserved: totalReserved,
      available_stock: totalStock - totalReserved
    };
  }

  async createProduct(productData) {
    const {
      name,
      description,
      category_id,
      supplier_id,
      price,
      cost_price,
      reorder_level,
      unit,
      weight,
      dimensions
    } = productData;
    
    // Generate SKU if not provided
    let sku = productData.sku;
    if (!sku) {
      const category = await Category.findByPk(category_id);
      const supplier = await Supplier.findByPk(supplier_id);
      sku = generateSKU(
        category ? category.name : 'GEN',
        supplier ? supplier.name : 'GEN'
      );
    }
    
    // Check if SKU exists
    const existingProduct = await Product.findOne({ where: { sku } });
    if (existingProduct) {
      throw new Error('Product with this SKU already exists');
    }
    
    const product = await Product.create({
      sku,
      name,
      description,
      category_id,
      supplier_id,
      price: price || 0,
      cost_price: cost_price || 0,
      reorder_level: reorder_level || 10,
      unit: unit || 'pcs',
      weight,
      dimensions,
      status: 'active'
    });
    
    return product;
  }

  async updateProduct(id, productData) {
    const product = await Product.findByPk(id);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    const {
      name,
      description,
      category_id,
      supplier_id,
      price,
      cost_price,
      reorder_level,
      unit,
      status,
      weight,
      dimensions
    } = productData;
    
    await product.update({
      name: name || product.name,
      description: description !== undefined ? description : product.description,
      category_id: category_id || product.category_id,
      supplier_id: supplier_id || product.supplier_id,
      price: price !== undefined ? price : product.price,
      cost_price: cost_price !== undefined ? cost_price : product.cost_price,
      reorder_level: reorder_level !== undefined ? reorder_level : product.reorder_level,
      unit: unit || product.unit,
      status: status || product.status,
      weight: weight !== undefined ? weight : product.weight,
      dimensions: dimensions !== undefined ? dimensions : product.dimensions
    });
    
    return product;
  }

  async deleteProduct(id) {
    const product = await Product.findByPk(id);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    // Soft delete - deactivate product
    await product.update({ status: 'inactive' });
    
    return { message: 'Product deactivated successfully' };
  }

  async updateProductStatus(id, status) {
    const product = await Product.findByPk(id);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    await product.update({ status });
    
    return product;
  }

  async getLowStockProducts() {
    const products = await Product.findAll({
      where: { status: 'active' },
      include: [
        {
          model: Inventory,
          as: 'inventory',
          required: true,
          include: [
            {
              model: Warehouse,
              as: 'warehouse',
              attributes: ['id', 'name', 'code']
            }
          ]
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ]
    });
    
    const lowStockProducts = products
      .map(product => {
        const totalStock = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
        return {
          ...product.toJSON(),
          total_stock: totalStock,
          is_low_stock: totalStock <= product.reorder_level
        };
      })
      .filter(product => product.is_low_stock);
    
    return lowStockProducts;
  }

  async getProductStatistics() {
    const totalProducts = await Product.count();
    const activeProducts = await Product.count({ where: { status: 'active' } });
    const inactiveProducts = await Product.count({ where: { status: 'inactive' } });
    const discontinuedProducts = await Product.count({ where: { status: 'discontinued' } });
    
    const topProducts = await Product.findAll({
      where: { status: 'active' },
      include: [
        {
          model: Inventory,
          as: 'inventory',
          required: true
        }
      ],
      attributes: [
        'id',
        'name',
        'sku',
        'price',
        [sequelize.fn('SUM', sequelize.col('inventory.quantity')), 'total_stock']
      ],
      group: ['Product.id'],
      order: [[sequelize.literal('total_stock'), 'DESC']],
      limit: 10
    });
    
    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
      discontinuedProducts,
      topProducts
    };
  }
}

module.exports = new ProductService();