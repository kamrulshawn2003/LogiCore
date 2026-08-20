import api from './api';

const shipmentService = {
  getAll: async (params) => {
    const response = await api.get('/shipments', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/shipments/${id}`);
    return response.data.data;
  },
  create: async (data) => {
    const response = await api.post('/shipments', data);
    return response.data.data;
  },
  assignDriver: async (id, driverId) => {
    const response = await api.post(`/shipments/${id}/assign`, { driver_id: driverId });
    return response.data.data;
  },
  updateStatus: async (id, status) => {
    const response = await api.patch(`/shipments/${id}/status`, { status });
    return response.data.data;
  },
  track: async (trackingNumber) => {
    const response = await api.get(`/shipments/track/${trackingNumber}`);
    return response.data.data;
  },
  getStatistics: async () => {
    const response = await api.get('/shipments/statistics');
    return response.data.data;
  },
};

export { shipmentService };
export default shipmentService;