const { sequelize } = require('./models');
const bcrypt = require('bcryptjs');

async function setupProduction() {
  try {
    console.log('Connecting to production database...');
    await sequelize.authenticate();
    console.log('Connected successfully.');

    // Create tables
    console.log('Creating tables...');
    await sequelize.sync({ force: false });
    console.log('Tables ready.');

    // Check if users exist
    const { User } = require('./models');
    const userCount = await User.count();
    
    if (userCount === 0) {
      console.log('Creating demo users...');
      const password = await bcrypt.hash('Password123!', 10);
      
      await User.bulkCreate([
        { name: 'System Admin', email: 'admin@logicore.com', password, role: 'admin', status: 'active' },
        { name: 'John Manager', email: 'manager@logicore.com', password, role: 'warehouse_manager', status: 'active' },
        { name: 'Supplier User', email: 'supplier@logicore.com', password, role: 'supplier', status: 'active' },
        { name: 'Mike Driver', email: 'driver@logicore.com', password, role: 'driver', status: 'active' },
        { name: 'Alice Customer', email: 'customer@logicore.com', password, role: 'customer', status: 'active' }
      ]);
      console.log('Demo users created.');
    }

    console.log('Setup completed successfully!');
  } catch (error) {
    console.error('Setup failed:', error);
  } finally {
    await sequelize.close();
  }
}

setupProduction();