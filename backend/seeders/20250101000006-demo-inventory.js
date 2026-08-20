'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('inventory', [
      {
        product_id: 1, // Wireless Mouse
        warehouse_id: 1, // Main Distribution Center
        quantity: 150,
        reserved_quantity: 20,
        reorder_level: 20,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        product_id: 2, // USB-C Cable
        warehouse_id: 1,
        quantity: 45,
        reserved_quantity: 5,
        reorder_level: 50,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        product_id: 3, // Cotton T-Shirt
        warehouse_id: 1,
        quantity: 300,
        reserved_quantity: 30,
        reorder_level: 30,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        product_id: 4, // Printer Paper
        warehouse_id: 2, // East Coast Warehouse
        quantity: 500,
        reserved_quantity: 100,
        reorder_level: 100,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        product_id: 5, // Stapler
        warehouse_id: 2,
        quantity: 80,
        reserved_quantity: 10,
        reorder_level: 25,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        product_id: 6, // Safety Gloves
        warehouse_id: 3, // West Coast Warehouse
        quantity: 25,
        reserved_quantity: 0,
        reorder_level: 40,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        product_id: 1, // Wireless Mouse
        warehouse_id: 2,
        quantity: 75,
        reserved_quantity: 10,
        reorder_level: 20,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        product_id: 2, // USB-C Cable
        warehouse_id: 3,
        quantity: 60,
        reserved_quantity: 0,
        reorder_level: 50,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('inventory', null, {});
  }
};