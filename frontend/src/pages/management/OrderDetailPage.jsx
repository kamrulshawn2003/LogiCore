import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import { FiArrowLeft, FiPackage, FiTruck, FiMapPin } from 'react-icons/fi';
import toast from 'react-hot-toast';

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const response = await orderService.getById(id);
      setOrder(response.order);
    } catch (error) {
      toast.error('Failed to fetch order');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      await orderService.updateStatus(id, status);
      toast.success('Order status updated');
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Order not found</p>
      </div>
    );
  }

  const statusFlow = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const currentIndex = statusFlow.indexOf(order.status);

  return (
    <div className="p-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <FiArrowLeft className="mr-2 h-5 w-5" />
        Back
      </button>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Order {order.order_number}
        </h2>
        <div className="flex space-x-3">
          {order.status === 'PENDING' && (
            <>
              <Button onClick={() => handleStatusUpdate('CONFIRMED')}>Confirm</Button>
              <Button variant="danger" onClick={() => handleStatusUpdate('CANCELLED')}>Cancel</Button>
            </>
          )}
          {order.status === 'CONFIRMED' && (
            <Button onClick={() => handleStatusUpdate('PROCESSING')}>Process</Button>
          )}
          {order.status === 'PROCESSING' && (
            <Button onClick={() => handleStatusUpdate('PACKED')}>Pack</Button>
          )}
          {order.status === 'PACKED' && (
            <Button onClick={() => handleStatusUpdate('SHIPPED')}>Ship</Button>
          )}
        </div>
      </div>

      {/* Status Progress */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          {statusFlow.map((status, index) => (
            <div key={status} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                index < currentIndex ? 'bg-green-500 text-white' :
                index === currentIndex ? 'bg-primary-600 text-white' :
                'bg-gray-200 text-gray-400'
              }`}>
                {index + 1}
              </div>
              {index < statusFlow.length - 1 && (
                <div className={`w-16 h-1 ${
                  index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {statusFlow.map((status, index) => (
            <span key={status} className="text-xs text-gray-500">
              {status.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{item.product?.name}</div>
                        <div className="text-xs text-gray-500">{item.product?.sku}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${parseFloat(item.unit_price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${parseFloat(item.subtotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-right font-medium">
                      Total:
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      ${parseFloat(order.total_amount).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Order Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <StatusBadge status={order.status} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Status</p>
                <StatusBadge status={order.payment_status} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="text-sm text-gray-900">{order.customer?.name}</p>
                <p className="text-sm text-gray-500">{order.customer?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created At</p>
                <p className="text-sm text-gray-900">{new Date(order.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {order.shipping_address && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
              <p className="text-sm text-gray-600">{order.shipping_address}</p>
              <p className="text-sm text-gray-600">
                {order.shipping_city}, {order.shipping_state} {order.shipping_zip}
              </p>
              <p className="text-sm text-gray-600">{order.shipping_country}</p>
            </div>
          )}

          {order.shipment && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipment</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Tracking: {order.shipment.tracking_number}
                </p>
                <StatusBadge status={order.shipment.status} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;