import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { warehouseService } from '../../services/warehouseService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import StatusBadge from '../../components/common/StatusBadge';
import { FiPlus, FiSearch, FiEye, FiEdit2, FiTrash2, FiMapPin } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const WarehousesPage = () => {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteWarehouse, setDeleteWarehouse] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchWarehouses();
  }, [filters]);

  const fetchWarehouses = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...filters, search };
      const response = await warehouseService.getAll(params);
      setWarehouses(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchWarehouses();
  };

  const handleCreate = async (data) => {
    try {
      await warehouseService.create(data);
      toast.success('Warehouse created successfully');
      setShowCreateModal(false);
      reset();
      fetchWarehouses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create warehouse');
    }
  };

  const handleDelete = async () => {
    try {
      await warehouseService.delete(deleteWarehouse.id);
      toast.success('Warehouse deleted successfully');
      setDeleteWarehouse(null);
      fetchWarehouses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete warehouse');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (warehouse) => (
        <button
          onClick={() => navigate(`/warehouses/${warehouse.id}`)}
          className="text-primary-600 hover:text-primary-900 font-medium"
        >
          {warehouse.name}
        </button>
      ),
    },
    {
      key: 'code',
      label: 'Code',
      render: (warehouse) => warehouse.code,
    },
    {
      key: 'manager',
      label: 'Manager',
      render: (warehouse) => warehouse.manager?.name || 'Not assigned',
    },
    {
      key: 'statistics',
      label: 'Products',
      render: (warehouse) => warehouse.statistics?.total_products || 0,
    },
    {
      key: 'statistics',
      label: 'Total Stock',
      render: (warehouse) => warehouse.statistics?.total_stock || 0,
    },
    {
      key: 'statistics',
      label: 'Low Stock',
      render: (warehouse) => (
        warehouse.statistics?.low_stock_items > 0 ? (
          <span className="text-red-600 font-semibold">
            {warehouse.statistics.low_stock_items}
          </span>
        ) : (
          <span className="text-green-600">0</span>
        )
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (warehouse) => <StatusBadge status={warehouse.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (warehouse) => (
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/warehouses/${warehouse.id}`)}
            className="text-blue-600 hover:text-blue-900"
          >
            <FiEye className="h-5 w-5" />
          </button>
          <button
            onClick={() => setDeleteWarehouse(warehouse)}
            className="text-red-600 hover:text-red-900"
          >
            <FiTrash2 className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Warehouses</h2>
        <Button onClick={() => setShowCreateModal(true)}>
          <FiPlus className="mr-2 h-5 w-5" />
          Add Warehouse
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <form onSubmit={handleSearch} className="md:col-span-2">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search warehouses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </form>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Warehouses Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table
          columns={columns}
          data={warehouses}
          loading={loading}
          pagination={pagination}
          onPageChange={fetchWarehouses}
        />
      </div>

      {/* Create Warehouse Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Warehouse"
      >
        <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
          <Input
            label="Warehouse Name"
            name="name"
            register={register}
            error={errors.name?.message}
            validation={{ required: 'Name is required' }}
          />
          <Input
            label="Warehouse Code"
            name="code"
            register={register}
            error={errors.code?.message}
            validation={{ required: 'Code is required' }}
          />
          <Input
            label="Address"
            name="address"
            register={register}
            error={errors.address?.message}
          />
          <Input
            label="Capacity"
            name="capacity"
            type="number"
            step="0.01"
            register={register}
            error={errors.capacity?.message}
          />
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Warehouse</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteWarehouse}
        onClose={() => setDeleteWarehouse(null)}
        title="Delete Warehouse"
        size="sm"
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <strong>{deleteWarehouse?.name}</strong>?
        </p>
        <div className="mt-4 flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => setDeleteWarehouse(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default WarehousesPage;
