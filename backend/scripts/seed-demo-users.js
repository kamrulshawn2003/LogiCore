/**
 * Seed the 5 demo accounts (all with password: Password123!) plus a default
 * warehouse and a driver profile. Idempotent — safe to run multiple times.
 *
 * Run: cd backend && npm run seed:demo
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { sequelize, User, Warehouse, Driver } = require('../models');

const DEMO_PASSWORD = 'Password123!';

const DEMO_USERS = [
  { name: 'System Admin', email: 'admin@logicore.com', role: 'admin' },
  { name: 'John Manager', email: 'manager@logicore.com', role: 'warehouse_manager' },
  { name: 'Supplier User', email: 'supplier@logicore.com', role: 'supplier' },
  { name: 'Mike Driver', email: 'driver@logicore.com', role: 'driver' },
  { name: 'Alice Customer', email: 'customer@logicore.com', role: 'customer' },
];

(async () => {
  // Default warehouse (referenced by manager/driver users and shipments)
  let warehouse = await Warehouse.findOne({ where: { code: 'WH-MAIN' } });
  if (!warehouse) {
    warehouse = await Warehouse.create({
      name: 'Main Warehouse',
      code: 'WH-MAIN',
      address: '1 Logistics Way, Commerce City',
      status: 'active',
      capacity: 100000,
    });
    console.log('Created warehouse:', warehouse.code);
  } else {
    console.log('Warehouse exists:', warehouse.code);
  }

  // Demo users (password is hashed by the User model hook on create)
  for (const demo of DEMO_USERS) {
    const [user, created] = await User.findOrCreate({
      where: { email: demo.email },
      defaults: {
        name: demo.name,
        role: demo.role,
        password: DEMO_PASSWORD,
        status: 'active',
        phone: '+10000000000',
        warehouse_id: demo.role === 'warehouse_manager' ? warehouse.id : null,
      },
    });
    console.log(created ? 'Created user:' : 'User exists:', `${demo.email} (${demo.role})`);
  }

  // Driver profile for the demo driver (needed to assign shipments)
  const driverUser = await User.findOne({ where: { email: 'driver@logicore.com' } });
  if (driverUser) {
    const [driver, created] = await Driver.findOrCreate({
      where: { user_id: driverUser.id },
      defaults: {
        license_number: 'LIC-DEMO-001',
        vehicle_number: 'TRK-DEMO-01',
        vehicle_type: 'Van',
        status: 'AVAILABLE',
      },
    });
    console.log(created ? 'Created driver profile:' : 'Driver profile exists:', driver.license_number);
  }

  await sequelize.close();
  console.log('Demo seeding finished. All passwords: Password123!');
  process.exit(0);
})().catch((e) => {
  console.error('SEED ERROR:', e.message);
  process.exit(1);
});
