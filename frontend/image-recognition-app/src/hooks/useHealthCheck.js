// src/hooks/useHealthCheck.js

import { useState, useEffect, useRef } from 'react';
import { HealthService } from '../services/healthService.js';

/**
 * Custom hook for monitoring backend health
 * @param {object} options - Configuration options
 * @param {number} [options.interval=30000] - Check interval in ms (default 30s)
 * @param {boolean} [options.autoStart=true] - Start monitoring automatically
 * @param {boolean} [options.checkOnMount=true] - Check health on component mount
 * @returns {object} Health state and methods
 */
export const useHealthCheck = ({
  interval = 30000, // 30 seconds
  autoStart = true,
  checkOnMount = true
} = {}) => {
  const [healthStatus, setHealthStatus] = useState({
    isHealthy: null,
    lastChecked: null,
    responseTime: null,
    isChecking: false,
    error: null
  });

  const healthService = useRef(new HealthService());
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  /**
   * Perform health check
   */
  const checkHealth = async () => {
    if (!isMountedRef.current) return;

    setHealthStatus(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      const health = await healthService.current.checkHealth();
      
      if (isMountedRef.current) {
        setHealthStatus({
          isHealthy: health.isHealthy,
          lastChecked: health.lastChecked,
          responseTime: health.responseTime,
          isChecking: false,
          error: health.error || null,
          backend: health.backend,
          services: health.services
        });
      }
    } catch (error) {
      if (isMountedRef.current) {
        setHealthStatus(prev => ({
          ...prev,
          isChecking: false,
          error: error.message,
          isHealthy: false
        }));
      }
    }
  };

  /**
   * Start periodic health monitoring
   */
  const startMonitoring = () => {
    if (intervalRef.current) return; // Already running

    // Initial check
    checkHealth();

    // Set up interval
    intervalRef.current = setInterval(() => {
      checkHealth();
    }, interval);
  };

  /**
   * Stop periodic health monitoring
   */
  const stopMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  /**
   * Toggle monitoring on/off
   */
  const toggleMonitoring = () => {
    if (intervalRef.current) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  };

  // Mount effect
  useEffect(() => {
    isMountedRef.current = true;

    if (checkOnMount) {
      checkHealth();
    }

    if (autoStart) {
      startMonitoring();
    }

    return () => {
      isMountedRef.current = false;
      stopMonitoring();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, []);

  return {
    // Health status
    ...healthStatus,
    
    // Methods
    checkHealth,
    startMonitoring,
    stopMonitoring,
    toggleMonitoring,
    
    // Computed values
    isMonitoring: intervalRef.current !== null,
    statusColor: healthService.current.getStatusColor(),
    statusText: healthService.current.getStatusText(),
    formattedResponseTime: healthService.current.getFormattedResponseTime(),
    
    // Utilities
    getHealthService: () => healthService.current
  };
};