/**
 * One-off direct-SQL product seeder for Aiven free tier.
 * Uses a single raw mysql2 connection (no Sequelize pool) because the pool
 * connections keep getting dropped mid-transaction on Aiven free plans.
 * Reads the same PRODUCTS/CATEGORIES data as scripts/seed-store-products.js.
 * Idempotent by SKU.
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const src = fs.readFileSync(path.join(__dirname, 'seed-store-products.js'), 'utf8');

function extractBlock(name) {
  const start = src.indexOf(`const ${name} = [`);
  const end = src.indexOf('];', start);
  const body = src.slice(start + `const ${name} = [`.length, end);
  // eslint-disable-next-line no-eval
  return eval(`[${body}]`);
}

const CATEGORIES = extractBlock('CATEGORIES');
const PRODUCTS = extractBlock('PRODUCTS');

const CFG = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 28365,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
  connectTimeout: 20000,
};

(async () => {
  if (!CFG.host || !CFG.user || !CFG.password) {
    console.error('Set DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD env vars first.');
    process.exit(1);
  }
  const c = await mysql.createConnection(CFG);
  console.log('connected to', CFG.database);

  // 1. Categories
  for (const cat of CATEGORIES) {
    await c.query('INSERT IGNORE INTO categories (name, created_at, updated_at) VALUES (?, NOW(), NOW())', [cat.name.toLowerCase()]);
  }
  const [cats] = await c.query('SELECT id, name FROM categories');
  const catId = (name) => (cats.find((x) => x.name === name.toLowerCase()) || {}).id;

  // 2. Warehouse (prefer WH-MAIN, else first)
  const [[wh]] = await c.query("SELECT id FROM warehouses WHERE code = 'WH-MAIN' ORDER BY id LIMIT 1");
  const warehouseId = wh ? wh.id : (await c.query('SELECT id FROM warehouses ORDER BY id LIMIT 1'))[0][0].id;

  // 3. Products + inventory (idempotent by SKU)
  let created = 0, skipped = 0, unknown = 0;
  for (const p of PRODUCTS) {
    const cid = catId(p.cat);
    if (!cid) { unknown++; continue; }
    const [rows] = await c.query('SELECT id FROM products WHERE sku = ?', [p.sku]);
    let pid;
    if (rows.length) {
      pid = rows[0].id;
      skipped++;
    } else {
      const r = await c.query(
        'INSERT INTO products (sku, name, description, category_id, price, cost_price, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,NOW(),NOW())',
        [p.sku, p.name, p.desc, cid, p.price, p.cost, 'active']
      );
      pid = r[0].insertId;
      created++;
    }
    await c.query(
      'INSERT IGNORE INTO inventory (product_id, warehouse_id, quantity, reserved_quantity, reorder_level, created_at, updated_at) VALUES (?,?,?,0,10,NOW(),NOW())',
      [pid, warehouseId, 50]
    );
  }

  const [[cnt]] = await c.query('SELECT (SELECT COUNT(*) FROM products) p, (SELECT COUNT(*) FROM inventory) i');
  console.log(`DONE: created=${created} skipped=${skipped} unknown_cat=${unknown}`);
  console.log(`DB totals -> products: ${cnt.p}, inventory: ${cnt.i}`);
  await c.end();
  process.exit(0);
})().catch((e) => { console.error('SEED ERROR:', e.message); process.exit(1); });
