import api from './api';

const inventoryService = {
  getAll: async (params) => {
    const response = await api.get('/inventory', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/inventory/${id}`);
    return response.data.data;
  },
  getMovements: async (params) => {
    const response = await api.get('/inventory/movements', { params });
    return response.data;
  },
  getLowStock: async () => {
    const response = await api.get('/inventory/low-stock');
    return response.data.data;
  },
  getStatistics: async () => {
    const response = await api.get('/inventory/statistics');
    return response.data.data;
  },
  adjust: async (data) => {
    const response = await api.post('/inventory/adjust', data);
    return response.data.data;
  },
  transfer: async (data) => {
    const response = await api.post('/inventory/transfer', data);
    return response.data.data;
  },
  receive: async (data) => {
    const response = await api.post('/inventory/receive', data);
    return response.data.data;
  },
  issue: async (data) => {
    const response = await api.post('/inventory/issue', data);
    return response.data.data;
  },
};

export { inventoryService };
export default inventoryService;