import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
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
import ShipmentsPage from './pages/management/ShipmentsPage';
import ShipmentDetailPage from './pages/management/ShipmentDetailPage';
import DriversPage from './pages/management/DriversPage';
import UsersPage from './pages/management/UsersPage';
import AuditLogsPage from './pages/misc/AuditLogsPage';
import NotificationsPage from './pages/misc/NotificationsPage';
import ProfilePage from './pages/misc/ProfilePage';
import ReportsPage from './pages/dashboard/ReportsPage';
import ShopPage from './pages/customer/ShopPage';
import MyOrdersPage from './pages/customer/MyOrdersPage';
import TrackingPage from './pages/customer/TrackingPage';

const RoleBasedHome = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  
  switch (user.role) {
    case 'admin':
    case 'warehouse_manager':
      return <Navigate to="/dashboard" replace />;
    case 'supplier':
      return <Navigate to="/purchase-orders" replace />;
    case 'driver':
      return <Navigate to="/shipments" replace />;
    case 'customer':
      return <Navigate to="/shop" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
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

            {/* Protected Routes */}
            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/" element={<RoleBasedHome />} />
              
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
              
              {/* Customer Routes */}
              <Route path="/shop" element={<RoleRoute roles={['customer']}><ShopPage /></RoleRoute>} />
              <Route path="/my-orders" element={<RoleRoute roles={['customer']}><MyOrdersPage /></RoleRoute>} />
              <Route path="/track/:trackingNumber" element={<TrackingPage />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;