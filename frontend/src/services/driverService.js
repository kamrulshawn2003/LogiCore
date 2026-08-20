import api from './api';

const driverService = {
  getAll: async (params) => {
    const response = await api.get('/drivers', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/drivers/${id}`);
    return response.data.data;
  },
  create: async (data) => {
    const response = await api.post('/drivers', data);
    return response.data.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/drivers/${id}`, data);
    return response.data.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/drivers/${id}`);
    return response.data.data;
  },
  updateStatus: async (id, status) => {
    const response = await api.patch(`/drivers/${id}/status`, { status });
    return response.data.data;
  },
  getShipments: async (id, params) => {
    const response = await api.get(`/drivers/${id}/shipments`, { params });
    return response.data;
  },
  getStatistics: async () => {
    const response = await api.get('/drivers/statistics');
    return response.data.data;
  },
};

export { driverService };
export default driverService;