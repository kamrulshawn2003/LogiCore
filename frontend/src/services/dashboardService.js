import api from './api';

const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data.data;
  },
  getSalesAnalytics: async (days = 30) => {
    const response = await api.get(`/dashboard/sales?days=${days}`);
    return response.data.data;
  },
  getInventoryAnalytics: async () => {
    const response = await api.get('/dashboard/inventory');
    return response.data.data;
  },
  getPurchaseOrderAnalytics: async (days = 30) => {
    const response = await api.get(`/dashboard/purchase-orders?days=${days}`);
    return response.data.data;
  },
  getShipmentAnalytics: async (days = 30) => {
    const response = await api.get(`/dashboard/shipments?days=${days}`);
    return response.data.data;
  },
};

export { dashboardService };
export default dashboardService;