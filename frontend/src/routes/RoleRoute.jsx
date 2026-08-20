import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const RoleRoute = ({ roles, children }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    toast.error('You do not have permission to access this page');
    
    // Redirect to role-appropriate page
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
  }

  return children;
};

export default RoleRoute;