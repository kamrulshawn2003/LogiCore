import React, { useState, useEffect } from 'react';
import { refundService } from '../../services/refundService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import toast from 'react-hot-toast';
import { FiSearch, FiCheck, FiX, FiCreditCard, FiRefreshCcw } from 'react-icons/fi';

const RefundsPage = () => {
  const [refunds, setRefunds] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', type: '' });
  const [actionRefund, setActionRefund] = useState(null);
  const [action, setAction] = useState(null); // 'approve' | 'reject' | 'refunded'
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRefunds();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchRefunds = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...filters, search };
      const response = await refundService.getAll(params);
      setRefunds(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch refunds:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const s = await refundService.getStatistics();
      setStats(s);
    } catch (error) {
      console.error('Failed to fetch refund stats:', error);
    }
  };

  const openAction = (refund, type) => {
    setActionRefund(refund);
    setAction(type);
    setNote('');
  };

  const handleAction = async () => {
    if (!actionRefund) return;
    if (action === 'reject' && !note.trim()) {
      toast.error('A rejection reason is required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { status: action.toUpperCase() };
      if (action === 'reject' || (action === 'approve' && note.trim())) {
        payload.admin_note = note.trim();
      }
      await refundService.updateStatus(actionRefund.id, payload);
      toast.success(
        action === 'approve'
          ? 'Refund request approved'
          : action === 'reject'
          ? 'Refund request rejected'
          : 'Refund marked as issued'
      );
      setActionRefund(null);
      setAction(null);
      fetchRefunds();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update request');
    } finally {
      setSubmitting(false);
    }
  };

  const statsCards = [
    { label: 'Pending', value: stats?.pending ?? 0, color: 'text-yellow-600' },
    { label: 'Approved', value: stats?.approved ?? 0, color: 'text-blue-600' },
    { label: 'Refunded', value: stats?.refunded ?? 0, color: 'text-green-600' },
    { label: 'Rejected', value: stats?.rejected ?? 0, color: 'text-red-600' },
    { label: 'Total Refunded', value: `$${Number(stats?.total_refunded_amount ?? 0).toFixed(2)}`, color: 'text-brand-600' },
  ];

  const columns = [
    {
      key: 'refund_number',
      label: 'Request #',
      render: (r) => <span className="font-medium text-gray-900">{r.refund_number}</span>,
    },
    {
      key: 'order',
      label: 'Order',
      render: (r) => <span>{r.order?.order_number || '-'}</span>,
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (r) => (
        <div>
          <div className="font-medium">{r.customer?.name}</div>
          <div className="text-xs text-gray-500">{r.customer?.email}</div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (r) => (
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${r.type === 'RETURN' ? 'text-purple-600' : 'text-teal-600'}`}>
          <FiRefreshCcw className="h-3 w-3" />
          {r.type === 'RETURN' ? 'Return' : 'Refund'}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (r) => `$${Number(r.amount).toFixed(2)}`,
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (r) => (
        <span className="text-sm text-gray-600 line-clamp-1" title={r.reason}>
          {r.reason}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'created_at',
      label: 'Requested',
      render: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex space-x-2">
          {r.status === 'PENDING' && (
            <>
              <button
                onClick={() => openAction(r, 'approve')}
                className="text-green-600 hover:text-green-900"
                title="Approve"
              >
                <FiCheck className="h-5 w-5" />
              </button>
              <button
                onClick={() => openAction(r, 'reject')}
                className="text-red-600 hover:text-red-900"
                title="Reject"
              >
                <FiX className="h-5 w-5" />
              </button>
            </>
          )}
          {r.status === 'APPROVED' && (
            <button
              onClick={() => openAction(r, 'refunded')}
              className="text-teal-600 hover:text-teal-900"
              title="Mark as Refunded"
            >
              <FiCreditCard className="h-5 w-5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Refunds &amp; Returns</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {statsCards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by request or order number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchRefunds()}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="REFUNDED">Refunded</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="">All Types</option>
            <option value="REFUND">Refund</option>
            <option value="RETURN">Return</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table
          columns={columns}
          data={refunds}
          loading={loading}
          pagination={pagination}
          onPageChange={fetchRefunds}
        />
      </div>

      {/* Action Modal */}
      <Modal
        isOpen={!!actionRefund}
        onClose={() => setActionRefund(null)}
        title={action === 'approve' ? 'Approve Request' : action === 'reject' ? 'Reject Request' : 'Mark as Refunded'}
        size="sm"
      >
        {actionRefund && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              <strong>{actionRefund.refund_number}</strong> — order{' '}
              <strong>{actionRefund.order?.order_number}</strong> ·{' '}
              <strong className="text-brand-600">${Number(actionRefund.amount).toFixed(2)}</strong>
              <div className="mt-1 text-xs text-gray-500">{actionRefund.reason}</div>
            </div>

            {action === 'reject' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection reason *
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Explain why this request is rejected"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            )}
            {action === 'approve' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin note (optional)
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional note for the customer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            )}
            {action === 'refunded' && (
              <p className="text-sm text-gray-600">
                Confirm the refund has been issued. {actionRefund.type === 'RETURN' ? 'Returned items will be restocked.' : 'The payment will be marked as refunded.'}
              </p>
            )}

            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setActionRefund(null)}>
                Cancel
              </Button>
              <Button
                variant={action === 'reject' ? 'danger' : 'primary'}
                onClick={handleAction}
                disabled={submitting}
              >
                {submitting
                  ? 'Saving…'
                  : action === 'approve'
                  ? 'Approve'
                  : action === 'reject'
                  ? 'Reject'
                  : 'Confirm Refund'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RefundsPage;
