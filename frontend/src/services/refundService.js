import api from './api';

const refundService = {
  getAll: async (params) => {
    const response = await api.get('/refunds', { params });
    return response.data;
  },
  getMine: async (params) => {
    const response = await api.get('/refunds/mine', { params });
    return response.data;
  },
  getStatistics: async () => {
    const response = await api.get('/refunds/statistics');
    return response.data.data.statistics;
  },
  create: async (data) => {
    const response = await api.post('/refunds', data);
    return response.data.data.refund;
  },
  updateStatus: async (id, data) => {
    const response = await api.patch(`/refunds/${id}/status`, data);
    return response.data.data.refund;
  },
  cancel: async (id) => {
    const response = await api.post(`/refunds/${id}/cancel`);
    return response.data.data.refund;
  },
};

export { refundService };
export default refundService;
