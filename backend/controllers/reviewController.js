const reviewService = require('../services/reviewService');
const ApiResponse = require('../utils/ApiResponse');

class ReviewController {
  async createReview(req, res, next) {
    try {
      const review = await reviewService.createReview(req.user.id, req.body);
      res.status(201).json(ApiResponse.success({ review }));
    } catch (error) {
      const badRequestMessages = [
        'Rating must be between 1 and 5',
        'Order not found',
        'You can only review products from delivered orders',
        'Product is not part of this order',
        'You have already reviewed this product for this order'
      ];
      if (badRequestMessages.includes(error.message)) {
        return res.status(400).json(ApiResponse.error(error.message));
      }
      next(error);
    }
  }

  async getProductReviews(req, res, next) {
    try {
      const result = await reviewService.getProductReviews(req.params.productId, req.query);
      res.json(
        ApiResponse.success(
          { reviews: result.reviews, summary: result.summary },
          result.pagination
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async getMyReviews(req, res, next) {
    try {
      const result = await reviewService.getMyReviews(req.user.id, req.query);
      res.json(ApiResponse.success(result.reviews, result.pagination));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReviewController();
