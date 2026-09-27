import React from 'react';
import { FiStar } from 'react-icons/fi';

/**
 * Star rating. Renders read-only when onChange is not provided,
 * otherwise renders an interactive star picker.
 */
const StarRating = ({ value = 0, onChange, size = 'h-5 w-5', className = '' }) => {
  const [hover, setHover] = React.useState(0);

  if (!onChange) {
    return (
      <div className={`flex items-center ${className}`} aria-label={`${value} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`${size} ${
              star <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
            }`}
          />
        ))}
        {value > 0 && <span className="ml-1 text-sm text-gray-600">{value.toFixed(1)}</span>}
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="focus:outline-none p-0.5"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          aria-label={`Rate ${star} stars`}
        >
          <FiStar
            className={`${size} ${
              star <= (hover || value) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
            } transition-colors`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-600">{hover || value || ''}/5</span>
    </div>
  );
};

export default StarRating;
