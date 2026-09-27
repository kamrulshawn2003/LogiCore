const cartService = require('../services/cartService');
const ApiResponse = require('../utils/ApiResponse');

class CartController {
  async getCart(req, res, next) {
    try {
      const cart = await cartService.getCart(req.user.id);
      res.json(ApiResponse.success({ cart }));
    } catch (error) {
      next(error);
    }
  }

  async getCartCount(req, res, next) {
    try {
      const count = await cartService.getCartCount(req.user.id);
      res.json(ApiResponse.success({ count }));
    } catch (error) {
      next(error);
    }
  }

  async addItem(req, res, next) {
    try {
      const { product_id, quantity } = req.body;
      const cart = await cartService.addItem(req.user.id, product_id, quantity || 1);
      res.json(ApiResponse.success({ cart }));
    } catch (error) {
      if (error.message.includes('Insufficient') || error.message === 'Product not available') {
        return res.status(400).json(ApiResponse.error(error.message));
      }
      next(error);
    }
  }

  async updateQuantity(req, res, next) {
    try {
      const { quantity } = req.body;
      const cart = await cartService.updateQuantity(req.user.id, req.params.id, quantity);
      res.json(ApiResponse.success({ cart }));
    } catch (error) {
      if (
        error.message === 'Cart item not found' ||
        error.message.includes('Insufficient') ||
        error.message === 'Quantity must be at least 1'
      ) {
        return res.status(400).json(ApiResponse.error(error.message));
      }
      next(error);
    }
  }

  async removeItem(req, res, next) {
    try {
      const cart = await cartService.removeItem(req.user.id, req.params.id);
      res.json(ApiResponse.success({ cart }));
    } catch (error) {
      if (error.message === 'Cart item not found') {
        return res.status(404).json(ApiResponse.error(error.message));
      }
      next(error);
    }
  }

  async clearCart(req, res, next) {
    try {
      const result = await cartService.clearCart(req.user.id);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CartController();
