import api from './api';

const productService = {
  getAll: async (params) => {
    const response = await api.get('/products', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data.data;
  },
  create: async (data) => {
    const response = await api.post('/products', data);
    return response.data.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data.data;
  },
  updateStatus: async (id, status) => {
    const response = await api.patch(`/products/${id}/status`, { status });
    return response.data.data;
  },
  getLowStock: async () => {
    const response = await api.get('/products/low-stock');
    return response.data.data;
  },
  getStatistics: async () => {
    const response = await api.get('/products/statistics');
    return response.data.data;
  },
};

export { productService };
export default productService;