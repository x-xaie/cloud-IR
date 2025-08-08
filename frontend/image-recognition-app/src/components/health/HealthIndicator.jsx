// src/components/health/HealthIndicator.jsx

import React from 'react';
import { 
  Loader2, 
  Clock, 
  Wifi,
  WifiOff
} from 'lucide-react';
import { useHealthCheck } from '../../hooks/useHealthCheck.js';

/**
 * Simple health status indicator for header (no modal inside)
 * @param {object} props - Component props
 * @param {function} [props.onClick] - Click handler passed from parent
 */
export const HealthIndicator = ({ onClick }) => {
  const { 
    isHealthy, 
    isChecking, 
    responseTime, 
    formattedResponseTime, 
    error
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

  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${getBgColor()} ${getStatusColor()}`}
      title={error ? `Error: ${error}` : "Click to view health dashboard"}
    >
      {getStatusIcon()}
      <span className="text-sm font-medium">{getStatusText()}</span>
      {responseTime && (
        <span className="text-xs opacity-75">({formattedResponseTime})</span>
      )}
    </button>
  );
};