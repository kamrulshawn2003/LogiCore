const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const productRoutes = require('./productRoutes');
const categoryRoutes = require('./categoryRoutes');
const supplierRoutes = require('./supplierRoutes');
const warehouseRoutes = require('./warehouseRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const purchaseOrderRoutes = require('./purchaseOrderRoutes');
const orderRoutes = require('./orderRoutes');
const shipmentRoutes = require('./shipmentRoutes');
const driverRoutes = require('./driverRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const reportRoutes = require('./reportRoutes');
const notificationRoutes = require('./notificationRoutes');
const auditLogRoutes = require('./auditLogRoutes');
const storeRoutes = require('./storeRoutes');
const cartRoutes = require('./cartRoutes');
const addressRoutes = require('./addressRoutes');
const reviewRoutes = require('./reviewRoutes');
const wishlistRoutes = require('./wishlistRoutes');
const refundRoutes = require('./refundRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/orders', orderRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/drivers', driverRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit-logs', auditLogRoutes);

// JD-style storefront & customer commerce
router.use('/store', storeRoutes);
router.use('/cart', cartRoutes);
router.use('/addresses', addressRoutes);
router.use('/reviews', reviewRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/refunds', refundRoutes);

module.exports = router;