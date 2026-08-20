import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/inventoryService';
import { warehouseService } from '../../services/warehouseService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import StatusBadge from '../../components/common/StatusBadge';
import { FiPlus, FiSearch, FiRefreshCw, FiArrowRight } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const InventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ warehouse_id: '', low_stock: '' });
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { register: registerTransfer, handleSubmit: handleTransferSubmit, reset: resetTransfer, formState: { errors: transferErrors } } = useForm();

  useEffect(() => {
    fetchInventory();
    fetchWarehouses();
    fetchProducts();
  }, [filters]);

  const fetchInventory = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...filters, search };
      const response = await inventoryService.getAll(params);
      setInventory(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await warehouseService.getAll({ limit: 100 });
      setWarehouses(response.data);
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { productService } = await import('../../services/productService');
      const response = await productService.getAll({ limit: 100, status: 'active' });
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchInventory();
  };

  const handleAdjust = async (data) => {
    try {
      await inventoryService.adjust({
        product_id: parseInt(data.product_id),
        warehouse_id: parseInt(data.warehouse_id),
        quantity: parseInt(data.quantity),
        reason: data.reason,
      });
      toast.success('Inventory adjusted successfully');
      setShowAdjustModal(false);
      reset();
      fetchInventory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to adjust inventory');
    }
  };

  const handleTransfer = async (data) => {
    try {
      await inventoryService.transfer({
        product_id: parseInt(data.product_id),
        from_warehouse_id: parseInt(data.from_warehouse_id),
        to_warehouse_id: parseInt(data.to_warehouse_id),
        quantity: parseInt(data.quantity),
        reason: data.reason,
      });
      toast.success('Inventory transferred successfully');
      setShowTransferModal(false);
      resetTransfer();
      fetchInventory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to transfer inventory');
    }
  };

  const columns = [
    {
      key: 'product',
      label: 'Product',
      render: (item) => (
        <div>
          <div className="font-medium">{item.product?.name}</div>
          <div className="text-xs text-gray-500">{item.product?.sku}</div>
        </div>
      ),
    },
    {
      key: 'warehouse',
      label: 'Warehouse',
      render: (item) => item.warehouse?.name || '-',
    },
    {
      key: 'quantity',
      label: 'Total Quantity',
      render: (item) => (
        <span className="font-semibold">{item.quantity}</span>
      ),
    },
    {
      key: 'reserved_quantity',
      label: 'Reserved',
      render: (item) => item.reserved_quantity,
    },
    {
      key: 'available_quantity',
      label: 'Available',
      render: (item) => (
        <span className={item.available_quantity <= item.reorder_level ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
          {item.available_quantity}
        </span>
      ),
    },
    {
      key: 'reorder_level',
      label: 'Reorder Level',
      render: (item) => item.reorder_level,
    },
    {
      key: 'stock_status',
      label: 'Status',
      render: (item) => (
        item.is_low_stock ? (
          <StatusBadge status="LOW STOCK" />
        ) : (
          <StatusBadge status="IN STOCK" />
        )
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item) => (
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedItem(item);
              setShowAdjustModal(true);
            }}
            className="text-blue-600 hover:text-blue-900"
            title="Adjust"
          >
            <FiRefreshCw className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              setSelectedItem(item);
              setShowTransferModal(true);
            }}
            className="text-green-600 hover:text-green-900"
            title="Transfer"
          >
            <FiArrowRight className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
        <div className="flex space-x-3">
          <Button onClick={() => setShowAdjustModal(true)}>
            <FiRefreshCw className="mr-2 h-5 w-5" />
            Adjust Stock
          </Button>
          <Button onClick={() => setShowTransferModal(true)} variant="secondary">
            <FiArrowRight className="mr-2 h-5 w-5" />
            Transfer Stock
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <form onSubmit={handleSearch} className="md:col-span-2">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search inventory..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </form>
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
          <select
            value={filters.low_stock}
            onChange={(e) => setFilters({ ...filters, low_stock: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Stock</option>
            <option value="true">Low Stock Only</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table
          columns={columns}
          data={inventory}
          loading={loading}
          pagination={pagination}
          onPageChange={fetchInventory}
        />
      </div>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        title="Adjust Stock"
      >
        <form onSubmit={handleSubmit(handleAdjust)} className="space-y-4">
          <Select
            label="Product"
            name="product_id"
            register={register}
            error={errors.product_id?.message}
            options={products.map(p => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
            validation={{ required: 'Product is required' }}
          />
          <Select
            label="Warehouse"
            name="warehouse_id"
            register={register}
            error={errors.warehouse_id?.message}
            options={warehouses.map(w => ({ value: w.id, label: w.name }))}
            validation={{ required: 'Warehouse is required' }}
          />
          <Input
            label="Quantity (+/-)"
            name="quantity"
            type="number"
            register={register}
            error={errors.quantity?.message}
            validation={{ required: 'Quantity is required' }}
          />
          <Input
            label="Reason"
            name="reason"
            register={register}
            error={errors.reason?.message}
          />
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setShowAdjustModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Adjust</Button>
          </div>
        </form>
      </Modal>

      {/* Transfer Stock Modal */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="Transfer Stock"
      >
        <form onSubmit={handleTransferSubmit(handleTransfer)} className="space-y-4">
          <Select
            label="Product"
            name="product_id"
            register={registerTransfer}
            error={transferErrors.product_id?.message}
            options={products.map(p => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
            validation={{ required: 'Product is required' }}
          />
          <Select
            label="From Warehouse"
            name="from_warehouse_id"
            register={registerTransfer}
            error={transferErrors.from_warehouse_id?.message}
            options={warehouses.map(w => ({ value: w.id, label: w.name }))}
            validation={{ required: 'Source warehouse is required' }}
          />
          <Select
            label="To Warehouse"
            name="to_warehouse_id"
            register={registerTransfer}
            error={transferErrors.to_warehouse_id?.message}
            options={warehouses.map(w => ({ value: w.id, label: w.name }))}
            validation={{ required: 'Destination warehouse is required' }}
          />
          <Input
            label="Quantity"
            name="quantity"
            type="number"
            register={registerTransfer}
            error={transferErrors.quantity?.message}
            validation={{ required: 'Quantity is required', min: { value: 1, message: 'Must be positive' } }}
          />
          <Input
            label="Reason"
            name="reason"
            register={registerTransfer}
            error={transferErrors.reason?.message}
          />
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setShowTransferModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Transfer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryPage;