const { sequelize } = require('./models');
const bcrypt = require('bcryptjs');

async function setupFullDatabase() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Sync all models (create tables)
    console.log('Creating all tables...');
    await sequelize.sync({ force: true });
    console.log('All tables created successfully.');

    // Create demo data
    console.log('Creating demo data...');
    
    const models = require('./models');
    
    // Create users
    const password = await bcrypt.hash('Password123!', 10);
    
    const users = await models.User.bulkCreate([
      {
        name: 'System Admin',
        email: 'admin@logicore.com',
        password,
        phone: '+1234567890',
        role: 'admin',
        status: 'active'
      },
      {
        name: 'John Manager',
        email: 'manager@logicore.com',
        password,
        phone: '+1234567891',
        role: 'warehouse_manager',
        status: 'active'
      },
      {
        name: 'Supplier User',
        email: 'supplier@logicore.com',
        password,
        phone: '+1234567892',
        role: 'supplier',
        status: 'active'
      },
      {
        name: 'Mike Driver',
        email: 'driver@logicore.com',
        password,
        phone: '+1234567893',
        role: 'driver',
        status: 'active'
      },
      {
        name: 'Alice Customer',
        email: 'customer@logicore.com',
        password,
        phone: '+1234567894',
        role: 'customer',
        status: 'active'
      }
    ]);
    
    console.log('Users created:', users.length);
    
    // Create categories
    const categories = await models.Category.bulkCreate([
      { name: 'Electronics', description: 'Electronic devices and accessories' },
      { name: 'Clothing', description: 'Apparel and fashion items' },
      { name: 'Office Supplies', description: 'Office and stationery supplies' },
      { name: 'Industrial', description: 'Industrial equipment and machinery' }
    ]);
    console.log('Categories created:', categories.length);
    
    // Create suppliers
    const suppliers = await models.Supplier.bulkCreate([
      {
        name: 'TechSupply Inc',
        email: 'contact@techsupply.com',
        phone: '+1234567001',
        address: '123 Tech Street, Silicon Valley, CA',
        rating: 4.5,
        user_id: users[2].id
      },
      {
        name: 'Global Traders Ltd',
        email: 'info@globaltraders.com',
        phone: '+1234567002',
        address: '456 Commerce Ave, New York, NY',
        rating: 4.2
      }
    ]);
    console.log('Suppliers created:', suppliers.length);
    
    // Create warehouses
    const warehouses = await models.Warehouse.bulkCreate([
      {
        name: 'Main Distribution Center',
        code: 'WH-MAIN',
        address: '100 Logistics Parkway, Dallas, TX',
        manager_id: users[1].id,
        capacity: 10000
      },
      {
        name: 'East Coast Warehouse',
        code: 'WH-EAST',
        address: '200 Harbor Blvd, Newark, NJ',
        capacity: 7500
      }
    ]);
    console.log('Warehouses created:', warehouses.length);
    
    // Update manager with warehouse
    await users[1].update({ warehouse_id: warehouses[0].id });
    
    // Create products
    const products = await models.Product.bulkCreate([
      {
        sku: 'ELC-001',
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with long battery life',
        category_id: categories[0].id,
        supplier_id: suppliers[0].id,
        price: 29.99,
        cost_price: 15.00,
        reorder_level: 20,
        unit: 'pcs',
        status: 'active'
      },
      {
        sku: 'ELC-002',
        name: 'USB-C Cable',
        description: 'Fast charging USB-C cable, 2m length',
        category_id: categories[0].id,
        supplier_id: suppliers[0].id,
        price: 12.99,
        cost_price: 5.00,
        reorder_level: 50,
        unit: 'pcs',
        status: 'active'
      },
      {
        sku: 'CLT-001',
        name: 'Cotton T-Shirt',
        description: 'Premium cotton t-shirt',
        category_id: categories[1].id,
        supplier_id: suppliers[1].id,
        price: 19.99,
        cost_price: 8.00,
        reorder_level: 30,
        unit: 'pcs',
        status: 'active'
      },
      {
        sku: 'OFF-001',
        name: 'Printer Paper',
        description: 'A4 printer paper, 500 sheets',
        category_id: categories[2].id,
        supplier_id: suppliers[1].id,
        price: 6.99,
        cost_price: 3.00,
        reorder_level: 100,
        unit: 'pack',
        status: 'active'
      },
      {
        sku: 'IND-001',
        name: 'Safety Gloves',
        description: 'Industrial safety gloves',
        category_id: categories[3].id,
        supplier_id: suppliers[1].id,
        price: 15.99,
        cost_price: 7.00,
        reorder_level: 40,
        unit: 'pair',
        status: 'active'
      }
    ]);
    console.log('Products created:', products.length);
    
    // Create inventory
    const inventory = await models.Inventory.bulkCreate([
      {
        product_id: products[0].id,
        warehouse_id: warehouses[0].id,
        quantity: 150,
        reserved_quantity: 20,
        reorder_level: 20
      },
      {
        product_id: products[1].id,
        warehouse_id: warehouses[0].id,
        quantity: 45,
        reserved_quantity: 5,
        reorder_level: 50
      },
      {
        product_id: products[2].id,
        warehouse_id: warehouses[0].id,
        quantity: 300,
        reserved_quantity: 30,
        reorder_level: 30
      },
      {
        product_id: products[3].id,
        warehouse_id: warehouses[1].id,
        quantity: 500,
        reserved_quantity: 100,
        reorder_level: 100
      },
      {
        product_id: products[4].id,
        warehouse_id: warehouses[0].id,
        quantity: 25,
        reserved_quantity: 0,
        reorder_level: 40
      },
      {
        product_id: products[0].id,
        warehouse_id: warehouses[1].id,
        quantity: 75,
        reserved_quantity: 10,
        reorder_level: 20
      }
    ]);
    console.log('Inventory created:', inventory.length);
    
    // Create driver
    await models.Driver.create({
      user_id: users[3].id,
      license_number: 'DL-123456',
      vehicle_number: 'TRK-001',
      vehicle_type: 'Box Truck',
      status: 'AVAILABLE',
      rating: 4.8,
      total_deliveries: 150,
      completed_deliveries: 145
    });
    console.log('Driver created');
    
    console.log('\n✅ Setup completed successfully!');
    console.log('\n📋 Demo Accounts:');
    console.log('   Admin:    admin@logicore.com / Password123!');
    console.log('   Manager:  manager@logicore.com / Password123!');
    console.log('   Supplier: supplier@logicore.com / Password123!');
    console.log('   Driver:   driver@logicore.com / Password123!');
    console.log('   Customer: customer@logicore.com / Password123!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure MySQL is running');
    console.log('2. Check .env file has correct credentials');
    console.log('3. If using MySQL, create database first:');
    console.log('   mysql -u root -p');
    console.log('   CREATE DATABASE logicore;');
  } finally {
    await sequelize.close();
  }
}

setupFullDatabase();