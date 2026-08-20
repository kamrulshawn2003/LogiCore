const { AuditLog, User, sequelize } = require('../models');
const { Op } = require('sequelize');

class AuditLogService {
  async getAllAuditLogs(query = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      action = '',
      entity_type = '',
      user_id = '',
      start_date = '',
      end_date = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = query;

    const where = {};
    
    if (action) {
      where.action = action;
    }
    
    if (entity_type) {
      where.entity_type = entity_type;
    }
    
    if (user_id) {
      where.user_id = user_id;
    }
    
    if (start_date && end_date) {
      where.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    } else if (start_date) {
      where.created_at = {
        [Op.gte]: new Date(start_date)
      };
    } else if (end_date) {
      where.created_at = {
        [Op.lte]: new Date(end_date)
      };
    }

    const userWhere = {};
    if (search) {
      userWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { rows, count } = await AuditLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true
    });

    return {
      auditLogs: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getAuditLogById(id) {
    const auditLog = await AuditLog.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    if (!auditLog) {
      throw new Error('Audit log not found');
    }
    
    return auditLog;
  }

  async getAuditLogsByEntity(entityType, entityId) {
    const auditLogs = await AuditLog.findAll({
      where: {
        entity_type: entityType,
        entity_id: entityId
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 50
    });
    
    return auditLogs;
  }

  async getAuditLogStatistics() {
    try {
      const totalLogs = await AuditLog.count().catch(() => 0);
      
      const logsByAction = await AuditLog.findAll({
        attributes: [
          'action',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['action'],
        order: [[sequelize.literal('count'), 'DESC']],
        limit: 20
      }).catch(() => []);
      
      const logsByEntity = await AuditLog.findAll({
        attributes: [
          'entity_type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['entity_type'],
        order: [[sequelize.literal('count'), 'DESC']]
      }).catch(() => []);
      
      const logsByUser = await AuditLog.findAll({
        attributes: [
          'user_id',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['name', 'email']
          }
        ],
        group: ['user_id'],
        order: [[sequelize.literal('count'), 'DESC']],
        limit: 10
      }).catch(() => []);
      
      const recentActivity = await AuditLog.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          created_at: {
            [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        group: [sequelize.fn('DATE', sequelize.col('created_at'))],
        order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
      }).catch(() => []);
      
      return {
        total_logs: totalLogs,
        logs_by_action: logsByAction,
        logs_by_entity: logsByEntity,
        logs_by_user: logsByUser,
        recent_activity: recentActivity
      };
    } catch (error) {
      console.error('Audit log statistics error:', error);
      return {
        total_logs: 0,
        logs_by_action: [],
        logs_by_entity: [],
        logs_by_user: [],
        recent_activity: []
      };
    }
  }

  async createAuditLog(logData) {
    const { user_id, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent } = logData;
    
    const auditLog = await AuditLog.create({
      user_id,
      action,
      entity_type,
      entity_id,
      old_value: old_value || null,
      new_value: new_value || null,
      ip_address,
      user_agent
    });
    
    return auditLog;
  }

  async exportAuditLogs(query = {}) {
    const { start_date, end_date, entity_type, action } = query;
    
    const where = {};
    
    if (start_date && end_date) {
      where.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }
    
    if (entity_type) {
      where.entity_type = entity_type;
    }
    
    if (action) {
      where.action = action;
    }
    
    const auditLogs = await AuditLog.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 10000
    });
    
    return auditLogs;
  }
}

module.exports = new AuditLogService();