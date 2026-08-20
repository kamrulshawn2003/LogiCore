import React, { useState, useEffect } from 'react';
import { auditLogService } from '../../services/auditLogService';
import Table from '../../components/common/Table';
import StatusBadge from '../../components/common/StatusBadge';
import { FiSearch, FiFilter, FiDownload } from 'react-icons/fi';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ action: '', entity_type: '' });
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    fetchLogs();
    fetchStatistics();
  }, [filters]);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20, ...filters, search };
      const response = await auditLogService.getAll(params);
      setLogs(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await auditLogService.getStatistics();
      setStatistics(response.statistics);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/audit-logs/export', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'audit-logs.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const columns = [
    {
      key: 'created_at',
      label: 'Timestamp',
      render: (log) => new Date(log.created_at).toLocaleString(),
    },
    {
      key: 'user',
      label: 'User',
      render: (log) => log.user?.name || 'System',
    },
    {
      key: 'action',
      label: 'Action',
      render: (log) => <StatusBadge status={log.action} />,
    },
    {
      key: 'entity_type',
      label: 'Entity',
      render: (log) => log.entity_type,
    },
    {
      key: 'entity_id',
      label: 'Entity ID',
      render: (log) => log.entity_id || '-',
    },
    {
      key: 'ip_address',
      label: 'IP Address',
      render: (log) => log.ip_address || '-',
    },
    {
      key: 'changes',
      label: 'Changes',
      render: (log) => {
        if (!log.old_value && !log.new_value) return '-';
        return (
          <button
            onClick={() => {
              // Show details in modal or expand
              console.log('Old:', log.old_value, 'New:', log.new_value);
            }}
            className="text-primary-600 hover:text-primary-900"
          >
            View Changes
          </button>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
        <button onClick={handleExport} className="btn-secondary">
          <FiDownload className="mr-2 h-5 w-5" />
          Export CSV
        </button>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Logs</p>
            <p className="text-2xl font-bold text-gray-900">{statistics.total_logs}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Actions Tracked</p>
            <p className="text-2xl font-bold text-gray-900">{statistics.logs_by_action?.length || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Entity Types</p>
            <p className="text-2xl font-bold text-gray-900">{statistics.logs_by_entity?.length || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Active Users</p>
            <p className="text-2xl font-bold text-gray-900">{statistics.logs_by_user?.length || 0}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchLogs()}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
          </select>
          <select
            value={filters.entity_type}
            onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Entities</option>
            <option value="Product">Product</option>
            <option value="Order">Order</option>
            <option value="User">User</option>
            <option value="Inventory">Inventory</option>
            <option value="PurchaseOrder">Purchase Order</option>
            <option value="Shipment">Shipment</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table
          columns={columns}
          data={logs}
          loading={loading}
          pagination={pagination}
          onPageChange={fetchLogs}
        />
      </div>
    </div>
  );
};

export default AuditLogsPage;