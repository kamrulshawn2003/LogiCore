import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProductImage from './ProductImage';
import StarRating from './StarRating';
import { FiShoppingCart } from 'react-icons/fi';
import { cartService } from '../../services/cartService';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

/**
 * JD-style product card used on the storefront home, listing and wishlist pages.
 */
const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { refresh } = useCart();

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to add items to your cart');
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    try {
      await cartService.addItem(product.id, 1);
      toast.success('Added to cart');
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  return (
    <div
      className="bg-white rounded-lg border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all cursor-pointer group"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className="relative overflow-hidden rounded-t-lg aspect-square bg-gray-100">
        <ProductImage
          src={product.image_url}
          name={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <span className="absolute top-2 left-2 bg-brand-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow">Direct</span>
        {product.available_stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold text-sm bg-black/60 px-3 py-1 rounded">
              Sold Out
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm text-gray-800 line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-brand-600">${Number(product.price).toFixed(2)}</span>
            {product.unit && <span className="text-xs text-gray-400 ml-1">/{product.unit}</span>}
          </div>
          <StarRating value={product.avg_rating || 0} size="h-4 w-4" />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {product.sales_count || 0} sold
          </span>
          <button
            onClick={handleAddToCart}
            disabled={product.available_stock === 0}
            className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:bg-brand-50 rounded px-2 py-1 transition-colors disabled:text-gray-300 disabled:hover:bg-transparent"
            title="Add to cart"
          >
            <FiShoppingCart className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
