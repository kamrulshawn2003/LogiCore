const request = require('supertest');
const app = require('../app');
const { 
  sequelize, 
  User, 
  Product, 
  Warehouse, 
  Supplier, 
  Category,
  Inventory,
  PurchaseOrder,
  Order,
  Shipment,
  Driver
} = require('../models');
const { generateToken } = require('../utils/generateToken');

let adminToken, managerToken, supplierToken, driverToken, customerToken;
let adminUser, managerUser, supplierUser, driverUser, customerUser;
let category, supplier, warehouse, product;
let purchaseOrder, order, shipment, driver;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  
  // Create users
  adminUser = await User.create({
    name: 'Admin', email: 'admin@test.com', password: 'Password123!',
    role: 'admin', status: 'active'
  });
  adminToken = generateToken(adminUser);
  
  managerUser = await User.create({
    name: 'Manager', email: 'manager@test.com', password: 'Password123!',
    role: 'warehouse_manager', status: 'active', warehouse_id: 1
  });
  managerToken = generateToken(managerUser);
  
  supplierUser = await User.create({
    name: 'Supplier', email: 'supplier@test.com', password: 'Password123!',
    role: 'supplier', status: 'active'
  });
  supplierToken = generateToken(supplierUser);
  
  driverUser = await User.create({
    name: 'Driver', email: 'driver@test.com', password: 'Password123!',
    role: 'driver', status: 'active'
  });
  driverToken = generateToken(driverUser);
  
  customerUser = await User.create({
    name: 'Customer', email: 'customer@test.com', password: 'Password123!',
    role: 'customer', status: 'active'
  });
  customerToken = generateToken(customerUser);
  
  // Create base data
  category = await Category.create({ name: 'Test Category' });
  
  supplier = await Supplier.create({
    name: 'Test Supplier', email: 'supplier@test.com',
    user_id: supplierUser.id
  });
  
  warehouse = await Warehouse.create({
    name: 'Main Warehouse', code: 'WH-MAIN', manager_id: managerUser.id
  });
  
  product = await Product.create({
    sku: 'TEST-001', name: 'Test Product', price: 100,
    cost_price: 50, reorder_level: 10,
    category_id: category.id, supplier_id: supplier.id
  });
  
  driver = await Driver.create({
    user_id: driverUser.id, license_number: 'DL-12345',
    vehicle_number: 'TRK-001', vehicle_type: 'Truck'
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Complete Supply Chain Workflow', () => {
  test('1. Create Purchase Order', async () => {
    const res = await request(app)
      .post('/api/v1/purchase-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        supplier_id: supplier.id,
        warehouse_id: warehouse.id,
        items: [{ product_id: product.id, quantity: 50, unit_price: 50 }]
      });
    
    expect(res.statusCode).toBe(201);
    purchaseOrder = res.body.data.purchaseOrder;
    expect(purchaseOrder.status).toBe('DRAFT');
  });

  test('2. Submit Purchase Order', async () => {
    const res = await request(app)
      .post(`/api/v1/purchase-orders/${purchaseOrder.id}/submit`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.data.purchaseOrder.status).toBe('SUBMITTED');
  });

  test('3. Approve Purchase Order', async () => {
    const res = await request(app)
      .post(`/api/v1/purchase-orders/${purchaseOrder.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.data.purchaseOrder.status).toBe('APPROVED');
  });

  test('4. Supplier Accepts Purchase Order', async () => {
    const res = await request(app)
      .post(`/api/v1/purchase-orders/${purchaseOrder.id}/accept`)
      .set('Authorization', `Bearer ${supplierToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.data.purchaseOrder.status).toBe('ACCEPTED');
  });

  test('5. Receive Purchase Order Items', async () => {
    const poItems = purchaseOrder.items;
    
    const res = await request(app)
      .post(`/api/v1/purchase-orders/${purchaseOrder.id}/receive`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        items: [{ purchase_order_item_id: poItems[0].id, quantity: 50 }]
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.data.purchaseOrder.status).toBe('RECEIVED');
  });

  test('6. Verify Inventory Updated', async () => {
    const res = await request(app)
      .get('/api/v1/inventory')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ warehouse_id: warehouse.id });
    
    expect(res.statusCode).toBe(200);
    const inventory = res.body.data.find(i => i.product_id === product.id);
    expect(inventory).toBeDefined();
    expect(inventory.quantity).toBe(50);
  });

  test('7. Customer Creates Order', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        items: [{ product_id: product.id, quantity: 10 }],
        shipping_address: '123 Test St'
      });
    
    expect(res.statusCode).toBe(201);
    order = res.body.data.order;
    expect(order.status).toBe('PENDING');
  });

  test('8. Verify Inventory Reserved', async () => {
    const res = await request(app)
      .get('/api/v1/inventory')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ warehouse_id: warehouse.id });
    
    const inventory = res.body.data.find(i => i.product_id === product.id);
    expect(inventory.reserved_quantity).toBe(10);
    expect(inventory.available_quantity).toBe(40);
  });

  test('9. Process Order', async () => {
    const res = await request(app)
      .patch(`/api/v1/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CONFIRMED' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.data.order.status).toBe('CONFIRMED');
  });

  test('10. Pack Order', async () => {
    await request(app)
      .patch(`/api/v1/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'PROCESSING' });
    
    const res = await request(app)
      .patch(`/api/v1/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'PACKED' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.data.order.status).toBe('PACKED');
  });

  test('11. Create Shipment', async () => {
    const res = await request(app)
      .post('/api/v1/shipments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        order_id: order.id,
        warehouse_id: warehouse.id,
        driver_id: driver.id,
        estimated_delivery: '2025-02-15'
      });
    
    expect(res.statusCode).toBe(201);
    shipment = res.body.data.shipment;
    expect(shipment.status).toBe('ASSIGNED');
  });

  test('12. Driver Picks Up Shipment', async () => {
    const res = await request(app)
      .patch(`/api/v1/shipments/${shipment.id}/status`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'PICKED_UP' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.data.shipment.status).toBe('PICKED_UP');
  });

  test('13. Driver Delivers Shipment', async () => {
    await request(app)
      .patch(`/api/v1/shipments/${shipment.id}/status`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'IN_TRANSIT' });
    
    await request(app)
      .patch(`/api/v1/shipments/${shipment.id}/status`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'OUT_FOR_DELIVERY' });
    
    const res = await request(app)
      .patch(`/api/v1/shipments/${shipment.id}/status`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'DELIVERED' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.data.shipment.status).toBe('DELIVERED');
  });

  test('14. Verify Order Delivered', async () => {
    const res = await request(app)
      .get(`/api/v1/orders/${order.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.body.data.order.status).toBe('DELIVERED');
  });

  test('15. Track Shipment', async () => {
    const res = await request(app)
      .get(`/api/v1/shipments/track/${shipment.tracking_number}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.data.tracking.status).toBe('DELIVERED');
  });
});