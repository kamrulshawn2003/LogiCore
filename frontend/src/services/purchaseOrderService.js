import api from './api';

const purchaseOrderService = {
  getAll: async (params) => {
    const response = await api.get('/purchase-orders', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/purchase-orders/${id}`);
    return response.data.data;
  },
  create: async (data) => {
    const response = await api.post('/purchase-orders', data);
    return response.data.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/purchase-orders/${id}`, data);
    return response.data.data;
  },
  submit: async (id) => {
    const response = await api.post(`/purchase-orders/${id}/submit`);
    return response.data.data;
  },
  approve: async (id) => {
    const response = await api.post(`/purchase-orders/${id}/approve`);
    return response.data.data;
  },
  reject: async (id, reason) => {
    const response = await api.post(`/purchase-orders/${id}/reject`, { reason });
    return response.data.data;
  },
  accept: async (id) => {
    const response = await api.post(`/purchase-orders/${id}/accept`);
    return response.data.data;
  },
  cancel: async (id, reason) => {
    const response = await api.post(`/purchase-orders/${id}/cancel`, { reason });
    return response.data.data;
  },
  receive: async (id, items) => {
    const response = await api.post(`/purchase-orders/${id}/receive`, { items });
    return response.data.data;
  },
};

export { purchaseOrderService };
export default purchaseOrderService;