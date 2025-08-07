
// src/components/layout/PageSection.jsx

import React from 'react';

/**
 * Generic page section wrapper with consistent spacing
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Section content
 * @param {string} [props.className=''] - Additional classes
 */
export const PageSection = ({ children, className = '' }) => (
  <div className={`text-center space-y-8 ${className}`}>
    {children}
  </div>
);