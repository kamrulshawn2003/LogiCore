const auditLogService = require('../services/auditLogService');
const ApiResponse = require('../utils/ApiResponse');

class AuditLogController {
  async getAllAuditLogs(req, res, next) {
    try {
      const result = await auditLogService.getAllAuditLogs(req.query);
      
      res.json(
        ApiResponse.success(result.auditLogs, result.pagination)
      );
    } catch (error) {
      next(error);
    }
  }

  async getAuditLogById(req, res, next) {
    try {
      const auditLog = await auditLogService.getAuditLogById(req.params.id);
      
      res.json(
        ApiResponse.success({ auditLog })
      );
    } catch (error) {
      if (error.message === 'Audit log not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async getAuditLogsByEntity(req, res, next) {
    try {
      const { entityType, entityId } = req.params;
      const auditLogs = await auditLogService.getAuditLogsByEntity(
        entityType,
        parseInt(entityId)
      );
      
      res.json(
        ApiResponse.success({ auditLogs })
      );
    } catch (error) {
      next(error);
    }
  }

  async getAuditLogStatistics(req, res, next) {
    try {
      const stats = await auditLogService.getAuditLogStatistics();
      
      res.json(
        ApiResponse.success({ statistics: stats })
      );
    } catch (error) {
      next(error);
    }
  }

  async exportAuditLogs(req, res, next) {
    try {
      const auditLogs = await auditLogService.exportAuditLogs(req.query);
      
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
      
      // Create CSV
      const csvHeaders = 'ID,User,Action,Entity Type,Entity ID,Old Value,New Value,IP Address,Timestamp\n';
      const csvRows = auditLogs.map(log => {
        const user = log.user ? `${log.user.name} (${log.user.email})` : 'System';
        const oldValue = log.old_value ? JSON.stringify(log.old_value).replace(/,/g, ';') : '';
        const newValue = log.new_value ? JSON.stringify(log.new_value).replace(/,/g, ';') : '';
        return `${log.id},${user},${log.action},${log.entity_type},${log.entity_id || ''},${oldValue},${newValue},${log.ip_address || ''},${log.created_at}`;
      }).join('\n');
      
      res.send(csvHeaders + csvRows);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuditLogController();