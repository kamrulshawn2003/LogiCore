import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import StatusBadge from '../../components/common/StatusBadge';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiUserCheck, FiUserX } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ role: '', status: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...filters, search };
      const response = await userService.getAll(params);
      setUsers(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data) => {
    try {
      await userService.create(data);
      toast.success('User created successfully');
      setShowCreateModal(false);
      reset();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleUpdateStatus = async (userId, status) => {
    try {
      await userService.updateStatus(userId, status);
      toast.success(`User ${status === 'active' ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleDelete = async () => {
    try {
      await userService.delete(deleteUser.id);
      toast.success('User deleted successfully');
      setDeleteUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (user) => (
        <div>
          <div className="font-medium">{user.name}</div>
          <div className="text-xs text-gray-500">{user.email}</div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (user) => user.phone || '-',
    },
    {
      key: 'role',
      label: 'Role',
      render: (user) => <StatusBadge status={user.role} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (user) => <StatusBadge status={user.status} />,
    },
    {
      key: 'last_login',
      label: 'Last Login',
      render: (user) => user.last_login ? new Date(user.last_login).toLocaleString() : '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user) => (
        <div className="flex space-x-2">
          {user.status === 'active' ? (
            <button
              onClick={() => handleUpdateStatus(user.id, 'inactive')}
              className="text-yellow-600 hover:text-yellow-900"
              title="Deactivate"
            >
              <FiUserX className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={() => handleUpdateStatus(user.id, 'active')}
              className="text-green-600 hover:text-green-900"
              title="Activate"
            >
              <FiUserCheck className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={() => setDeleteUser(user)}
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
        <h2 className="text-2xl font-bold text-gray-900">Users</h2>
        <Button onClick={() => setShowCreateModal(true)}>
          <FiPlus className="mr-2 h-5 w-5" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchUsers()}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="warehouse_manager">Warehouse Manager</option>
            <option value="supplier">Supplier</option>
            <option value="driver">Driver</option>
            <option value="customer">Customer</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table
          columns={columns}
          data={users}
          loading={loading}
          pagination={pagination}
          onPageChange={fetchUsers}
        />
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New User"
      >
        <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
          <Input
            label="Name"
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
            label="Password"
            name="password"
            type="password"
            register={register}
            error={errors.password?.message}
            validation={{ required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } }}
          />
          <Input
            label="Phone"
            name="phone"
            register={register}
            error={errors.phone?.message}
          />
          <Select
            label="Role"
            name="role"
            register={register}
            error={errors.role?.message}
            options={[
              { value: 'admin', label: 'Admin' },
              { value: 'warehouse_manager', label: 'Warehouse Manager' },
              { value: 'supplier', label: 'Supplier' },
              { value: 'driver', label: 'Driver' },
              { value: 'customer', label: 'Customer' },
            ]}
            validation={{ required: 'Role is required' }}
          />
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create User</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        title="Delete User"
        size="sm"
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete user <strong>{deleteUser?.name}</strong>?
        </p>
        <div className="mt-4 flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => setDeleteUser(null)}>
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

export default UsersPage;