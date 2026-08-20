'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('drivers', [
      {
        user_id: 4, // Mike Driver
        license_number: 'DL-123456',
        vehicle_number: 'TRK-001',
        vehicle_type: 'Box Truck',
        status: 'AVAILABLE',
        rating: 4.8,
        total_deliveries: 150,
        completed_deliveries: 145,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: 5, // We'll create another driver user
        license_number: 'DL-789012',
        vehicle_number: 'VAN-002',
        vehicle_type: 'Cargo Van',
        status: 'AVAILABLE',
        rating: 4.5,
        total_deliveries: 100,
        completed_deliveries: 95,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('drivers', null, {});
  }
};