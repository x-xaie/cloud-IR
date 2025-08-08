// src/components/health/ClickableHealthIndicator.jsx

import React, { useState } from 'react';
import { 
  Loader2, 
  Clock, 
  Wifi,
  WifiOff,
  Activity,
  ChevronDown
} from 'lucide-react';
import { useHealthCheck } from '../../hooks/useHealthCheck.js';
import { HealthDashboardModal } from './HealthDashboardModal.jsx';

/**
 * Clickable health status indicator for header with modal dashboard
 * @param {object} props - Component props
 * @param {boolean} [props.showDropdown=false] - Show dropdown on hover
 */
export const ClickableHealthIndicator = ({ showDropdown = false }) => {
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { 
    isHealthy, 
    isChecking, 
    responseTime, 
    formattedResponseTime, 
    error,
    lastChecked 
  } = useHealthCheck({
    interval: 30000,
    autoStart: true
  });

  const getStatusIcon = () => {
    if (isChecking) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (isHealthy === null) return <Clock className="w-4 h-4" />;
    return isHealthy ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />;
  };

  const getStatusColor = () => {
    if (isChecking) return 'text-blue-500';
    if (isHealthy === null) return 'text-gray-500';
    return isHealthy ? 'text-green-500' : 'text-red-500';
  };

  const getStatusText = () => {
    if (isChecking) return 'Checking...';
    if (isHealthy === null) return 'Unknown';
    return isHealthy ? 'Online' : 'Offline';
  };

  const getBgColor = () => {
    if (isChecking) return 'hover:bg-blue-50 dark:hover:bg-blue-900/20';
    if (isHealthy === null) return 'hover:bg-gray-50 dark:hover:bg-gray-700/50';
    return isHealthy ? 'hover:bg-green-50 dark:hover:bg-green-900/20' : 'hover:bg-red-50 dark:hover:bg-red-900/20';
  };

  const formatLastChecked = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative">
      {/* Clickable Health Indicator */}
      <button
        onClick={() => setIsDashboardOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${getBgColor()} ${getStatusColor()}`}
        title="Click to view detailed health dashboard"
      >
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
        {responseTime && (
          <span className="text-xs opacity-75">({formattedResponseTime})</span>
        )}
        {showDropdown && (
          <ChevronDown className="w-3 h-3 opacity-50" />
        )}
      </button>

      {/* Quick Status Dropdown (on hover) - Fixed z-index */}
      {showDropdown && isHovered && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-[9998]">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Service Status:</span>
              <span className={`text-sm font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
            
            {responseTime && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Response Time:</span>
                <span className={`text-sm font-medium ${
                  responseTime < 1000 ? 'text-green-600' : 
                  responseTime < 3000 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {formattedResponseTime}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Last Checked:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatLastChecked(lastChecked)}
              </span>
            </div>

            {error && (
              <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <button
                onClick={() => setIsDashboardOpen(true)}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Activity className="w-4 h-4" />
                <span>View Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Health Dashboard Modal - Now with proper z-index */}
      <HealthDashboardModal 
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
      />
    </div>
  );
};
