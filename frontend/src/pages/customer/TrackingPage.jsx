import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { shipmentService } from '../../services/shipmentService';
import { FiTruck, FiPackage, FiMapPin, FiClock } from 'react-icons/fi';

const TrackingPage = () => {
  const { trackingNumber } = useParams();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    fetchTracking();
  }, [trackingNumber]);

  const fetchTracking = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await shipmentService.track(trackingNumber);
      setTracking(response.tracking);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to track shipment');
    } finally {
      setLoading(false);
    }
  };

  const statusSteps = [
    { status: 'READY', label: 'Ready', icon: FiPackage },
    { status: 'ASSIGNED', label: 'Assigned', icon: FiTruck },
    { status: 'PICKED_UP', label: 'Picked Up', icon: FiTruck },
    { status: 'IN_TRANSIT', label: 'In Transit', icon: FiTruck },
    { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: FiMapPin },
    { status: 'DELIVERED', label: 'Delivered', icon: FiClock },
  ];

  const currentStepIndex = statusSteps.findIndex(step => step.status === tracking?.status);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Track Shipment</h2>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      ) : tracking ? (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Tracking Number: {tracking.tracking_number}
            </h3>
            <p className="text-sm text-gray-500">
              Order: {tracking.order_number}
            </p>
          </div>

          {/* Tracking Steps */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-6">
              {statusSteps.map((step, index) => (
                <div key={step.status} className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index <= currentStepIndex
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      <step.icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className={`font-medium ${
                      index <= currentStepIndex ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </p>
                    {index === currentStepIndex && tracking.status === step.status && (
                      <p className="text-sm text-gray-500">
                        {new Date().toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default TrackingPage;