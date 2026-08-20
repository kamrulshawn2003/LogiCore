import React from 'react';

const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    if (!status) return 'gray';
    
    const statusUpper = status.toUpperCase();
    
    // Purchase Orders
    const poStatusMap = {
      'DRAFT': 'gray',
      'SUBMITTED': 'info',
      'APPROVED': 'info',
      'ACCEPTED': 'warning',
      'PARTIALLY_RECEIVED': 'warning',
      'RECEIVED': 'success',
      'CANCELLED': 'danger',
      'REJECTED': 'danger',
    };
    
    // Orders
    const orderStatusMap = {
      'PENDING': 'warning',
      'CONFIRMED': 'info',
      'PROCESSING': 'info',
      'PACKED': 'info',
      'SHIPPED': 'info',
      'OUT_FOR_DELIVERY': 'warning',
      'DELIVERED': 'success',
      'RETURN_REQUESTED': 'warning',
      'RETURNED': 'danger',
    };
    
    // Shipments
    const shipmentStatusMap = {
      'READY': 'gray',
      'ASSIGNED': 'info',
      'PICKED_UP': 'info',
      'IN_TRANSIT': 'info',
      'FAILED': 'danger',
    };
    
    // Drivers
    const driverStatusMap = {
      'AVAILABLE': 'success',
      'ON_DELIVERY': 'warning',
      'OFF_DUTY': 'gray',
      'INACTIVE': 'gray',
    };
    
    // Payment
    const paymentStatusMap = {
      'PAID': 'success',
      'FAILED': 'danger',
      'REFUNDED': 'warning',
    };
    
    // Inventory Movement Types
    const movementTypeMap = {
      'IN': 'success',
      'OUT': 'danger',
      'TRANSFER': 'info',
      'ADJUSTMENT': 'warning',
      'RETURN': 'gray',
    };
    
    // User roles
    const roleMap = {
      'ADMIN': 'danger',
      'WAREHOUSE_MANAGER': 'info',
      'SUPPLIER': 'warning',
      'DRIVER': 'success',
      'CUSTOMER': 'gray',
    };
    
    // General status
    const generalMap = {
      'ACTIVE': 'success',
      'INACTIVE': 'gray',
      'SUSPENDED': 'danger',
      'MAINTENANCE': 'warning',
      'LOW STOCK': 'danger',
      'IN STOCK': 'success',
    };
    
    // Check all maps in order
    return (
      poStatusMap[statusUpper] ||
      orderStatusMap[statusUpper] ||
      shipmentStatusMap[statusUpper] ||
      driverStatusMap[statusUpper] ||
      paymentStatusMap[statusUpper] ||
      movementTypeMap[statusUpper] ||
      roleMap[statusUpper] ||
      generalMap[statusUpper] ||
      generalMap[status] ||
      'gray'
    );
  };

  const getBadgeClasses = (color) => {
    const classes = {
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      danger: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800',
      gray: 'bg-gray-100 text-gray-800',
    };
    return classes[color] || classes.gray;
  };

  const color = getStatusColor(status);
  const badgeClasses = getBadgeClasses(color);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClasses}`}>
      {status}
    </span>
  );
};

export default StatusBadge;