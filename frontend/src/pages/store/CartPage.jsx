import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartService } from '../../services/cartService';
import { useCart } from '../../context/CartContext';
import ProductImage from '../../components/common/ProductImage';
import { FiShoppingCart, FiTrash2, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CartPage = () => {
  const navigate = useNavigate();
  const { refresh } = useCart();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const result = await cartService.getCart();
      setCart(result);
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return;
    setUpdating(true);
    try {
      const result = await cartService.updateQuantity(itemId, quantity);
      setCart(result);
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update quantity');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async (itemId) => {
    setUpdating(true);
    try {
      const result = await cartService.removeItem(itemId);
      setCart(result);
      refresh();
      toast.success('Item removed');
    } catch (error) {
      toast.error('Failed to remove item');
    } finally {
      setUpdating(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Clear your entire cart?')) return;
    try {
      await cartService.clearCart();
      setCart({ items: [], total_quantity: 0, total_amount: 0 });
      refresh();
      toast.success('Cart cleared');
    } catch (error) {
      toast.error('Failed to clear cart');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <FiShoppingCart className="h-16 w-16 mx-auto text-gray-300" />
        <h2 className="mt-4 text-xl font-bold text-gray-900">Your cart is empty</h2>
        <p className="mt-2 text-gray-500">Looks like you haven't added anything yet.</p>
        <button
          onClick={() => navigate('/store')}
          className="mt-6 bg-brand-600 text-white font-semibold px-8 py-3 rounded-md hover:bg-brand-700 transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4"
            >
              <button
                onClick={() => navigate(`/product/${item.product.id}`)}
                className="w-24 h-24 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0"
              >
                <ProductImage
                  src={item.product.image_url}
                  name={item.product.name}
                  className="w-full h-full object-cover"
                />
              </button>

              <div className="flex-1 min-w-0">
                <button
                  onClick={() => navigate(`/product/${item.product.id}`)}
                  className="text-sm font-medium text-gray-900 hover:text-brand-600 line-clamp-2 text-left"
                >
                  {item.product.name}
                </button>
                <p className="text-xs text-gray-400 mt-1">SKU: {item.product.sku}</p>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      disabled={updating || item.quantity <= 1}
                      className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="px-4 py-1.5 border-x border-gray-300 min-w-[2.5rem] text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      disabled={updating || item.quantity >= item.available_stock}
                      className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-bold text-brand-600">
                      ${Number(item.subtotal).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Remove item"
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {item.quantity >= item.available_stock && (
                  <p className="mt-2 text-xs text-orange-500">
                    Max stock reached ({item.available_stock} available)
                  </p>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={handleClear}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            Clear entire cart
          </button>
        </div>

        {/* Summary */}
        <div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24">
            <h3 className="font-bold text-gray-900 text-lg">Order Summary</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Items ({cart.total_quantity})</span>
                <span>${Number(cart.total_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span className="text-brand-600 text-xl">${Number(cart.total_amount).toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="mt-5 w-full bg-brand-600 text-white font-semibold py-3 rounded-md hover:bg-brand-700 transition-colors flex items-center justify-center gap-1"
            >
              Checkout <FiChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/store')}
              className="mt-2 w-full text-sm text-gray-500 hover:text-brand-600 py-2"
            >
              Continue shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
