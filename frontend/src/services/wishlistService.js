import api from './api';

const wishlistService = {
  getAll: async () => {
    const response = await api.get('/wishlist');
    return response.data.data.wishlist;
  },
  add: async (productId) => {
    const response = await api.post(`/wishlist/${productId}`);
    return response.data.data;
  },
  remove: async (productId) => {
    const response = await api.delete(`/wishlist/${productId}`);
    return response.data.data;
  },
  getMap: async () => {
    const response = await api.get('/wishlist/map');
    return response.data.data.wished;
  },
};

export { wishlistService };
export default wishlistService;
