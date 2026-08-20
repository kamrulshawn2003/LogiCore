import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import { supplierService } from '../../services/supplierService';
import { warehouseService } from '../../services/warehouseService';
import { productService } from '../../services/productService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import StatusBadge from '../../components/common/StatusBadge';
import { FiPlus, FiSearch, FiEye } from 'react-icons/fi';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';

const PurchaseOrdersPage = () => {
  const navigate = useNavigate();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', supplier_id: '' });
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    defaultValues: {
      items: [{ product_id: '', quantity: 1, unit_price: 0 }]
    }
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  useEffect(() => {
    fetchPurchaseOrders();
    fetchSuppliers();
    fetchWarehouses();
    fetchProducts();
  }, [filters]);

  const fetchPurchaseOrders = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...filters, search };
      const response = await purchaseOrderService.getAll(params);
      setPurchaseOrders(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await supplierService.getAll({ limit: 100, status: 'active' });
      setSuppliers(response.data);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await warehouseService.getAll({ limit: 100, status: 'active' });
      setWarehouses(response.data);
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll({ limit: 100, status: 'active' });
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleCreate = async (data) => {
    try {
      const formattedData = {
        supplier_id: parseInt(data.supplier_id),
        warehouse_id: parseInt(data.warehouse_id),
        expected_delivery_date: data.expected_delivery_date,
        items: data.items.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unit_price)
        }))
      };
      
      await purchaseOrderService.create(formattedData);
      toast.success('Purchase order created successfully');
      setShowCreateModal(false);
      reset();
      fetchPurchaseOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create purchase order');
    }
  };

  const columns = [
    {
      key: 'po_number',
      label: 'PO Number',
      render: (po) => (
        <button
          onClick={() => navigate(`/purchase-orders/${po.id}`)}
          className="text-primary-600 hover:text-primary-900 font-medium"
        >
          {po.po_number}
        </button>
      ),
    },
    {
      key: 'supplier',
      label: 'Supplier',
      render: (po) => po.supplier?.name || '-',
    },
    {
      key: 'warehouse',
      label: 'Warehouse',
      render: (po) => po.warehouse?.name || '-',
    },
    {
      key: 'total_amount',
      label: 'Total Amount',
      render: (po) => `$${parseFloat(po.total_amount).toFixed(2)}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (po) => <StatusBadge status={po.status} />,
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (po) => new Date(po.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (po) => (
        <button
          onClick={() => navigate(`/purchase-orders/${po.id}`)}
          className="text-blue-600 hover:text-blue-900"
        >
          <FiEye className="h-5 w-5" />
        </button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Purchase Orders</h2>
        <Button onClick={() => setShowCreateModal(true)}>
          <FiPlus className="mr-2 h-5 w-5" />
          Create PO
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search purchase orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchPurchaseOrders()}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="RECEIVED">Received</option>
          </select>
          <select
            value={filters.supplier_id}
            onChange={(e) => setFilters({ ...filters, supplier_id: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table
          columns={columns}
          data={purchaseOrders}
          loading={loading}
          pagination={pagination}
          onPageChange={fetchPurchaseOrders}
        />
      </div>

      {/* Create PO Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Purchase Order"
        size="xl"
      >
        <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Supplier"
              name="supplier_id"
              register={register}
              error={errors.supplier_id?.message}
              options={suppliers.map(s => ({ value: s.id, label: s.name }))}
              validation={{ required: 'Supplier is required' }}
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
              label="Expected Delivery Date"
              name="expected_delivery_date"
              type="date"
              register={register}
              error={errors.expected_delivery_date?.message}
            />
          </div>

          {/* Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Items</label>
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-4 gap-3 mb-2">
                <Select
                  name={`items.${index}.product_id`}
                  register={register}
                  options={products.map(p => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
                  placeholder="Select Product"
                />
                <Input
                  name={`items.${index}.quantity`}
                  type="number"
                  placeholder="Quantity"
                  register={register}
                />
                <Input
                  name={`items.${index}.unit_price`}
                  type="number"
                  step="0.01"
                  placeholder="Unit Price"
                  register={register}
                />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-red-600 hover:text-red-900"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => append({ product_id: '', quantity: 1, unit_price: 0 })}
              className="text-primary-600 hover:text-primary-900"
            >
              + Add Item
            </button>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create PO</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PurchaseOrdersPage;