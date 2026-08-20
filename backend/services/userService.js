const { User, Warehouse, Driver } = require('../models');
const { Op } = require('sequelize');

class UserService {
  async getAllUsers(query = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      status = '',
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
    
    if (role) {
      where.role = role;
    }
    
    if (status) {
      where.status = status;
    }

    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Warehouse,
          as: 'managedWarehouse',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    return {
      users: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getUserById(id) {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Warehouse,
          as: 'managedWarehouse',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Driver,
          as: 'driverProfile',
          attributes: ['id', 'license_number', 'vehicle_number', 'status']
        }
      ]
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }

  async createUser(userData) {
    const { name, email, password, phone, role, warehouse_id } = userData;
    
    // Check if user exists
    const existingUser = await User.findOne({ 
      where: { email: email.toLowerCase() } 
    });
    
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      role,
      warehouse_id,
      status: 'active'
    });
    
    // If role is driver, create driver profile
    if (role === 'driver') {
      await Driver.create({
        user_id: user.id,
        license_number: `LIC-${Date.now()}`,
        status: 'AVAILABLE'
      });
    }
    
    return user;
  }

  async updateUser(id, userData) {
    const user = await User.findByPk(id);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const { name, phone, role, warehouse_id, status } = userData;
    
    await user.update({
      name: name || user.name,
      phone: phone || user.phone,
      role: role || user.role,
      warehouse_id: warehouse_id !== undefined ? warehouse_id : user.warehouse_id,
      status: status || user.status
    });
    
    return user;
  }

  async deleteUser(id) {
    const user = await User.findByPk(id);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Soft delete - deactivate user
    await user.update({ status: 'inactive' });
    
    return { message: 'User deactivated successfully' };
  }

  async updateUserStatus(id, status) {
    const user = await User.findByPk(id);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    await user.update({ status });
    
    return user;
  }
}

module.exports = new UserService();