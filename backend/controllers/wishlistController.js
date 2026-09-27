const wishlistService = require('../services/wishlistService');
const ApiResponse = require('../utils/ApiResponse');

class WishlistController {
  async listWishlist(req, res, next) {
    try {
      const wishlist = await wishlistService.listWishlist(req.user.id);
      res.json(ApiResponse.success({ wishlist }));
    } catch (error) {
      next(error);
    }
  }

  async addToWishlist(req, res, next) {
    try {
      const result = await wishlistService.addToWishlist(req.user.id, req.params.productId);
      res.json(ApiResponse.success(result));
    } catch (error) {
      if (error.message === 'Product not available') {
        return res.status(400).json(ApiResponse.error(error.message));
      }
      next(error);
    }
  }

  async removeFromWishlist(req, res, next) {
    try {
      const result = await wishlistService.removeFromWishlist(req.user.id, req.params.productId);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getWishlistMap(req, res, next) {
    try {
      const map = await wishlistService.getWishlistMap(req.user.id);
      res.json(ApiResponse.success({ wished: map }));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WishlistController();
