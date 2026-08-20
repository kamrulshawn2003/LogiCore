const request = require('supertest');
const app = require('../app');
const { sequelize, User, Supplier, Product } = require('../models');
const { generateToken } = require('../utils/generateToken');

let adminToken;
let adminUser;
let supplierToken;
let supplierUser;

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
  
  // Create supplier user
  supplierUser = await User.create({
    name: 'Supplier User',
    email: 'supplieruser@test.com',
    password: 'Password123!',
    role: 'supplier',
    status: 'active'
  });
  
  supplierToken = generateToken(supplierUser);
});

afterAll(async () => {
  await sequelize.close();
});

describe('Supplier Endpoints', () => {
  const testSupplier = {
    name: 'Test Supplier Corp',
    email: 'testsupplier@test.com',
    phone: '+1234567890',
    address: '123 Test Street, Test City'
  };
  
  let supplierId;

  describe('POST /api/v1/suppliers', () => {
    it('should create a new supplier', async () => {
      const res = await request(app)
        .post('/api/v1/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testSupplier);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.supplier).toHaveProperty('id');
      expect(res.body.data.supplier.name).toBe(testSupplier.name);
      
      supplierId = res.body.data.supplier.id;
    });
    
    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/v1/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '',
          email: 'invalid-email'
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
    
    it('should prevent duplicate email', async () => {
      const res = await request(app)
        .post('/api/v1/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testSupplier);
      
      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });
    
    it('should require admin role', async () => {
      const res = await request(app)
        .post('/api/v1/suppliers')
        .set('Authorization', `Bearer ${supplierToken}`)
        .send({
          name: 'Another Supplier',
          email: 'another@test.com'
        });
      
      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/suppliers', () => {
    it('should get all suppliers', async () => {
      const res = await request(app)
        .get('/api/v1/suppliers');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });
    
    it('should filter suppliers by search', async () => {
      const res = await request(app)
        .get('/api/v1/suppliers?search=Test');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
    
    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/v1/suppliers?status=active');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/suppliers/:id', () => {
    it('should get supplier by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/suppliers/${supplierId}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.supplier.id).toBe(supplierId);
      expect(res.body.data.supplier.performance).toBeDefined();
    });
    
    it('should return 404 for non-existent supplier', async () => {
      const res = await request(app)
        .get('/api/v1/suppliers/99999');
      
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/suppliers/:id', () => {
    it('should update supplier', async () => {
      const res = await request(app)
        .put(`/api/v1/suppliers/${supplierId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Supplier Corp',
          phone: '+9876543210'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.supplier.name).toBe('Updated Supplier Corp');
      expect(res.body.data.supplier.phone).toBe('+9876543210');
    });
  });

  describe('PATCH /api/v1/suppliers/:id/rating', () => {
    it('should update supplier rating', async () => {
      const res = await request(app)
        .patch(`/api/v1/suppliers/${supplierId}/rating`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rating: 4.5 });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(parseFloat(res.body.data.supplier.rating)).toBe(4.5);
    });
    
    it('should validate rating range', async () => {
      const res = await request(app)
        .patch(`/api/v1/suppliers/${supplierId}/rating`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rating: 10 });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/suppliers/:id', () => {
    it('should deactivate supplier', async () => {
      const res = await request(app)
        .delete(`/api/v1/suppliers/${supplierId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      
      // Verify supplier is inactive
      const getRes = await request(app)
        .get(`/api/v1/suppliers/${supplierId}`);
      
      expect(getRes.body.data.supplier.status).toBe('inactive');
    });
  });

  describe('GET /api/v1/suppliers/statistics', () => {
    it('should get supplier statistics', async () => {
      const res = await request(app)
        .get('/api/v1/suppliers/statistics')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.statistics).toHaveProperty('totalSuppliers');
      expect(res.body.data.statistics).toHaveProperty('activeSuppliers');
    });
  });
});