const reportService = require('../services/reportService');
const ApiResponse = require('../utils/ApiResponse');

class ReportController {
  async generateSalesReport(req, res, next) {
    try {
      const { start_date, end_date, group_by } = req.query;
      
      if (!start_date || !end_date) {
        return res.status(400).json(
          ApiResponse.error('start_date and end_date are required')
        );
      }
      
      const report = await reportService.generateSalesReport({
        start_date,
        end_date,
        group_by
      });
      
      res.json(
        ApiResponse.success({ report })
      );
    } catch (error) {
      next(error);
    }
  }

  async generateInventoryReport(req, res, next) {
    try {
      const { warehouse_id } = req.query;
      const report = await reportService.generateInventoryReport({ warehouse_id });
      
      res.json(
        ApiResponse.success({ report })
      );
    } catch (error) {
      next(error);
    }
  }

  async generatePurchaseReport(req, res, next) {
    try {
      const { start_date, end_date, supplier_id } = req.query;
      
      if (!start_date || !end_date) {
        return res.status(400).json(
          ApiResponse.error('start_date and end_date are required')
        );
      }
      
      const report = await reportService.generatePurchaseReport({
        start_date,
        end_date,
        supplier_id
      });
      
      res.json(
        ApiResponse.success({ report })
      );
    } catch (error) {
      next(error);
    }
  }

  async generateShipmentReport(req, res, next) {
    try {
      const { start_date, end_date, status } = req.query;
      
      if (!start_date || !end_date) {
        return res.status(400).json(
          ApiResponse.error('start_date and end_date are required')
        );
      }
      
      const report = await reportService.generateShipmentReport({
        start_date,
        end_date,
        status
      });
      
      res.json(
        ApiResponse.success({ report })
      );
    } catch (error) {
      next(error);
    }
  }

  async generateSupplierPerformanceReport(req, res, next) {
    try {
      const report = await reportService.generateSupplierPerformanceReport();
      
      res.json(
        ApiResponse.success({ report })
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportController();