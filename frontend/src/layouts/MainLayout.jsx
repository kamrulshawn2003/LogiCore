import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  FiHome, FiPackage, FiUsers, FiTruck, FiShoppingCart, 
  FiMapPin, FiClipboard, FiBarChart2, FiBell, FiLogOut,
  FiMenu, FiX, FiSettings
} from 'react-icons/fi';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: FiHome, roles: ['admin', 'warehouse_manager'] },
    { name: 'Products', href: '/products', icon: FiPackage, roles: ['admin', 'warehouse_manager', 'customer'] },
    { name: 'Suppliers', href: '/suppliers', icon: FiUsers, roles: ['admin'] },
    { name: 'Warehouses', href: '/warehouses', icon: FiMapPin, roles: ['admin', 'warehouse_manager'] },
    { name: 'Inventory', href: '/inventory', icon: FiClipboard, roles: ['admin', 'warehouse_manager'] },
    { name: 'Purchase Orders', href: '/purchase-orders', icon: FiShoppingCart, roles: ['admin', 'warehouse_manager', 'supplier'] },
    { name: 'Orders', href: '/orders', icon: FiShoppingCart, roles: ['admin', 'warehouse_manager'] },
    { name: 'Shipments', href: '/shipments', icon: FiTruck, roles: ['admin', 'warehouse_manager', 'driver'] },
    { name: 'Drivers', href: '/drivers', icon: FiTruck, roles: ['admin', 'warehouse_manager'] },
    { name: 'Users', href: '/users', icon: FiUsers, roles: ['admin'] },
    { name: 'Reports', href: '/reports', icon: FiBarChart2, roles: ['admin', 'warehouse_manager'] },
    { name: 'Audit Logs', href: '/audit-logs', icon: FiClipboard, roles: ['admin'] },
    { name: 'Shop', href: '/shop', icon: FiShoppingCart, roles: ['customer'] },
    { name: 'My Orders', href: '/my-orders', icon: FiPackage, roles: ['customer'] },
  ];

  const filteredNavigation = navigation.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar - fixed */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-20">
        <SidebarContent 
          navigation={filteredNavigation} 
          user={user} 
          onNavigate={navigate} 
          currentPath={location.pathname} 
        />
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col max-w-xs w-full h-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none"
                onClick={() => setSidebarOpen(false)}
              >
                <FiX className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent 
              navigation={filteredNavigation} 
              user={user} 
              onNavigate={(path) => { navigate(path); setSidebarOpen(false); }} 
              currentPath={location.pathname} 
            />
          </div>
        </div>
      )}

      {/* Main content area with left padding for sidebar */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <FiMenu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex items-center">
              <h1 className="text-lg font-semibold text-gray-900">
                {user?.name || 'Dashboard'}
              </h1>
            </div>
            <div className="ml-4 flex items-center md:ml-6 space-x-3">
              <button
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={() => navigate('/notifications')}
                title="Notifications"
              >
                <span className="relative">
                  <FiBell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </span>
              </button>

              <button
                className="flex items-center focus:outline-none"
                onClick={() => navigate('/profile')}
                title="Profile"
              >
                <span className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </button>
              
              <button
                onClick={handleLogout}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
                title="Logout"
              >
                <FiLogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const SidebarContent = ({ navigation, user, onNavigate, currentPath }) => {
  return (
    <div className="flex flex-col h-full pt-5 pb-4 overflow-y-auto">
      <div className="flex items-center flex-shrink-0 px-4">
        <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-xl font-bold">LC</span>
        </div>
        <div className="ml-3">
          <h1 className="text-lg font-bold text-gray-900">LogiCore</h1>
          <p className="text-xs text-gray-500 capitalize">{user?.role?.replace(/_/g, ' ') || 'User'}</p>
        </div>
      </div>
      <nav className="mt-5 flex-1 px-2 space-y-1">
        {navigation.map((item) => {
          const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
          return (
            <button
              key={item.name}
              onClick={() => onNavigate(item.href)}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon
                className={`mr-3 flex-shrink-0 h-5 w-5 ${
                  isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              {item.name}
            </button>
          );
        })}
      </nav>
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <button
          onClick={() => onNavigate('/profile')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 w-full"
        >
          <FiSettings className="mr-2 h-5 w-5" />
          Settings
        </button>
      </div>
    </div>
  );
};

export default MainLayout;