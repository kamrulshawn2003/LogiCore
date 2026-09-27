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
  Order,
  Refund
} = require('../models');
const { generateToken } = require('../utils/generateToken');

let adminToken;
let managerToken;
let customerToken;
let otherCustomerToken;
let productId;
let warehouseId;
let orderId;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'Password123!',
    role: 'admin',
    status: 'active'
  });
  adminToken = generateToken(admin);

  const manager = await User.create({
    name: 'Manager User',
    email: 'manager@test.com',
    password: 'Password123!',
    role: 'warehouse_manager',
    status: 'active'
  });
  managerToken = generateToken(manager);

  const customer = await User.create({
    name: 'Customer User',
    email: 'customer@test.com',
    password: 'Password123!',
    role: 'customer',
    status: 'active'
  });
  customerToken = generateToken(customer);

  const other = await User.create({
    name: 'Other Customer',
    email: 'other@test.com',
    password: 'Password123!',
    role: 'customer',
    status: 'active'
  });
  otherCustomerToken = generateToken(other);

  const category = await Category.create({ name: 'Test Category' });
  const supplier = await Supplier.create({
    name: 'Test Supplier',
    email: 'supplier@test.com'
  });
  const warehouse = await Warehouse.create({
    name: 'Test Warehouse',
    code: 'WH-TEST'
  });
  warehouseId = warehouse.id;

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

  await Inventory.create({
    product_id: productId,
    warehouse_id: warehouseId,
    quantity: 100,
    reserved_quantity: 0,
    reorder_level: 10
  });

  // Create + pay + deliver an order for the customer
  const created = await request(app)
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({
      items: [{ product_id: productId, quantity: 5 }],
      shipping_address: '123 Test St, Test City, TS 12345'
    });
  orderId = created.body.data.order.id;

  await request(app)
    .post(`/api/v1/orders/${orderId}/pay`)
    .set('Authorization', `Bearer ${customerToken}`);

  await request(app)
    .patch(`/api/v1/orders/${orderId}/status`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'PROCESSING' });

  await request(app)
    .patch(`/api/v1/orders/${orderId}/status`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'PACKED' });

  await request(app)
    .patch(`/api/v1/orders/${orderId}/status`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'SHIPPED' });

  await request(app)
    .post(`/api/v1/orders/${orderId}/confirm-receipt`)
    .set('Authorization', `Bearer ${customerToken}`);
});

afterAll(async () => {
  await sequelize.close();
});

describe('Refund & Returns Endpoints', () => {
  describe('POST /api/v1/refunds (customer)', () => {
    it('should create a refund request for a delivered paid order', async () => {
      const res = await request(app)
        .post('/api/v1/refunds')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ order_id: orderId, type: 'REFUND', reason: 'Received damaged item' });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.refund).toHaveProperty('refund_number');
      expect(res.body.data.refund.status).toBe('PENDING');
      expect(res.body.data.refund.type).toBe('REFUND');
      expect(res.body.data.refund.amount).toBe('500.00');

      // Order should be flagged as return-requested
      const order = await Order.findByPk(orderId);
      expect(order.status).toBe('RETURN_REQUESTED');
    });

    it('should reject a duplicate refund request for the same order', async () => {
      const res = await request(app)
        .post('/api/v1/refunds')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ order_id: orderId, type: 'REFUND', reason: 'Still want a refund' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('A refund request for this order is already in progress');
    });

    it('should reject refund for another customers order', async () => {
      const res = await request(app)
        .post('/api/v1/refunds')
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .send({ order_id: orderId, type: 'REFUND', reason: 'Trying to steal a refund' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('You can only request a refund for your own orders');
    });

    it('should reject creation by non-customer roles', async () => {
      const res = await request(app)
        .post('/api/v1/refunds')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ order_id: orderId, type: 'REFUND', reason: 'Admin requesting' });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/v1/refunds (staff)', () => {
    it('should list refund requests for admin', async () => {
      const res = await request(app)
        .get('/api/v1/refunds')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].customer.email).toBe('customer@test.com');
    });

    it('should list refund requests for warehouse manager', async () => {
      const res = await request(app)
        .get('/api/v1/refunds')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
    });

    it('should deny customers from listing all refunds', async () => {
      const res = await request(app)
        .get('/api/v1/refunds')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/v1/refunds/mine (customer)', () => {
    it('should return only the customers own refunds', async () => {
      const res = await request(app)
        .get('/api/v1/refunds/mine')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('GET /api/v1/refunds/statistics', () => {
    it('should return status statistics for staff', async () => {
      const res = await request(app)
        .get('/api/v1/refunds/statistics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.statistics.pending).toBe(1);
      expect(res.body.data.statistics.total_refunded_amount).toBe(0);
    });
  });

  describe('PATCH /api/v1/refunds/:id/status (staff)', () => {
    it('should require a note when rejecting', async () => {
      const refund = await Refund.findOne({ where: { order_id: orderId } });

      const res = await request(app)
        .patch(`/api/v1/refunds/${refund.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'REJECTED' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('A rejection reason is required');
    });

    it('should reject a request with a note', async () => {
      const refund = await Refund.findOne({ where: { order_id: orderId } });

      const res = await request(app)
        .patch(`/api/v1/refunds/${refund.id}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: 'REJECTED', admin_note: 'Item was not damaged' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.refund.status).toBe('REJECTED');
      expect(res.body.data.refund.admin_note).toBe('Item was not damaged');
    });

    it('should block customers from deciding refunds', async () => {
      const refund = await Refund.findOne({ where: { order_id: orderId } });

      const res = await request(app)
        .patch(`/api/v1/refunds/${refund.id}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'APPROVED' });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('Full refund flow (RETURN restocks inventory)', () => {
    it('should approve, refund and restock a RETURN request', async () => {
      // Create a second order for a RETURN flow
      const created = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ product_id: productId, quantity: 2 }],
          shipping_address: '123 Test St, Test City, TS 12345'
        });
      const returnOrderId = created.body.data.order.id;

      await request(app)
        .post(`/api/v1/orders/${returnOrderId}/pay`)
        .set('Authorization', `Bearer ${customerToken}`);
      await request(app)
        .patch(`/api/v1/orders/${returnOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PROCESSING' });
      await request(app)
        .patch(`/api/v1/orders/${returnOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PACKED' });
      await request(app)
        .patch(`/api/v1/orders/${returnOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'SHIPPED' });
      await request(app)
        .post(`/api/v1/orders/${returnOrderId}/confirm-receipt`)
        .set('Authorization', `Bearer ${customerToken}`);

      const reqRes = await request(app)
        .post('/api/v1/refunds')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ order_id: returnOrderId, type: 'RETURN', reason: 'Changed my mind about this item' });
      expect(reqRes.statusCode).toBe(201);
      const refundId = reqRes.body.data.refund.id;

      // Approve
      const approveRes = await request(app)
        .patch(`/api/v1/refunds/${refundId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'APPROVED' });
      expect(approveRes.statusCode).toBe(200);
      expect(approveRes.body.data.refund.status).toBe('APPROVED');

      // Stock was decremented at shipping (first order -5, this order -2 => 93)
      let inventory = await Inventory.findOne({
        where: { product_id: productId, warehouse_id: warehouseId }
      });
      expect(Number(inventory.quantity)).toBe(93);

      // Complete the refund
      const refundRes = await request(app)
        .patch(`/api/v1/refunds/${refundId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'REFUNDED' });
      expect(refundRes.statusCode).toBe(200);
      expect(refundRes.body.data.refund.status).toBe('REFUNDED');

      // Payment refunded + returned stock
      const order = await Order.findByPk(returnOrderId);
      expect(order.payment_status).toBe('REFUNDED');
      expect(order.status).toBe('RETURNED');

      inventory = await Inventory.findOne({
        where: { product_id: productId, warehouse_id: warehouseId }
      });
      expect(Number(inventory.quantity)).toBe(95);
    });
  });
});
