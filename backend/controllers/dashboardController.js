const dashboardService = require('../services/dashboardService');
const ApiResponse = require('../utils/ApiResponse');

class DashboardController {
  async getDashboardStats(req, res, next) {
    try {
      const stats = await dashboardService.getDashboardStats(
        req.user.id,
        req.user.role,
        req.user.warehouse_id
      );
      
      res.json(
        ApiResponse.success({ dashboard: stats })
      );
    } catch (error) {
      next(error);
    }
  }

  async getSalesAnalytics(req, res, next) {
    try {
      const { days = 30 } = req.query;
      const analytics = await dashboardService.getSalesAnalytics(parseInt(days));
      
      res.json(
        ApiResponse.success({ analytics })
      );
    } catch (error) {
      next(error);
    }
  }

  async getInventoryAnalytics(req, res, next) {
    try {
      const analytics = await dashboardService.getInventoryAnalytics();
      
      res.json(
        ApiResponse.success({ analytics })
      );
    } catch (error) {
      next(error);
    }
  }

  async getPurchaseOrderAnalytics(req, res, next) {
    try {
      const { days = 30 } = req.query;
      const analytics = await dashboardService.getPurchaseOrderAnalytics(parseInt(days));
      
      res.json(
        ApiResponse.success({ analytics })
      );
    } catch (error) {
      next(error);
    }
  }

  async getShipmentAnalytics(req, res, next) {
    try {
      const { days = 30 } = req.query;
      const analytics = await dashboardService.getShipmentAnalytics(parseInt(days));
      
      res.json(
        ApiResponse.success({ analytics })
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();