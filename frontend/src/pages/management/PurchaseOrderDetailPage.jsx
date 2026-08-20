import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { FiArrowLeft } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const PurchaseOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchPurchaseOrder();
  }, [id]);

  const fetchPurchaseOrder = async () => {
    setLoading(true);
    try {
      const response = await purchaseOrderService.getById(id);
      setPurchaseOrder(response.purchaseOrder);
    } catch (error) {
      toast.error('Failed to fetch purchase order');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (action) => {
    try {
      switch (action) {
        case 'submit':
          await purchaseOrderService.submit(id);
          break;
        case 'approve':
          await purchaseOrderService.approve(id);
          break;
        case 'accept':
          await purchaseOrderService.accept(id);
          break;
        case 'cancel':
          await purchaseOrderService.cancel(id, 'Cancelled by user');
          break;
        default:
          return;
      }
      toast.success('Purchase order updated');
      fetchPurchaseOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update');
    }
  };

  const handleReceive = async (data) => {
    try {
      await purchaseOrderService.receive(id, [{
        purchase_order_item_id: selectedItem.id,
        quantity: parseInt(data.quantity)
      }]);
      toast.success('Items received successfully');
      setShowReceiveModal(false);
      reset();
      fetchPurchaseOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to receive items');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Purchase order not found</p>
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
        <h2 className="text-2xl font-bold text-gray-900">
          Purchase Order {purchaseOrder.po_number}
        </h2>
        <div className="flex space-x-3">
          {purchaseOrder.status === 'DRAFT' && (
            <>
              <Button onClick={() => handleStatusUpdate('submit')}>Submit</Button>
              <Button variant="danger" onClick={() => handleStatusUpdate('cancel')}>Cancel</Button>
            </>
          )}
          {purchaseOrder.status === 'SUBMITTED' && (
            <Button onClick={() => handleStatusUpdate('approve')}>Approve</Button>
          )}
          {purchaseOrder.status === 'APPROVED' && (
            <Button onClick={() => handleStatusUpdate('accept')}>Accept</Button>
          )}
          {(purchaseOrder.status === 'ACCEPTED' || purchaseOrder.status === 'PARTIALLY_RECEIVED') && (
            <Button onClick={() => setShowReceiveModal(true)}>Receive Items</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ordered</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                    {purchaseOrder.status === 'ACCEPTED' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchaseOrder.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{item.product?.name}</div>
                        <div className="text-xs text-gray-500">{item.product?.sku}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.received_quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${parseFloat(item.unit_price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${parseFloat(item.subtotal).toFixed(2)}
                      </td>
                      {purchaseOrder.status === 'ACCEPTED' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setShowReceiveModal(true);
                            }}
                          >
                            Receive
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-right font-medium">
                      Total:
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      ${parseFloat(purchaseOrder.total_amount).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <StatusBadge status={purchaseOrder.status} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Supplier</p>
                <p className="text-sm text-gray-900">{purchaseOrder.supplier?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Warehouse</p>
                <p className="text-sm text-gray-900">{purchaseOrder.warehouse?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Expected Delivery</p>
                <p className="text-sm text-gray-900">{purchaseOrder.expected_delivery_date || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Received Progress</p>
                <p className="text-sm text-gray-900">
                  {purchaseOrder.received_percentage?.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Receive Modal */}
      <Modal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        title="Receive Items"
      >
        <form onSubmit={handleSubmit(handleReceive)} className="space-y-4">
          <p className="text-sm text-gray-600">
            Receiving: {selectedItem?.product?.name}
          </p>
          <p className="text-sm text-gray-600">
            Remaining: {selectedItem ? selectedItem.quantity - selectedItem.received_quantity : 0}
          </p>
          <Input
            label="Quantity to Receive"
            name="quantity"
            type="number"
            register={register}
            error={errors.quantity?.message}
            validation={{ required: 'Quantity is required', min: { value: 1, message: 'Must be positive' } }}
          />
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setShowReceiveModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Receive</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PurchaseOrderDetailPage;