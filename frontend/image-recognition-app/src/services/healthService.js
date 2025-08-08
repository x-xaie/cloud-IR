// src/services/healthService.js

import { API_CONFIG } from '../utils/constants.js';

/**
 * Health check service for monitoring backend status
 */
export class HealthService {
  constructor() {
    this.lastHealthCheck = null;
    this.healthStatus = {
      isHealthy: null,
      lastChecked: null,
      services: {},
      responseTime: null
    };
  }

  /**
   * Perform comprehensive health check
   * @returns {Promise<object>} Health status
   */
  async checkHealth() {
    const startTime = Date.now();

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(5000)
      });

      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
      }

      const healthData = await response.json();
      
      this.healthStatus = {
        isHealthy: true,
        lastChecked: new Date().toISOString(),
        responseTime,
        backend: {
          status: healthData.status,
          version: healthData.version,
          timestamp: healthData.timestamp
        },
        services: {
          api: 'healthy',
          functions: 'healthy'
        }
      };

      return this.healthStatus;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.healthStatus = {
        isHealthy: false,
        lastChecked: new Date().toISOString(),
        responseTime,
        error: error.message,
        services: {
          api: 'unhealthy',
          functions: 'unknown'
        }
      };

      return this.healthStatus;
    }
  }

  /**
   * Get cached health status
   * @returns {object} Current health status
   */
  getHealthStatus() {
    return this.healthStatus;
  }

  /**
   * Check if services are healthy
   * @returns {boolean} Overall health status
   */
  isHealthy() {
    return this.healthStatus.isHealthy === true;
  }

  /**
   * Get response time in ms
   * @returns {number|null} Response time
   */
  getResponseTime() {
    return this.healthStatus.responseTime;
  }

  /**
   * Format response time for display
   * @returns {string} Formatted response time
   */
  getFormattedResponseTime() {
    const time = this.healthStatus.responseTime;
    if (time === null) return 'Unknown';
    
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  }

  /**
   * Get health status color for UI
   * @returns {string} Color class
   */
  getStatusColor() {
    if (this.healthStatus.isHealthy === null) return 'gray';
    return this.healthStatus.isHealthy ? 'green' : 'red';
  }

  /**
   * Get health status text
   * @returns {string} Status text
   */
  getStatusText() {
    if (this.healthStatus.isHealthy === null) return 'Unknown';
    return this.healthStatus.isHealthy ? 'Healthy' : 'Unhealthy';
  }
}