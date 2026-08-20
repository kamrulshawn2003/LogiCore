const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.get('/', auth, authorize('admin'), auditLogController.getAllAuditLogs);
router.get('/statistics', auth, authorize('admin'), auditLogController.getAuditLogStatistics);
router.get('/export', auth, authorize('admin'), auditLogController.exportAuditLogs);
router.get('/entity/:entityType/:entityId', auth, authorize('admin'), auditLogController.getAuditLogsByEntity);
router.get('/:id', auth, authorize('admin'), auditLogController.getAuditLogById);

module.exports = router;