const { sequelize } = require('./models');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Sync all models (create tables)
    console.log('Creating tables...');
    await sequelize.sync({ force: true });
    console.log('Tables created successfully.');

    // Create demo data
    console.log('Creating demo data...');
    
    const { User, Category, Supplier, Warehouse, Product, Inventory, Driver, PurchaseOrder, Order, Shipment } = require('./models');
    
    // Create users
    const password = await bcrypt.hash('Password123!', 10);
    
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@logicore.com',
      password,
      phone: '+1234567890',
      role: 'admin',
      status: 'active'
    });
    console.log('Admin created');

    const manager = await User.create({
      name: 'John Manager',
      email: 'manager@logicore.com',
      password,
      phone: '+1234567891',
      role: 'warehouse_manager',
      status: 'active'
    });
    console.log('Manager created');

    const supplierUser = await User.create({
      name: 'Supplier User',
      email: 'supplier@logicore.com',
      password,
      phone: '+1234567892',
      role: 'supplier',
      status: 'active'
    });
    console.log('Supplier user created');

    const driverUser = await User.create({
      name: 'Mike Driver',
      email: 'driver@logicore.com',
      password,
      phone: '+1234567893',
      role: 'driver',
      status: 'active'
    });
    console.log('Driver user created');

    const customer = await User.create({
      name: 'Alice Customer',
      email: 'customer@logicore.com',
      password,
      phone: '+1234567894',
      role: 'customer',
      status: 'active'
    });
    console.log('Customer created');

    // Create categories
    const categories = await Category.bulkCreate([
      { name: 'Electronics', description: 'Electronic devices and accessories' },
      { name: 'Clothing', description: 'Apparel and fashion items' },
      { name: 'Office Supplies', description: 'Office and stationery supplies' },
      { name: 'Industrial', description: 'Industrial equipment and machinery' }
    ]);
    console.log('Categories created');

    // Create suppliers
    const suppliers = await Supplier.bulkCreate([
      {
        name: 'TechSupply Inc',
        email: 'contact@techsupply.com',
        phone: '+1234567001',
        address: '123 Tech Street, Silicon Valley, CA',
        rating: 4.5,
        user_id: supplierUser.id
      },
      {
        name: 'Global Traders Ltd',
        email: 'info@globaltraders.com',
        phone: '+1234567002',
        address: '456 Commerce Ave, New York, NY',
        rating: 4.2
      }
    ]);
    console.log('Suppliers created');

    // Create warehouses
    const warehouses = await Warehouse.bulkCreate([
      {
        name: 'Main Distribution Center',
        code: 'WH-MAIN',
        address: '100 Logistics Parkway, Dallas, TX',
        manager_id: manager.id,
        capacity: 10000
      },
      {
        name: 'East Coast Warehouse',
        code: 'WH-EAST',
        address: '200 Harbor Blvd, Newark, NJ',
        capacity: 7500
      }
    ]);
    console.log('Warehouses created');

    // Update manager with warehouse
    await manager.update({ warehouse_id: warehouses[0].id });

    // Create products
    const products = await Product.bulkCreate([
      {
        sku: 'ELC-001',
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse',
        category_id: categories[0].id,
        supplier_id: suppliers[0].id,
        price: 29.99,
        cost_price: 15.00,
        reorder_level: 20,
        unit: 'pcs'
      },
      {
        sku: 'ELC-002',
        name: 'USB-C Cable',
        description: 'Fast charging USB-C cable',
        category_id: categories[0].id,
        supplier_id: suppliers[0].id,
        price: 12.99,
        cost_price: 5.00,
        reorder_level: 50,
        unit: 'pcs'
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
        unit: 'pcs'
      },
      {
        sku: 'OFF-001',
        name: 'Printer Paper',
        description: 'A4 printer paper',
        category_id: categories[2].id,
        supplier_id: suppliers[1].id,
        price: 6.99,
        cost_price: 3.00,
        reorder_level: 100,
        unit: 'pack'
      }
    ]);
    console.log('Products created');

    // Create inventory
    await Inventory.bulkCreate([
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
      }
    ]);
    console.log('Inventory created');

    // Create driver
    await Driver.create({
      user_id: driverUser.id,
      license_number: 'DL-123456',
      vehicle_number: 'TRK-001',
      vehicle_type: 'Box Truck',
      status: 'AVAILABLE',
      rating: 4.8,
      total_deliveries: 150,
      completed_deliveries: 145
    });
    console.log('Driver created');

    console.log('Setup completed successfully!');
    console.log('\nDemo Accounts:');
    console.log('Admin: admin@logicore.com / Password123!');
    console.log('Manager: manager@logicore.com / Password123!');
    console.log('Supplier: supplier@logicore.com / Password123!');
    console.log('Driver: driver@logicore.com / Password123!');
    console.log('Customer: customer@logicore.com / Password123!');
    
  } catch (error) {
    console.error('Setup failed:', error);
  } finally {
    await sequelize.close();
  }
}

setupDatabase();