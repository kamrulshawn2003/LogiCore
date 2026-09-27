import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { cartService } from '../../services/cartService';
import { addressService } from '../../services/addressService';
import { orderService } from '../../services/orderService';
import { useCart } from '../../context/CartContext';
import ProductImage from '../../components/common/ProductImage';
import toast from 'react-hot-toast';
import {
  FiMapPin,
  FiPlus,
  FiCreditCard,
  FiTruck,
  FiCheckCircle,
  FiChevronRight,
} from 'react-icons/fi';

const PAYMENT_METHODS = [
  { value: 'ONLINE', label: 'Online Payment', icon: FiCreditCard, note: 'Simulated instant payment' },
  { value: 'CARD', label: 'Bank Card', icon: FiCreditCard, note: 'Simulated card checkout' },
  { value: 'COD', label: 'Cash on Delivery', icon: FiTruck, note: 'Pay when you receive' },
];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { refresh } = useCart();

  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('ONLINE');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  // New address form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip: '',
    country: 'China',
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, a] = await Promise.all([cartService.getCart(), addressService.getAll()]);
      setCart(c);
      setAddresses(a);
      const def = a.find((addr) => addr.is_default) || a[0] || null;
      setSelectedAddress(def);
    } catch (error) {
      console.error('Failed to load checkout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const created = await addressService.create(form);
      const updated = await addressService.getAll();
      setAddresses(updated);
      setSelectedAddress(created);
      setShowForm(false);
      setForm({ full_name: '', phone: '', address_line1: '', address_line2: '', city: '', state: '', zip: '', country: 'China' });
      toast.success('Address added');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a shipping address');
      return;
    }
    setPlacing(true);
    try {
      const order = await orderService.checkout({ address_id: selectedAddress.id, payment_method: paymentMethod });
      setPlacedOrder(order);
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  // Success screen
  if (placedOrder) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <FiCheckCircle className="h-20 w-20 mx-auto text-green-500" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Order Placed!</h1>
        <p className="mt-2 text-gray-500">
          Order <span className="font-semibold text-gray-800">{placedOrder.order_number}</span> has been
          created. Total: <span className="font-bold text-brand-600">${Number(placedOrder.total_amount).toFixed(2)}</span>
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(`/my-orders`)}
            className="bg-brand-600 text-white font-semibold px-6 py-3 rounded-md hover:bg-brand-700 transition-colors"
          >
            View My Orders
          </button>
          <button
            onClick={() => navigate('/store')}
            className="border border-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-md hover:border-brand-600 hover:text-brand-600 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-gray-900">Nothing to checkout</h1>
        <p className="mt-2 text-gray-500">Your cart is empty.</p>
        <button
          onClick={() => navigate('/store')}
          className="mt-6 bg-brand-600 text-white font-semibold px-8 py-3 rounded-md hover:bg-brand-700 transition-colors"
        >
          Go Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Address */}
          <section className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center">1</span>
                Shipping Address
              </h2>
              <button
                onClick={() => setShowForm(!showForm)}
                className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                {showForm ? 'Cancel' : <><FiPlus className="h-4 w-4" /> New Address</>}
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleAddAddress} className="mb-5 grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                <input required placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
                <input required placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
                <input required placeholder="Address line 1" value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-md text-sm" />
                <input placeholder="Address line 2 (optional)" value={form.address_line2} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-md text-sm" />
                <input required placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
                <input placeholder="State / Province" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
                <input placeholder="ZIP / Postal code" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
                <input placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
                <button type="submit" className="md:col-span-2 bg-brand-600 text-white font-medium py-2.5 rounded-md hover:bg-brand-700 text-sm">
                  Save Address
                </button>
              </form>
            )}

            {addresses.length === 0 ? (
              <p className="text-sm text-gray-400">No saved addresses. Add one to continue.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => setSelectedAddress(addr)}
                    className={`text-left p-4 rounded-lg border transition-colors ${
                      selectedAddress?.id === addr.id
                        ? 'border-brand-600 bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900 text-sm">{addr.full_name}</span>
                      {addr.is_default && (
                        <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded">Default</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{addr.phone}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {addr.address_line1}
                      {addr.address_line2 ? `, ${addr.address_line2}` : ''}, {addr.city}
                      {addr.state ? `, ${addr.state}` : ''} {addr.zip || ''}, {addr.country}
                    </p>
                    {selectedAddress?.id === addr.id && (
                      <span className="text-xs text-brand-600 mt-2 inline-flex items-center gap-1">
                        <FiCheckCircle className="h-3.5 w-3.5" /> Selected
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            <Link to="/addresses" className="mt-3 inline-block text-sm text-gray-500 hover:text-brand-600">
              Manage all addresses <FiChevronRight className="inline h-3.5 w-3.5" />
            </Link>
          </section>

          {/* Step 2: Payment */}
          <section className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center">2</span>
              Payment Method
            </h2>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-colors text-left ${
                    paymentMethod === method.value
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <method.icon className={`h-6 w-6 ${paymentMethod === method.value ? 'text-brand-600' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900 text-sm">{method.label}</span>
                    <p className="text-xs text-gray-400">{method.note}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 ${
                      paymentMethod === method.value ? 'border-brand-600 bg-brand-600' : 'border-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Order summary */}
        <div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24">
            <h3 className="font-bold text-gray-900 text-lg">Order Summary</h3>
            <div className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                    <ProductImage src={item.product.image_url} name={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 line-clamp-2">{item.product.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">x {item.quantity}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">${Number(item.subtotal).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 text-sm border-t border-gray-100 pt-4">
              <div className="flex justify-between text-gray-600">
                <span>Items ({cart.total_quantity})</span>
                <span>${Number(cart.total_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span>
                <span className="text-brand-600 text-xl">${Number(cart.total_amount).toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={placing || !selectedAddress}
              className="mt-5 w-full bg-brand-600 text-white font-semibold py-3 rounded-md hover:bg-brand-700 transition-colors disabled:bg-gray-300 flex items-center justify-center gap-1"
            >
              {placing ? (
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
              ) : (
                <>Place Order</>
              )}
            </button>
            {!selectedAddress && (
              <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                <FiMapPin className="h-3.5 w-3.5" /> Select a shipping address first
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
