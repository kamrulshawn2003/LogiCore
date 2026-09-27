import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { wishlistService } from '../../services/wishlistService';
import { cartService } from '../../services/cartService';
import { useCart } from '../../context/CartContext';
import ProductImage from '../../components/common/ProductImage';
import { FiHeart, FiShoppingCart, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const WishlistPage = () => {
  const navigate = useNavigate();
  const { refresh } = useCart();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const result = await wishlistService.getAll();
      setItems(result);
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await wishlistService.remove(productId);
      setItems(items.filter((i) => i.product.id !== productId));
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      await cartService.addItem(productId, 1);
      refresh();
      toast.success('Added to cart');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <FiHeart className="h-6 w-6 text-brand-600" /> My Wishlist
        <span className="text-sm font-normal text-gray-400">({items.length})</span>
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <FiHeart className="h-16 w-16 mx-auto text-gray-300" />
          <p className="mt-4 text-gray-500">Your wishlist is empty.</p>
          <button
            onClick={() => navigate('/store')}
            className="mt-6 bg-brand-600 text-white font-semibold px-8 py-3 rounded-md hover:bg-brand-700 transition-colors"
          >
            Discover Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(({ product }) => (
            <div
              key={product.id}
              className="bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-shadow overflow-hidden cursor-pointer group"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <div className="aspect-square bg-gray-50 overflow-hidden">
                <ProductImage
                  src={product.image_url}
                  name={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="p-3">
                <h3 className="text-sm text-gray-800 line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-bold text-brand-600">${Number(product.price).toFixed(2)}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product.id);
                      }}
                      className="p-2 text-brand-600 hover:bg-brand-50 rounded transition-colors"
                      title="Add to cart"
                    >
                      <FiShoppingCart className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(product.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Remove"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
