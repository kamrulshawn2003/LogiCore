import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { driverService } from '../../services/driverService';
import { userService } from '../../services/userService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import StatusBadge from '../../components/common/StatusBadge';
import { FiPlus, FiSearch, FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const DriversPage = () => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '' });
  const [users, setUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteDriver, setDeleteDriver] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchDrivers();
    fetchUsers();
  }, [filters]);

  const fetchDrivers = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...filters, search };
      const response = await driverService.getAll(params);
      setDrivers(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userService.getAll({ limit: 100, role: 'driver' });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleCreate = async (data) => {
    try {
      await driverService.create({
        user_id: parseInt(data.user_id),
        license_number: data.license_number,
        vehicle_number: data.vehicle_number,
        vehicle_type: data.vehicle_type,
      });
      toast.success('Driver created successfully');
      setShowCreateModal(false);
      reset();
      fetchDrivers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create driver');
    }
  };

  const handleDelete = async () => {
    try {
      await driverService.delete(deleteDriver.id);
      toast.success('Driver deleted successfully');
      setDeleteDriver(null);
      fetchDrivers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete driver');
    }
  };

  const columns = [
    {
      key: 'user',
      label: 'Driver',
      render: (driver) => (
        <div>
          <div className="font-medium">{driver.user?.name}</div>
          <div className="text-xs text-gray-500">{driver.user?.email}</div>
        </div>
      ),
    },
    {
      key: 'license_number',
      label: 'License #',
    },
    {
      key: 'vehicle_number',
      label: 'Vehicle',
      render: (driver) => (
        <div>
          <div>{driver.vehicle_number || '-'}</div>
          <div className="text-xs text-gray-500">{driver.vehicle_type}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (driver) => <StatusBadge status={driver.status} />,
    },
    {
      key: 'statistics',
      label: 'Deliveries',
      render: (driver) => (
        <div>
          <div>{driver.completed_deliveries || 0} / {driver.total_deliveries || 0}</div>
          <div className="text-xs text-gray-500">
            Rating: {parseFloat(driver.rating || 0).toFixed(1)}
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (driver) => (
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/drivers/${driver.id}`)}
            className="text-blue-600 hover:text-blue-900"
          >
            <FiEye className="h-5 w-5" />
          </button>
          <button
            onClick={() => setDeleteDriver(driver)}
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
        <h2 className="text-2xl font-bold text-gray-900">Drivers</h2>
        <Button onClick={() => setShowCreateModal(true)}>
          <FiPlus className="mr-2 h-5 w-5" />
          Add Driver
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search drivers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchDrivers()}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="ON_DELIVERY">On Delivery</option>
            <option value="OFF_DUTY">Off Duty</option>
          </select>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table
          columns={columns}
          data={drivers}
          loading={loading}
          pagination={pagination}
          onPageChange={fetchDrivers}
        />
      </div>

      {/* Create Driver Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Driver"
      >
        <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
          <Select
            label="User"
            name="user_id"
            register={register}
            error={errors.user_id?.message}
            options={users.map(u => ({ value: u.id, label: u.name }))}
            validation={{ required: 'User is required' }}
          />
          <Input
            label="License Number"
            name="license_number"
            register={register}
            error={errors.license_number?.message}
            validation={{ required: 'License number is required' }}
          />
          <Input
            label="Vehicle Number"
            name="vehicle_number"
            register={register}
            error={errors.vehicle_number?.message}
          />
          <Input
            label="Vehicle Type"
            name="vehicle_type"
            register={register}
            error={errors.vehicle_type?.message}
          />
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Driver</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteDriver}
        onClose={() => setDeleteDriver(null)}
        title="Delete Driver"
        size="sm"
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete driver <strong>{deleteDriver?.user?.name}</strong>?
        </p>
        <div className="mt-4 flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => setDeleteDriver(null)}>
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

export default DriversPage;