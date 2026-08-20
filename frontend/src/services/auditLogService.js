import api from './api';

const auditLogService = {
  getAll: async (params) => {
    const response = await api.get('/audit-logs', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/audit-logs/${id}`);
    return response.data.data;
  },
  getStatistics: async () => {
    const response = await api.get('/audit-logs/statistics');
    return response.data.data;
  },
  getByEntity: async (entityType, entityId) => {
    const response = await api.get(`/audit-logs/entity/${entityType}/${entityId}`);
    return response.data.data;
  },
};

export { auditLogService };
export default auditLogService;