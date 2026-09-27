import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import ProductImage from '../../components/common/ProductImage';
import ReviewModal from '../../components/common/ReviewModal';
import RefundModal from '../../components/common/RefundModal';
import StatusBadge from '../../components/common/StatusBadge';
import toast from 'react-hot-toast';
import { FiEye, FiXCircle, FiCreditCard, FiCheckCircle, FiStar, FiRefreshCcw } from 'react-icons/fi';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [reviewOrder, setReviewOrder] = useState(null);
  const [refundOrder, setRefundOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10, status };
      const response = await orderService.getMyOrders(params);
      setOrders(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (order) => {
    if (!window.confirm(`Cancel order ${order.order_number}?`)) return;
    try {
      await orderService.cancel(order.id, 'Cancelled by customer');
      toast.success('Order cancelled');
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handlePay = async (order) => {
    if (!window.confirm(`Pay ${order.order_number} for $${Number(order.total_amount).toFixed(2)}?`)) return;
    try {
      await orderService.pay(order.id);
      toast.success('Payment successful!');
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    }
  };

  const handleConfirmReceipt = async (order) => {
    if (!window.confirm(`Confirm you have received order ${order.order_number}?`)) return;
    try {
      await orderService.confirmReceipt(order.id);
      toast.success('Thanks! Order marked as delivered.');
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to confirm receipt');
    }
  };

  const canCancel = (o) => ['PENDING', 'CONFIRMED'].includes(o.status);
  const canPay = (o) => o.payment_status !== 'PAID' && o.status !== 'CANCELLED' && !['DELIVERED', 'RETURNED', 'RETURN_REQUESTED'].includes(o.status);
  const canConfirmReceipt = (o) => ['SHIPPED', 'OUT_FOR_DELIVERY'].includes(o.status);
  const canReview = (o) => o.status === 'DELIVERED';
  // Refund/return is available on paid, delivered (or out-for-delivery) orders,
  // and hidden once a return was already requested or completed.
  const canRefund = (o) =>
    o.payment_status === 'PAID' &&
    ['DELIVERED', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(o.status);

  const Actions = ({ order }) => (
    <div className="flex flex-wrap gap-2 mt-3">
      <button
        onClick={() => navigate(`/orders/${order.id}`)}
        className="flex items-center gap-1 text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded hover:border-brand-600 hover:text-brand-600 transition-colors"
      >
        <FiEye className="h-3.5 w-3.5" /> Details
      </button>
      {canPay(order) && (
        <button
          onClick={() => handlePay(order)}
          className="flex items-center gap-1 text-xs bg-brand-600 text-white px-3 py-1.5 rounded hover:bg-brand-700 transition-colors"
        >
          <FiCreditCard className="h-3.5 w-3.5" /> Pay Now
        </button>
      )}
      {canConfirmReceipt(order) && (
        <button
          onClick={() => handleConfirmReceipt(order)}
          className="flex items-center gap-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors"
        >
          <FiCheckCircle className="h-3.5 w-3.5" /> Confirm Receipt
        </button>
      )}
      {canReview(order) && (
        <button
          onClick={() => setReviewOrder(order)}
          className="flex items-center gap-1 text-xs bg-amber-500 text-white px-3 py-1.5 rounded hover:bg-amber-600 transition-colors"
        >
          <FiStar className="h-3.5 w-3.5" /> Review
        </button>
      )}
      {canRefund(order) && (
        <button
          onClick={() => setRefundOrder(order)}
          className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
        >
          <FiRefreshCcw className="h-3.5 w-3.5" /> Refund / Return
        </button>
      )}
      {canCancel(order) && (
        <button
          onClick={() => handleCancel(order)}
          className="flex items-center gap-1 text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded hover:bg-red-50 transition-colors"
        >
          <FiXCircle className="h-3.5 w-3.5" /> Cancel
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
              status === tab.value
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-5">
              {/* Order header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                  <span className="font-semibold text-gray-900">{order.order_number}</span>
                  <span className="text-xs text-gray-400 ml-3">
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={order.payment_status} />
                  <StatusBadge status={order.status} />
                </div>
              </div>

              {/* Items */}
              <div className="py-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-2">
                    <button
                      onClick={() => navigate(`/product/${item.product_id}`)}
                      className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0"
                    >
                      <ProductImage
                        src={item.product?.image_url}
                        name={item.product?.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 line-clamp-1">{item.product?.name || `Product #${item.product_id}`}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        ${Number(item.unit_price).toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      ${Number(item.subtotal).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  Total:{' '}
                  <span className="text-lg font-bold text-brand-600">
                    ${Number(order.total_amount).toFixed(2)}
                  </span>
                </div>
                <Actions order={order} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            disabled={pagination.page <= 1}
            onClick={() => fetchOrders(pagination.page - 1)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-40"
          >
            Prev
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchOrders(pagination.page + 1)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Review modal */}
      {reviewOrder && (
        <ReviewModal
          order={reviewOrder}
          onClose={() => setReviewOrder(null)}
          onSuccess={() => fetchOrders()}
        />
      )}

      {/* Refund / Return modal */}
      {refundOrder && (
        <RefundModal
          order={refundOrder}
          onClose={() => setRefundOrder(null)}
          onSuccess={() => fetchOrders()}
        />
      )}
    </div>
  );
};

export default MyOrdersPage;
