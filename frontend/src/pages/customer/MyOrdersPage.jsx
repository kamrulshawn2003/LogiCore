import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import Table from '../../components/common/Table';
import StatusBadge from '../../components/common/StatusBadge';
import { FiEye, FiXCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '' });

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...filters };
      const response = await orderService.getMyOrders(params);
      setOrders(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await orderService.cancel(orderId, 'Cancelled by customer');
        toast.success('Order cancelled successfully');
        fetchOrders();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to cancel order');
      }
    }
  };

  const columns = [
    {
      key: 'order_number',
      label: 'Order #',
      render: (order) => (
        <button
          onClick={() => navigate(`/orders/${order.id}`)}
          className="text-primary-600 hover:text-primary-900 font-medium"
        >
          {order.order_number}
        </button>
      ),
    },
    {
      key: 'total_amount',
      label: 'Total',
      render: (order) => `$${parseFloat(order.total_amount).toFixed(2)}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (order) => <StatusBadge status={order.status} />,
    },
    {
      key: 'payment_status',
      label: 'Payment',
      render: (order) => <StatusBadge status={order.payment_status} />,
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (order) => new Date(order.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (order) => (
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/orders/${order.id}`)}
            className="text-blue-600 hover:text-blue-900"
          >
            <FiEye className="h-5 w-5" />
          </button>
          {['PENDING', 'CONFIRMED'].includes(order.status) && (
            <button
              onClick={() => handleCancelOrder(order.id)}
              className="text-red-600 hover:text-red-900"
            >
              <FiXCircle className="h-5 w-5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h2>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Orders</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table
          columns={columns}
          data={orders}
          loading={loading}
          pagination={pagination}
          onPageChange={fetchOrders}
        />
      </div>
    </div>
  );
};

export default MyOrdersPage;