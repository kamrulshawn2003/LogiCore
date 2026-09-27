import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { storeService } from '../../services/storeService';
import { cartService } from '../../services/cartService';
import { wishlistService } from '../../services/wishlistService';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import ProductImage from '../../components/common/ProductImage';
import StarRating from '../../components/common/StarRating';
import ProductCard from '../../components/common/ProductCard';
import toast from 'react-hot-toast';
import {
  FiShoppingCart,
  FiHeart,
  FiChevronRight,
  FiTruck,
  FiShield,
  FiCheckCircle,
} from 'react-icons/fi';

const StoreProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { refresh } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [wished, setWished] = useState(false);
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const result = await storeService.getProductById(id);
      setProduct(result);
      if (user) {
        try {
          const map = await wishlistService.getMap();
          setWished(!!map[result.id]);
        } catch (e) {
          /* wishlist optional */
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Product not found');
      navigate('/store');
    } finally {
      setLoading(false);
    }
  };

  const requireAuth = () => {
    if (!user) {
      toast.error('Please sign in first');
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return false;
    }
    return true;
  };

  const handleAddToCart = async (thenCheckout = false) => {
    if (!requireAuth()) return;
    setAdding(true);
    try {
      await cartService.addItem(product.id, quantity);
      refresh();
      if (thenCheckout) {
        navigate('/cart');
      } else {
        toast.success('Added to cart');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!requireAuth()) return;
    try {
      if (wished) {
        await wishlistService.remove(product.id);
        setWished(false);
        toast.success('Removed from wishlist');
      } else {
        await wishlistService.add(product.id);
        setWished(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update wishlist');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!product) return null;

  const images = product.images && product.images.length ? product.images : [];
  const gallery = images.length
    ? images.map((img) => img.image_url)
    : [product.image_url];

  const ratingPct = (rating) =>
    product.review_count ? Math.round((rating / product.review_count) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-5">
        <Link to="/store" className="hover:text-brand-600">Home</Link>
        <FiChevronRight className="h-4 w-4" />
        <Link to="/store/products" className="hover:text-brand-600">All Products</Link>
        {product.category && (
          <>
            <FiChevronRight className="h-4 w-4" />
            <Link
              to={`/store/products?category_id=${product.category.id}`}
              className="hover:text-brand-600"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <FiChevronRight className="h-4 w-4" />
        <span className="text-gray-800 line-clamp-1">{product.name}</span>
      </nav>

      {/* Main product area */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gallery */}
        <div>
          <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
            <ProductImage
              src={gallery[activeImage]}
              name={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-16 h-16 rounded-md overflow-hidden border-2 flex-shrink-0 transition-colors ${
                    idx === activeImage ? 'border-brand-600' : 'border-gray-200'
                  }`}
                >
                  <ProductImage src={img} name={product.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <div className="mt-2 flex items-center gap-3 text-sm">
            <StarRating value={product.avg_rating || 0} size="h-4 w-4" />
            <span className="text-gray-400">{product.review_count} reviews</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">{product.sales_count} sold</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-400">SKU: {product.sku}</span>
          </div>

          {/* Price */}
          <div className="mt-5 bg-brand-50 rounded-lg px-5 py-4">
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-brand-600">
                ${Number(product.price).toFixed(2)}
              </span>
              {product.unit && <span className="text-sm text-gray-500 mb-1">/{product.unit}</span>}
            </div>
          </div>

          {/* Stock */}
          <div className="mt-4 text-sm">
            {product.available_stock > 0 ? (
              <span className="text-green-600 flex items-center gap-1">
                <FiCheckCircle className="h-4 w-4" />
                In stock ({product.available_stock} available)
              </span>
            ) : (
              <span className="text-red-500 font-medium">Out of stock</span>
            )}
          </div>

          {/* Quantity */}
          <div className="mt-5 flex items-center gap-4">
            <span className="text-sm text-gray-600">Quantity</span>
            <div className="flex items-center border border-gray-300 rounded-md">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 text-gray-600 hover:bg-gray-50"
              >
                −
              </button>
              <span className="px-4 py-2 border-x border-gray-300 min-w-[3rem] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(product.available_stock || 1, quantity + 1))}
                className="px-3 py-2 text-gray-600 hover:bg-gray-50"
              >
                +
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => handleAddToCart(false)}
              disabled={product.available_stock === 0 || adding}
              className="flex items-center gap-2 px-8 py-3 rounded-md bg-yellow-400 text-gray-900 font-semibold hover:bg-yellow-500 transition-colors disabled:bg-gray-300"
            >
              <FiShoppingCart className="h-5 w-5" />
              Add to Cart
            </button>
            <button
              onClick={() => handleAddToCart(true)}
              disabled={product.available_stock === 0 || adding}
              className="px-8 py-3 rounded-md bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors disabled:bg-gray-300"
            >
              Buy Now
            </button>
            <button
              onClick={handleToggleWishlist}
              className={`flex items-center gap-2 px-5 py-3 rounded-md border font-medium transition-colors ${
                wished
                  ? 'border-brand-600 text-brand-600 bg-brand-50'
                  : 'border-gray-300 text-gray-600 hover:border-brand-600 hover:text-brand-600'
              }`}
            >
              <FiHeart className={`h-5 w-5 ${wished ? 'fill-brand-600' : ''}`} />
              {wished ? 'Wishlisted' : 'Wishlist'}
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-3 gap-2 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <FiTruck className="h-4 w-4 text-brand-600" /> Fast tracked delivery
            </div>
            <div className="flex items-center gap-1.5">
              <FiShield className="h-4 w-4 text-brand-600" /> Verified purchase reviews
            </div>
            <div className="flex items-center gap-1.5">
              <FiCheckCircle className="h-4 w-4 text-brand-600" /> Stock guaranteed
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: description / reviews */}
      <div className="mt-8 bg-white rounded-xl border border-gray-100">
        <div className="flex border-b border-gray-100">
          {[
            { key: 'description', label: 'Product Details' },
            { key: 'reviews', label: `Reviews (${product.review_count})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'description' ? (
            <div className="prose max-w-none text-gray-700">
              <p className="whitespace-pre-line">{product.description || 'No description available.'}</p>
              {product.weight && (
                <p className="mt-4 text-sm text-gray-500">Weight: {product.weight}</p>
              )}
              {product.dimensions && (
                <p className="text-sm text-gray-500">Dimensions: {product.dimensions}</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Summary */}
              <div>
                <div className="text-center lg:text-left">
                  <div className="text-4xl font-black text-gray-900">
                    {product.avg_rating ? product.avg_rating.toFixed(1) : '—'}
                  </div>
                  <div className="mt-1 flex justify-center lg:justify-start">
                    <StarRating value={product.avg_rating || 0} size="h-4 w-4" />
                  </div>
                  <p className="mt-1 text-sm text-gray-400">{product.review_count} reviews</p>
                </div>
                <div className="mt-4 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = product.rating_summary?.by_rating?.[star] || 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="w-8">{star} star</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${ratingPct(count)}%` }}
                          />
                        </div>
                        <span className="w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Review list */}
              <div className="lg:col-span-3 space-y-5">
                {!product.reviews || product.reviews.length === 0 ? (
                  <p className="text-gray-500 text-sm py-10 text-center">
                    No reviews yet. Be the first to review this product!
                  </p>
                ) : (
                  product.reviews.map((review) => (
                    <div key={review.id} className="border border-gray-100 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-sm">
                            {(review.user?.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{review.user?.name || 'User'}</p>
                            <div className="flex items-center gap-2">
                              <StarRating value={review.rating} size="h-3.5 w-3.5" />
                              <span className="text-xs text-gray-400">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        {review.is_verified && (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      {review.title && (
                        <p className="mt-3 text-sm font-semibold text-gray-800">{review.title}</p>
                      )}
                      {review.comment && (
                        <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">{review.comment}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related products */}
      {product.related_products && product.related_products.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {product.related_products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default StoreProductDetailPage;
