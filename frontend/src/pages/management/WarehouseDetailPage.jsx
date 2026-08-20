import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { warehouseService } from '../../services/warehouseService';
import StatusBadge from '../../components/common/StatusBadge';
import { FiArrowLeft, FiMapPin, FiPackage } from 'react-icons/fi';
import toast from 'react-hot-toast';

const WarehouseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWarehouse();
  }, [id]);

  const fetchWarehouse = async () => {
    setLoading(true);
    try {
      const response = await warehouseService.getById(id);
      setWarehouse(response.warehouse);
    } catch (error) {
      toast.error('Failed to fetch warehouse');
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

  if (!warehouse) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Warehouse not found</p>
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
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{warehouse.name}</h2>
            <p className="text-sm text-gray-500">{warehouse.code}</p>
          </div>
          <StatusBadge status={warehouse.status} />
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <FiMapPin className="h-8 w-8 text-primary-600 mb-2" />
              <h4 className="font-medium text-gray-900">Address</h4>
              <p className="text-sm text-gray-600">{warehouse.address || '-'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <FiPackage className="h-8 w-8 text-primary-600 mb-2" />
              <h4 className="font-medium text-gray-900">Capacity</h4>
              <p className="text-sm text-gray-600">{warehouse.capacity}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <FiPackage className="h-8 w-8 text-primary-600 mb-2" />
              <h4 className="font-medium text-gray-900">Manager</h4>
              <p className="text-sm text-gray-600">{warehouse.manager?.name || 'Not assigned'}</p>
            </div>
          </div>

          {warehouse.statistics && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Inventory</p>
                  <p className="text-2xl font-bold text-gray-900">{warehouse.statistics.total_inventory}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Available</p>
                  <p className="text-2xl font-bold text-gray-900">{warehouse.statistics.available_inventory}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Low Stock Items</p>
                  <p className="text-2xl font-bold text-red-600">{warehouse.statistics.low_stock_count}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Capacity Utilization</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {warehouse.statistics.capacity_utilization?.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {warehouse.low_stock_items && warehouse.low_stock_items.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder Level</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {warehouse.low_stock_items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.product?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.product?.reorder_level}
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

export default WarehouseDetailPage;