/**
 * Seed the dev database with a JD-style product catalog.
 * Adds new categories, ~40 products (idempotent by SKU) and inventory rows.
 *
 * Run: cd backend && node scripts/seed-store-products.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { sequelize, Category, Product, Inventory, Warehouse } = require('../models');

const CATEGORIES = [
  { name: 'Home & Kitchen', icon: 'home' },
  { name: 'Sports & Outdoors', icon: 'sports' },
  { name: 'Beauty & Personal Care', icon: 'beauty' },
  { name: 'Toys & Books', icon: 'toys' },
  { name: 'Grocery & Food', icon: 'grocery' },
];

const img = (sku) => `https://picsum.photos/seed/${sku.toLowerCase()}/400/400`;

const PRODUCTS = [
  // Electronics
  { sku: 'ELC-010', name: '27" 4K UHD Monitor', cat: 'Electronics', price: 329.99, cost: 220, desc: '27-inch IPS panel with 4K resolution, 99% sRGB and adjustable stand. Perfect for work and entertainment.' },
  { sku: 'ELC-011', name: 'Mechanical Keyboard RGB', cat: 'Electronics', price: 89.99, cost: 52, desc: 'Hot-swappable mechanical keyboard with RGB backlight, PBT keycaps and 104 keys.' },
  { sku: 'ELC-012', name: 'Wireless Earbuds Pro', cat: 'Electronics', price: 59.99, cost: 31, desc: 'Active noise cancelling earbuds with 30h battery life and wireless charging case.' },
  { sku: 'ELC-013', name: 'Smart Watch Series 6', cat: 'Electronics', price: 199.99, cost: 118, desc: 'AMOLED display, heart-rate and SpO2 monitoring, GPS and 7-day battery life.' },
  { sku: 'ELC-014', name: 'Portable Bluetooth Speaker', cat: 'Electronics', price: 49.99, cost: 26, desc: 'Waterproof outdoor speaker with 360° sound and 20h playtime.' },
  { sku: 'ELC-015', name: 'Power Bank 20000mAh', cat: 'Electronics', price: 39.99, cost: 19, desc: 'Fast charging 22.5W power bank with dual USB and USB-C output.' },
  { sku: 'ELC-016', name: '1080p HD Webcam', cat: 'Electronics', price: 45.99, cost: 24, desc: 'Full HD webcam with noise-reducing mic and auto light correction for calls.' },
  { sku: 'ELC-017', name: 'Gaming Headset 7.1', cat: 'Electronics', price: 69.99, cost: 37, desc: 'Surround sound gaming headset with plush ear cushions and flip mute mic.' },
  // Clothing
  { sku: 'CLT-010', name: 'Classic Denim Jacket', cat: 'Clothing', price: 59.99, cost: 33, desc: 'Timeless denim jacket with brushed cotton lining and two chest pockets.' },
  { sku: 'CLT-011', name: 'Running Sneakers Air', cat: 'Clothing', price: 79.99, cost: 44, desc: 'Lightweight breathable running shoes with responsive foam cushioning.' },
  { sku: 'CLT-012', name: 'Winter Parka Coat', cat: 'Clothing', price: 149.99, cost: 88, desc: 'Water-repellent down parka with hood, warm enough for -20°C weather.' },
  { sku: 'CLT-013', name: 'Merino Wool Scarf', cat: 'Clothing', price: 24.99, cost: 12, desc: 'Soft merino wool scarf, 180cm long, in a classic neutral tone.' },
  { sku: 'CLT-014', name: 'Genuine Leather Belt', cat: 'Clothing', price: 29.99, cost: 15, desc: 'Full-grain leather belt with polished buckle, sizes 30-40.' },
  { sku: 'CLT-015', name: 'Pima Cotton Polo Shirt', cat: 'Clothing', price: 34.99, cost: 18, desc: 'Breathable pima cotton polo with ribbed collar, regular fit.' },
  { sku: 'CLT-016', name: 'Fleece Hoodie Oversize', cat: 'Clothing', price: 39.99, cost: 20, desc: 'Cozy brushed-fleece hoodie with kangaroo pocket and drawstring hood.' },
  // Office Supplies
  { sku: 'OFF-010', name: 'Gel Pens 10-Pack', cat: 'Office Supplies', price: 9.99, cost: 4, desc: 'Smooth 0.5mm gel ink pens in 10 assorted colors.' },
  { sku: 'OFF-011', name: 'A5 Hardcover Notebook', cat: 'Office Supplies', price: 12.99, cost: 6, desc: '192-page dotted A5 notebook with lay-flat binding and elastic closure.' },
  { sku: 'OFF-012', name: 'Heavy Duty Stapler', cat: 'Office Supplies', price: 14.99, cost: 7, desc: 'Staples up to 40 sheets, with built-in staple remover.' },
  { sku: 'OFF-013', name: 'Desk Organizer Tray', cat: 'Office Supplies', price: 18.99, cost: 9, desc: 'Bamboo desk organizer with 3 compartments for documents and stationery.' },
  { sku: 'OFF-014', name: 'Whiteboard Markers 12pc', cat: 'Office Supplies', price: 11.99, cost: 5, desc: 'Low-odor dry erase markers, assorted colors, chisel tip.' },
  { sku: 'OFF-015', name: 'USB Flash Drive 64GB', cat: 'Office Supplies', price: 15.99, cost: 8, desc: 'USB 3.0 flash drive with metal casing and key ring.' },
  { sku: 'OFF-016', name: 'Document Folder 12-Pack', cat: 'Office Supplies', price: 13.99, cost: 6, desc: 'Durable polypropylene folders with prong fasteners, assorted colors.' },
  // Industrial
  { sku: 'IND-010', name: 'Safety Work Gloves 6pr', cat: 'Industrial', price: 19.99, cost: 10, desc: 'Cut-resistant work gloves with grip coating for warehouse handling.' },
  { sku: 'IND-011', name: 'Home Tool Kit 120pcs', cat: 'Industrial', price: 89.99, cost: 55, desc: 'Complete tool kit with sockets, wrenches, screwdrivers and a hard case.' },
  { sku: 'IND-012', name: 'LED Workbench Lamp', cat: 'Industrial', price: 34.99, cost: 18, desc: 'Adjustable LED work lamp with magnetic base and 3 brightness modes.' },
  { sku: 'IND-013', name: 'Measuring Tape 5m', cat: 'Industrial', price: 8.99, cost: 3, desc: 'Dual-scale tape measure with lock and belt clip.' },
  { sku: 'IND-014', name: 'Drill Bits Set 13pc', cat: 'Industrial', price: 22.99, cost: 12, desc: 'HSS twist drill bits from 1mm to 10mm in a storage case.' },
  { sku: 'IND-015', name: 'Safety Goggles', cat: 'Industrial', price: 12.99, cost: 6, desc: 'Anti-fog impact-resistant goggles with adjustable strap.' },
  { sku: 'IND-016', name: 'Utility Knife Retractable', cat: 'Industrial', price: 7.99, cost: 3, desc: 'Retractable blade utility knife with ergonomic grip and spare blades.' },
  // Home & Kitchen
  { sku: 'HOM-001', name: 'Stainless Cookware Set 7pc', cat: 'Home & Kitchen', price: 129.99, cost: 74, desc: 'Non-stick stainless steel pots and pans set with glass lids.' },
  { sku: 'HOM-002', name: 'Electric Kettle 1.7L', cat: 'Home & Kitchen', price: 29.99, cost: 15, desc: 'Cordless electric kettle with rapid boil and auto shut-off.' },
  { sku: 'HOM-003', name: 'Air Fryer 5L', cat: 'Home & Kitchen', price: 89.99, cost: 50, desc: '5L digital air fryer with 8 presets and 360° hot air circulation.' },
  { sku: 'HOM-004', name: 'Bedding Set 4-Piece', cat: 'Home & Kitchen', price: 49.99, cost: 27, desc: 'Soft microfiber queen bedding set with duvet cover, sheets and pillowcases.' },
  { sku: 'HOM-005', name: 'Bath Towel Set 4pc', cat: 'Home & Kitchen', price: 25.99, cost: 13, desc: '100% combed cotton towels, quick-dry and absorbent.' },
  { sku: 'HOM-006', name: 'Ceramic Dinnerware 16pc', cat: 'Home & Kitchen', price: 64.99, cost: 35, desc: '16-piece white ceramic dinnerware set for 4 people.' },
  { sku: 'HOM-007', name: 'Robot Vacuum Cleaner', cat: 'Home & Kitchen', price: 249.99, cost: 150, desc: 'Smart robot vacuum with laser mapping, app control and self-charging.' },
  // Sports & Outdoors
  { sku: 'SPT-001', name: 'Yoga Mat 6mm', cat: 'Sports & Outdoors', price: 19.99, cost: 10, desc: 'Non-slip TPE yoga mat with carry strap, 183x61cm.' },
  { sku: 'SPT-002', name: 'Adjustable Dumbbell Set 20kg', cat: 'Sports & Outdoors', price: 139.99, cost: 82, desc: 'Two adjustable dumbbells from 2.5kg to 20kg with storage trays.' },
  { sku: 'SPT-003', name: 'Camping Tent 2-Person', cat: 'Sports & Outdoors', price: 79.99, cost: 45, desc: 'Waterproof 2-person dome tent with vestibule, sets up in minutes.' },
  { sku: 'SPT-004', name: 'Insulated Water Bottle 750ml', cat: 'Sports & Outdoors', price: 21.99, cost: 11, desc: 'Stainless steel vacuum bottle keeps drinks cold 24h / hot 12h.' },
  { sku: 'SPT-005', name: 'Resistance Bands Set', cat: 'Sports & Outdoors', price: 16.99, cost: 8, desc: '5-level resistance bands with handles, door anchor and carry bag.' },
  { sku: 'SPT-006', name: 'Hiking Backpack 40L', cat: 'Sports & Outdoors', price: 54.99, cost: 30, desc: 'Water-resistant 40L hiking pack with hip belt and rain cover.' },
  // Beauty & Personal Care
  { sku: 'BTY-001', name: 'Electric Toothbrush', cat: 'Beauty & Personal Care', price: 39.99, cost: 20, desc: 'Sonic toothbrush with 4 modes, pressure sensor and 2-week battery.' },
  { sku: 'BTY-002', name: 'Ionic Hair Dryer 1800W', cat: 'Beauty & Personal Care', price: 34.99, cost: 17, desc: 'Negative-ion hair dryer with 3 heat/speed settings and cool shot.' },
  { sku: 'BTY-003', name: 'Skincare Set Gift Box', cat: 'Beauty & Personal Care', price: 59.99, cost: 33, desc: 'Cleanser, toner, serum and moisturizer set for daily care.' },
  { sku: 'BTY-004', name: 'Grooming Kit 12pc', cat: 'Beauty & Personal Care', price: 27.99, cost: 14, desc: 'Manicure and grooming kit in a leather-look travel case.' },
  { sku: 'BTY-005', name: 'Nail Polish Set 8 Colors', cat: 'Beauty & Personal Care', price: 18.99, cost: 9, desc: '8 trendy gel-like nail polish shades, chip-resistant formula.' },
  { sku: 'BTY-006', name: 'Gentle Facial Cleanser 200ml', cat: 'Beauty & Personal Care', price: 13.99, cost: 6, desc: 'pH-balanced foaming cleanser for all skin types.' },
  // Toys & Books
  { sku: 'TOY-001', name: 'Building Blocks Set 500pcs', cat: 'Toys & Books', price: 29.99, cost: 15, desc: '500-piece creative building blocks with storage box, ages 6+.' },
  { sku: 'TOY-002', name: 'RC Sports Car 1:14', cat: 'Toys & Books', price: 49.99, cost: 27, desc: '2.4GHz remote control car, 15km/h, 40min playtime.' },
  { sku: 'TOY-003', name: 'Strategy Board Game', cat: 'Toys & Books', price: 35.99, cost: 18, desc: 'Award-winning strategy board game for 2-5 players, ages 10+.' },
  { sku: 'TOY-004', name: 'Children Story Books 12-Book Set', cat: 'Toys & Books', price: 24.99, cost: 12, desc: 'Classic illustrated storybook collection for ages 4-8.' },
  { sku: 'TOY-005', name: 'Plush Toy Set 3pc', cat: 'Toys & Books', price: 22.99, cost: 11, desc: 'Super-soft plush animal set, machine washable, 30cm each.' },
  { sku: 'TOY-006', name: 'Panorama Puzzle 1000pcs', cat: 'Toys & Books', price: 19.99, cost: 9, desc: '1,000-piece jigsaw puzzle with a scenic world landmark panorama.' },
  // Grocery & Food
  { sku: 'GRO-001', name: 'Instant Coffee 100g Jar', cat: 'Grocery & Food', price: 12.99, cost: 6, desc: 'Rich and smooth freeze-dried instant coffee, 100g jar.' },
  { sku: 'GRO-002', name: 'Premium Green Tea 200g', cat: 'Grocery & Food', price: 15.99, cost: 8, desc: 'Hand-picked jasmine green tea leaves in a resealable pouch.' },
  { sku: 'GRO-003', name: 'Mixed Nuts 500g', cat: 'Grocery & Food', price: 14.99, cost: 7, desc: 'Roasted mixed nuts with almonds, cashews, walnuts and raisins.' },
  { sku: 'GRO-004', name: 'Dark Chocolate 85% 200g', cat: 'Grocery & Food', price: 8.99, cost: 4, desc: 'Intense 85% cacao dark chocolate bar, single origin.' },
  { sku: 'GRO-005', name: 'Extra Virgin Olive Oil 1L', cat: 'Grocery & Food', price: 17.99, cost: 9, desc: 'Cold-pressed extra virgin olive oil in a dark glass bottle.' },
  { sku: 'GRO-006', name: 'Aromatic Rice 5kg', cat: 'Grocery & Food', price: 21.99, cost: 12, desc: 'Premium long-grain aromatic rice, 5kg vacuum-sealed bag.' },
];

async function main() {
  await sequelize.authenticate();
  console.log('DB connected. Seeding JD-style catalog...');

  // 1. Categories
  const catMap = {};
  const upsertCategory = async (name) => {
    const [cat] = await Category.findOrCreate({
      where: { name: name.toLowerCase() },
      defaults: { name: name.toLowerCase() },
    });
    if (cat.name !== name.toLowerCase()) {
      await cat.update({ name: name.toLowerCase() });
    }
    return cat;
  };
  for (const c of CATEGORIES) {
    const cat = await upsertCategory(c.name);
    catMap[c.name.toLowerCase()] = cat;
    console.log(`category ok: ${cat.name} (id=${cat.id})`);
  }
  const allCats = await Category.findAll();
  allCats.forEach((c) => { catMap[c.name.toLowerCase()] = c; });

  const warehouses = await Warehouse.findAll({ order: [['id', 'ASC']] });
  if (!warehouses.length) throw new Error('No warehouses found — seed warehouses first.');
  const w1 = warehouses[0];
  const w2 = warehouses[1] || w1;

  // 2. Products + inventory
  let created = 0, skipped = 0;
  for (const p of PRODUCTS) {
    const category = catMap[p.cat.toLowerCase()];
    if (!category) { console.warn(`skip: unknown category ${p.cat}`); skipped++; continue; }
    const [product, wasCreated] = await Product.findOrCreate({
      where: { sku: p.sku },
      defaults: {
        sku: p.sku,
        name: p.name,
        description: p.desc,
        category_id: category.id,
        price: p.price,
        cost_price: p.cost,
        reorder_level: 10,
        unit: 'pcs',
        status: 'active',
        image_url: img(p.sku),
      },
    });
    if (wasCreated) created++; else skipped++;

    // Inventory: main warehouse + a second warehouse for some products
    const qty = 40 + ((p.sku.charCodeAt(p.sku.length - 1) * 17) % 460); // 40-500 deterministic
    await Inventory.findOrCreate({
      where: { product_id: product.id, warehouse_id: w1.id },
      defaults: { product_id: product.id, warehouse_id: w1.id, quantity: qty, reserved_quantity: 0, reorder_level: 10 },
    });
    if ((p.sku.charCodeAt(p.sku.length - 1) % 3) === 0) {
      const qty2 = 20 + ((p.sku.charCodeAt(0) * 7) % 120);
      await Inventory.findOrCreate({
        where: { product_id: product.id, warehouse_id: w2.id },
        defaults: { product_id: product.id, warehouse_id: w2.id, quantity: qty2, reserved_quantity: 0, reorder_level: 10 },
      });
    }
  }

  // 3. Ensure the original 4 products also have inventory
  const all = await Product.findAll();
  for (const product of all) {
    const inv = await Inventory.findOne({ where: { product_id: product.id, warehouse_id: w1.id } });
    if (!inv) {
      await Inventory.create({ product_id: product.id, warehouse_id: w1.id, quantity: 100, reserved_quantity: 0, reorder_level: 10 });
    }
  }

  const totals = {
    products: await Product.count(),
    categories: await Category.count(),
    inventory: await Inventory.count(),
  };
  console.log(`DONE: ${created} created, ${skipped} already existed. Totals ->`, totals);
  await sequelize.close();
}

main().catch((e) => { console.error('SEED FAILED:', e); process.exit(1); });
