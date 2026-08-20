import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import Table from '../../components/common/Table';
import StatusBadge from '../../components/common/StatusBadge';
import { FiSearch, FiEye } from 'react-icons/fi';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', payment_status: '' });

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...filters, search };
      const response = await orderService.getAll(params);
      setOrders(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
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
      key: 'customer',
      label: 'Customer',
      render: (order) => order.customer?.name || '-',
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
        <button
          onClick={() => navigate(`/orders/${order.id}`)}
          className="text-blue-600 hover:text-blue-900"
        >
          <FiEye className="h-5 w-5" />
        </button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Orders</h2>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchOrders()}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            value={filters.payment_status}
            onChange={(e) => setFilters({ ...filters, payment_status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Payments</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
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

export default OrdersPage;