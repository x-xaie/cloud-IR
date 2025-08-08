// src/components/layout/Header.jsx

import React from 'react';
import { Eye } from 'lucide-react';
import { HealthIndicator } from '../health/HealthIndicator.jsx';

/**
 * Application header component
 * @param {object} props - Component props
 * @param {function} [props.onReset] - Reset callback for new upload
 * @param {boolean} [props.showResetButton=false] - Whether to show reset button
 * @param {boolean} [props.showHealthStatus=true] - Whether to show health indicator
 * @param {function} [props.onHealthClick] - Health indicator click handler
 */
export const Header = ({ 
  onReset, 
  showResetButton = false, 
  showHealthStatus = true,
  onHealthClick
}) => (
  <header className="border-b border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Eye className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI Image Recognition
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Powered by Azure Cognitive Services
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {showHealthStatus && (
            <HealthIndicator onClick={onHealthClick} />
          )}
          {showResetButton && (
            <button
              onClick={onReset}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-lg transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              Upload New Image
            </button>
          )}
        </div>
      </div>
    </div>
  </header>
);