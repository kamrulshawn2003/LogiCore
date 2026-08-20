const { User } = require('../models');
const { generateToken } = require('../utils/generateToken');
const ApiResponse = require('../utils/ApiResponse');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

class AuthService {
  async register(userData) {
    const { name, email, password, phone, role } = userData;
    
    // Check if user exists
    const existingUser = await User.findOne({ 
      where: { 
        email: email.toLowerCase() 
      } 
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
      role: role || 'customer',
      status: 'active'
    });
    
    // Generate token
    const token = generateToken(user);
    
    return { user, token };
  }

  async login(email, password) {
    // Find user
    const user = await User.findOne({ 
      where: { 
        email: email.toLowerCase(),
        status: 'active'
      } 
    });
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
    
    // Update last login
    await user.update({ last_login: new Date() });
    
    // Generate token
    const token = generateToken(user);
    
    return { user, token };
  }

  async getCurrentUser(userId) {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: require('../models').Warehouse,
          as: 'managedWarehouse',
          attributes: ['id', 'name', 'code']
        }
      ]
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify old password
    const isPasswordValid = await user.comparePassword(oldPassword);
    
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }
    
    // Update password
    await user.update({ password: newPassword });
    
    return user;
  }

  async forgotPassword(email) {
    const user = await User.findOne({ 
      where: { 
        email: email.toLowerCase() 
      } 
    });
    
    if (!user) {
      // Return success even if user not found for security
      return { message: 'If the email exists, a password reset link has been sent' };
    }
    
    // In production, send email with reset token
    // For now, return reset token (in production, this should be emailed)
    const resetToken = generateToken(user);
    
    return { 
      message: 'If the email exists, a password reset link has been sent',
      resetToken 
    };
  }
}

module.exports = new AuthService();