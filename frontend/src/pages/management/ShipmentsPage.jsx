import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { shipmentService } from '../../services/shipmentService';
import { driverService } from '../../services/driverService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Select from '../../components/common/Select';
import StatusBadge from '../../components/common/StatusBadge';
import { FiSearch, FiEye, FiTruck } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const ShipmentsPage = () => {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', driver_id: '' });
  const [drivers, setDrivers] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchShipments();
    fetchDrivers();
  }, [filters]);

  const fetchShipments = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...filters, search };
      const response = await shipmentService.getAll(params);
      setShipments(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await driverService.getAll({ limit: 100, status: 'AVAILABLE' });
      setDrivers(response.data);
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
    }
  };

  const handleAssignDriver = async (data) => {
    try {
      await shipmentService.assignDriver(selectedShipment.id, parseInt(data.driver_id));
      toast.success('Driver assigned successfully');
      setShowAssignModal(false);
      reset();
      fetchShipments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign driver');
    }
  };

  const columns = [
    {
      key: 'shipment_number',
      label: 'Shipment #',
      render: (shipment) => (
        <button
          onClick={() => navigate(`/shipments/${shipment.id}`)}
          className="text-primary-600 hover:text-primary-900 font-medium"
        >
          {shipment.shipment_number}
        </button>
      ),
    },
    {
      key: 'tracking_number',
      label: 'Tracking #',
      render: (shipment) => shipment.tracking_number || '-',
    },
    {
      key: 'order',
      label: 'Order',
      render: (shipment) => shipment.order?.order_number || '-',
    },
    {
      key: 'driver',
      label: 'Driver',
      render: (shipment) => shipment.driver?.user?.name || '-',
    },
    {
      key: 'status',
      label: 'Status',
      render: (shipment) => <StatusBadge status={shipment.status} />,
    },
    {
      key: 'estimated_delivery',
      label: 'Est. Delivery',
      render: (shipment) => shipment.estimated_delivery || '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (shipment) => (
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/shipments/${shipment.id}`)}
            className="text-blue-600 hover:text-blue-900"
          >
            <FiEye className="h-5 w-5" />
          </button>
          {['READY', 'ASSIGNED'].includes(shipment.status) && (
            <button
              onClick={() => {
                setSelectedShipment(shipment);
                setShowAssignModal(true);
              }}
              className="text-green-600 hover:text-green-900"
            >
              <FiTruck className="h-5 w-5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipments</h2>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search shipments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchShipments()}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Status</option>
            <option value="READY">Ready</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="PICKED_UP">Picked Up</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
          </select>
          <select
            value={filters.driver_id}
            onChange={(e) => setFilters({ ...filters, driver_id: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Drivers</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.user?.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table
          columns={columns}
          data={shipments}
          loading={loading}
          pagination={pagination}
          onPageChange={fetchShipments}
        />
      </div>

      {/* Assign Driver Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Driver"
      >
        <form onSubmit={handleSubmit(handleAssignDriver)} className="space-y-4">
          <Select
            label="Select Driver"
            name="driver_id"
            register={register}
            error={errors.driver_id?.message}
            options={drivers.map(d => ({ 
              value: d.id, 
              label: `${d.user?.name} - ${d.vehicle_number || 'No vehicle'}` 
            }))}
            validation={{ required: 'Driver is required' }}
          />
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setShowAssignModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Assign</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ShipmentsPage;