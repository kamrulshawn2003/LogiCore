import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const RoleRoute = ({ roles, children }) => {
  const { user, isAuthenticated } = useAuth();
  const allowed = isAuthenticated && user && roles.includes(user.role);

  // Side-effect stays out of render: showing the toast inside the render
  // body caused "Cannot update a component while rendering" and could fire
  // spurious permission toasts during login transitions.
  useEffect(() => {
    if (isAuthenticated && user && !allowed) {
      toast.error('You do not have permission to access this page');
    }
  }, [isAuthenticated, user, allowed]);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowed) {
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
        return <Navigate to="/store" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default RoleRoute;
