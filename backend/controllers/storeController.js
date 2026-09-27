const storeService = require('../services/storeService');
const ApiResponse = require('../utils/ApiResponse');

class StoreController {
  async getHome(req, res, next) {
    try {
      const data = await storeService.getHome();
      res.json(ApiResponse.success(data));
    } catch (error) {
      next(error);
    }
  }

  async listProducts(req, res, next) {
    try {
      const result = await storeService.listProducts(req.query);
      res.json(ApiResponse.success(result.products, result.pagination));
    } catch (error) {
      next(error);
    }
  }

  async getProductDetail(req, res, next) {
    try {
      const product = await storeService.getProductDetail(req.params.id);
      res.json(ApiResponse.success({ product }));
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return res.status(404).json(ApiResponse.error(error.message));
      }
      next(error);
    }
  }
}

module.exports = new StoreController();
