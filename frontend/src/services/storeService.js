import api from './api';

const storeService = {
  getHome: async () => {
    const response = await api.get('/store/home');
    return response.data.data;
  },
  listProducts: async (params) => {
    const response = await api.get('/store/products', { params });
    return response.data;
  },
  getProductById: async (id) => {
    const response = await api.get(`/store/products/${id}`);
    return response.data.data.product;
  },
};

export { storeService };
export default storeService;
