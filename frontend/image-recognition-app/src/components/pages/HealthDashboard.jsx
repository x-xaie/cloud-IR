// src/components/pages/HealthDashboard.jsx

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  BarChart3, 
  Clock, 
  Database,
  Image as ImageIcon,
  Users,
  FileText,
  TrendingUp
} from 'lucide-react';
import { HealthMonitor } from '../health/HealthStatus.jsx';
import { Card } from '../ui/Card.jsx';
import { API_CONFIG } from '../../utils/constants.js';

/**
 * Health Dashboard Page - Optional admin/monitoring view
 */
export const HealthDashboard = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/results/stats?days_back=7`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue' }) => (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{title}</p>
          <p className={`text-xl font-semibold text-${color}-600`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
        <div className={`p-2 bg-${color}-100 dark:bg-${color}-900/30 rounded-lg`}>
          <Icon className={`w-4 h-4 text-${color}-600`} />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="bg-white dark:bg-gray-800">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <Activity className="w-6 h-6 text-blue-600" />
            <span>System Health</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Service status and usage analytics
          </p>
        </div>

        <div className="space-y-6">
          {/* Health Monitor */}
          <HealthMonitor />

          {/* Usage Statistics */}
          {stats && (
            <>
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Usage Statistics (7 days)</span>
                </h2>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    icon={ImageIcon}
                    title="Total Images"
                    value={stats.summary.total_images_analyzed}
                    subtitle="analyzed"
                    color="blue"
                  />
                  
                  <StatCard
                    icon={Users}
                    title="With Faces"
                    value={stats.summary.images_with_faces}
                    subtitle={`${stats.percentages.faces}%`}
                    color="purple"
                  />
                  
                  <StatCard
                    icon={Database}
                    title="Objects Found"
                    value={stats.summary.total_objects_detected}
                    subtitle={`${stats.percentages.objects}%`}
                    color="green"
                  />
                  
                  <StatCard
                    icon={FileText}
                    title="With Text"
                    value={stats.summary.images_with_text}
                    subtitle={`${stats.percentages.text}%`}
                    color="orange"
                  />
                </div>
              </div>

              {/* Performance Metrics */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Performance</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Avg Confidence</p>
                      <p className="text-2xl font-semibold text-blue-600">
                        {(stats.summary.average_confidence * 100).toFixed(1)}%
                      </p>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                        <div 
                          className="h-1.5 bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${stats.summary.average_confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Faces</p>
                      <p className="text-2xl font-semibold text-purple-600">
                        {stats.summary.total_faces_detected}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        detected
                      </p>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Time Period</p>
                      <p className="text-2xl font-semibold text-green-600">7d</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        of data
                      </p>
                    </div>
                  </Card>
                </div>
              </div>
            </>
          )}

          {/* Error State */}
          {error && (
            <Card className="p-4">
              <div className="text-center">
                <div className="text-red-500 mb-3">
                  <Activity className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
                  Unable to Load Statistics
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{error}</p>
                <button
                  onClick={fetchStats}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Retrying...' : 'Retry'}
                </button>
              </div>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && !stats && (
            <Card className="p-6">
              <div className="text-center">
                <div className="animate-spin text-blue-500 mb-3">
                  <Clock className="w-6 h-6 mx-auto" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Loading statistics...</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};