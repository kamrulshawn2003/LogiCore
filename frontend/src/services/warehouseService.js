import api from './api';

const warehouseService = {
  getAll: async (params) => {
    const response = await api.get('/warehouses', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/warehouses/${id}`);
    return response.data.data;
  },
  create: async (data) => {
    const response = await api.post('/warehouses', data);
    return response.data.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/warehouses/${id}`, data);
    return response.data.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/warehouses/${id}`);
    return response.data.data;
  },
  getInventory: async (id, params) => {
    const response = await api.get(`/warehouses/${id}/inventory`, { params });
    return response.data;
  },
  getStatistics: async () => {
    const response = await api.get('/warehouses/statistics');
    return response.data.data;
  },
};

export { warehouseService };
export default warehouseService;