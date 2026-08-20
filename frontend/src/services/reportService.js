import api from './api';

const reportService = {
  getSalesReport: async (startDate, endDate) => {
    const response = await api.get('/reports/sales', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data.data;
  },
  getInventoryReport: async (warehouseId = null) => {
    const response = await api.get('/reports/inventory', {
      params: warehouseId ? { warehouse_id: warehouseId } : {}
    });
    return response.data.data;
  },
  getPurchaseReport: async (startDate, endDate) => {
    const response = await api.get('/reports/purchases', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data.data;
  },
  getShipmentReport: async (startDate, endDate) => {
    const response = await api.get('/reports/shipments', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data.data;
  },
  getSupplierPerformance: async () => {
    const response = await api.get('/reports/supplier-performance');
    return response.data.data;
  },
};

export { reportService };
export default reportService;