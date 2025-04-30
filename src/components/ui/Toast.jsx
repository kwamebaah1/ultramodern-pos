'use client';

import { useState, useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';

export const useToast = () => {
  const [toast, setToast] = useState(null);

  const showToast = ({ title, description, variant = 'default' }) => {
    setToast({ title, description, variant });
  };

  return { toast, showToast };
};

export function Toast({ toast, onClose }) {
  if (!toast) return null;

  const variantStyles = {
    default: 'bg-background border',
    destructive: 'bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-800',
    success: 'bg-green-100 border-green-200 dark:bg-green-900/30 dark:border-green-800',
  };

  const variantIcons = {
    default: null,
    destructive: <FiAlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
    success: <FiCheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />,
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`flex items-center p-4 rounded-lg shadow-lg border ${variantStyles[toast.variant]}`}>
        {variantIcons[toast.variant] && (
          <div className="mr-3">
            {variantIcons[toast.variant]}
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-medium">{toast.title}</h3>
          {toast.description && (
            <p className="text-sm">{toast.description}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-4 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}