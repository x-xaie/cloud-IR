
// src/components/ui/ConfidenceBar.jsx

import React from 'react';

/**
 * Confidence level visualization bar
 * @param {object} props - Component props
 * @param {number} props.confidence - Confidence value (0-1)
 */
export const ConfidenceBar = ({ confidence }) => (
  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
    <div 
      className="h-2 bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
      style={{ width: `${(confidence || 0) * 100}%` }}
    />
  </div>
);
