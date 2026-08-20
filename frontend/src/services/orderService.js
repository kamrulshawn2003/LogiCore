import api from './api';

const orderService = {
  getAll: async (params) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data.data;
  },
  create: async (data) => {
    const response = await api.post('/orders', data);
    return response.data.data;
  },
  updateStatus: async (id, status) => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data.data;
  },
  cancel: async (id, reason) => {
    const response = await api.post(`/orders/${id}/cancel`, { reason });
    return response.data.data;
  },
  getMyOrders: async (params) => {
    const response = await api.get('/orders/my-orders', { params });
    return response.data;
  },
  getStatistics: async () => {
    const response = await api.get('/orders/statistics');
    return response.data.data;
  },
};

export { orderService };
export default orderService;