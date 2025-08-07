// src/components/ui/LoadingSpinner.jsx

import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable loading spinner component
 * @param {object} props - Component props
 * @param {string} [props.size='w-5 h-5'] - Size classes
 * @param {string} [props.className=''] - Additional classes
 */
export const LoadingSpinner = ({ size = 'w-5 h-5', className = '' }) => (
  <Loader2 className={`${size} animate-spin ${className}`} />
);
