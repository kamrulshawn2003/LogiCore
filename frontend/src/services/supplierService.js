import api from './api';

const supplierService = {
  getAll: async (params) => {
    const response = await api.get('/suppliers', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data.data;
  },
  create: async (data) => {
    const response = await api.post('/suppliers', data);
    return response.data.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/suppliers/${id}`);
    return response.data.data;
  },
  updateRating: async (id, rating) => {
    const response = await api.patch(`/suppliers/${id}/rating`, { rating });
    return response.data.data;
  },
  getPurchaseOrders: async (id, params) => {
    const response = await api.get(`/suppliers/${id}/purchase-orders`, { params });
    return response.data;
  },
  getStatistics: async () => {
    const response = await api.get('/suppliers/statistics');
    return response.data.data;
  },
};

export { supplierService };
export default supplierService;