
// src/components/ui/Badge.jsx

import React from 'react';

/**
 * Reusable badge component
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Badge content
 * @param {string} [props.variant='green'] - Color variant
 */
export const Badge = ({ children, variant = 'green' }) => {
  const variants = {
    green: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
  };

  return (
    <span className={`px-3 py-1 text-xs rounded-full font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};