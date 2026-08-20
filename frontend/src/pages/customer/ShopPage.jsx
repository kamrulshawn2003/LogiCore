import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import Button from '../../components/common/Button';
import { FiSearch, FiShoppingCart } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState({});
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getAll({ limit: 50, status: 'active', search });
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    setCart(prev => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1
    }));
    toast.success(`${product.name} added to cart`);
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[productId];
      return newCart;
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(prev => ({
        ...prev,
        [productId]: quantity
      }));
    }
  };

  const calculateTotal = () => {
    return Object.entries(cart).reduce((total, [productId, quantity]) => {
      const product = products.find(p => p.id === parseInt(productId));
      return total + (product ? product.price * quantity : 0);
    }, 0);
  };

  const handleCheckout = async () => {
    try {
      const items = Object.entries(cart).map(([productId, quantity]) => ({
        product_id: parseInt(productId),
        quantity
      }));

      await orderService.create({ items });
      toast.success('Order placed successfully!');
      setCart({});
      setShowCart(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Shop Products</h2>
        <Button onClick={() => setShowCart(!showCart)}>
          <FiShoppingCart className="mr-2 h-5 w-5" />
          Cart ({Object.keys(cart).length})
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchProducts()}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{product.sku}</p>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{product.description}</p>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-2xl font-bold text-gray-900">
                    ${parseFloat(product.price).toFixed(2)}
                  </span>
                  <Button onClick={() => addToCart(product)}>
                    Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowCart(false)} />
            <div className="relative bg-white rounded-lg max-w-lg w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shopping Cart</h3>
                {Object.keys(cart).length === 0 ? (
                  <p className="text-gray-500">Your cart is empty</p>
                ) : (
                  <>
                    {Object.entries(cart).map(([productId, quantity]) => {
                      const product = products.find(p => p.id === parseInt(productId));
                      return (
                        <div key={productId} className="flex justify-between items-center mb-3">
                          <div>
                            <p className="font-medium">{product?.name}</p>
                            <p className="text-sm text-gray-500">${product?.price} x {quantity}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(parseInt(productId), quantity - 1)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              -
                            </button>
                            <span>{quantity}</span>
                            <button
                              onClick={() => updateQuantity(parseInt(productId), quantity + 1)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between">
                        <span className="font-semibold">Total:</span>
                        <span className="font-semibold">${calculateTotal().toFixed(2)}</span>
                      </div>
                      <Button onClick={handleCheckout} className="w-full mt-4">
                        Place Order
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopPage;