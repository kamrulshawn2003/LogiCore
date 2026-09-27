import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { refundService } from '../../services/refundService';
import { FiRefreshCcw, FiDollarSign } from 'react-icons/fi';

const RefundModal = ({ order, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { type: 'REFUND', reason: '' },
  });
  const type = watch('type');

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await refundService.create({
        order_id: order.id,
        type: data.type,
        reason: data.reason,
      });
      toast.success(
        data.type === 'RETURN'
          ? 'Return request submitted'
          : 'Refund request submitted'
      );
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Request Refund / Return" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
          Order <strong>{order.order_number}</strong> —{' '}
          <strong className="text-brand-600">
            ${Number(order.total_amount).toFixed(2)}
          </strong>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Request type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue('type', 'REFUND')}
              className={`flex items-center justify-center gap-2 border rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                type === 'REFUND'
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-gray-300 text-gray-600 hover:border-brand-400'
              }`}
            >
              <FiDollarSign className="h-4 w-4" />
              Refund only
            </button>
            <button
              type="button"
              onClick={() => setValue('type', 'RETURN')}
              className={`flex items-center justify-center gap-2 border rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                type === 'RETURN'
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-gray-300 text-gray-600 hover:border-brand-400'
              }`}
            >
              <FiRefreshCcw className="h-4 w-4" />
              Return items
            </button>
            <input type="hidden" {...register('type')} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason
          </label>
          <textarea
            {...register('reason', { required: 'Reason is required', minLength: { value: 5, message: 'Please give at least 5 characters' } })}
            rows={3}
            placeholder="e.g. Item arrived damaged / wrong item received / no longer needed"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500"
          />
          {errors.reason && (
            <p className="mt-1 text-xs text-red-600">{errors.reason.message}</p>
          )}
        </div>

        {type === 'RETURN' && (
          <p className="text-xs text-gray-500">
            A return means you will send the items back and the full amount will be
            refunded after staff approve the request.
          </p>
        )}
        {type === 'REFUND' && (
          <p className="text-xs text-gray-500">
            A refund means the full amount is refunded and you keep the items.
          </p>
        )}

        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Request'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RefundModal;
