const { Op } = require('sequelize');
const {
  Product,
  Category,
  ProductImage,
  Review,
  Inventory,
  OrderItem,
  Supplier,
  User
} = require('../models');

class StoreService {
  /**
   * Home page data: categories + featured + new arrivals + best sellers
   */
  async getHome() {
    const categories = await Category.findAll({
      attributes: ['id', 'name'],
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['id'],
          where: { status: 'active' },
          required: false
        }
      ]
    });

    const featured = await this.listProducts({ limit: 8, sortBy: 'featured' });
    const newArrivals = await this.listProducts({ limit: 8, sortBy: 'newest' });
    const bestSellers = await this.listProducts({ limit: 8, sortBy: 'sales' });

    return {
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        product_count: c.products ? c.products.length : 0
      })),
      featured_products: featured.products,
      new_arrivals: newArrivals.products,
      best_sellers: bestSellers.products
    };
  }

  /**
   * Public product listing with filters & sort
   */
  async listProducts(query = {}) {
    const {
      page = 1,
      limit = 12,
      search = '',
      category_id = '',
      min_price = '',
      max_price = '',
      sortBy = 'featured'
    } = query;

    const where = { status: 'active' };

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    if (category_id) {
      where.category_id = category_id;
    }

    if (min_price) {
      where.price = { [Op.gte]: min_price };
    }

    if (max_price) {
      where.price = { ...where.price, [Op.lte]: max_price };
    }

    const order = [];
    switch (sortBy) {
      case 'price_asc':
        order.push(['price', 'ASC']);
        break;
      case 'price_desc':
        order.push(['price', 'DESC']);
        break;
      case 'newest':
        order.push(['created_at', 'DESC']);
        break;
      case 'sales':
        order.push(['created_at', 'DESC']);
        break;
      case 'featured':
      default:
        order.push(['updated_at', 'DESC']);
        break;
    }

    const { rows, count } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: ProductImage,
          as: 'images',
          attributes: ['id', 'image_url', 'is_primary'],
          required: false
        },
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['quantity', 'reserved_quantity'],
          required: false
        },
        {
          model: Review,
          as: 'reviews',
          attributes: ['rating'],
          required: false
        },
        {
          model: OrderItem,
          as: 'orderItems',
          attributes: ['quantity'],
          required: false
        }
      ],
      order,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true
    });

    const products = rows.map((p) => this.decorateProduct(p));

    if (sortBy === 'rating') {
      products.sort((a, b) => b.avg_rating - a.avg_rating || b.sales_count - a.sales_count);
    } else if (sortBy === 'sales') {
      products.sort((a, b) => b.sales_count - a.sales_count);
    }

    return {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Product detail with gallery, rating, stock, reviews and related items
   */
  async getProductDetail(id) {
    const product = await Product.findByPk(id, {
      where: { status: 'active' },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'rating']
        },
        {
          model: ProductImage,
          as: 'images',
          attributes: ['id', 'image_url', 'is_primary', 'sort_order'],
          order: [['sort_order', 'ASC']],
          required: false
        },
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['quantity', 'reserved_quantity'],
          required: false
        },
        {
          model: Review,
          as: 'reviews',
          attributes: ['id', 'rating', 'title', 'comment', 'is_verified', 'created_at', 'user_id'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'avatar_url']
            }
          ],
          order: [['created_at', 'DESC']],
          limit: 20,
          required: false
        }
      ]
    });

    if (!product) {
      const err = new Error('Product not found');
      err.code = 'NOT_FOUND';
      throw err;
    }

    const detail = this.decorateProduct(product);
    detail.reviews = product.reviews || [];

    // Full rating summary from ALL reviews (not just the latest 20)
    const allReviews = await Review.findAll({
      where: { product_id: id },
      attributes: ['rating']
    });
    const byRating = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allReviews.forEach((r) => {
      if (byRating[r.rating] !== undefined) byRating[r.rating] += 1;
    });
    detail.rating_summary = {
      total: allReviews.length,
      by_rating: byRating
    };

    // Related products in the same category
    let related = [];
    if (product.category_id) {
      related = await Product.findAll({
        where: {
          status: 'active',
          category_id: product.category_id,
          id: { [Op.ne]: id }
        },
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
          }
        ],
        limit: 4
      });
    }
    detail.related_products = related.map((p) => this.decorateProduct(p));

    return detail;
  }

  /**
   * Decorate a product row with stock / rating / sales computed fields
   */
  decorateProduct(product) {
    const p = product.toJSON();

    const totalStock = (p.inventory || []).reduce((sum, inv) => sum + Number(inv.quantity || 0), 0);
    const totalReserved = (p.inventory || []).reduce(
      (sum, inv) => sum + Number(inv.reserved_quantity || 0),
      0
    );

    const reviews = p.reviews || [];
    const avgRating = reviews.length
      ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length
      : 0;
    const salesCount = (p.orderItems || []).reduce((sum, oi) => sum + Number(oi.quantity || 0), 0);

    const images = p.images || [];
    const primaryImage =
      images.find((img) => img.is_primary) || images[0] || (p.image_url ? { image_url: p.image_url } : null);

    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      unit: p.unit,
      category: p.category || null,
      supplier: p.supplier || null,
      image_url: primaryImage ? primaryImage.image_url : p.image_url,
      images: images.length ? images : p.image_url ? [{ image_url: p.image_url, is_primary: true }] : [],
      total_stock: totalStock,
      available_stock: totalStock - totalReserved,
      avg_rating: Math.round(avgRating * 10) / 10,
      review_count: reviews.length,
      sales_count: salesCount,
      weight: p.weight,
      dimensions: p.dimensions,
      created_at: p.created_at
    };
  }
}

module.exports = new StoreService();
