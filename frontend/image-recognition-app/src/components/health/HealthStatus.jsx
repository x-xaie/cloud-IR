// src/components/health/HealthStatus.jsx

import React, { useState } from 'react';
import { 
  Heart, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  Clock, 
  Server,
  Wifi,
  WifiOff,
  Activity, 
  RefreshCw, 
  Settings, 
  Eye, 
  EyeOff,
  Play,
  Pause
} from 'lucide-react';
import { useHealthCheck } from '../../hooks/useHealthCheck.js';
import { Card } from '../ui/Card.jsx';

/**
 * Compact health status indicator for header
 * @param {object} props - Component props
 * @param {boolean} [props.showDetails=false] - Show detailed info
 */
export const HealthIndicator = ({ showDetails = false }) => {
  const { isHealthy, isChecking, responseTime, formattedResponseTime, error } = useHealthCheck({
    interval: 30000, // Check every 30 seconds
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

  if (!showDetails) {
    // Compact version for header
    return (
      <div className={`flex items-center space-x-2 ${getStatusColor()}`} title={error || getStatusText()}>
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
        {responseTime && (
          <span className="text-xs opacity-75">({formattedResponseTime})</span>
        )}
      </div>
    );
  }

  // Detailed version
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <Heart className="w-5 h-5 text-red-500" />
          <span>Service Health</span>
        </h3>
        <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="font-medium">{getStatusText()}</span>
        </div>
      </div>

      <div className="space-y-3">
        {responseTime && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Response Time:</span>
            <span className={`font-medium ${responseTime < 1000 ? 'text-green-600' : responseTime < 3000 ? 'text-yellow-600' : 'text-red-600'}`}>
              {formattedResponseTime}
            </span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-700 dark:text-red-300 text-sm font-medium">Connection Error</p>
                <p className="text-red-600 dark:text-red-400 text-xs mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Detailed health monitoring component
 */
export const HealthMonitor = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    isHealthy,
    isChecking,
    responseTime,
    formattedResponseTime,
    lastChecked,
    error,
    backend,
    services,
    isMonitoring,
    checkHealth,
    toggleMonitoring
  } = useHealthCheck({
    interval: 30000,
    autoStart: true
  });

  const formatLastChecked = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <h3 className="text-base font-medium">System Health</h3>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={checkHealth}
              disabled={isChecking}
              className="p-1.5 hover:bg-white/20 rounded-md transition-colors disabled:opacity-50"
              title="Refresh health check"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={toggleMonitoring}
              className="p-1.5 hover:bg-white/20 rounded-md transition-colors"
              title={isMonitoring ? 'Stop monitoring' : 'Start monitoring'}
            >
              {isMonitoring ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 hover:bg-white/20 rounded-md transition-colors"
            >
              {isExpanded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Quick Status */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className={`text-lg font-semibold ${isHealthy ? 'text-green-600' : 'text-red-600'}`}>
              {isHealthy === null ? '?' : (isHealthy ? '✓' : '✗')}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {isHealthy === null ? 'Unknown' : (isHealthy ? 'Healthy' : 'Unhealthy')}
            </p>
          </div>

          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className={`text-lg font-semibold ${
              responseTime ? (
                responseTime < 1000 ? 'text-green-600' : 
                responseTime < 3000 ? 'text-yellow-600' : 'text-red-600'
              ) : 'text-gray-500'
            }`}>
              {formattedResponseTime}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Response</p>
          </div>

          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-lg font-semibold text-blue-600">
              {isMonitoring ? '●' : '○'}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {isMonitoring ? 'Live' : 'Paused'}
            </p>
          </div>
        </div>

        {/* Detailed Info */}
        {isExpanded && (
          <div className="space-y-3">
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">Service Details</h4>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Last Checked:</p>
                  <p className="font-medium">{formatLastChecked(lastChecked)}</p>
                </div>
                
                {backend && (
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Version:</p>
                    <p className="font-medium">{backend.version || 'Unknown'}</p>
                  </div>
                )}
              </div>

              {services && (
                <div className="mt-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Services:</p>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(services).map(([service, status]) => (
                      <div key={service} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-xs">
                        <span className="capitalize">{service}</span>
                        <span className={`px-1.5 py-0.5 rounded-full font-medium ${
                          status === 'healthy' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          status === 'unhealthy' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                        }`}>
                          {status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <h5 className="font-medium text-red-800 dark:text-red-300 mb-1 text-sm">Error Details</h5>
                <p className="text-red-700 dark:text-red-400 text-xs">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};