/**
 * Create/update all tables from the Sequelize models.
 * Idempotent — safe to run multiple times.
 *
 * Run: cd backend && npm run db:sync
 * (For production, run it inside Render Shell so the env vars are applied.)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { sequelize } = require('../models');

(async () => {
  await sequelize.sync();
  console.log('All tables synced successfully.');
  await sequelize.close();
  process.exit(0);
})().catch((e) => {
  console.error('SYNC ERROR:', e.message);
  process.exit(1);
});
