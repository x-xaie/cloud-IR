
// src/components/ui/ErrorAlert.jsx

import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Reusable error alert component
 * @param {object} props - Component props
 * @param {string} props.message - Error message to display
 * @param {function} [props.onClose] - Close handler
 */
export const ErrorAlert = ({ message, onClose }) => (
  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-3">
    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
    <p className="text-red-700 dark:text-red-300 text-sm flex-1">{message}</p>
    {onClose && (
      <button
        onClick={onClose}
        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
      >
        ×
      </button>
    )}
  </div>
);
