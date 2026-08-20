import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/inventoryService';
import Table from '../../components/common/Table';
import StatusBadge from '../../components/common/StatusBadge';
import { FiSearch, FiFilter } from 'react-icons/fi';

const InventoryMovementsPage = () => {
  const [movements, setMovements] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ type: '', warehouse_id: '' });
  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
    fetchMovements();
    fetchWarehouses();
  }, [filters]);

  const fetchMovements = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20, ...filters, search };
      const response = await inventoryService.getMovements(params);
      setMovements(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const { warehouseService } = await import('../../services/warehouseService');
      const response = await warehouseService.getAll({ limit: 100 });
      setWarehouses(response.data);
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    }
  };

  const getMovementTypeBadge = (type) => {
    const typeMap = {
      'IN': 'success',
      'OUT': 'danger',
      'TRANSFER': 'info',
      'ADJUSTMENT': 'warning',
      'RETURN': 'gray',
    };
    return <StatusBadge status={type} />;
  };

  const columns = [
    {
      key: 'created_at',
      label: 'Date',
      render: (movement) => new Date(movement.created_at).toLocaleString(),
    },
    {
      key: 'product',
      label: 'Product',
      render: (movement) => (
        <div>
          <div className="font-medium">{movement.product?.name}</div>
          <div className="text-xs text-gray-500">{movement.product?.sku}</div>
        </div>
      ),
    },
    {
      key: 'warehouse',
      label: 'Warehouse',
      render: (movement) => movement.warehouse?.name || '-',
    },
    {
      key: 'type',
      label: 'Type',
      render: (movement) => getMovementTypeBadge(movement.type),
    },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (movement) => (
        <span className={movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
          {movement.quantity > 0 ? '+' : ''}{movement.quantity}
        </span>
      ),
    },
    {
      key: 'reference',
      label: 'Reference',
      render: (movement) => movement.reference_type ? `${movement.reference_type} #${movement.reference_id}` : '-',
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (movement) => movement.reason || '-',
    },
    {
      key: 'creator',
      label: 'Created By',
      render: (movement) => movement.creator?.name || 'System',
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Inventory Movements</h2>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search movements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchMovements()}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Types</option>
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
            <option value="TRANSFER">TRANSFER</option>
            <option value="ADJUSTMENT">ADJUSTMENT</option>
            <option value="RETURN">RETURN</option>
          </select>
          <select
            value={filters.warehouse_id}
            onChange={(e) => setFilters({ ...filters, warehouse_id: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table
          columns={columns}
          data={movements}
          loading={loading}
          pagination={pagination}
          onPageChange={fetchMovements}
        />
      </div>
    </div>
  );
};

export default InventoryMovementsPage;