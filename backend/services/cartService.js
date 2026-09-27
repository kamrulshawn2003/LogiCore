const { Cart, CartItem, Product, ProductImage, Inventory, Review } = require('../models');

class CartService {
  /**
   * Get (or lazily create) the user's cart with full item details
   */
  async getCart(userId) {
    const cart = await this.getOrCreateCart(userId);

    const items = await CartItem.findAll({
      where: { cart_id: cart.id },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'sku', 'name', 'price', 'image_url', 'unit', 'status', 'description'],
          include: [
            {
              model: ProductImage,
              as: 'images',
              attributes: ['id', 'image_url', 'is_primary'],
              required: false
            },
            {
              model: Review,
              as: 'reviews',
              attributes: ['rating'],
              required: false
            },
            {
              model: Inventory,
              as: 'inventory',
              attributes: ['quantity', 'reserved_quantity'],
              required: false
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const enriched = items
      .filter((item) => item.product !== null)
      .map((item) => {
        const product = item.product;
        const images = product.images || [];
        const image =
          images.find((img) => img.is_primary)?.image_url ||
          images[0]?.image_url ||
          product.image_url ||
          null;

        const inventory = product.inventory || [];
        const availableStock = inventory.reduce(
          (sum, inv) => sum + (Number(inv.quantity || 0) - Number(inv.reserved_quantity || 0)),
          0
        );

        const reviews = product.reviews || [];
        const avgRating = reviews.length
          ? Math.round((reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length) * 10) / 10
          : 0;

        return {
          id: item.id,
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
          subtotal: Math.round(Number(item.unit_price) * item.quantity * 100) / 100,
          available_stock: availableStock,
          product: {
            id: product.id,
            sku: product.sku,
            name: product.name,
            price: Number(product.price),
            unit: product.unit,
            status: product.status,
            image_url: image,
            description: product.description,
            avg_rating: avgRating,
            review_count: reviews.length
          }
        };
      });

    const totalQuantity = enriched.reduce((sum, i) => sum + i.quantity, 0);
    const totalAmount = enriched.reduce((sum, i) => sum + i.subtotal, 0);

    return {
      id: cart.id,
      items: enriched,
      total_quantity: totalQuantity,
      total_amount: Math.round(totalAmount * 100) / 100
    };
  }

  async getCartCount(userId) {
    const cart = await Cart.findOne({ where: { user_id: userId } });
    if (!cart) return 0;
    const result = await CartItem.sum('quantity', { where: { cart_id: cart.id } });
    return result || 0;
  }

  async addItem(userId, productId, quantity = 1) {
    if (quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }

    const product = await Product.findByPk(productId);
    if (!product || product.status !== 'active') {
      throw new Error('Product not available');
    }

    const availableStock = await this.getAvailableStock(productId);

    const cart = await this.getOrCreateCart(userId);
    const existing = await CartItem.findOne({
      where: { cart_id: cart.id, product_id: productId }
    });

    const newQuantity = (existing ? existing.quantity : 0) + quantity;
    if (newQuantity > availableStock) {
      throw new Error(`Insufficient stock for ${product.name}. Available: ${availableStock}`);
    }

    if (existing) {
      await existing.update({ quantity: newQuantity });
    } else {
      await CartItem.create({
        cart_id: cart.id,
        product_id: productId,
        quantity,
        unit_price: product.price
      });
    }

    return this.getCart(userId);
  }

  async updateQuantity(userId, itemId, quantity) {
    if (quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }

    const cart = await this.getOrCreateCart(userId);
    const item = await CartItem.findOne({
      where: { id: itemId, cart_id: cart.id },
      include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }]
    });

    if (!item) {
      throw new Error('Cart item not found');
    }

    const availableStock = await this.getAvailableStock(item.product_id);
    if (quantity > availableStock) {
      throw new Error(
        `Insufficient stock for ${item.product.name}. Available: ${availableStock}`
      );
    }

    await item.update({ quantity });
    return this.getCart(userId);
  }

  async removeItem(userId, itemId) {
    const cart = await this.getOrCreateCart(userId);
    const item = await CartItem.findOne({
      where: { id: itemId, cart_id: cart.id }
    });

    if (!item) {
      throw new Error('Cart item not found');
    }

    await item.destroy();
    return this.getCart(userId);
  }

  async clearCart(userId) {
    const cart = await Cart.findOne({ where: { user_id: userId } });
    if (cart) {
      await CartItem.destroy({ where: { cart_id: cart.id } });
    }
    return { message: 'Cart cleared' };
  }

  async getOrCreateCart(userId) {
    let cart = await Cart.findOne({ where: { user_id: userId } });
    if (!cart) {
      cart = await Cart.create({ user_id: userId });
    }
    return cart;
  }

  async getAvailableStock(productId) {
    const inventoryRows = await Inventory.findAll({
      where: { product_id: productId },
      attributes: ['quantity', 'reserved_quantity']
    });
    return inventoryRows.reduce(
      (sum, inv) => sum + (Number(inv.quantity || 0) - Number(inv.reserved_quantity || 0)),
      0
    );
  }
}

module.exports = new CartService();
