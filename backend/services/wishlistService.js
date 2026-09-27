const { Wishlist, Product, ProductImage } = require('../models');
const { Op } = require('sequelize');

class WishlistService {
  async listWishlist(userId) {
    const rows = await Wishlist.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Product,
          as: 'product',
          where: { status: 'active' },
          required: false,
          include: [
            {
              model: ProductImage,
              as: 'images',
              attributes: ['id', 'image_url', 'is_primary'],
              required: false
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return rows
      .filter((w) => w.product !== null)
      .map((w) => {
        const product = w.product;
        const images = product.images || [];
        return {
          id: w.id,
          created_at: w.created_at,
          product: {
            id: product.id,
            sku: product.sku,
            name: product.name,
            price: Number(product.price),
            unit: product.unit,
            image_url:
              images.find((i) => i.is_primary)?.image_url ||
              images[0]?.image_url ||
              product.image_url ||
              null,
            status: product.status
          }
        };
      });
  }

  async addToWishlist(userId, productId) {
    const product = await Product.findByPk(productId);
    if (!product || product.status !== 'active') {
      throw new Error('Product not available');
    }

    const existing = await Wishlist.findOne({
      where: { user_id: userId, product_id: productId }
    });

    if (!existing) {
      await Wishlist.create({ user_id: userId, product_id: productId });
    }

    return { wished: true };
  }

  async removeFromWishlist(userId, productId) {
    await Wishlist.destroy({
      where: { user_id: userId, product_id: productId }
    });
    return { wished: false };
  }

  /**
   * Return a map of productId -> true for the user's wishlist
   */
  async getWishlistMap(userId, productIds = []) {
    if (!userId) return {};
    const where = { user_id: userId };
    if (productIds && productIds.length) {
      where.product_id = { [Op.in]: productIds };
    }
    const rows = await Wishlist.findAll({ where, attributes: ['product_id'] });
    const map = {};
    rows.forEach((r) => {
      map[r.product_id] = true;
    });
    return map;
  }
}

module.exports = new WishlistService();
