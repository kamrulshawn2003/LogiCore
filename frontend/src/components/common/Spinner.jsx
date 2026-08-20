import React from 'react';

const Spinner = ({ size = 'md' }) => {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  return (
    <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizes[size]}`}></div>
  );
};

export default Spinner;