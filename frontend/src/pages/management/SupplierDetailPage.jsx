import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supplierService } from '../../services/supplierService';
import StatusBadge from '../../components/common/StatusBadge';
import { FiArrowLeft, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';

const SupplierDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSupplier();
  }, [id]);

  const fetchSupplier = async () => {
    setLoading(true);
    try {
      const response = await supplierService.getById(id);
      setSupplier(response.supplier);
    } catch (error) {
      toast.error('Failed to fetch supplier');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Supplier not found</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <FiArrowLeft className="mr-2 h-5 w-5" />
        Back
      </button>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">{supplier.name}</h2>
          <StatusBadge status={supplier.status} />
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-sm text-gray-900">{supplier.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="text-sm text-gray-900">{supplier.phone || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="text-sm text-gray-900">{supplier.address || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Rating</dt>
                  <dd className="flex items-center">
                    <FiStar className="text-yellow-400 mr-1" />
                    <span className="text-sm text-gray-900">{parseFloat(supplier.rating).toFixed(1)}</span>
                  </dd>
                </div>
              </dl>
            </div>
            
            {supplier.performance && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Total Purchase Orders</dt>
                    <dd className="text-sm text-gray-900">{supplier.performance.total_purchase_orders}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Completed</dt>
                    <dd className="text-sm text-gray-900">{supplier.performance.completed_purchase_orders}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Completion Rate</dt>
                    <dd className="text-sm text-gray-900">{supplier.performance.completion_rate?.toFixed(1)}%</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>

          {supplier.products && supplier.products.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Products</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {supplier.products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.sku}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${parseFloat(product.price).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={product.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierDetailPage;