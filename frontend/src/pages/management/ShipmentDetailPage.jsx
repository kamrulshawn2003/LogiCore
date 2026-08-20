import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shipmentService } from '../../services/shipmentService';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import { FiArrowLeft, FiTruck, FiMapPin, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ShipmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShipment();
  }, [id]);

  const fetchShipment = async () => {
    setLoading(true);
    try {
      const response = await shipmentService.getById(id);
      setShipment(response.shipment);
    } catch (error) {
      toast.error('Failed to fetch shipment');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      await shipmentService.updateStatus(id, status);
      toast.success('Shipment status updated');
      fetchShipment();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Shipment not found</p>
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

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Shipment {shipment.shipment_number}
          </h2>
          <p className="text-sm text-gray-500">
            Tracking: {shipment.tracking_number}
          </p>
        </div>
        <div className="flex space-x-3">
          {shipment.status === 'ASSIGNED' && (
            <Button onClick={() => handleStatusUpdate('PICKED_UP')}>Mark as Picked Up</Button>
          )}
          {shipment.status === 'PICKED_UP' && (
            <Button onClick={() => handleStatusUpdate('IN_TRANSIT')}>Start Transit</Button>
          )}
          {shipment.status === 'IN_TRANSIT' && (
            <Button onClick={() => handleStatusUpdate('OUT_FOR_DELIVERY')}>Out for Delivery</Button>
          )}
          {shipment.status === 'OUT_FOR_DELIVERY' && (
            <Button onClick={() => handleStatusUpdate('DELIVERED')}>Mark as Delivered</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipment Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Order</p>
                <p className="text-sm text-gray-900">{shipment.order?.order_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <StatusBadge status={shipment.status} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Warehouse</p>
                <p className="text-sm text-gray-900">{shipment.warehouse?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Driver</p>
                <p className="text-sm text-gray-900">{shipment.driver?.user?.name || 'Not assigned'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Pickup Time</p>
                <p className="text-sm text-gray-900">
                  {shipment.pickup_time ? new Date(shipment.pickup_time).toLocaleString() : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estimated Delivery</p>
                <p className="text-sm text-gray-900">{shipment.estimated_delivery || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Actual Delivery</p>
                <p className="text-sm text-gray-900">
                  {shipment.actual_delivery ? new Date(shipment.actual_delivery).toLocaleString() : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {shipment.order && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
            <div className="space-y-3">
              {shipment.order.items?.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.product?.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm text-gray-900">
                    ${parseFloat(item.subtotal).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipmentDetailPage;