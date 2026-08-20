import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import StatusBadge from '../../components/common/StatusBadge';
import { FiPlus, FiSearch, FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const ProductsPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', category_id: '' });
  const [categories, setCategories] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [filters]);

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...filters, search };
      const response = await productService.getAll(params);
      setProducts(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAll({ limit: 100 });
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleCreate = async (data) => {
    try {
      await productService.create(data);
      toast.success('Product created successfully');
      setShowCreateModal(false);
      reset();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create product');
    }
  };

  const handleDelete = async () => {
    try {
      await productService.delete(deleteProduct.id);
      toast.success('Product deleted successfully');
      setDeleteProduct(null);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const columns = [
    {
      key: 'sku',
      label: 'SKU',
      sortable: true,
      render: (product) => (
        <button
          onClick={() => navigate(`/products/${product.id}`)}
          className="text-primary-600 hover:text-primary-900 font-medium"
        >
          {product.sku}
        </button>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'category',
      label: 'Category',
      render: (product) => product.category?.name || '-',
    },
    {
      key: 'supplier',
      label: 'Supplier',
      render: (product) => product.supplier?.name || '-',
    },
    {
      key: 'price',
      label: 'Price',
      render: (product) => `$${parseFloat(product.price).toFixed(2)}`,
    },
    {
      key: 'total_stock',
      label: 'Total Stock',
      render: (product) => product.total_stock || 0,
    },
    {
      key: 'status',
      label: 'Status',
      render: (product) => <StatusBadge status={product.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (product) => (
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/products/${product.id}`)}
            className="text-blue-600 hover:text-blue-900"
          >
            <FiEye className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate(`/products/${product.id}/edit`)}
            className="text-green-600 hover:text-green-900"
          >
            <FiEdit2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => setDeleteProduct(product)}
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
        <h2 className="text-2xl font-bold text-gray-900">Products</h2>
        <Button onClick={() => setShowCreateModal(true)}>
          <FiPlus className="mr-2 h-5 w-5" />
          Add Product
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <form onSubmit={handleSearch} className="md:col-span-2">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
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
            <option value="discontinued">Discontinued</option>
          </select>
          <select
            value={filters.category_id}
            onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table
          columns={columns}
          data={products}
          loading={loading}
          pagination={pagination}
          onPageChange={fetchProducts}
        />
      </div>

      {/* Create Product Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Product"
        size="lg"
      >
        <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Product Name"
              name="name"
              register={register}
              error={errors.name?.message}
              validation={{ required: 'Name is required' }}
            />
            <Input
              label="SKU"
              name="sku"
              register={register}
              error={errors.sku?.message}
            />
          </div>
          <Input
            label="Description"
            name="description"
            register={register}
            error={errors.description?.message}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              name="category_id"
              register={register}
              error={errors.category_id?.message}
              options={categories.map(c => ({ value: c.id, label: c.name }))}
            />
            <Input
              label="Price"
              name="price"
              type="number"
              step="0.01"
              register={register}
              error={errors.price?.message}
              validation={{ required: 'Price is required' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cost Price"
              name="cost_price"
              type="number"
              step="0.01"
              register={register}
              error={errors.cost_price?.message}
            />
            <Input
              label="Reorder Level"
              name="reorder_level"
              type="number"
              register={register}
              error={errors.reorder_level?.message}
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Product</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        title="Delete Product"
        size="sm"
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <strong>{deleteProduct?.name}</strong>? This action cannot be undone.
        </p>
        <div className="mt-4 flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => setDeleteProduct(null)}>
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

export default ProductsPage;