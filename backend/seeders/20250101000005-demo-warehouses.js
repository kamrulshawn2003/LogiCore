'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('warehouses', [
      {
        name: 'Main Distribution Center',
        code: 'WH-MAIN',
        address: '100 Logistics Parkway, Dallas, TX',
        manager_id: 2, // John Manager
        capacity: 10000.00,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'East Coast Warehouse',
        code: 'WH-EAST',
        address: '200 Harbor Blvd, Newark, NJ',
        capacity: 7500.00,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'West Coast Warehouse',
        code: 'WH-WEST',
        address: '300 Pacific Ave, Oakland, CA',
        capacity: 8000.00,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Central Hub',
        code: 'WH-CNTR',
        address: '400 Midwest Drive, Kansas City, MO',
        capacity: 5000.00,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('warehouses', null, {});
  }
};