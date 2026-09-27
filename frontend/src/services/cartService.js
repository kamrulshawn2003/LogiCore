import api from './api';

const cartService = {
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data.data.cart;
  },
  getCount: async () => {
    const response = await api.get('/cart/count');
    return response.data.data.count;
  },
  addItem: async (productId, quantity = 1) => {
    const response = await api.post('/cart/items', { product_id: productId, quantity });
    return response.data.data.cart;
  },
  updateQuantity: async (itemId, quantity) => {
    const response = await api.patch(`/cart/items/${itemId}`, { quantity });
    return response.data.data.cart;
  },
  removeItem: async (itemId) => {
    const response = await api.delete(`/cart/items/${itemId}`);
    return response.data.data.cart;
  },
  clearCart: async () => {
    const response = await api.delete('/cart');
    return response.data.data;
  },
};

export { cartService };
export default cartService;
