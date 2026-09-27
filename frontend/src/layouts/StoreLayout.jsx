import React, { useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  FiShoppingCart,
  FiSearch,
  FiHeart,
  FiMapPin,
  FiPackage,
  FiLogOut,
  FiUser,
  FiGrid,
} from 'react-icons/fi';

const StoreLayout = () => {
  const [search, setSearch] = useState('');
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/store/products?search=${encodeURIComponent(search)}`);
  };

  const handleLogout = () => {
    logout(); // AuthContext navigates to /store (guest view)
  };

  const navLinks = [
    { name: 'Home', href: '/store' },
    { name: 'All Products', href: '/store/products' },
    { name: 'New Arrivals', href: '/store/products?sortBy=newest' },
    { name: 'Best Sellers', href: '/store/products?sortBy=sales' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top utility bar */}
      <div className="bg-gray-100 text-xs text-gray-600">
        <div className="max-w-7xl mx-auto px-4 h-9 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <FiUser className="h-3.5 w-3.5 text-brand-600" />
            Hi, <span className="text-brand-600 font-medium">{user?.name || 'Welcome'}</span> — quality goods,
            fast delivery
          </span>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/my-orders" className="hover:text-brand-600 flex items-center gap-1">
                  <FiPackage className="h-3.5 w-3.5" /> My Orders
                </Link>
                <Link to="/wishlist" className="hover:text-brand-600 flex items-center gap-1">
                  <FiHeart className="h-3.5 w-3.5" /> Wishlist
                </Link>
                <Link to="/addresses" className="hover:text-brand-600 flex items-center gap-1">
                  <FiMapPin className="h-3.5 w-3.5" /> Addresses
                </Link>
                <Link to="/profile" className="hover:text-brand-600 flex items-center gap-1">
                  <FiUser className="h-3.5 w-3.5" /> {user?.name || 'Account'}
                </Link>
                <button onClick={handleLogout} className="hover:text-brand-600 flex items-center gap-1">
                  <FiLogOut className="h-3.5 w-3.5" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login?redirect=/wishlist" className="hover:text-brand-600 flex items-center gap-1">
                  <FiHeart className="h-3.5 w-3.5" /> Wishlist
                </Link>
                <Link to="/login?redirect=/my-orders" className="hover:text-brand-600 flex items-center gap-1">
                  <FiPackage className="h-3.5 w-3.5" /> My Orders
                </Link>
                <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
                  Sign in
                </Link>
                <Link to="/register" className="hover:text-brand-600">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main red header */}
      <header className="bg-brand-600 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
          <Link to="/store" className="flex items-center gap-2 flex-shrink-0">
            <div className="bg-white text-brand-600 rounded-lg w-9 h-9 flex items-center justify-center shadow">
              <span className="font-black text-lg">LC</span>
            </div>
            <div className="leading-tight">
              <div className="font-bold text-lg tracking-wide">LogiCore</div>
              <div className="text-[11px] text-brand-100 tracking-widest">JD-STYLE MALL</div>
            </div>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 flex max-w-xl mx-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for products..."
              className="flex-1 px-4 py-2.5 rounded-l-md text-gray-800 text-sm focus:outline-none"
            />
            <button
              type="submit"
              className="bg-brand-800 text-white px-5 rounded-r-md flex items-center justify-center hover:bg-brand-900 transition-colors"
              aria-label="Search"
            >
              <FiSearch className="h-5 w-5" />
            </button>
          </form>

          {/* Cart */}
          <Link
            to={user ? '/cart' : '/login?redirect=/cart'}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-md px-4 py-2.5 transition-colors flex-shrink-0"
          >
            <FiShoppingCart className="h-6 w-6" />
            <span className="hidden sm:block text-sm font-medium">My Cart</span>
            {count > 0 && (
              <span className="bg-yellow-400 text-brand-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {count}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Category nav */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto">
          <Link
            to="/store/products"
            className="flex items-center gap-2 bg-brand-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-brand-700 transition-colors whitespace-nowrap"
          >
            <FiGrid className="h-4 w-4" />
            All Categories
          </Link>
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="px-3 py-3 text-sm text-gray-700 hover:text-brand-600 hover:border-b-2 hover:border-brand-600 whitespace-nowrap"
            >
              {link.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-gray-600">
          <div>
            <h4 className="font-bold text-gray-900 mb-3">LogiCore Mall</h4>
            <p className="text-gray-500">
              A JD-style shopping experience powered by LogiCore's supply chain engine.
              Browse, order, pay and track — all in one place.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-3">Customer Service</h4>
            <ul className="space-y-2">
              <li><Link to="/my-orders" className="hover:text-brand-600">Order Tracking</Link></li>
              <li><Link to="/addresses" className="hover:text-brand-600">Shipping Addresses</Link></li>
              <li><Link to="/wishlist" className="hover:text-brand-600">My Wishlist</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-3">About</h4>
            <p className="text-gray-500">
              Full inventory, warehouse and logistics management behind every order.
              Secure payment simulation and verified reviews on every purchase.
            </p>
          </div>
        </div>
        <div className="border-t border-gray-100 py-4 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} LogiCore. Demo e-commerce platform — not affiliated with JD.com.
        </div>
      </footer>
    </div>
  );
};

export default StoreLayout;
