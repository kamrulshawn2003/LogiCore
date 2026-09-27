const addressService = require('../services/addressService');
const ApiResponse = require('../utils/ApiResponse');

class AddressController {
  async listAddresses(req, res, next) {
    try {
      const addresses = await addressService.listAddresses(req.user.id);
      res.json(ApiResponse.success({ addresses }));
    } catch (error) {
      next(error);
    }
  }

  async createAddress(req, res, next) {
    try {
      const address = await addressService.createAddress(req.user.id, req.body);
      res.status(201).json(ApiResponse.success({ address }));
    } catch (error) {
      next(error);
    }
  }

  async updateAddress(req, res, next) {
    try {
      const address = await addressService.updateAddress(
        req.user.id,
        req.params.id,
        req.body
      );
      res.json(ApiResponse.success({ address }));
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return res.status(404).json(ApiResponse.error(error.message));
      }
      next(error);
    }
  }

  async setDefault(req, res, next) {
    try {
      const address = await addressService.setDefault(req.user.id, req.params.id);
      res.json(ApiResponse.success({ address }));
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return res.status(404).json(ApiResponse.error(error.message));
      }
      next(error);
    }
  }

  async deleteAddress(req, res, next) {
    try {
      const result = await addressService.deleteAddress(req.user.id, req.params.id);
      res.json(ApiResponse.success(result));
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return res.status(404).json(ApiResponse.error(error.message));
      }
      next(error);
    }
  }
}

module.exports = new AddressController();
