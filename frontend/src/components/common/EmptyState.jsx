import React from 'react';
import { FiInbox } from 'react-icons/fi';

const EmptyState = ({ message = 'No data available', icon: Icon = FiInbox }) => {
  return (
    <div className="text-center py-12">
      <Icon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">{message}</h3>
      <p className="mt-1 text-sm text-gray-500">
        Get started by creating a new record.
      </p>
    </div>
  );
};

export default EmptyState;