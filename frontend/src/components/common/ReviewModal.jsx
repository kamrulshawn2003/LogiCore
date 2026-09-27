import React, { useState } from 'react';
import StarRating from './StarRating';
import ProductImage from './ProductImage';
import { reviewService } from '../../services/reviewService';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

/**
 * Modal for submitting a product review from a delivered order.
 * Expects `order` with items[] (each item has product: {id, name, image_url}).
 */
const ReviewModal = ({ order, onClose, onSuccess }) => {
  const [productId, setProductId] = useState(order.items?.[0]?.product_id || order.items?.[0]?.product?.id || null);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const items = order.items || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productId) {
      toast.error('Select a product to review');
      return;
    }
    setSubmitting(true);
    try {
      await reviewService.create({
        product_id: productId,
        order_id: order.id,
        rating,
        title,
        comment,
      });
      toast.success('Review submitted! Thank you.');
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative bg-white rounded-xl max-w-lg w-full my-8">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Write a Review</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Product selector */}
            {items.length > 1 ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                <select
                  value={productId || ''}
                  onChange={(e) => setProductId(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {items.map((item) => (
                    <option key={item.id} value={item.product_id || item.product?.id}>
                      {item.product?.name || `Product #${item.product_id}`}
                    </option>
                  ))}
                </select>
              </div>
            ) : items.length === 1 ? (
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-white">
                  <ProductImage
                    src={items[0].product?.image_url}
                    name={items[0].product?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm font-medium text-gray-800">{items[0].product?.name}</p>
              </div>
            ) : null}

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your rating</label>
              <StarRating value={rating} onChange={setRating} size="h-7 w-7" />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title (optional)</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="Summarize your experience"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500"
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Review (optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="Share details about quality, shipping, value..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-600 text-white font-semibold py-3 rounded-md hover:bg-brand-700 transition-colors disabled:bg-gray-300"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
