import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supplierService } from '../../services/supplierService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import StatusBadge from '../../components/common/StatusBadge';
import { FiPlus, FiSearch, FiEye, FiEdit2, FiTrash2, FiStar } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const SuppliersPage = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [deleteSupplier, setDeleteSupplier] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchSuppliers();
  }, [filters]);

  const fetchSuppliers = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...filters, search };
      const response = await supplierService.getAll(params);
      setSuppliers(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSuppliers();
  };

  const handleCreate = async (data) => {
    try {
      await supplierService.create(data);
      toast.success('Supplier created successfully');
      setShowCreateModal(false);
      reset();
      fetchSuppliers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create supplier');
    }
  };

  const handleUpdate = async (data) => {
    try {
      await supplierService.update(editSupplier.id, data);
      toast.success('Supplier updated successfully');
      setEditSupplier(null);
      reset();
      fetchSuppliers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update supplier');
    }
  };

  const handleDelete = async () => {
    try {
      await supplierService.delete(deleteSupplier.id);
      toast.success('Supplier deleted successfully');
      setDeleteSupplier(null);
      fetchSuppliers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete supplier');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (supplier) => (
        <button
          onClick={() => navigate(`/suppliers/${supplier.id}`)}
          className="text-primary-600 hover:text-primary-900 font-medium"
        >
          {supplier.name}
        </button>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (supplier) => supplier.email,
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (supplier) => supplier.phone || '-',
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (supplier) => (
        <div className="flex items-center">
          <FiStar className="text-yellow-400 mr-1" />
          <span>{parseFloat(supplier.rating || 0).toFixed(1)}</span>
        </div>
      ),
    },
    {
      key: 'statistics',
      label: 'Products',
      render: (supplier) => supplier.statistics?.total_products || 0,
    },
    {
      key: 'status',
      label: 'Status',
      render: (supplier) => <StatusBadge status={supplier.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (supplier) => (
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/suppliers/${supplier.id}`)}
            className="text-blue-600 hover:text-blue-900"
          >
            <FiEye className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              setEditSupplier(supplier);
              reset({
                name: supplier.name,
                email: supplier.email,
                phone: supplier.phone,
                address: supplier.address,
              });
            }}
            className="text-green-600 hover:text-green-900"
          >
            <FiEdit2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => setDeleteSupplier(supplier)}
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
        <h2 className="text-2xl font-bold text-gray-900">Suppliers</h2>
        <Button onClick={() => setShowCreateModal(true)}>
          <FiPlus className="mr-2 h-5 w-5" />
          Add Supplier
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
                placeholder="Search suppliers..."
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
            <option value="blacklisted">Blacklisted</option>
          </select>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table
          columns={columns}
          data={suppliers}
          loading={loading}
          pagination={pagination}
          onPageChange={fetchSuppliers}
        />
      </div>

      {/* Create Supplier Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Supplier"
      >
        <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
          <Input
            label="Supplier Name"
            name="name"
            register={register}
            error={errors.name?.message}
            validation={{ required: 'Name is required' }}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            register={register}
            error={errors.email?.message}
            validation={{ required: 'Email is required' }}
          />
          <Input
            label="Phone"
            name="phone"
            register={register}
            error={errors.phone?.message}
          />
          <Input
            label="Address"
            name="address"
            register={register}
            error={errors.address?.message}
          />
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Supplier</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Supplier Modal */}
      <Modal
        isOpen={!!editSupplier}
        onClose={() => setEditSupplier(null)}
        title="Edit Supplier"
      >
        <form onSubmit={handleSubmit(handleUpdate)} className="space-y-4">
          <Input
            label="Supplier Name"
            name="name"
            register={register}
            error={errors.name?.message}
            validation={{ required: 'Name is required' }}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            register={register}
            error={errors.email?.message}
            validation={{ required: 'Email is required' }}
          />
          <Input
            label="Phone"
            name="phone"
            register={register}
            error={errors.phone?.message}
          />
          <Input
            label="Address"
            name="address"
            register={register}
            error={errors.address?.message}
          />
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setEditSupplier(null)}>
              Cancel
            </Button>
            <Button type="submit">Update Supplier</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteSupplier}
        onClose={() => setDeleteSupplier(null)}
        title="Delete Supplier"
        size="sm"
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <strong>{deleteSupplier?.name}</strong>?
        </p>
        <div className="mt-4 flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => setDeleteSupplier(null)}>
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

export default SuppliersPage;