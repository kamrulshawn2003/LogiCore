import api from './api';

const reviewService = {
  getProductReviews: async (productId, params) => {
    const response = await api.get(`/reviews/product/${productId}`, { params });
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/reviews', data);
    return response.data.data.review;
  },
  getMine: async (params) => {
    const response = await api.get('/reviews/mine', { params });
    return response.data;
  },
};

export { reviewService };
export default reviewService;
