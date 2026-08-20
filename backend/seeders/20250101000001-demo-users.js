'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const password = await bcrypt.hash('Password123!', 10);
    
    await queryInterface.bulkInsert('users', [
      {
        name: 'System Admin',
        email: 'admin@logicore.com',
        password: password,
        phone: '+1234567890',
        role: 'admin',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'John Manager',
        email: 'manager@logicore.com',
        password: password,
        phone: '+1234567891',
        role: 'warehouse_manager',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Supplier Corp',
        email: 'supplier@logicore.com',
        password: password,
        phone: '+1234567892',
        role: 'supplier',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Mike Driver',
        email: 'driver@logicore.com',
        password: password,
        phone: '+1234567893',
        role: 'driver',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Alice Customer',
        email: 'customer@logicore.com',
        password: password,
        phone: '+1234567894',
        role: 'customer',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {
      where: {
        email: {
          [Sequelize.Op.in]: [
            'admin@logicore.com',
            'manager@logicore.com',
            'supplier@logicore.com',
            'driver@logicore.com',
            'customer@logicore.com'
          ]
        }
      }
    });
  }
};