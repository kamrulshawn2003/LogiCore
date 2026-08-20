'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('categories', [
      {
        name: 'Electronics',
        description: 'Electronic devices and accessories',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Clothing',
        description: 'Apparel and fashion items',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Food & Beverage',
        description: 'Food products and beverages',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Office Supplies',
        description: 'Office and stationery supplies',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Industrial',
        description: 'Industrial equipment and machinery',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('categories', null, {});
  }
};