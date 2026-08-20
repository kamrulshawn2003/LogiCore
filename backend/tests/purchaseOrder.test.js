const request = require('supertest');
const app = require('../app');
const { 
  sequelize, 
  User, 
  Product, 
  Warehouse, 
  Supplier, 
  Category,
  PurchaseOrder 
} = require('../models');
const { generateToken } = require('../utils/generateToken');

let adminToken;
let adminUser;
let supplierUser;
let supplierToken;
let productId;
let supplierId;
let warehouseId;
let poId;

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
  
  // Create category
  const category = await Category.create({ name: 'Test Category' });
  
  // Create supplier
  const supplier = await Supplier.create({
    name: 'Test Supplier',
    email: 'supplier@test.com',
    user_id: supplierUser.id
  });
  supplierId = supplier.id;
  
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
    supplier_id: supplierId
  });
  productId = product.id;
});

afterAll(async () => {
  await sequelize.close();
});

describe('Purchase Order Endpoints', () => {
  describe('POST /api/v1/purchase-orders', () => {
    it('should create a new purchase order', async () => {
      const res = await request(app)
        .post('/api/v1/purchase-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          supplier_id: supplierId,
          warehouse_id: warehouseId,
          expected_delivery_date: '2025-02-01',
          items: [
            {
              product_id: productId,
              quantity: 100,
              unit_price: 50
            }
          ]
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.purchaseOrder).toHaveProperty('id');
      expect(res.body.data.purchaseOrder.status).toBe('DRAFT');
      expect(res.body.data.purchaseOrder.total_amount).toBe('5000.00');
      
      poId = res.body.data.purchaseOrder.id;
    });
    
    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/v1/purchase-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          supplier_id: supplierId
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/purchase-orders/:id/submit', () => {
    it('should submit a draft purchase order', async () => {
      const res = await request(app)
        .post(`/api/v1/purchase-orders/${poId}/submit`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.purchaseOrder.status).toBe('SUBMITTED');
    });
  });

  describe('POST /api/v1/purchase-orders/:id/approve', () => {
    it('should approve a submitted purchase order', async () => {
      const res = await request(app)
        .post(`/api/v1/purchase-orders/${poId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.purchaseOrder.status).toBe('APPROVED');
    });
  });

  describe('POST /api/v1/purchase-orders/:id/accept', () => {
    it('should accept an approved purchase order by supplier', async () => {
      const res = await request(app)
        .post(`/api/v1/purchase-orders/${poId}/accept`)
        .set('Authorization', `Bearer ${supplierToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.purchaseOrder.status).toBe('ACCEPTED');
    });
  });

  describe('POST /api/v1/purchase-orders/:id/receive', () => {
    it('should receive items for purchase order', async () => {
      // Get PO to find item ID
      const poRes = await request(app)
        .get(`/api/v1/purchase-orders/${poId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      const poItemId = poRes.body.data.purchaseOrder.items[0].id;
      
      const res = await request(app)
        .post(`/api/v1/purchase-orders/${poId}/receive`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            {
              purchase_order_item_id: poItemId,
              quantity: 50
            }
          ]
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.purchaseOrder.status).toBe('PARTIALLY_RECEIVED');
      expect(res.body.data.purchaseOrder.received_percentage).toBe(50);
    });
    
    it('should receive remaining items', async () => {
      const poRes = await request(app)
        .get(`/api/v1/purchase-orders/${poId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      const poItemId = poRes.body.data.purchaseOrder.items[0].id;
      
      const res = await request(app)
        .post(`/api/v1/purchase-orders/${poId}/receive`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            {
              purchase_order_item_id: poItemId,
              quantity: 50
            }
          ]
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.purchaseOrder.status).toBe('RECEIVED');
      expect(res.body.data.purchaseOrder.received_percentage).toBe(100);
    });
  });

  describe('GET /api/v1/purchase-orders', () => {
    it('should get all purchase orders', async () => {
      const res = await request(app)
        .get('/api/v1/purchase-orders')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
    
    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/v1/purchase-orders?status=RECEIVED')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/purchase-orders/statistics', () => {
    it('should get purchase order statistics', async () => {
      const res = await request(app)
        .get('/api/v1/purchase-orders/statistics')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.statistics).toHaveProperty('total_po');
      expect(res.body.data.statistics).toHaveProperty('received_po');
    });
  });
});