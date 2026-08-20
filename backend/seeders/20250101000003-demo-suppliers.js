'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('suppliers', [
      {
        name: 'TechSupply Inc',
        email: 'contact@techsupply.com',
        phone: '+1234567001',
        address: '123 Tech Street, Silicon Valley, CA',
        rating: 4.5,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Global Traders Ltd',
        email: 'info@globaltraders.com',
        phone: '+1234567002',
        address: '456 Commerce Ave, New York, NY',
        rating: 4.2,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Fashion Forward Co',
        email: 'sales@fashionforward.com',
        phone: '+1234567003',
        address: '789 Style Blvd, Los Angeles, CA',
        rating: 4.0,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Office Essentials',
        email: 'orders@officeessentials.com',
        phone: '+1234567004',
        address: '321 Business Park, Chicago, IL',
        rating: 4.8,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Industrial Pro Supply',
        email: 'sales@industrialpro.com',
        phone: '+1234567005',
        address: '654 Factory Road, Detroit, MI',
        rating: 4.3,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('suppliers', null, {});
  }
};