const request = require('supertest');
const app = require('../app');
const { 
  sequelize, 
  User, 
  Product, 
  Warehouse, 
  Inventory, 
  Category, 
  Supplier 
} = require('../models');
const { generateToken } = require('../utils/generateToken');

let adminToken;
let adminUser;
let productId;
let warehouse1Id;
let warehouse2Id;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  
  // Create admin user
  adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'Password123!',
    role: 'admin',
    status: 'active'
  });
  
  adminToken = generateToken(adminUser);
  
  // Create category
  const category = await Category.create({
    name: 'Test Category'
  });
  
  // Create supplier
  const supplier = await Supplier.create({
    name: 'Test Supplier',
    email: 'supplier@test.com'
  });
  
  // Create product
  const product = await Product.create({
    sku: 'TEST-001',
    name: 'Test Product',
    price: 100,
    cost_price: 50,
    reorder_level: 10,
    category_id: category.id,
    supplier_id: supplier.id
  });
  productId = product.id;
  
  // Create warehouses
  const wh1 = await Warehouse.create({
    name: 'Warehouse 1',
    code: 'WH1'
  });
  warehouse1Id = wh1.id;
  
  const wh2 = await Warehouse.create({
    name: 'Warehouse 2',
    code: 'WH2'
  });
  warehouse2Id = wh2.id;
  
  // Create initial inventory
  await Inventory.create({
    product_id: productId,
    warehouse_id: warehouse1Id,
    quantity: 100,
    reserved_quantity: 0,
    reorder_level: 10
  });
  
  await Inventory.create({
    product_id: productId,
    warehouse_id: warehouse2Id,
    quantity: 50,
    reserved_quantity: 0,
    reorder_level: 10
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Inventory Endpoints', () => {
  describe('GET /api/v1/inventory', () => {
    it('should get all inventory', async () => {
      const res = await request(app)
        .get('/api/v1/inventory')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });
    
    it('should filter by warehouse', async () => {
      const res = await request(app)
        .get(`/api/v1/inventory?warehouse_id=${warehouse1Id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/v1/inventory/adjust', () => {
    it('should adjust inventory quantity', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          product_id: productId,
          warehouse_id: warehouse1Id,
          quantity: 50,
          reason: 'Test adjustment'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.inventory.quantity).toBe(150);
    });
    
    it('should handle negative adjustments', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          product_id: productId,
          warehouse_id: warehouse1Id,
          quantity: -30,
          reason: 'Test negative adjustment'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.inventory.quantity).toBe(120);
    });
    
    it('should validate quantity', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          product_id: productId,
          warehouse_id: warehouse1Id,
          quantity: 'invalid'
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/inventory/transfer', () => {
    it('should transfer inventory between warehouses', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/transfer')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          product_id: productId,
          from_warehouse_id: warehouse1Id,
          to_warehouse_id: warehouse2Id,
          quantity: 20,
          reason: 'Test transfer'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.transferred_quantity).toBe(20);
      
      // Verify source inventory decreased
      expect(res.body.data.source_inventory.quantity).toBe(100);
      
      // Verify destination inventory increased
      expect(res.body.data.destination_inventory.quantity).toBe(70);
    });
    
    it('should prevent transfer with insufficient stock', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/transfer')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          product_id: productId,
          from_warehouse_id: warehouse1Id,
          to_warehouse_id: warehouse2Id,
          quantity: 1000
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
    
    it('should prevent transfer to same warehouse', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/transfer')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          product_id: productId,
          from_warehouse_id: warehouse1Id,
          to_warehouse_id: warehouse1Id,
          quantity: 10
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/inventory/receive', () => {
    it('should receive inventory', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/receive')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          product_id: productId,
          warehouse_id: warehouse1Id,
          quantity: 25,
          reason: 'Test receiving'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.inventory.quantity).toBe(125);
    });
  });

  describe('POST /api/v1/inventory/issue', () => {
    it('should issue inventory', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/issue')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          product_id: productId,
          warehouse_id: warehouse1Id,
          quantity: 15,
          reason: 'Test issuing'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.inventory.quantity).toBe(110);
    });
    
    it('should prevent issuing more than available', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/issue')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          product_id: productId,
          warehouse_id: warehouse1Id,
          quantity: 9999
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/inventory/reserve', () => {
    it('should reserve inventory', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/reserve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          product_id: productId,
          warehouse_id: warehouse1Id,
          quantity: 30,
          reference_type: 'ORDER',
          reference_id: 1
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.inventory.reserved_quantity).toBe(30);
    });
  });

  describe('POST /api/v1/inventory/release', () => {
    it('should release inventory', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/release')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          product_id: productId,
          warehouse_id: warehouse1Id,
          quantity: 10,
          reference_type: 'ORDER',
          reference_id: 1
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.inventory.reserved_quantity).toBe(20);
    });
  });

  describe('GET /api/v1/inventory/movements', () => {
    it('should get inventory movements', async () => {
      const res = await request(app)
        .get('/api/v1/inventory/movements')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/inventory/low-stock', () => {
    it('should get low stock items', async () => {
      const res = await request(app)
        .get('/api/v1/inventory/low-stock')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.inventory)).toBe(true);
    });
  });

  describe('GET /api/v1/inventory/statistics', () => {
    it('should get inventory statistics', async () => {
      const res = await request(app)
        .get('/api/v1/inventory/statistics')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.statistics).toHaveProperty('total_inventory');
      expect(res.body.data.statistics).toHaveProperty('available_inventory');
    });
  });
});