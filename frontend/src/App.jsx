import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import RequireAuth from './routes/RequireAuth';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import StoreLayout from './layouts/StoreLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProductsPage from './pages/management/ProductsPage';
import ProductDetailPage from './pages/management/ProductDetailPage';
import SuppliersPage from './pages/management/SuppliersPage';
import SupplierDetailPage from './pages/management/SupplierDetailPage';
import WarehousesPage from './pages/management/WarehousesPage';
import WarehouseDetailPage from './pages/management/WarehouseDetailPage';
import InventoryPage from './pages/management/InventoryPage';
import InventoryMovementsPage from './pages/management/InventoryMovementsPage';
import PurchaseOrdersPage from './pages/management/PurchaseOrdersPage';
import PurchaseOrderDetailPage from './pages/management/PurchaseOrderDetailPage';
import OrdersPage from './pages/management/OrdersPage';
import OrderDetailPage from './pages/management/OrderDetailPage';
import RefundsPage from './pages/management/RefundsPage';
import ShipmentsPage from './pages/management/ShipmentsPage';
import ShipmentDetailPage from './pages/management/ShipmentDetailPage';
import DriversPage from './pages/management/DriversPage';
import UsersPage from './pages/management/UsersPage';
import AuditLogsPage from './pages/misc/AuditLogsPage';
import NotificationsPage from './pages/misc/NotificationsPage';
import ProfilePage from './pages/misc/ProfilePage';
import ReportsPage from './pages/dashboard/ReportsPage';
import MyOrdersPage from './pages/customer/MyOrdersPage';
import TrackingPage from './pages/customer/TrackingPage';

// JD-style storefront pages
import StoreHomePage from './pages/store/StoreHomePage';
import StoreProductsPage from './pages/store/StoreProductsPage';
import StoreProductDetailPage from './pages/store/StoreProductDetailPage';
import CartPage from './pages/store/CartPage';
import CheckoutPage from './pages/store/CheckoutPage';
import AddressesPage from './pages/store/AddressesPage';
import WishlistPage from './pages/store/WishlistPage';

const RoleBasedHome = () => {
  const { user } = useAuth();
  
  // Guests browse the store first — login only when they want to act (cart/wishlist/buy)
  if (!user) return <Navigate to="/store" replace />;
  
  switch (user.role) {
    case 'admin':
    case 'warehouse_manager':
      return <Navigate to="/dashboard" replace />;
    case 'supplier':
      return <Navigate to="/purchase-orders" replace />;
    case 'driver':
      return <Navigate to="/shipments" replace />;
    case 'customer':
      return <Navigate to="/store" replace />;
    default:
      return <Navigate to="/store" replace />;
  }
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <CartProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
            <Routes>
              {/* Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* Root — guests land on the store, logged-in users go to their role home */}
              <Route path="/" element={<RoleBasedHome />} />

              {/* Admin / Operations layout (login required) */}
              <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                {/* Dashboard - Admin and Manager only */}
                <Route path="/dashboard" element={<RoleRoute roles={['admin', 'warehouse_manager']}><DashboardPage /></RoleRoute>} />
                
                {/* Products - Multiple roles */}
                <Route path="/products" element={<RoleRoute roles={['admin', 'warehouse_manager', 'customer']}><ProductsPage /></RoleRoute>} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                
                {/* Suppliers - Admin only */}
                <Route path="/suppliers" element={<RoleRoute roles={['admin']}><SuppliersPage /></RoleRoute>} />
                <Route path="/suppliers/:id" element={<RoleRoute roles={['admin']}><SupplierDetailPage /></RoleRoute>} />
                
                {/* Warehouses - Admin and Manager */}
                <Route path="/warehouses" element={<RoleRoute roles={['admin', 'warehouse_manager']}><WarehousesPage /></RoleRoute>} />
                <Route path="/warehouses/:id" element={<RoleRoute roles={['admin', 'warehouse_manager']}><WarehouseDetailPage /></RoleRoute>} />
                
                {/* Inventory - Admin and Manager */}
                <Route path="/inventory" element={<RoleRoute roles={['admin', 'warehouse_manager']}><InventoryPage /></RoleRoute>} />
                <Route path="/inventory/movements" element={<RoleRoute roles={['admin', 'warehouse_manager']}><InventoryMovementsPage /></RoleRoute>} />
                
                {/* Purchase Orders - Admin, Manager, Supplier */}
                <Route path="/purchase-orders" element={<RoleRoute roles={['admin', 'warehouse_manager', 'supplier']}><PurchaseOrdersPage /></RoleRoute>} />
                <Route path="/purchase-orders/:id" element={<PurchaseOrderDetailPage />} />
                
                {/* Orders - Admin and Manager */}
                <Route path="/orders" element={<RoleRoute roles={['admin', 'warehouse_manager']}><OrdersPage /></RoleRoute>} />
                <Route path="/orders/:id" element={<OrderDetailPage />} />
                
                {/* Refunds & Returns - Admin and Manager */}
                <Route path="/refunds" element={<RoleRoute roles={['admin', 'warehouse_manager']}><RefundsPage /></RoleRoute>} />
                
                {/* Shipments - Admin, Manager, Driver */}
                <Route path="/shipments" element={<RoleRoute roles={['admin', 'warehouse_manager', 'driver']}><ShipmentsPage /></RoleRoute>} />
                <Route path="/shipments/:id" element={<ShipmentDetailPage />} />
                
                {/* Drivers - Admin and Manager */}
                <Route path="/drivers" element={<RoleRoute roles={['admin', 'warehouse_manager']}><DriversPage /></RoleRoute>} />
                
                {/* Users - Admin only */}
                <Route path="/users" element={<RoleRoute roles={['admin']}><UsersPage /></RoleRoute>} />
                
                {/* Reports - Admin and Manager */}
                <Route path="/reports" element={<RoleRoute roles={['admin', 'warehouse_manager']}><ReportsPage /></RoleRoute>} />
                
                {/* Audit Logs - Admin only */}
                <Route path="/audit-logs" element={<RoleRoute roles={['admin']}><AuditLogsPage /></RoleRoute>} />
                
                {/* Notifications - All authenticated */}
                <Route path="/notifications" element={<NotificationsPage />} />
                
                {/* Profile - All authenticated */}
                <Route path="/profile" element={<ProfilePage />} />

                {/* Order tracking by tracking number */}
                <Route path="/track/:trackingNumber" element={<TrackingPage />} />
              </Route>

              {/* JD-style storefront — PUBLIC for browsing (guests land here first) */}
              <Route element={<StoreLayout />}>
                <Route path="/store" element={<StoreHomePage />} />
                <Route path="/store/products" element={<StoreProductsPage />} />
                <Route path="/product/:id" element={<StoreProductDetailPage />} />
                {/* Customer action pages — login required */}
                <Route path="/cart" element={<RequireAuth><CartPage /></RequireAuth>} />
                <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
                <Route path="/addresses" element={<RequireAuth><AddressesPage /></RequireAuth>} />
                <Route path="/wishlist" element={<RequireAuth><WishlistPage /></RequireAuth>} />
                <Route path="/my-orders" element={<RequireAuth><MyOrdersPage /></RequireAuth>} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<Navigate to="/store" replace />} />
            </Routes>
          </CartProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
