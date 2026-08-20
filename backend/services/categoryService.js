const { Category, Product } = require('../models');
const { Op } = require('sequelize');

class CategoryService {
  async getAllCategories(query = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      sortBy = 'name',
      sortOrder = 'ASC'
    } = query;

    const where = {};
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (status) {
      where.status = status;
    }

    const { rows, count } = await Category.findAndCountAll({
      where,
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['id', 'sku', 'name', 'price'],
          where: { status: 'active' },
          required: false
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true
    });

    return {
      categories: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getCategoryById(id) {
    const category = await Category.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['id', 'sku', 'name', 'price', 'status'],
          where: { status: 'active' },
          required: false
        }
      ]
    });
    
    if (!category) {
      throw new Error('Category not found');
    }
    
    return category;
  }

  async createCategory(categoryData) {
    const { name, description } = categoryData;
    
    // Check if category exists
    const existingCategory = await Category.findOne({ 
      where: { name: name.toLowerCase() } 
    });
    
    if (existingCategory) {
      throw new Error('Category with this name already exists');
    }
    
    const category = await Category.create({
      name,
      description,
      status: 'active'
    });
    
    return category;
  }

  async updateCategory(id, categoryData) {
    const category = await Category.findByPk(id);
    
    if (!category) {
      throw new Error('Category not found');
    }
    
    const { name, description, status } = categoryData;
    
    await category.update({
      name: name || category.name,
      description: description !== undefined ? description : category.description,
      status: status || category.status
    });
    
    return category;
  }

  async deleteCategory(id) {
    const category = await Category.findByPk(id);
    
    if (!category) {
      throw new Error('Category not found');
    }
    
    // Check if category has products
    const productCount = await Product.count({ 
      where: { category_id: id } 
    });
    
    if (productCount > 0) {
      throw new Error('Cannot delete category with associated products');
    }
    
    await category.destroy();
    
    return { message: 'Category deleted successfully' };
  }

  async getCategoryStats() {
    const totalCategories = await Category.count();
    const activeCategories = await Category.count({ 
      where: { status: 'active' } 
    });
    
    const categoriesWithProducts = await Category.findAll({
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['id'],
          required: true
        }
      ],
      attributes: [
        'id',
        'name',
        [sequelize.fn('COUNT', sequelize.col('products.id')), 'product_count']
      ],
      group: ['Category.id'],
      order: [[sequelize.literal('product_count'), 'DESC']],
      limit: 10
    });

    return {
      totalCategories,
      activeCategories,
      topCategories: categoriesWithProducts
    };
  }
}

module.exports = new CategoryService();