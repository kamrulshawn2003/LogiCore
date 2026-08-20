const request = require('supertest');
const app = require('../app');
const { sequelize, User, Warehouse, Inventory, Product } = require('../models');
const { generateToken } = require('../utils/generateToken');

let adminToken;
let adminUser;
let managerToken;
let managerUser;
let warehouseId;

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
  
  // Create warehouse manager
  managerUser = await User.create({
    name: 'Warehouse Manager',
    email: 'manager@test.com',
    password: 'Password123!',
    role: 'warehouse_manager',
    status: 'active'
  });
  
  managerToken = generateToken(managerUser);
});

afterAll(async () => {
  await sequelize.close();
});

describe('Warehouse Endpoints', () => {
  const testWarehouse = {
    name: 'Test Warehouse',
    code: 'WH-TEST',
    address: '123 Test Ave, Test City',
    capacity: 5000
  };

  describe('POST /api/v1/warehouses', () => {
    it('should create a new warehouse', async () => {
      const res = await request(app)
        .post('/api/v1/warehouses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testWarehouse);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.warehouse).toHaveProperty('id');
      expect(res.body.data.warehouse.name).toBe(testWarehouse.name);
      
      warehouseId = res.body.data.warehouse.id;
    });
    
    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/v1/warehouses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '',
          code: 'INVALID CODE'
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
    
    it('should prevent duplicate code', async () => {
      const res = await request(app)
        .post('/api/v1/warehouses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testWarehouse);
      
      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });
    
    it('should require admin role', async () => {
      const res = await request(app)
        .post('/api/v1/warehouses')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Manager Warehouse',
          code: 'WH-MGR'
        });
      
      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/warehouses', () => {
    it('should get all warehouses', async () => {
      const res = await request(app)
        .get('/api/v1/warehouses');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });
    
    it('should filter warehouses by search', async () => {
      const res = await request(app)
        .get('/api/v1/warehouses?search=Test');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/warehouses/:id', () => {
    it('should get warehouse by ID with statistics', async () => {
      const res = await request(app)
        .get(`/api/v1/warehouses/${warehouseId}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.warehouse.id).toBe(warehouseId);
      expect(res.body.data.warehouse.statistics).toBeDefined();
    });
    
    it('should return 404 for non-existent warehouse', async () => {
      const res = await request(app)
        .get('/api/v1/warehouses/99999');
      
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/warehouses/:id', () => {
    it('should update warehouse', async () => {
      const res = await request(app)
        .put(`/api/v1/warehouses/${warehouseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Warehouse',
          capacity: 6000
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.warehouse.name).toBe('Updated Warehouse');
      expect(parseFloat(res.body.data.warehouse.capacity)).toBe(6000);
    });
  });

  describe('DELETE /api/v1/warehouses/:id', () => {
    it('should deactivate warehouse', async () => {
      const res = await request(app)
        .delete(`/api/v1/warehouses/${warehouseId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      
      // Verify warehouse is inactive
      const getRes = await request(app)
        .get(`/api/v1/warehouses/${warehouseId}`);
      
      expect(getRes.body.data.warehouse.status).toBe('inactive');
    });
  });

  describe('GET /api/v1/warehouses/statistics', () => {
    it('should get warehouse statistics', async () => {
      const res = await request(app)
        .get('/api/v1/warehouses/statistics')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.statistics).toHaveProperty('totalWarehouses');
      expect(res.body.data.statistics).toHaveProperty('activeWarehouses');
    });
  });
});