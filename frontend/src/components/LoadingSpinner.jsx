import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ message = 'Loading...', size = 'large' }) => {
  const getSizeClasses = (size) => {
    switch (size) {
      case 'small':
        return 'h-4 w-4';
      case 'medium':
        return 'h-8 w-8';
      case 'large':
        return 'h-32 w-32';
      default:
        return 'h-32 w-32';
    }
  };

  const getTextSize = (size) => {
    switch (size) {
      case 'small':
        return 'text-sm';
      case 'medium':
        return 'text-base';
      case 'large':
        return 'text-lg';
      default:
        return 'text-lg';
    }
  };

  return (
    <div className="flex flex-col justify-center items-center">
      <Loader2
        className={`${getSizeClasses(size)} animate-spin text-indigo-600 mb-4`}
      />
      <p className={`${getTextSize(size)} text-gray-600 font-medium`}>
        {message}
      </p>
    </div>
  );
};

export default LoadingSpinner;
