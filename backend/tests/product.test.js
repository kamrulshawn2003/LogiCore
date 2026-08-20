const request = require('supertest');
const app = require('../app');
const { sequelize, User, Product, Category, Supplier } = require('../models');
const { generateToken } = require('../utils/generateToken');

let adminToken;
let adminUser;
let testCategory;
let testSupplier;

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
  
  // Create test category
  testCategory = await Category.create({
    name: 'Test Category',
    description: 'Test category description'
  });
  
  // Create test supplier
  testSupplier = await Supplier.create({
    name: 'Test Supplier',
    email: 'supplier@test.com',
    phone: '+1234567890'
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Product Endpoints', () => {
  const testProduct = {
    name: 'Test Product',
    description: 'A test product',
    price: 99.99,
    cost_price: 50.00,
    reorder_level: 10,
    category_id: 1,
    supplier_id: 1
  };
  
  let productId;

  describe('POST /api/v1/products', () => {
    it('should create a new product', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...testProduct,
          category_id: testCategory.id,
          supplier_id: testSupplier.id
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.product).toHaveProperty('id');
      expect(res.body.data.product).toHaveProperty('sku');
      expect(res.body.data.product.name).toBe(testProduct.name);
      
      productId = res.body.data.product.id;
    });
    
    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '',
          price: -10
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
    
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .send(testProduct);
      
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/products', () => {
    it('should get all products', async () => {
      const res = await request(app)
        .get('/api/v1/products');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });
    
    it('should filter products by search', async () => {
      const res = await request(app)
        .get('/api/v1/products?search=Test');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('should get product by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/products/${productId}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.product.id).toBe(productId);
    });
    
    it('should return 404 for non-existent product', async () => {
      const res = await request(app)
        .get('/api/v1/products/99999');
      
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/products/:id', () => {
    it('should update product', async () => {
      const res = await request(app)
        .put(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Product',
          price: 149.99
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.product.name).toBe('Updated Product');
      expect(res.body.data.product.price).toBe('149.99');
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    it('should deactivate product', async () => {
      const res = await request(app)
        .delete(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      
      // Verify product is inactive
      const getRes = await request(app)
        .get(`/api/v1/products/${productId}`);
      
      expect(getRes.body.data.product.status).toBe('inactive');
    });
  });
});