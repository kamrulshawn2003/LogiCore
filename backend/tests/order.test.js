const request = require('supertest');
const app = require('../app');
const { 
  sequelize, 
  User, 
  Product, 
  Warehouse, 
  Inventory, 
  Category, 
  Supplier,
  Order 
} = require('../models');
const { generateToken } = require('../utils/generateToken');

let adminToken;
let adminUser;
let customerUser;
let customerToken;
let productId;
let warehouseId;
let orderId;

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
  
  // Create customer user
  customerUser = await User.create({
    name: 'Customer User',
    email: 'customer@test.com',
    password: 'Password123!',
    role: 'customer',
    status: 'active'
  });
  customerToken = generateToken(customerUser);
  
  // Create category
  const category = await Category.create({ name: 'Test Category' });
  
  // Create supplier
  const supplier = await Supplier.create({
    name: 'Test Supplier',
    email: 'supplier@test.com'
  });
  
  // Create warehouse
  const warehouse = await Warehouse.create({
    name: 'Test Warehouse',
    code: 'WH-TEST'
  });
  warehouseId = warehouse.id;
  
  // Create product
  const product = await Product.create({
    sku: 'TEST-PROD-001',
    name: 'Test Product',
    price: 100,
    cost_price: 50,
    reorder_level: 10,
    category_id: category.id,
    supplier_id: supplier.id
  });
  productId = product.id;
  
  // Create inventory
  await Inventory.create({
    product_id: productId,
    warehouse_id: warehouseId,
    quantity: 100,
    reserved_quantity: 0,
    reorder_level: 10
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Order Endpoints', () => {
  describe('POST /api/v1/orders', () => {
    it('should create a new order', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              product_id: productId,
              quantity: 5
            }
          ],
          shipping_address: '123 Test St, Test City, TS 12345'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order).toHaveProperty('id');
      expect(res.body.data.order.status).toBe('PENDING');
      expect(res.body.data.order.total_amount).toBe('500.00');
      
      orderId = res.body.data.order.id;
    });
    
    it('should reserve inventory on order creation', async () => {
      const inventory = await Inventory.findOne({
        where: { product_id: productId, warehouse_id: warehouseId }
      });
      
      expect(inventory.reserved_quantity).toBe(5);
      expect(inventory.quantity).toBe(100);
    });
    
    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: []
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
    
    it('should prevent ordering more than available', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              product_id: productId,
              quantity: 1000
            }
          ]
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/orders', () => {
    it('should get all orders for admin', async () => {
      const res = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
    
    it('should get only customer orders for customer', async () => {
      const res = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].customer_id).toBe(customerUser.id);
    });
  });

  describe('GET /api/v1/orders/:id', () => {
    it('should get order by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.id).toBe(orderId);
    });
    
    it('should prevent accessing other customer orders', async () => {
      // Create another customer
      const otherCustomer = await User.create({
        name: 'Other Customer',
        email: 'other@test.com',
        password: 'Password123!',
        role: 'customer',
        status: 'active'
      });
      const otherToken = generateToken(otherCustomer);
      
      const res = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${otherToken}`);
      
      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/orders/:id/status', () => {
    it('should update order status', async () => {
      const res = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CONFIRMED' });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.status).toBe('CONFIRMED');
    });
    
    it('should validate status transitions', async () => {
      // Try invalid transition from CONFIRMED to DELIVERED
      const res = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'DELIVERED' });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/orders/:id/cancel', () => {
    it('should cancel order and release inventory', async () => {
      const res = await request(app)
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'Changed mind' });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.status).toBe('CANCELLED');
      
      // Verify inventory released
      const inventory = await Inventory.findOne({
        where: { product_id: productId, warehouse_id: warehouseId }
      });
      
      expect(inventory.reserved_quantity).toBe(0);
    });
  });

  describe('GET /api/v1/orders/statistics', () => {
    it('should get order statistics', async () => {
      const res = await request(app)
        .get('/api/v1/orders/statistics')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.statistics).toHaveProperty('total_orders');
      expect(res.body.data.statistics).toHaveProperty('total_revenue');
    });
  });
});