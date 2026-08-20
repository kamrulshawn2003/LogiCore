'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('products', [
      {
        sku: 'ELC-TCH-001',
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with long battery life',
        category_id: 1,
        supplier_id: 1,
        price: 29.99,
        cost_price: 15.00,
        reorder_level: 20,
        unit: 'pcs',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        sku: 'ELC-TCH-002',
        name: 'USB-C Cable',
        description: 'Fast charging USB-C cable, 2m length',
        category_id: 1,
        supplier_id: 1,
        price: 12.99,
        cost_price: 5.00,
        reorder_level: 50,
        unit: 'pcs',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        sku: 'CLT-SHT-001',
        name: 'Cotton T-Shirt',
        description: 'Premium cotton t-shirt, available in multiple sizes',
        category_id: 2,
        supplier_id: 3,
        price: 19.99,
        cost_price: 8.00,
        reorder_level: 30,
        unit: 'pcs',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        sku: 'OFF-PRN-001',
        name: 'Printer Paper',
        description: 'A4 size printer paper, 500 sheets per pack',
        category_id: 4,
        supplier_id: 4,
        price: 6.99,
        cost_price: 3.00,
        reorder_level: 100,
        unit: 'pack',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        sku: 'OFF-STP-001',
        name: 'Stapler',
        description: 'Heavy duty stapler for office use',
        category_id: 4,
        supplier_id: 4,
        price: 8.99,
        cost_price: 4.00,
        reorder_level: 25,
        unit: 'pcs',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        sku: 'IND-GLV-001',
        name: 'Safety Gloves',
        description: 'Industrial safety gloves, cut resistant',
        category_id: 5,
        supplier_id: 5,
        price: 15.99,
        cost_price: 7.00,
        reorder_level: 40,
        unit: 'pair',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('products', null, {});
  }
};