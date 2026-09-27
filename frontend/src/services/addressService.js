import api from './api';

const addressService = {
  getAll: async () => {
    const response = await api.get('/addresses');
    return response.data.data.addresses;
  },
  create: async (data) => {
    const response = await api.post('/addresses', data);
    return response.data.data.address;
  },
  update: async (id, data) => {
    const response = await api.put(`/addresses/${id}`, data);
    return response.data.data.address;
  },
  setDefault: async (id) => {
    const response = await api.patch(`/addresses/${id}/default`);
    return response.data.data.address;
  },
  remove: async (id) => {
    const response = await api.delete(`/addresses/${id}`);
    return response.data.data;
  },
};

export { addressService };
export default addressService;
