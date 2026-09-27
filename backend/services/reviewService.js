const { Review, Order, OrderItem, User, Product } = require('../models');
const { Op } = require('sequelize');

class ReviewService {
  /**
   * Create a review. Customer must own a DELIVERED order containing the product.
   */
  async createReview(userId, data) {
    const { product_id, order_id, rating, title, comment } = data;

    if (!rating || rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const order = await Order.findOne({
      where: { id: order_id, customer_id: userId }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'DELIVERED') {
      throw new Error('You can only review products from delivered orders');
    }

    const orderItem = await OrderItem.findOne({
      where: { order_id: order.id, product_id }
    });

    if (!orderItem) {
      throw new Error('Product is not part of this order');
    }

    const existing = await Review.findOne({
      where: { user_id: userId, product_id, order_id }
    });

    if (existing) {
      throw new Error('You have already reviewed this product for this order');
    }

    const review = await Review.create({
      product_id,
      user_id: userId,
      order_id,
      rating,
      title: title || null,
      comment: comment || null,
      is_verified: true
    });

    return this.getReviewById(review.id);
  }

  async getReviewById(id) {
    const review = await Review.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar_url']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'image_url']
        }
      ]
    });

    if (!review) {
      const err = new Error('Review not found');
      err.code = 'NOT_FOUND';
      throw err;
    }

    return review;
  }

  /**
   * Public: reviews for a product with pagination
   */
  async getProductReviews(productId, query = {}) {
    const { page = 1, limit = 10 } = query;

    const { rows, count } = await Review.findAndCountAll({
      where: { product_id: productId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar_url']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    const summary = await this.getRatingSummary(productId);

    return {
      reviews: rows,
      summary,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getRatingSummary(productId) {
    const reviews = await Review.findAll({
      where: { product_id: productId },
      attributes: ['rating']
    });

    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);

    const byRating = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      if (byRating[r.rating] !== undefined) byRating[r.rating] += 1;
    });

    return {
      average: total ? Math.round((sum / total) * 10) / 10 : 0,
      total,
      by_rating: byRating
    };
  }

  /**
   * Customer's own reviews
   */
  async getMyReviews(userId, query = {}) {
    const { page = 1, limit = 10 } = query;

    const { rows, count } = await Review.findAndCountAll({
      where: { user_id: userId },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'image_url', 'price']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    return {
      reviews: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }
}

module.exports = new ReviewService();
